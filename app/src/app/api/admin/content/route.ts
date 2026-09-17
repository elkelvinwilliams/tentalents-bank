import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq, asc } from "drizzle-orm";
import { isAdmin, nid } from "@/lib/auth";
import sanitizeHtml from "sanitize-html";

/* Admin content API — password-gated. Create, edit, reorder, publish and
   unpublish tracks, modules and lessons; quiz upsert; glossary CRUD. */

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: ["p", "h2", "h3", "b", "strong", "i", "em", "u", "ul", "ol", "li", "a", "img", "figure", "figcaption", "div", "br", "blockquote", "iframe"],
  allowedAttributes: {
    a: ["href", "rel", "target"],
    img: ["src", "alt", "width", "height"],
    div: ["class"],
    iframe: ["src", "width", "height", "allowfullscreen", "frameborder"],
  },
  allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
  allowedSchemes: ["https", "http", "data"],
};

type Body = {
  op: string;
  kind?: "track" | "module" | "lesson" | "glossary";
  id?: string;
  parentId?: string;
  fields?: Record<string, unknown>;
  direction?: "up" | "down";
  questions?: { q: string; options: string[]; correct: number; why: string }[];
};

const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : undefined);
const strip = <T extends object>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

async function reorder(rows: { id: string; position: number }[], id: string, direction: "up" | "down",
  write: (id: string, position: number) => Promise<unknown>) {
  const idx = rows.findIndex((r) => r.id === id);
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= rows.length) return;
  await write(rows[idx].id, rows[swap].position);
  await write(rows[swap].id, rows[idx].position);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Body;
  const f = body.fields ?? {};

  try {
    switch (body.op) {
      case "create": {
        const id = nid(12);
        if (body.kind === "track") {
          const n = (await db.select().from(tables.tracks)).length;
          await db.insert(tables.tracks).values({ id, name: "New track", blurb: "", position: n, published: false });
        } else if (body.kind === "module" && body.parentId) {
          const n = (await db.select().from(tables.modules).where(eq(tables.modules.trackId, body.parentId))).length;
          await db.insert(tables.modules).values({ id, trackId: body.parentId, name: "New module", position: n, published: false });
        } else if (body.kind === "lesson" && body.parentId) {
          const n = (await db.select().from(tables.lessons).where(eq(tables.lessons.moduleId, body.parentId))).length;
          await db.insert(tables.lessons).values({ id, moduleId: body.parentId, title: "New lesson", position: n, published: false });
        } else if (body.kind === "glossary") {
          const n = (await db.select().from(tables.glossaryTerms)).length;
          await db.insert(tables.glossaryTerms).values({ id, term: "New term", definition: "", position: n });
        } else {
          return NextResponse.json({ error: "Bad create." }, { status: 400 });
        }
        return NextResponse.json({ ok: true, id });
      }

      case "update": {
        const id = body.id!;
        if (body.kind === "track") {
          await db.update(tables.tracks).set(strip({ name: str(f.name), blurb: str(f.blurb), published: bool(f.published) })).where(eq(tables.tracks.id, id));
        } else if (body.kind === "module") {
          await db.update(tables.modules).set(strip({ name: str(f.name), published: bool(f.published) })).where(eq(tables.modules.id, id));
        } else if (body.kind === "lesson") {
          const bodyHtml = str(f.bodyHtml);
          await db.update(tables.lessons).set(strip({
            title: str(f.title), minutes: int(f.minutes), published: bool(f.published),
            isFreePreview: bool(f.isFreePreview),
            bodyHtml: bodyHtml === undefined ? undefined : sanitizeHtml(bodyHtml, SANITIZE),
          })).where(eq(tables.lessons.id, id));
        } else if (body.kind === "glossary") {
          await db.update(tables.glossaryTerms).set(strip({ term: str(f.term), definition: str(f.definition) })).where(eq(tables.glossaryTerms.id, id));
        } else {
          return NextResponse.json({ error: "Bad update." }, { status: 400 });
        }
        return NextResponse.json({ ok: true });
      }

      case "reorder": {
        const { id, direction } = body as { id: string; direction: "up" | "down" };
        if (body.kind === "track") {
          const rows = await db.select().from(tables.tracks).orderBy(asc(tables.tracks.position));
          await reorder(rows, id, direction, (rid, position) => db.update(tables.tracks).set({ position }).where(eq(tables.tracks.id, rid)));
        } else if (body.kind === "module") {
          const rows = await db.select().from(tables.modules).where(eq(tables.modules.trackId, body.parentId!)).orderBy(asc(tables.modules.position));
          await reorder(rows, id, direction, (rid, position) => db.update(tables.modules).set({ position }).where(eq(tables.modules.id, rid)));
        } else if (body.kind === "lesson") {
          const rows = await db.select().from(tables.lessons).where(eq(tables.lessons.moduleId, body.parentId!)).orderBy(asc(tables.lessons.position));
          await reorder(rows, id, direction, (rid, position) => db.update(tables.lessons).set({ position }).where(eq(tables.lessons.id, rid)));
        } else if (body.kind === "glossary") {
          const rows = await db.select().from(tables.glossaryTerms).orderBy(asc(tables.glossaryTerms.position));
          await reorder(rows, id, direction, (rid, position) => db.update(tables.glossaryTerms).set({ position }).where(eq(tables.glossaryTerms.id, rid)));
        }
        return NextResponse.json({ ok: true });
      }

      case "quiz-upsert": {
        const moduleId = body.parentId!;
        const questions = (body.questions ?? [])
          .map((q) => ({ q: q.q?.trim() ?? "", options: (q.options ?? []).map((o) => o?.trim() ?? "").filter(Boolean), correct: q.correct, why: q.why?.trim() ?? "" }))
          .filter((q) => q.q && q.options.length >= 2 && q.correct >= 0 && q.correct < q.options.length && q.why);
        if (!questions.length) {
          await db.delete(tables.quizzes).where(eq(tables.quizzes.moduleId, moduleId));
          return NextResponse.json({ ok: true, removed: true });
        }
        await db.insert(tables.quizzes).values({ id: `${moduleId}-quiz`, moduleId, questions })
          .onConflictDoUpdate({ target: tables.quizzes.moduleId, set: { questions } });
        return NextResponse.json({ ok: true, count: questions.length });
      }

      case "glossary-delete": {
        await db.delete(tables.glossaryTerms).where(eq(tables.glossaryTerms.id, body.id!));
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Unknown op." }, { status: 400 });
    }
  } catch (e) {
    console.error("admin", e);
    return NextResponse.json({ error: "Operation failed." }, { status: 500 });
  }
}

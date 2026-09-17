/* Applies migrations and seeds the database from the prototype content.
   Idempotent: safe to run repeatedly (content upsert keyed by stable IDs).
   Run: npm run db:setup  */
import { db, tables } from "../src/db";
import { TRACKS, GLOSSARY } from "../src/content/seed-data";
import { sql } from "drizzle-orm";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

async function migrate() {
  const dir = join(process.cwd(), "drizzle");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  await db.execute(sql`CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY)`);
  for (const f of files) {
    const done = await db.execute(sql`SELECT 1 FROM _migrations WHERE name = ${f}`);
    if ((done as { rows: unknown[] }).rows.length) continue;
    const raw = readFileSync(join(dir, f), "utf8");
    for (const stmt of raw.split("--> statement-breakpoint")) {
      const s = stmt.trim();
      if (s) await db.execute(sql.raw(s));
    }
    await db.execute(sql`INSERT INTO _migrations (name) VALUES (${f})`);
    console.log("applied", f);
  }
}

async function seed() {
  for (const [ti, t] of TRACKS.entries()) {
    await db.insert(tables.tracks).values({ id: t.id, name: t.name, blurb: t.blurb, position: ti })
      .onConflictDoUpdate({ target: tables.tracks.id, set: { name: t.name, blurb: t.blurb, position: ti } });
    for (const [mi, m] of t.modules.entries()) {
      const mid = `${t.id}-${m.id}`;
      await db.insert(tables.modules).values({ id: mid, trackId: t.id, name: m.name, position: mi })
        .onConflictDoUpdate({ target: tables.modules.id, set: { name: m.name, position: mi } });
      for (const [li, l] of m.lessons.entries()) {
        const lid = `${mid}-${l.id}`;
        await db.insert(tables.lessons).values({
          id: lid, moduleId: mid, title: l.title, minutes: l.mins,
          bodyHtml: l.body ?? "", isFreePreview: !!l.free, position: li,
        }).onConflictDoUpdate({
          target: tables.lessons.id,
          set: { title: l.title, minutes: l.mins, bodyHtml: l.body ?? "", isFreePreview: !!l.free, position: li },
        });
      }
      if (m.quiz) {
        const questions = m.quiz.map((q) => ({ q: q.q, options: q.options, correct: q.correct, why: q.why }));
        await db.insert(tables.quizzes).values({ id: `${mid}-quiz`, moduleId: mid, questions })
          .onConflictDoUpdate({ target: tables.quizzes.moduleId, set: { questions } });
      }
    }
  }
  for (const [gi, [term, definition]] of GLOSSARY.entries()) {
    await db.insert(tables.glossaryTerms).values({ id: `g${gi}`, term, definition, position: gi })
      .onConflictDoUpdate({ target: tables.glossaryTerms.id, set: { term, definition, position: gi } });
  }
  console.log("seeded: tracks", TRACKS.length, "· glossary", GLOSSARY.length);
}

migrate().then(seed).then(() => { console.log("db ready"); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });

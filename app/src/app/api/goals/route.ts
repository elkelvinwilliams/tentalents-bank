import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { asc, eq } from "drizzle-orm";
import { currentUser, nid } from "@/lib/auth";
import { award } from "@/lib/gamify";

/* Steward goals — a planning tool. Figures are the user's own; nothing is held or moved. */

export const ICONS = new Set(["home", "plane", "shield", "gift", "car", "book", "target"]);

export function cleanGoal(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim().slice(0, 60);
  const icon = ICONS.has(String(body.icon)) ? String(body.icon) : "target";
  const targetPence = Math.round(Number(body.target) * 100);
  const savedPence = Math.max(0, Math.round(Number(body.saved ?? 0) * 100));
  const targetMonth = /^\d{4}-\d{2}$/.test(String(body.date ?? "")) ? String(body.date) : null;
  if (!name || !(targetPence > 0) || targetPence > 1e11) return null;
  return { name, icon, targetPence, savedPence, targetMonth };
}

export const pct = (g: { savedPence: number; targetPence: number }) => Math.min(100, Math.floor((g.savedPence / g.targetPence) * 100));

/** Awards 25/50/75/100% milestones once each; returns total XP awarded and any new badges. */
export async function milestones(userId: string, g: typeof tables.goals.$inferSelect) {
  const p = pct(g);
  let xp = 0; const badges: string[] = [];
  const got = new Set(g.milestones);
  for (const m of [25, 50, 75, 100]) {
    if (p >= m && !got.has(m)) {
      got.add(m);
      const r = await award(userId, m === 100 ? "goal_done" : "goal_ms", `${g.id}:${m}`);
      xp += r.awarded; badges.push(...r.newBadges);
    }
  }
  if (got.size !== g.milestones.length) {
    await db.update(tables.goals).set({ milestones: [...got] }).where(eq(tables.goals.id, g.id));
  }
  return { xp, badges };
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const rows = await db.select().from(tables.goals).where(eq(tables.goals.userId, user.id)).orderBy(asc(tables.goals.createdAt));
  return NextResponse.json({ goals: rows });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const clean = cleanGoal(body);
  if (!clean) return NextResponse.json({ error: "Give the goal a name and a target." }, { status: 400 });
  const count = await db.select({ id: tables.goals.id }).from(tables.goals).where(eq(tables.goals.userId, user.id));
  if (count.length >= 20) return NextResponse.json({ error: "Twenty goals is plenty — finish one first." }, { status: 400 });
  const id = nid();
  const [g] = await db.insert(tables.goals).values({ id, userId: user.id, ...clean }).returning();
  const r = await award(user.id, "goal_set", id);
  const ms = await milestones(user.id, g);
  const fresh = (await db.select().from(tables.goals).where(eq(tables.goals.id, id)))[0];
  return NextResponse.json({ goal: fresh, xp: r.awarded + ms.xp, badges: [...r.newBadges, ...ms.badges] });
}

import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { currentUser, nid } from "@/lib/auth";
import { award } from "@/lib/gamify";
import type { WealthAssets, WealthLiabilities } from "@/db/schema";
import { isoWeek } from "@/lib/week";

/* Build API — one route, `kind` selects the resource. All user-entered, all per-user,
   none of it advice. Real user data (not demo) lives here. */

const pence = (x: unknown) => Math.max(0, Math.min(1e11, Math.round(Number(x ?? 0) * 100))) || 0;
const ASSET_KEYS: (keyof WealthAssets)[] = ["cash", "savings", "investments", "property", "business", "other"];
const LIAB_KEYS: (keyof WealthLiabilities)[] = ["mortgage", "loans", "credit", "other"];

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const kind = String(b.kind ?? "");

  if (kind === "wealth") {
    const assets = Object.fromEntries(ASSET_KEYS.map((k) => [k, pence(b.assets?.[k])])) as WealthAssets;
    const liabilities = Object.fromEntries(LIAB_KEYS.map((k) => [k, pence(b.liabilities?.[k])])) as WealthLiabilities;
    const [row] = await db.insert(tables.wealthSnapshots).values({ id: nid(), userId: user.id, assets, liabilities, note: String(b.note ?? "").slice(0, 200) }).returning();
    const r = await award(user.id, "wealth", "first");
    return NextResponse.json({ snapshot: row, xp: r.awarded, badges: r.newBadges });
  }
  if (kind === "health") {
    const answers: Record<string, number> = {};
    for (const [k, v] of Object.entries(b.answers ?? {})) { const n = Number(v); if (/^[a-z]+$/.test(k) && n >= 1 && n <= 5) answers[k] = n; }
    if (Object.keys(answers).length < 5) return NextResponse.json({ error: "Answer the seven questions." }, { status: 400 });
    const [row] = await db.insert(tables.healthChecks).values({ id: nid(), userId: user.id, answers }).returning();
    const r = await award(user.id, "health", "first");
    return NextResponse.json({ check: row, xp: r.awarded, badges: r.newBadges });
  }
  if (kind === "review") {
    const week = /^\d{4}-W\d{2}$/.test(String(b.week)) ? String(b.week) : isoWeek(new Date());
    const answers: Record<string, string> = {};
    for (const [k, v] of Object.entries(b.answers ?? {})) if (/^[a-z]+$/.test(k) && typeof v === "string") answers[k] = v.slice(0, 500);
    const skipped = !!b.skipped;
    await db.insert(tables.weeklyReviews).values({ id: nid(), userId: user.id, week, answers, skipped })
      .onConflictDoUpdate({ target: [tables.weeklyReviews.userId, tables.weeklyReviews.week], set: { answers, skipped } });
    const r = skipped ? null : await award(user.id, "review", week);
    let badges = r?.newBadges ?? [];
    if (r) { const n = (await db.select({ id: tables.weeklyReviews.id }).from(tables.weeklyReviews).where(and(eq(tables.weeklyReviews.userId, user.id), eq(tables.weeklyReviews.skipped, false)))).length; if (n >= 4) badges = [...badges, ...(await award(user.id, "review", "four", ["reflective"])).newBadges]; }
    return NextResponse.json({ week, xp: r?.awarded ?? 0, badges });
  }
  if (kind === "debt") {
    const name = String(b.name ?? "").trim().slice(0, 60); if (!name) return NextResponse.json({ error: "Name the debt." }, { status: 400 });
    const [row] = await db.insert(tables.debts).values({ id: nid(), userId: user.id, name, balancePence: pence(b.balance), aprBp: Math.max(0, Math.min(9999, Math.round(Number(b.apr ?? 0) * 100))), minPaymentPence: pence(b.minPayment) }).returning();
    return NextResponse.json({ debt: row });
  }
  if (kind === "debt_delete") {
    await db.delete(tables.debts).where(and(eq(tables.debts.id, String(b.id)), eq(tables.debts.userId, user.id)));
    return NextResponse.json({ ok: true });
  }
  if (kind === "giving") {
    const month = /^\d{4}-\d{2}$/.test(String(b.month)) ? String(b.month) : new Date().toISOString().slice(0, 7);
    const pct = Math.max(0, Math.min(100, Math.round(Number(b.pct ?? 0))));
    const note = String(b.note ?? "").slice(0, 200);
    const [row] = await db.insert(tables.givingEntries).values({ id: nid(), userId: user.id, month, pct, note })
      .onConflictDoUpdate({ target: [tables.givingEntries.userId, tables.givingEntries.month], set: { pct, note } }).returning();
    return NextResponse.json({ entry: row });
  }
  if (kind === "talent") {
    const name = String(b.name ?? "").trim().slice(0, 60); if (!name) return NextResponse.json({ error: "Name the talent." }, { status: 400 });
    const category = ["skill", "habit", "knowledge", "relationship"].includes(b.category) ? b.category : "skill";
    const level = Math.max(1, Math.min(5, Math.round(Number(b.level ?? 1))));
    if (b.id) {
      await db.update(tables.talents).set({ name, category, level, note: String(b.note ?? "").slice(0, 200), updatedAt: sql`now()` }).where(and(eq(tables.talents.id, String(b.id)), eq(tables.talents.userId, user.id)));
      const row = (await db.select().from(tables.talents).where(eq(tables.talents.id, String(b.id))))[0];
      return NextResponse.json({ talent: row, xp: 0, badges: [] });
    }
    const id = nid();
    const [row] = await db.insert(tables.talents).values({ id, userId: user.id, name, category, level, note: String(b.note ?? "").slice(0, 200) }).returning();
    const r = await award(user.id, "talent", id);
    return NextResponse.json({ talent: row, xp: r.awarded, badges: r.newBadges });
  }
  if (kind === "talent_delete") {
    await db.delete(tables.talents).where(and(eq(tables.talents.id, String(b.id)), eq(tables.talents.userId, user.id)));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown request." }, { status: 400 });
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const [wealth, health, reviews, debtRows, giving, talentRows, events] = await Promise.all([
    db.select().from(tables.wealthSnapshots).where(eq(tables.wealthSnapshots.userId, user.id)).orderBy(desc(tables.wealthSnapshots.takenAt)).limit(12),
    db.select().from(tables.healthChecks).where(eq(tables.healthChecks.userId, user.id)).orderBy(desc(tables.healthChecks.takenAt)).limit(1),
    db.select().from(tables.weeklyReviews).where(eq(tables.weeklyReviews.userId, user.id)).orderBy(desc(tables.weeklyReviews.createdAt)).limit(12),
    db.select().from(tables.debts).where(eq(tables.debts.userId, user.id)),
    db.select().from(tables.givingEntries).where(eq(tables.givingEntries.userId, user.id)).orderBy(desc(tables.givingEntries.month)).limit(12),
    db.select().from(tables.talents).where(eq(tables.talents.userId, user.id)),
    db.select({ kind: tables.xpEvents.kind, ref: tables.xpEvents.ref }).from(tables.xpEvents).where(eq(tables.xpEvents.userId, user.id)),
  ]);
  const refs = (k: string) => events.filter((e) => e.kind === k && e.ref !== "all").map((e) => e.ref);
  return NextResponse.json({ wealth, health: health[0] ?? null, reviews, debts: debtRows, giving, talents: talentRows, scenarios: { safety: refs("safety"), journey: refs("journey"), drill: refs("drill") } });
}

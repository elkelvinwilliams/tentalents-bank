import { db, tables } from "@/db";
import { eq, sql } from "drizzle-orm";
import { nid } from "./auth";
import { levelOf, LEVEL_TITLES, XP } from "./levels";

/* ============================================================
   Learning gamification — server is the only writer.
   award() is idempotent when a ref is given: the (user, kind, ref)
   unique index means a lesson, quiz, milestone or drill pays once.
   Streaks count days with any XP event (UTC dates).
   ============================================================ */

export type Stats = { xp: number; streak: number; todayXp: number; badges: string[] };

const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);

export async function getStats(userId: string): Promise<Stats> {
  const row = (await db.select().from(tables.userStats).where(eq(tables.userStats.userId, userId)))[0];
  if (!row) return { xp: 0, streak: 0, todayXp: 0, badges: [] };
  const t = today();
  // a streak is broken if the last active day is before yesterday
  const streak = row.lastActive && row.lastActive < yesterday() ? 0 : row.streak;
  return { xp: row.xp, streak, todayXp: row.todayDate === t ? row.todayXp : 0, badges: row.badges };
}

export type AwardResult = { awarded: number; stats: Stats; newBadges: string[] };

export async function award(userId: string, kind: keyof typeof XP, ref = "", extraBadges: string[] = []): Promise<AwardResult> {
  const amount = XP[kind];
  // once-only awards carry a ref; repeatable ones get a unique ref so the index never blocks them
  const eventRef = ref || `${Date.now()}-${nid(6)}`;
  const inserted = await db.insert(tables.xpEvents)
    .values({ id: nid(), userId, kind, ref: eventRef, amount })
    .onConflictDoNothing()
    .returning();
  const stats = await getStats(userId);
  if (!inserted.length) return { awarded: 0, stats, newBadges: [] };

  const t = today();
  const existing = (await db.select().from(tables.userStats).where(eq(tables.userStats.userId, userId)))[0];
  let streak = 1;
  if (existing?.lastActive === t) streak = existing.streak;
  else if (existing?.lastActive === yesterday()) streak = existing.streak + 1;
  const todayXp = (existing?.todayDate === t ? existing.todayXp : 0) + amount;
  const xp = (existing?.xp ?? 0) + amount;

  const badges = new Set(existing?.badges ?? []);
  const before = new Set(badges);
  if (kind === "lesson_done") badges.add("first_steps");
  if (kind === "quiz_pass") badges.add("quiz_ace");
  if (kind === "goal_done") badges.add("steward");
  if (streak >= 7) badges.add("streak_7");
  if (levelOf(xp) >= LEVEL_TITLES.length) badges.add("sage");
  extraBadges.forEach((b) => badges.add(b));
  const newBadges = [...badges].filter((b) => !before.has(b));

  await db.insert(tables.userStats)
    .values({ userId, xp, streak, lastActive: t, todayXp, todayDate: t, badges: [...badges] })
    .onConflictDoUpdate({
      target: tables.userStats.userId,
      set: { xp, streak, lastActive: t, todayXp, todayDate: t, badges: [...badges], updatedAt: sql`now()` },
    });
  return { awarded: amount, stats: { xp, streak, todayXp, badges: [...badges] }, newBadges };
}

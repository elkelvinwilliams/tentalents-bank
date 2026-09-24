import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { getStats } from "./gamify";

/* Readiness Passport — an EDUCATIONAL readiness profile computed from learning activity and
   simulated behaviour. It is not creditworthiness, suitability, a profitability prediction,
   financial advice or a guarantee of anything. */

export type PassportDim = { id: string; name: string; pct: number; evidence: string[] };
export type Passport = { dims: PassportDim[]; overall: number; issuedAt: string };

const TRACK_OF = (lessonId: string) => lessonId.split("-")[0];

export async function computePassport(userId: string): Promise<Passport> {
  const [lessons, progress, attempts, quizzes, events, journal, stats] = await Promise.all([
    db.select({ id: tables.lessons.id, minutes: tables.lessons.minutes }).from(tables.lessons).where(eq(tables.lessons.published, true)),
    db.select().from(tables.lessonProgress).where(eq(tables.lessonProgress.userId, userId)),
    db.select().from(tables.quizAttempts).where(eq(tables.quizAttempts.userId, userId)),
    db.select({ id: tables.quizzes.id, moduleId: tables.quizzes.moduleId }).from(tables.quizzes),
    db.select({ kind: tables.xpEvents.kind, ref: tables.xpEvents.ref, createdAt: tables.xpEvents.createdAt }).from(tables.xpEvents).where(eq(tables.xpEvents.userId, userId)),
    db.select().from(tables.journalEntries).where(eq(tables.journalEntries.userId, userId)),
    getStats(userId),
  ]);
  const written = lessons.filter((l) => l.minutes > 0);
  const done = new Set(progress.map((p) => p.lessonId));
  const byTrack = (t: string) => { const all = written.filter((l) => TRACK_OF(l.id) === t); const got = all.filter((l) => done.has(l.id)).length; return all.length ? got / all.length : 0; };
  const passed = new Set(attempts.filter((a) => a.scorePct >= 70).map((a) => a.quizId));
  const quizPct = quizzes.length ? passed.size / quizzes.length : 0;
  const drills = new Set(events.filter((e) => e.kind === "drill" && e.ref !== "all").map((e) => e.ref));
  const safety = new Set(events.filter((e) => e.kind === "safety" && e.ref !== "all").map((e) => e.ref));
  const journeys = new Set(events.filter((e) => e.kind === "journey").map((e) => e.ref));
  const reviews = events.filter((e) => e.kind === "review").length;
  const planned = journal.filter((j) => j.planned).length;
  const plannedRatio = journal.length ? planned / journal.length : 0;
  const activeDays = new Set(events.map((e) => e.createdAt.toISOString().slice(0, 10))).size;

  const clamp = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 100);
  const dims: PassportDim[] = [
    { id: "foundations", name: "Financial Foundations", pct: clamp(byTrack("t1") * 0.6 + Math.min(1, journeys.size / 7) * 0.4), evidence: [`${written.filter((l) => TRACK_OF(l.id) === "t1" && done.has(l.id)).length} Money Foundations lessons complete`, `${journeys.size} of 7 journey stages practised`] },
    { id: "markets", name: "Market Knowledge", pct: clamp(byTrack("t2") * 0.6 + quizPct * 0.4), evidence: [`${written.filter((l) => TRACK_OF(l.id) === "t2" && done.has(l.id)).length} How Markets Work lessons complete`, `${passed.size} module quiz${passed.size === 1 ? "" : "zes"} passed`] },
    { id: "risk", name: "Risk Management", pct: clamp(byTrack("t3") * 0.5 + Math.min(1, drills.size / 3) * 0.5), evidence: [`${written.filter((l) => TRACK_OF(l.id) === "t3" && done.has(l.id)).length} Understanding Risk lessons complete`, `${drills.size} scenario drills answered well`] },
    { id: "behaviour", name: "Financial Behaviour", pct: clamp(Math.min(1, safety.size / 5) * 0.5 + Math.min(1, reviews / 4) * 0.5), evidence: [`${safety.size} of 5 Spot-the-Scam scenarios right`, `${reviews} weekly review${reviews === 1 ? "" : "s"} completed`] },
    { id: "simulation", name: "Simulation Discipline", pct: clamp(journal.length ? plannedRatio * 0.7 + Math.min(1, journal.length / 10) * 0.3 : 0), evidence: [`${journal.length} journal entr${journal.length === 1 ? "y" : "ies"}`, journal.length ? `${Math.round(plannedRatio * 100)}% planned vs impulse` : "No trades journaled yet"] },
    { id: "consistency", name: "Learning Consistency", pct: clamp(Math.min(1, stats.streak / 14) * 0.5 + Math.min(1, activeDays / 20) * 0.5), evidence: [`${stats.streak}-day current streak`, `${activeDays} active learning day${activeDays === 1 ? "" : "s"}`] },
  ];
  const overall = Math.round(dims.reduce((a, d) => a + d.pct, 0) / dims.length);
  return { dims, overall, issuedAt: new Date().toISOString().slice(0, 10) };
}

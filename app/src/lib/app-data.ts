import { db, tables } from "@/db";
import { asc, desc, eq } from "drizzle-orm";
import { getEntitlement, SIGNALS_ENABLED } from "./entitlements";
import { getStats } from "./gamify";
import type { SessionUser } from "./auth";

export type LessonMeta = { id: string; title: string; minutes: number; isFreePreview: boolean };
export type ModuleMeta = { id: string; name: string; kind: string; lessons: LessonMeta[]; quizId: string | null; quizCount: number };
export type TrackMeta = { id: string; name: string; blurb: string; modules: ModuleMeta[] };

export async function loadContent(): Promise<{ tracks: TrackMeta[]; glossary: [string, string][] }> {
  const [ts, ms, ls, qs, gs] = await Promise.all([
    db.select().from(tables.tracks).where(eq(tables.tracks.published, true)).orderBy(asc(tables.tracks.position)),
    db.select().from(tables.modules).where(eq(tables.modules.published, true)).orderBy(asc(tables.modules.position)),
    db.select({ id: tables.lessons.id, moduleId: tables.lessons.moduleId, title: tables.lessons.title, minutes: tables.lessons.minutes, isFreePreview: tables.lessons.isFreePreview, position: tables.lessons.position, published: tables.lessons.published })
      .from(tables.lessons).where(eq(tables.lessons.published, true)).orderBy(asc(tables.lessons.position)),
    db.select({ id: tables.quizzes.id, moduleId: tables.quizzes.moduleId, questions: tables.quizzes.questions, published: tables.quizzes.published })
      .from(tables.quizzes).where(eq(tables.quizzes.published, true)),
    db.select().from(tables.glossaryTerms).orderBy(asc(tables.glossaryTerms.position)),
  ]);
  const tracks: TrackMeta[] = ts.map((t) => ({
    id: t.id, name: t.name, blurb: t.blurb,
    modules: ms.filter((m) => m.trackId === t.id).map((m) => {
      const quiz = qs.find((q) => q.moduleId === m.id);
      return {
        id: m.id, name: m.name, kind: m.kind,
        lessons: ls.filter((l) => l.moduleId === m.id).map((l) => ({ id: l.id, title: l.title, minutes: l.minutes, isFreePreview: l.isFreePreview })),
        quizId: quiz?.id ?? null,
        quizCount: quiz?.questions.length ?? 0,
      };
    }),
  }));
  return { tracks, glossary: gs.map((g) => [g.term, g.definition]) };
}

export type GoalRow = { id: string; name: string; icon: string; targetPence: number; savedPence: number; targetMonth: string | null; milestones: number[] };
export type JournalRow = { id: string; date: string; symbol: string; direction: string; pnlPence: number; planned: boolean; emotionBefore: string; emotionAfter: string; reason: string };

export async function loadUserState(user: SessionUser) {
  const [progress, attempts, certs, ent, stats, goalRows, journalRows] = await Promise.all([
    db.select().from(tables.lessonProgress).where(eq(tables.lessonProgress.userId, user.id)),
    db.select().from(tables.quizAttempts).where(eq(tables.quizAttempts.userId, user.id)),
    db.select().from(tables.certificates).where(eq(tables.certificates.userId, user.id)),
    getEntitlement(user.id),
    getStats(user.id),
    db.select().from(tables.goals).where(eq(tables.goals.userId, user.id)).orderBy(asc(tables.goals.createdAt)),
    db.select().from(tables.journalEntries).where(eq(tables.journalEntries.userId, user.id)).orderBy(desc(tables.journalEntries.date), desc(tables.journalEntries.createdAt)).limit(200),
  ]);
  const done: Record<string, 1> = {};
  for (const p of progress) done[p.lessonId] = 1;
  const scores: Record<string, number> = {};
  for (const a of attempts) scores[a.quizId] = Math.max(scores[a.quizId] ?? 0, a.scorePct);
  return {
    email: user.email,
    emailVerified: !!user.emailVerifiedAt,
    name: user.name,
    stage: user.stage,
    answers: user.onboardingAnswers,
    done, scores,
    certs: certs.map((c) => ({ trackId: c.trackId, issuedAt: c.issuedAt.toISOString() })),
    ent: {
      member: ent.member, signals: ent.signals, grace: ent.grace,
      status: ent.status, signalsStatus: ent.signalsStatus,
      cancelAtPeriodEnd: ent.cancelAtPeriodEnd,
      currentPeriodEnd: ent.currentPeriodEnd?.toISOString() ?? null,
    },
    signalsEnabled: SIGNALS_ENABLED,
    stats,
    goals: goalRows.map((g): GoalRow => ({ id: g.id, name: g.name, icon: g.icon, targetPence: g.targetPence, savedPence: g.savedPence, targetMonth: g.targetMonth, milestones: g.milestones })),
    journal: journalRows.map((j): JournalRow => ({ id: j.id, date: j.date, symbol: j.symbol, direction: j.direction, pnlPence: j.pnlPence, planned: j.planned, emotionBefore: j.emotionBefore, emotionAfter: j.emotionAfter, reason: j.reason })),
  };
}

/** Server-side lock rules — mirror the prototype exactly. */
export function isLessonFree(l: { isFreePreview: boolean }) { return l.isFreePreview; }

export async function maybeIssueCertificate(userId: string, lessonId: string) {
  // find lesson's track; if every published lesson in the track is now done, issue.
  const lesson = (await db.select().from(tables.lessons).where(eq(tables.lessons.id, lessonId)))[0];
  if (!lesson) return;
  const mod = (await db.select().from(tables.modules).where(eq(tables.modules.id, lesson.moduleId)))[0];
  if (!mod) return;
  const mods = await db.select().from(tables.modules).where(eq(tables.modules.trackId, mod.trackId));
  const modIds = new Set(mods.map((m) => m.id));
  const allLessons = (await db.select().from(tables.lessons).where(eq(tables.lessons.published, true)))
    .filter((l) => modIds.has(l.moduleId));
  const doneRows = await db.select().from(tables.lessonProgress).where(eq(tables.lessonProgress.userId, userId));
  const doneSet = new Set(doneRows.map((r) => r.lessonId));
  if (!allLessons.every((l) => doneSet.has(l.id))) return;
  const user = (await db.select().from(tables.users).where(eq(tables.users.id, userId)))[0];
  const { nid } = await import("./auth");
  await db.insert(tables.certificates)
    .values({ id: nid(), userId, trackId: mod.trackId, nameOnCert: user?.name ?? "" })
    .onConflictDoNothing();
}

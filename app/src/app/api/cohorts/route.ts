import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { currentUser, nid } from "@/lib/auth";

/* Cohorts — churches, groups, workplaces learning together. The board shows LEARNING
   progress only (lessons, streak, XP). Never money, never trades, never balances. */

const code = () => Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const mine = await db.select({ cohortId: tables.cohortMembers.cohortId }).from(tables.cohortMembers).where(eq(tables.cohortMembers.userId, user.id));
  if (!mine.length) return NextResponse.json({ cohorts: [] });
  const ids = mine.map((m) => m.cohortId);
  const cs = await db.select().from(tables.cohorts).where(inArray(tables.cohorts.id, ids));
  const members = await db.select({ cohortId: tables.cohortMembers.cohortId, userId: tables.cohortMembers.userId, name: tables.users.name, email: tables.users.email })
    .from(tables.cohortMembers).innerJoin(tables.users, eq(tables.cohortMembers.userId, tables.users.id)).where(inArray(tables.cohortMembers.cohortId, ids));
  const userIds = [...new Set(members.map((m) => m.userId))];
  const [stats, progress] = await Promise.all([
    db.select().from(tables.userStats).where(inArray(tables.userStats.userId, userIds)),
    db.select({ userId: tables.lessonProgress.userId }).from(tables.lessonProgress).where(inArray(tables.lessonProgress.userId, userIds)),
  ]);
  const lessonsBy: Record<string, number> = {}; progress.forEach((p) => { lessonsBy[p.userId] = (lessonsBy[p.userId] ?? 0) + 1; });
  const out = cs.map((c) => ({
    id: c.id, name: c.name, code: c.leaderId === user.id ? c.code : null, leader: c.leaderId === user.id,
    members: members.filter((m) => m.cohortId === c.id).map((m) => {
      const st = stats.find((s) => s.userId === m.userId);
      const label = (m.name || m.email.split("@")[0]).split(" ")[0];
      return { you: m.userId === user.id, name: m.userId === user.id ? "You" : label, lessons: lessonsBy[m.userId] ?? 0, xp: st?.xp ?? 0, streak: st?.streak ?? 0 };
    }).sort((a, b) => b.xp - a.xp),
  }));
  return NextResponse.json({ cohorts: out });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (b.action === "create") {
    const name = String(b.name ?? "").trim().slice(0, 60); if (!name) return NextResponse.json({ error: "Name the cohort." }, { status: 400 });
    const id = nid(); const c = code();
    await db.insert(tables.cohorts).values({ id, name, code: c, leaderId: user.id });
    await db.insert(tables.cohortMembers).values({ cohortId: id, userId: user.id });
    return NextResponse.json({ id, code: c });
  }
  if (b.action === "join") {
    const c = String(b.code ?? "").trim().toUpperCase();
    const row = (await db.select().from(tables.cohorts).where(eq(tables.cohorts.code, c)))[0];
    if (!row) return NextResponse.json({ error: "No cohort with that code." }, { status: 404 });
    await db.insert(tables.cohortMembers).values({ cohortId: row.id, userId: user.id }).onConflictDoNothing();
    return NextResponse.json({ id: row.id, name: row.name });
  }
  if (b.action === "leave") {
    await db.delete(tables.cohortMembers).where(and(eq(tables.cohortMembers.cohortId, String(b.id)), eq(tables.cohortMembers.userId, user.id)));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

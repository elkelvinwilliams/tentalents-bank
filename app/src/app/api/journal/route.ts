import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { and, desc, eq } from "drizzle-orm";
import { currentUser, nid } from "@/lib/auth";

/* Trading journal — records behaviour (planned vs impulse, emotion) for
   reflection. No XP is ever awarded here: journaling must never feel like
   a reward for trading. */

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const rows = await db.select().from(tables.journalEntries).where(eq(tables.journalEntries.userId, user.id))
    .orderBy(desc(tables.journalEntries.date), desc(tables.journalEntries.createdAt)).limit(200);
  return NextResponse.json({ entries: rows });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const symbol = String(b.symbol ?? "").trim().toUpperCase().slice(0, 12);
  if (!symbol) return NextResponse.json({ error: "Which asset?" }, { status: 400 });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date ?? "")) ? String(b.date) : new Date().toISOString().slice(0, 10);
  const pnlPence = Math.round(Number(b.pnl ?? 0) * 100) || 0;
  const [row] = await db.insert(tables.journalEntries).values({
    id: nid(), userId: user.id, date, symbol,
    direction: b.direction === "Short" ? "Short" : "Long",
    pnlPence: Math.max(-1e11, Math.min(1e11, pnlPence)),
    planned: b.planned !== false && b.planned !== "false",
    emotionBefore: String(b.emotionBefore ?? "").slice(0, 30),
    emotionAfter: String(b.emotionAfter ?? "").slice(0, 30),
    reason: String(b.reason ?? "").slice(0, 200),
  }).returning();
  return NextResponse.json({ entry: row });
}

export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== "string") return NextResponse.json({ error: "Bad request." }, { status: 400 });
  await db.delete(tables.journalEntries).where(and(eq(tables.journalEntries.id, id), eq(tables.journalEntries.userId, user.id)));
  return NextResponse.json({ ok: true });
}

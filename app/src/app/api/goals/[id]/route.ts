import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { award } from "@/lib/gamify";
import { cleanGoal, milestones } from "../route";

async function own(id: string) {
  const user = await currentUser();
  if (!user) return { err: NextResponse.json({ error: "Signed out." }, { status: 401 }) };
  const g = (await db.select().from(tables.goals).where(and(eq(tables.goals.id, id), eq(tables.goals.userId, user.id))))[0];
  if (!g) return { err: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  return { user, g };
}

/** PATCH { name, icon, target, saved, date } — edit. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const o = await own(id);
  if (o.err) return o.err;
  const body = await req.json().catch(() => ({}));
  const clean = cleanGoal(body);
  if (!clean) return NextResponse.json({ error: "Give the goal a name and a target." }, { status: 400 });
  await db.update(tables.goals).set({ ...clean, updatedAt: sql`now()` }).where(eq(tables.goals.id, id));
  const g = (await db.select().from(tables.goals).where(eq(tables.goals.id, id)))[0];
  const ms = await milestones(o.user.id, g);
  const fresh = (await db.select().from(tables.goals).where(eq(tables.goals.id, id)))[0];
  return NextResponse.json({ goal: fresh, xp: ms.xp, badges: ms.badges });
}

/** POST { amount } — record money set aside elsewhere. +10 XP, plus milestones. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const o = await own(id);
  if (o.err) return o.err;
  const body = await req.json().catch(() => ({}));
  const pence = Math.round(Number(body.amount) * 100);
  if (!(pence > 0) || pence > 1e11) return NextResponse.json({ error: "Enter an amount." }, { status: 400 });
  await db.update(tables.goals).set({ savedPence: o.g.savedPence + pence, updatedAt: sql`now()` }).where(eq(tables.goals.id, id));
  const r = await award(o.user.id, "goal_add");
  const g = (await db.select().from(tables.goals).where(eq(tables.goals.id, id)))[0];
  const ms = await milestones(o.user.id, g);
  const fresh = (await db.select().from(tables.goals).where(eq(tables.goals.id, id)))[0];
  return NextResponse.json({ goal: fresh, xp: r.awarded + ms.xp, badges: [...r.newBadges, ...ms.badges] });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const o = await own(id);
  if (o.err) return o.err;
  await db.delete(tables.goals).where(eq(tables.goals.id, id));
  return NextResponse.json({ ok: true });
}

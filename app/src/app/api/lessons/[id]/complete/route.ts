import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { getEntitlement } from "@/lib/entitlements";
import { maybeIssueCertificate } from "@/lib/app-data";
import { award } from "@/lib/gamify";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const { id } = await ctx.params;
  const lesson = (await db.select().from(tables.lessons).where(eq(tables.lessons.id, id)))[0];
  if (!lesson || !lesson.published || !lesson.bodyHtml) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!lesson.isFreePreview) {
    const ent = await getEntitlement(user.id);
    if (!ent.member) return NextResponse.json({ error: "membership_required" }, { status: 402 });
  }
  await db.insert(tables.lessonProgress).values({ userId: user.id, lessonId: id }).onConflictDoNothing();
  await maybeIssueCertificate(user.id, id);
  // learning XP — pays once per lesson
  const r = await award(user.id, "lesson_done", id);
  // finishing the Understanding Risk track earns Risk Aware
  let badges = r.newBadges;
  const mod = (await db.select().from(tables.modules).where(eq(tables.modules.id, lesson.moduleId)))[0];
  if (mod?.trackId === "t3") {
    const cert = (await db.select().from(tables.certificates).where(eq(tables.certificates.userId, user.id))).find((c) => c.trackId === "t3");
    if (cert) { const r2 = await award(user.id, "lesson_done", "t3:complete", ["risk_aware"]); badges = [...badges, ...r2.newBadges]; }
  }
  return NextResponse.json({ ok: true, xp: r.awarded, badges, stats: r.stats });
}

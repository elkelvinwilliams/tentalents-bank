import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { getEntitlement } from "@/lib/entitlements";

/** Lesson body — the paywall is enforced HERE, on the server.
 *  Free-preview lessons are open to any signed-in user; everything else
 *  requires an active (or in-grace) membership. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const { id } = await ctx.params;
  const lesson = (await db.select().from(tables.lessons).where(eq(tables.lessons.id, id)))[0];
  if (!lesson || !lesson.published) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!lesson.isFreePreview) {
    const ent = await getEntitlement(user.id);
    if (!ent.member) return NextResponse.json({ error: "membership_required" }, { status: 402 });
  }
  return NextResponse.json({ bodyHtml: lesson.bodyHtml, minutes: lesson.minutes });
}

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { award } from "@/lib/gamify";

/* In-lesson knowledge check: the client reports a correct first answer for
   a lesson; XP pays once per lesson (ref = lesson id). Answers themselves are
   validated client-side — this is a nudge, not an exam (the module quiz is). */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const { lessonId } = await req.json().catch(() => ({}));
  if (typeof lessonId !== "string" || !lessonId) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const r = await award(user.id, "knowledge", lessonId);
  return NextResponse.json({ xp: r.awarded, badges: r.newBadges, stats: r.stats });
}

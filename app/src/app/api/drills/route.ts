import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { award } from "@/lib/gamify";
import { DRILLS } from "@/content/drills";
import { db, tables } from "@/db";
import { and, eq } from "drizzle-orm";

/* Scenario drills: POST { id, choice } -> verdict. The best answer earns XP
   once per scenario; answering all of them well earns the Good Judgement badge. */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const d = DRILLS.find((x) => x.id === b.id);
  const choice = Number(b.choice);
  if (!d || !(choice >= 0 && choice < d.options.length)) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const best = choice === d.best;
  let xp = 0; let badges: string[] = [];
  if (best) {
    const r = await award(user.id, "drill", d.id);
    xp = r.awarded; badges = r.newBadges;
    const done = await db.select({ ref: tables.xpEvents.ref }).from(tables.xpEvents)
      .where(and(eq(tables.xpEvents.userId, user.id), eq(tables.xpEvents.kind, "drill")));
    if (DRILLS.every((x) => done.some((row) => row.ref === x.id))) {
      const r2 = await award(user.id, "drill", "all", ["judgement"]);
      badges = [...badges, ...r2.newBadges];
    }
  }
  return NextResponse.json({ best, bestIndex: d.best, why: d.options[choice].why, xp, badges });
}

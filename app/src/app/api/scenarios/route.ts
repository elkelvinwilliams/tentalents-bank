import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { award } from "@/lib/gamify";
import { SCAM_SCENARIOS } from "@/content/safety";
import { JOURNEY } from "@/content/journey";
import { db, tables } from "@/db";
import { and, eq } from "drizzle-orm";

/* Spot-the-Scam and journey-stage scenarios: POST { set: "safety"|"journey", id, choice }.
   The safer/best answer earns learning XP once per scenario. */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const set = b.set === "journey" ? "journey" : "safety";
  const list = set === "journey" ? JOURNEY.map((s) => s.scenario) : SCAM_SCENARIOS;
  const d = list.find((x) => x.id === b.id);
  const choice = Number(b.choice);
  if (!d || !(choice >= 0 && choice < d.options.length)) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const best = choice === d.best;
  let xp = 0; let badges: string[] = [];
  if (best) {
    const r = await award(user.id, set, d.id);
    xp = r.awarded; badges = r.newBadges;
    const done = await db.select({ ref: tables.xpEvents.ref }).from(tables.xpEvents).where(and(eq(tables.xpEvents.userId, user.id), eq(tables.xpEvents.kind, set)));
    if (list.every((x) => done.some((row) => row.ref === x.id))) {
      const r2 = await award(user.id, set, "all", [set === "safety" ? "scam_spotter" : "builder"]);
      badges = [...badges, ...r2.newBadges];
    }
  }
  return NextResponse.json({ best, bestIndex: d.best, why: d.options[choice].why, xp, badges });
}

import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { award } from "@/lib/gamify";

/** Persists onboarding answers, journey stage and certificate name.
 *  Finishing the readiness assessment (stage -> tour) pays XP once. */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const patch: Partial<typeof tables.users.$inferInsert> = {};
  if (body.stage && ["onboard", "tour", "app"].includes(body.stage)) patch.stage = body.stage;
  if (body.answers && typeof body.answers === "object") {
    const clean: Record<string, number> = {};
    for (const [k, v] of Object.entries(body.answers)) {
      if (/^\d$/.test(k) && typeof v === "number" && v >= 0 && v < 10) clean[k] = v;
    }
    patch.onboardingAnswers = clean;
  }
  if (typeof body.name === "string") {
    patch.name = body.name.slice(0, 120);
    // keep future certificates in sync; already-issued ones keep their name
  }
  if (Object.keys(patch).length) await db.update(tables.users).set(patch).where(eq(tables.users.id, user.id));
  let xp = 0;
  if (patch.stage === "tour") xp = (await award(user.id, "assessment", "onboarding")).awarded;
  return NextResponse.json({ ok: true, xp });
}

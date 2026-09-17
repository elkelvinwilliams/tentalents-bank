import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { stripe, applySubscription } from "@/lib/stripe";

/** Cancel at period end — access continues until then; progress untouched. */
export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const ent = (await db.select().from(tables.entitlements).where(eq(tables.entitlements.userId, user.id)))[0];
  if (!ent?.subscriptionId) return NextResponse.json({ error: "No subscription to cancel." }, { status: 400 });
  try {
    const sub = await stripe().subscriptions.update(ent.subscriptionId, { cancel_at_period_end: true });
    await applySubscription(sub);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("cancel", e);
    return NextResponse.json({ error: "Couldn't cancel just now. Try the billing portal instead." }, { status: 500 });
  }
}

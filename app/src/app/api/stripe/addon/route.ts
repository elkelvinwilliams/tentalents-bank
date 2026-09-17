import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { SIGNALS_ENABLED } from "@/lib/entitlements";
import { stripe, PRICE_SIGNALS, applySubscription } from "@/lib/stripe";

/** Add or remove the Signals add-on as a second item on the existing
 *  subscription (one invoice, prorated). Members only, flag-gated. */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { action } = await req.json().catch(() => ({}));
  const ent = (await db.select().from(tables.entitlements).where(eq(tables.entitlements.userId, user.id)))[0];
  if (!ent?.subscriptionId || !["active", "trialing", "past_due"].includes(ent.status)) {
    return NextResponse.json({ error: "Signals access is for active members." }, { status: 400 });
  }
  try {
    if (action === "add") {
      if (!SIGNALS_ENABLED) return NextResponse.json({ error: "Signals access isn't available yet." }, { status: 400 });
      if (ent.signalsItemId) return NextResponse.json({ error: "Already added." }, { status: 400 });
      await stripe().subscriptionItems.create({
        subscription: ent.subscriptionId, price: PRICE_SIGNALS(), quantity: 1,
        proration_behavior: "create_prorations",
      });
    } else if (action === "remove") {
      if (!ent.signalsItemId) return NextResponse.json({ error: "Nothing to remove." }, { status: 400 });
      await stripe().subscriptionItems.del(ent.signalsItemId, { proration_behavior: "create_prorations" });
    } else {
      return NextResponse.json({ error: "Bad action." }, { status: 400 });
    }
    // reflect immediately; the webhook remains the source of truth and will confirm
    const sub = await stripe().subscriptions.retrieve(ent.subscriptionId);
    await applySubscription(sub);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("addon", e);
    return NextResponse.json({ error: "Couldn't update the add-on. Try again." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db, tables } from "@/db";
import { stripe, applySubscription } from "@/lib/stripe";

/* THE source of truth for entitlement. Signature-verified, idempotent.
   The client never writes entitlement state; only this handler (and the
   immediate post-change refresh in addon/cancel, which reads from Stripe)
   touches the entitlements table. */

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  // idempotency: process each event id once
  const inserted = await db.insert(tables.webhookEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning();
  if (!inserted.length) return NextResponse.json({ ok: true, duplicate: true });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.subscription) {
        const sub = await stripe().subscriptions.retrieve(session.subscription as string);
        await applySubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await applySubscription(event.data.object);
      break;
    }
    case "invoice.payment_failed":
    case "invoice.paid": {
      const invoice = event.data.object;
      const subId = (invoice as { subscription?: string | null }).subscription
        ?? invoice.parent?.subscription_details?.subscription;
      if (subId) {
        const sub = await stripe().subscriptions.retrieve(typeof subId === "string" ? subId : subId.id);
        await applySubscription(sub); // past_due -> grace banner; paid -> active again
      }
      break;
    }
  }
  return NextResponse.json({ ok: true });
}

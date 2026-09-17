import Stripe from "stripe";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";

export const stripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured yet.");
  return new Stripe(key);
};

export const PRICE_MEMBERSHIP = () => process.env.STRIPE_PRICE_MEMBERSHIP ?? "";
export const PRICE_SIGNALS = () => process.env.STRIPE_PRICE_SIGNALS ?? "";

/** Get or create the Stripe customer for a user; store the id. */
export async function customerFor(userId: string, email: string) {
  const rows = await db.select().from(tables.entitlements).where(eq(tables.entitlements.userId, userId));
  if (rows[0]?.stripeCustomerId) return rows[0].stripeCustomerId;
  const c = await stripe().customers.create({ email, metadata: { userId } });
  await db.insert(tables.entitlements)
    .values({ userId, stripeCustomerId: c.id })
    .onConflictDoUpdate({ target: tables.entitlements.userId, set: { stripeCustomerId: c.id } });
  return c.id;
}

/** Re-derive entitlement rows from a subscription object. Webhook-only writer. */
export async function applySubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId || (typeof sub.customer === "string"
    ? (await db.select().from(tables.entitlements).where(eq(tables.entitlements.stripeCustomerId, sub.customer)))[0]?.userId
    : undefined);
  if (!userId) return;

  const items = sub.items.data;
  const mItem = items.find((i) => i.price.id === PRICE_MEMBERSHIP());
  const sItem = items.find((i) => i.price.id === PRICE_SIGNALS());
  const dead = ["canceled", "unpaid", "incomplete_expired"].includes(sub.status);
  const status = dead ? "canceled" : sub.status; // active | trialing | past_due | ...
  const periodEnd = mItem?.current_period_end ?? items[0]?.current_period_end;

  await db.insert(tables.entitlements).values({
    userId,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    subscriptionId: sub.id,
    membershipItemId: mItem?.id ?? null,
    signalsItemId: sItem?.id ?? null,
    status: mItem && !dead ? status : dead ? "canceled" : "none",
    signalsStatus: sItem && !dead ? status : "none",
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: tables.entitlements.userId,
    set: {
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      subscriptionId: sub.id,
      membershipItemId: mItem?.id ?? null,
      signalsItemId: sItem?.id ?? null,
      status: mItem && !dead ? status : dead ? "canceled" : "none",
      signalsStatus: sItem && !dead ? status : "none",
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: !!sub.cancel_at_period_end,
      updatedAt: new Date(),
    },
  });
}

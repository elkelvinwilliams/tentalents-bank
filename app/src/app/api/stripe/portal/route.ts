import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { appUrl } from "@/lib/email";

/** Stripe Billing Portal: update card, view invoices, cancel at period end. */
export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const ent = (await db.select().from(tables.entitlements).where(eq(tables.entitlements.userId, user.id)))[0];
  if (!ent?.stripeCustomerId) return NextResponse.json({ error: "No billing account yet." }, { status: 400 });
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: ent.stripeCustomerId,
      return_url: `${appUrl()}/`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("portal", e);
    return NextResponse.json({ error: "Billing portal isn't available right now." }, { status: 500 });
  }
}

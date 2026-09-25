import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getEntitlement, SIGNALS_ENABLED } from "@/lib/entitlements";
import { customerFor, stripe, PRICE_MEMBERSHIP, PRICE_SIGNALS, PAYMENT_LINK } from "@/lib/stripe";
import { appUrl } from "@/lib/email";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (/TenTalentsApp/.test(req.headers.get("user-agent") ?? "")) return NextResponse.json({ error: "Membership is managed on the website." }, { status: 403 });
  const { addon } = await req.json().catch(() => ({}));
  const ent = await getEntitlement(user.id);
  if (ent.member) return NextResponse.json({ error: "You already have an active membership — manage it from your profile." }, { status: 400 });

  // Payment Link route: Stripe collects the email itself, so no verification gate here.
  if (PAYMENT_LINK()) {
    const u = new URL(PAYMENT_LINK());
    u.searchParams.set("client_reference_id", user.id);
    u.searchParams.set("prefilled_email", user.email);
    return NextResponse.json({ url: u.toString() });
  }
  if (!user.emailVerifiedAt) return NextResponse.json({ error: "Confirm your email first — check your inbox for the link." }, { status: 403 });
  if (addon && !SIGNALS_ENABLED) return NextResponse.json({ error: "Signals access isn't available yet." }, { status: 400 });

  try {
    const customer = await customerFor(user.id, user.email);
    const line_items = [{ price: PRICE_MEMBERSHIP(), quantity: 1 }];
    if (addon && SIGNALS_ENABLED) line_items.push({ price: PRICE_SIGNALS(), quantity: 1 });
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items,
      currency: "gbp",
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${appUrl()}/?checkout=success`,
      cancel_url: `${appUrl()}/?checkout=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout", e);
    return NextResponse.json({ error: "Payments aren't configured yet. Try again soon." }, { status: 500 });
  }
}

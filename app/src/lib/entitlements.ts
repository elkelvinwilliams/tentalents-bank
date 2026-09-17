import { db, tables } from "@/db";
import { eq } from "drizzle-orm";

/** Entitlement state, derived ONLY from what Stripe webhooks wrote.
 *  The client never sets any of this; it reads it via the server. */
export type Entitlement = {
  member: boolean;        // full Academy access
  signals: boolean;       // signals add-on access
  status: string;         // none | active | trialing | past_due | canceled
  signalsStatus: string;
  grace: boolean;         // past_due -> show banner, keep access until Stripe gives up
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
};

const OPEN = new Set(["active", "trialing"]);

export async function getEntitlement(userId: string): Promise<Entitlement> {
  const rows = await db.select().from(tables.entitlements)
    .where(eq(tables.entitlements.userId, userId));
  const e = rows[0];
  if (!e) return { member: false, signals: false, status: "none", signalsStatus: "none", grace: false, cancelAtPeriodEnd: false, currentPeriodEnd: null };
  const grace = e.status === "past_due";
  return {
    member: OPEN.has(e.status) || grace, // grace keeps access; hard states lock it
    signals: (OPEN.has(e.signalsStatus) || (e.signalsStatus === "past_due")) && (OPEN.has(e.status) || grace),
    status: e.status,
    signalsStatus: e.signalsStatus,
    grace,
    cancelAtPeriodEnd: e.cancelAtPeriodEnd,
    currentPeriodEnd: e.currentPeriodEnd,
  };
}

/** Feature flag: the Signals product is built but ships dark until the
 *  written legal sign-off is filed (04_COMPLIANCE). Flip via env only. */
export const SIGNALS_ENABLED = process.env.SIGNALS_ENABLED === "true";

// dev-only helper: simulate the entitlement row the Stripe webhook would write
import { db, tables } from "../src/db";
import { eq } from "drizzle-orm";
const email = process.argv[2] ?? "founder-test@example.com";
const u = (await db.select().from(tables.users).where(eq(tables.users.email, email)))[0];
if (!u) throw new Error("no user " + email);
await db.insert(tables.entitlements).values({ userId: u.id, status: "active", signalsStatus: "none" })
  .onConflictDoUpdate({ target: tables.entitlements.userId, set: { status: "active", updatedAt: new Date() } });
console.log("granted membership to", email);
process.exit(0);

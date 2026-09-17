// dev-only: create a verified member user (run ONLY while the server is stopped)
import { db, tables } from "../src/db";
import { hashPassword, nid } from "../src/lib/auth";
const email = "founder-test@example.com";
const id = nid();
await db.insert(tables.users).values({
  id, email, passwordHash: await hashPassword("testpass123"),
  emailVerifiedAt: new Date(), consentAt: new Date(), stage: "app", name: "Kelvin Williams",
}).onConflictDoNothing();
await db.insert(tables.entitlements).values({ userId: id, status: "active" })
  .onConflictDoUpdate({ target: tables.entitlements.userId, set: { status: "active" } });
console.log("member user ready:", email);
process.exit(0);

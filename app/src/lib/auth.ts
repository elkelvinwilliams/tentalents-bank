import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { createHash, randomBytes } from "node:crypto";

const SESSION_COOKIE = "tt_session";
const SESSION_DAYS = 30;

export const nid = (n = 21) => randomBytes(n).toString("base64url").slice(0, n);
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export const hashPassword = (pw: string) => argonHash(pw);
export const verifyPassword = (hash: string, pw: string) => argonVerify(hash, pw).catch(() => false);

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(tables.sessions).values({ id: hashToken(token), userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(tables.sessions).where(eq(tables.sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

export type SessionUser = typeof tables.users.$inferSelect;

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db.select({ user: tables.users, session: tables.sessions })
    .from(tables.sessions)
    .innerJoin(tables.users, eq(tables.sessions.userId, tables.users.id))
    .where(eq(tables.sessions.id, hashToken(token)));
  const row = rows[0];
  if (!row) return null;
  if (row.session.expiresAt < new Date()) {
    await db.delete(tables.sessions).where(eq(tables.sessions.id, row.session.id));
    return null;
  }
  return row.user;
}

/* ---- one-time email tokens (verify / reset) ---- */
export async function issueEmailToken(userId: string, purpose: "verify" | "reset") {
  const token = randomBytes(32).toString("base64url");
  await db.insert(tables.emailTokens).values({
    tokenHash: hashToken(token), userId, purpose,
    expiresAt: new Date(Date.now() + 24 * 36e5),
  });
  return token;
}

export async function consumeEmailToken(token: string, purpose: "verify" | "reset") {
  const rows = await db.select().from(tables.emailTokens)
    .where(eq(tables.emailTokens.tokenHash, hashToken(token)));
  const row = rows[0];
  if (!row || row.purpose !== purpose || row.expiresAt < new Date()) return null;
  await db.delete(tables.emailTokens).where(eq(tables.emailTokens.tokenHash, row.tokenHash));
  return row.userId;
}

/* ---- admin gate: a separate password (ADMIN_PASSWORD env), per spec ---- */
const ADMIN_COOKIE = "tt_admin";
export async function adminSignIn(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) return false;
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, hashToken(expected), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 12 * 3600, // "/" so /api/admin/* receives it too
  });
  return true;
}
export async function isAdmin() {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === hashToken(expected);
}

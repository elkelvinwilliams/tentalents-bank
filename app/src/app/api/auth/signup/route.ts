import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { createSession, hashPassword, issueEmailToken, nid } from "@/lib/auth";
import { appUrl, sendEmail, verifyEmailHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email, password, consent } = await req.json().catch(() => ({}));
  const em = String(email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (typeof password !== "string" || password.length < 8) return NextResponse.json({ error: "Password needs at least 8 characters." }, { status: 400 });
  if (consent !== true) return NextResponse.json({ error: "You need to accept the notice on the previous screen first." }, { status: 400 });
  const existing = await db.select().from(tables.users).where(eq(tables.users.email, em));
  if (existing.length) return NextResponse.json({ error: "An account with that email already exists. Sign in instead." }, { status: 409 });
  const id = nid();
  await db.insert(tables.users).values({ id, email: em, passwordHash: await hashPassword(password), consentAt: new Date() });
  const token = await issueEmailToken(id, "verify");
  await sendEmail(em, "Confirm your Ten Talents Academy account", verifyEmailHtml(`${appUrl()}/api/auth/verify?token=${token}`)).catch(() => {});
  await createSession(id);
  return NextResponse.json({ ok: true });
}

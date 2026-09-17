import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { consumeEmailToken, createSession, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || password.length < 8) return NextResponse.json({ error: "Password needs at least 8 characters." }, { status: 400 });
  const userId = await consumeEmailToken(String(token ?? ""), "reset");
  if (!userId) return NextResponse.json({ error: "That reset link has expired or was already used. Request a new one." }, { status: 400 });
  await db.update(tables.users).set({ passwordHash: await hashPassword(password) }).where(eq(tables.users.id, userId));
  await db.delete(tables.sessions).where(eq(tables.sessions.userId, userId)); // sign out everywhere
  await createSession(userId);
  return NextResponse.json({ ok: true });
}

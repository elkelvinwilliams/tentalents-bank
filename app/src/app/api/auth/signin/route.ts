import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  const em = String(email ?? "").trim().toLowerCase();
  const rows = await db.select().from(tables.users).where(eq(tables.users.email, em));
  const user = rows[0];
  const ok = user && (await verifyPassword(user.passwordHash, String(password ?? "")));
  if (!ok) return NextResponse.json({ error: "That email and password don't match." }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}

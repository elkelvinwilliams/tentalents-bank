import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { issueEmailToken } from "@/lib/auth";
import { appUrl, resetEmailHtml, sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  const em = String(email ?? "").trim().toLowerCase();
  const rows = await db.select().from(tables.users).where(eq(tables.users.email, em));
  if (rows[0]) {
    const token = await issueEmailToken(rows[0].id, "reset");
    await sendEmail(em, "Reset your Ten Talents Academy password", resetEmailHtml(`${appUrl()}/?reset=${token}`)).catch(() => {});
  }
  // same response either way — no account enumeration
  return NextResponse.json({ ok: true });
}

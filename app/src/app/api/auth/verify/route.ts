import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { consumeEmailToken } from "@/lib/auth";
import { appUrl } from "@/lib/email";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const userId = await consumeEmailToken(token, "verify");
  if (userId) {
    await db.update(tables.users).set({ emailVerifiedAt: new Date() }).where(eq(tables.users.id, userId));
  }
  return NextResponse.redirect(`${appUrl()}/?verified=${userId ? "1" : "0"}`);
}

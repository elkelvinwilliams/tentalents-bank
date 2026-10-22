import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listFirms, nextActions } from "@/lib/partners-data";

/* Affiliate Partnerships — overview. Admin-only (server-side gate). */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  const [firms, actions] = await Promise.all([listFirms(), nextActions()]);
  return NextResponse.json({ firms, actions }, { headers: { "Cache-Control": "no-store" } });
}

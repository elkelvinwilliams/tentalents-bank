import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getStats } from "@/lib/gamify";

/** Current learning stats — the client refreshes this after anything that pays XP. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  return NextResponse.json(await getStats(user.id));
}

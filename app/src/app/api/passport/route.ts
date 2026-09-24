import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { computePassport } from "@/lib/passport";

/** Educational readiness profile — recomputed on request from learning activity. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  return NextResponse.json(await computePassport(user.id));
}

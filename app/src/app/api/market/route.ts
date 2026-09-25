import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getCandles, getQuotes, UNIVERSE, type Interval } from "@/lib/market";

/** GET /api/market → quotes for the universe. GET /api/market?symbol=XAUUSD&interval=1h → candles. Educational only. */
export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (symbol) {
    const interval = (["15min", "1h", "4h", "1day"].includes(req.nextUrl.searchParams.get("interval") ?? "") ? req.nextUrl.searchParams.get("interval") : "1h") as Interval;
    const r = await getCandles(symbol, interval);
    return NextResponse.json(r, { headers: { "Cache-Control": "private, max-age=60" } });
  }
  const r = await getQuotes();
  return NextResponse.json({ ...r, universe: UNIVERSE.map((u) => ({ id: u.id, name: u.name, kind: u.kind, currency: u.currency, decimals: u.decimals })) }, { headers: { "Cache-Control": "private, max-age=30" } });
}

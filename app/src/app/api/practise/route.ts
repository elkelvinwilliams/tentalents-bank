import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { sync, placeOrder, closePosition, cancelOrder, amendPosition, resetAccount } from "@/lib/practise";

/* Practice portfolio. GET → sync + snapshot. POST { action } → order | close | cancel | amend | reset.
   Virtual money only. No XP is awarded by anything in this file. */

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  return NextResponse.json(await sync(user.id));
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const num = (x: unknown) => (x === "" || x == null ? null : Number.isFinite(Number(x)) ? Number(x) : null);
  let result: { ok: boolean; error?: string; pnlPence?: number };
  switch (b.action) {
    case "order": result = await placeOrder(user.id, { symbol: String(b.symbol ?? ""), side: b.side === "sell" ? "sell" : "buy", type: b.type === "limit" ? "limit" : b.type === "stop" ? "stop" : "market", qty: Number(b.qty), limitPrice: num(b.limitPrice), stopLoss: num(b.stopLoss), takeProfit: num(b.takeProfit), reason: String(b.reason ?? "") }); break;
    case "close": result = await closePosition(user.id, String(b.id)); break;
    case "cancel": result = await cancelOrder(user.id, String(b.id)); break;
    case "amend": result = await amendPosition(user.id, String(b.id), num(b.stopLoss), num(b.takeProfit)); break;
    case "reset": result = await resetAccount(user.id); break;
    default: return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  if (!result.ok) return NextResponse.json({ error: result.error ?? "Could not do that." }, { status: 400 });
  return NextResponse.json({ ...result, snapshot: await sync(user.id) });
}

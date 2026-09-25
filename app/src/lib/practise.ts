import { db, tables } from "@/db";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { nid } from "./auth";
import { getQuotes, byId, type Quote } from "./market";

/* ============================================================
   Practice portfolio — £100,000 of virtual money per user, saved to the
   account. Market, limit and stop orders; stop-loss / take-profit; positions
   marked to the latest quote; equity curve sampled on each sync.
   Simplifications, stated in the UI: fills happen at the quote seen when the
   engine runs (no intrabar highs/lows), no FX conversion, no fees, no leverage.
   No XP is ever awarded here. No real orders exist anywhere in this code.
   ============================================================ */

export const START_PENCE = 10_000_000; // £100,000
const toPence = (n: number) => Math.round(n * 100);

export type Position = { id: string; symbol: string; name: string; side: "buy" | "sell"; qty: number; entryPrice: number; price: number; pnlPence: number; stopLoss: number | null; takeProfit: number | null; openedAt: string; reason: string };
export type Pending = { id: string; symbol: string; name: string; side: "buy" | "sell"; type: "limit" | "stop"; qty: number; limitPrice: number; stopLoss: number | null; takeProfit: number | null; createdAt: string };
export type Closed = { id: string; symbol: string; name: string; side: "buy" | "sell"; qty: number; entryPrice: number; exitPrice: number; pnlPence: number; openedAt: string; closedAt: string; exitReason: string };
export type Snapshot = { account: { cashPence: number; startPence: number; equityPence: number; openPnlPence: number; resets: number }; positions: Position[]; pending: Pending[]; history: Closed[]; equity: { t: string; v: number }[]; quotes: Quote[]; source: string };

async function account(userId: string) {
  const row = (await db.select().from(tables.simAccounts).where(eq(tables.simAccounts.userId, userId)))[0];
  if (row) return row;
  await db.insert(tables.simAccounts).values({ userId }).onConflictDoNothing();
  return (await db.select().from(tables.simAccounts).where(eq(tables.simAccounts.userId, userId)))[0];
}
const pnlOf = (side: string, qty: number, entry: number, price: number) => (side === "buy" ? 1 : -1) * (toPence(price * qty) - toPence(entry * qty)); // pence-exact: cash in + out always reconciles

/** Evaluate pending orders and SL/TP against the latest quotes, then return the full snapshot. */
export async function sync(userId: string): Promise<Snapshot> {
  const acc = await account(userId);
  const orders = await db.select().from(tables.simOrders).where(and(eq(tables.simOrders.userId, userId), inArray(tables.simOrders.status, ["open", "pending"])));
  const { quotes, source } = await getQuotes();
  const q = new Map(quotes.map((x) => [x.symbol, x]));
  let cash = acc.cashPence;
  const now = new Date();
  for (const o of orders) {
    const quote = q.get(o.symbol); if (!quote) continue;
    const p = quote.price;
    if (o.status === "pending" && o.limitPrice != null) {
      const hit = o.type === "limit" ? (o.side === "buy" ? p <= o.limitPrice : p >= o.limitPrice) : (o.side === "buy" ? p >= o.limitPrice : p <= o.limitPrice);
      if (hit) {
        const notional = toPence(p * o.qty);
        if (notional <= cash) { cash -= notional; await db.update(tables.simOrders).set({ status: "open", entryPrice: p, openedAt: now }).where(eq(tables.simOrders.id, o.id)); }
        else await db.update(tables.simOrders).set({ status: "cancelled", exitReason: "insufficient cash at fill", closedAt: now }).where(eq(tables.simOrders.id, o.id));
      }
    } else if (o.status === "open" && o.entryPrice != null) {
      const sl = o.stopLoss != null && (o.side === "buy" ? p <= o.stopLoss : p >= o.stopLoss);
      const tp = o.takeProfit != null && (o.side === "buy" ? p >= o.takeProfit : p <= o.takeProfit);
      if (sl || tp) {
        const pnl = pnlOf(o.side, o.qty, o.entryPrice, p);
        cash += toPence(o.entryPrice * o.qty) + pnl;
        await db.update(tables.simOrders).set({ status: "closed", exitPrice: p, pnlPence: pnl, closedAt: now, exitReason: sl ? "stop-loss" : "take-profit" }).where(eq(tables.simOrders.id, o.id));
      }
    }
  }
  if (cash !== acc.cashPence) await db.update(tables.simAccounts).set({ cashPence: cash, updatedAt: now }).where(eq(tables.simAccounts.userId, userId));
  return snapshot(userId, quotes, source);
}

async function snapshot(userId: string, quotes: Quote[], source: string): Promise<Snapshot> {
  const acc = await account(userId);
  const q = new Map(quotes.map((x) => [x.symbol, x]));
  const rows = await db.select().from(tables.simOrders).where(eq(tables.simOrders.userId, userId)).orderBy(desc(tables.simOrders.createdAt)).limit(300);
  const positions: Position[] = rows.filter((o) => o.status === "open").map((o) => { const price = q.get(o.symbol)?.price ?? o.entryPrice ?? 0; return { id: o.id, symbol: o.symbol, name: byId(o.symbol)?.name ?? o.symbol, side: o.side as "buy" | "sell", qty: o.qty, entryPrice: o.entryPrice ?? 0, price, pnlPence: pnlOf(o.side, o.qty, o.entryPrice ?? 0, price), stopLoss: o.stopLoss, takeProfit: o.takeProfit, openedAt: (o.openedAt ?? o.createdAt).toISOString(), reason: o.reason }; });
  const pending: Pending[] = rows.filter((o) => o.status === "pending").map((o) => ({ id: o.id, symbol: o.symbol, name: byId(o.symbol)?.name ?? o.symbol, side: o.side as "buy" | "sell", type: o.type as "limit" | "stop", qty: o.qty, limitPrice: o.limitPrice ?? 0, stopLoss: o.stopLoss, takeProfit: o.takeProfit, createdAt: o.createdAt.toISOString() }));
  const history: Closed[] = rows.filter((o) => o.status === "closed").map((o) => ({ id: o.id, symbol: o.symbol, name: byId(o.symbol)?.name ?? o.symbol, side: o.side as "buy" | "sell", qty: o.qty, entryPrice: o.entryPrice ?? 0, exitPrice: o.exitPrice ?? 0, pnlPence: o.pnlPence ?? 0, openedAt: (o.openedAt ?? o.createdAt).toISOString(), closedAt: (o.closedAt ?? o.createdAt).toISOString(), exitReason: o.exitReason }));
  const openPnl = positions.reduce((a, p) => a + p.pnlPence, 0);
  const held = positions.reduce((a, p) => a + toPence(p.entryPrice * p.qty), 0);
  const equityPence = acc.cashPence + held + openPnl;
  // equity curve: at most one sample per 30 minutes
  const last = (await db.select().from(tables.simEquity).where(eq(tables.simEquity.userId, userId)).orderBy(desc(tables.simEquity.at)).limit(1))[0];
  if (!last || Date.now() - last.at.getTime() > 30 * 60_000) await db.insert(tables.simEquity).values({ id: nid(), userId, equityPence });
  const curve = await db.select().from(tables.simEquity).where(eq(tables.simEquity.userId, userId)).orderBy(asc(tables.simEquity.at)).limit(400);
  return { account: { cashPence: acc.cashPence, startPence: acc.startPence, equityPence, openPnlPence: openPnl, resets: acc.resets }, positions, pending, history, equity: curve.map((c) => ({ t: c.at.toISOString(), v: c.equityPence })), quotes, source };
}

export type OrderInput = { symbol: string; side: "buy" | "sell"; type: "market" | "limit" | "stop"; qty: number; limitPrice?: number | null; stopLoss?: number | null; takeProfit?: number | null; reason?: string };

export async function placeOrder(userId: string, o: OrderInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const inst = byId(o.symbol); if (!inst) return { ok: false, error: "Unknown market." };
  if (!(o.qty > 0) || o.qty > 1e7) return { ok: false, error: "Enter a quantity." };
  if (o.type !== "market" && !(o.limitPrice && o.limitPrice > 0)) return { ok: false, error: "Enter a price for the order." };
  const acc = await account(userId);
  const { quotes } = await getQuotes([o.symbol]); const p = quotes[0]?.price; if (!p) return { ok: false, error: "No price available right now." };
  if (o.stopLoss != null && ((o.side === "buy" && o.stopLoss >= p) || (o.side === "sell" && o.stopLoss <= p)) && o.type === "market") return { ok: false, error: "Stop-loss must be on the losing side of the price." };
  if (o.takeProfit != null && ((o.side === "buy" && o.takeProfit <= p) || (o.side === "sell" && o.takeProfit >= p)) && o.type === "market") return { ok: false, error: "Take-profit must be on the winning side of the price." };
  const notional = toPence((o.type === "market" ? p : o.limitPrice!) * o.qty);
  if (notional > acc.cashPence) return { ok: false, error: `That needs ${(notional / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" })} of virtual cash; you have ${(acc.cashPence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" })}. No leverage in the practice account.` };
  const now = new Date();
  if (o.type === "market") {
    await db.insert(tables.simOrders).values({ id: nid(), userId, symbol: inst.id, side: o.side, type: "market", qty: o.qty, entryPrice: p, stopLoss: o.stopLoss ?? null, takeProfit: o.takeProfit ?? null, status: "open", reason: (o.reason ?? "").slice(0, 200), openedAt: now });
    await db.update(tables.simAccounts).set({ cashPence: acc.cashPence - notional, updatedAt: now }).where(eq(tables.simAccounts.userId, userId));
  } else {
    await db.insert(tables.simOrders).values({ id: nid(), userId, symbol: inst.id, side: o.side, type: o.type, qty: o.qty, limitPrice: o.limitPrice!, stopLoss: o.stopLoss ?? null, takeProfit: o.takeProfit ?? null, status: "pending", reason: (o.reason ?? "").slice(0, 200) });
  }
  return { ok: true };
}

export async function closePosition(userId: string, id: string) {
  const o = (await db.select().from(tables.simOrders).where(and(eq(tables.simOrders.id, id), eq(tables.simOrders.userId, userId))))[0];
  if (!o || o.status !== "open" || o.entryPrice == null) return { ok: false as const, error: "Position not open." };
  const { quotes } = await getQuotes([o.symbol]); const p = quotes[0]?.price; if (!p) return { ok: false as const, error: "No price available." };
  const pnl = pnlOf(o.side, o.qty, o.entryPrice, p); const now = new Date();
  const acc = await account(userId);
  await db.update(tables.simOrders).set({ status: "closed", exitPrice: p, pnlPence: pnl, closedAt: now, exitReason: "closed by you" }).where(eq(tables.simOrders.id, id));
  await db.update(tables.simAccounts).set({ cashPence: acc.cashPence + toPence(o.entryPrice * o.qty) + pnl, updatedAt: now }).where(eq(tables.simAccounts.userId, userId));
  return { ok: true as const, pnlPence: pnl };
}

export async function cancelOrder(userId: string, id: string) {
  await db.update(tables.simOrders).set({ status: "cancelled", closedAt: new Date(), exitReason: "cancelled" }).where(and(eq(tables.simOrders.id, id), eq(tables.simOrders.userId, userId), eq(tables.simOrders.status, "pending")));
  return { ok: true as const };
}

export async function amendPosition(userId: string, id: string, stopLoss: number | null, takeProfit: number | null) {
  await db.update(tables.simOrders).set({ stopLoss, takeProfit }).where(and(eq(tables.simOrders.id, id), eq(tables.simOrders.userId, userId), eq(tables.simOrders.status, "open")));
  return { ok: true as const };
}

/** Wipe the practice account back to £100,000. History is kept (marked by reset count). */
export async function resetAccount(userId: string) {
  const acc = await account(userId); const now = new Date();
  await db.update(tables.simOrders).set({ status: "cancelled", closedAt: now, exitReason: "account reset" }).where(and(eq(tables.simOrders.userId, userId), inArray(tables.simOrders.status, ["open", "pending"])));
  await db.update(tables.simAccounts).set({ cashPence: START_PENCE, startPence: START_PENCE, resets: acc.resets + 1, updatedAt: now }).where(eq(tables.simAccounts.userId, userId));
  await db.delete(tables.simEquity).where(eq(tables.simEquity.userId, userId));
  return { ok: true as const };
}

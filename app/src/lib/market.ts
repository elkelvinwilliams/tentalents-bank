import { db, tables } from "@/db";
import { eq, sql } from "drizzle-orm";

/* ============================================================
   Market data — educational quotes and candles for the Practise tab.
   Provider: Twelve Data (MARKET_DATA_KEY). Without a key, or when the
   provider fails, a deterministic demo feed is served and labelled
   "Illustrative prices". Quotes are cached in Postgres so a free-tier key
   is shared across serverless instances and never exceeded:
   quotes ~2 min, candles 15 min, daily budget guard.
   Nothing here places real orders. Ever.
   ============================================================ */

export type Kind = "forex" | "commodity" | "index" | "stock" | "crypto";
export type Instrument = { id: string; name: string; kind: Kind; provider: string; base: number; decimals: number; currency: string };
export type Quote = { symbol: string; name: string; kind: Kind; currency: string; decimals: number; price: number; change: number; changePct: number; open: number; high: number; low: number; prevClose: number; updatedAt: string; source: "twelvedata" | "demo"; stale?: boolean };
export type Candle = { t: number; o: number; h: number; l: number; c: number };
export type Interval = "15min" | "1h" | "4h" | "1day";

export const UNIVERSE: Instrument[] = [
  { id: "XAUUSD", name: "Gold", kind: "commodity", provider: "XAU/USD", base: 2412.6, decimals: 2, currency: "USD" },
  { id: "GBPUSD", name: "GBP / USD", kind: "forex", provider: "GBP/USD", base: 1.2734, decimals: 4, currency: "USD" },
  { id: "EURUSD", name: "EUR / USD", kind: "forex", provider: "EUR/USD", base: 1.0842, decimals: 4, currency: "USD" },
  { id: "SPX", name: "S&P 500", kind: "index", provider: "SPX", base: 5431.8, decimals: 2, currency: "USD" },
  { id: "UKX", name: "FTSE 100", kind: "index", provider: "FTSE", base: 8214.3, decimals: 2, currency: "GBP" },
  { id: "AAPL", name: "Apple", kind: "stock", provider: "AAPL", base: 227.5, decimals: 2, currency: "USD" },
  { id: "TSLA", name: "Tesla", kind: "stock", provider: "TSLA", base: 246.3, decimals: 2, currency: "USD" },
  { id: "BTCUSD", name: "Bitcoin", kind: "crypto", provider: "BTC/USD", base: 63180, decimals: 0, currency: "USD" },
];
export const byId = (id: string) => UNIVERSE.find((u) => u.id === id);

const KEY = () => process.env.MARKET_DATA_KEY ?? "";
const QUOTE_TTL = 120_000, CANDLE_TTL = 15 * 60_000, DAILY_BUDGET = 700;

/* ---------- demo feed: deterministic, moves every minute, identical on every instance ---------- */
function noise(seed: number, t: number) { const x = Math.sin(seed * 12.9898 + t * 78.233) * 43758.5453; return x - Math.floor(x); }
function demoPrice(inst: Instrument, atMs: number) {
  const seed = [...inst.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const h = atMs / 3_600_000, m = atMs / 60_000;
  const vol = inst.kind === "crypto" ? 0.03 : inst.kind === "forex" ? 0.004 : 0.012;
  const trend = Math.sin(h / 37 + seed) * vol * 2 + Math.sin(h / 7 + seed * 2) * vol;
  const wobble = (noise(seed, Math.floor(m / 5)) - 0.5) * vol * 0.6 + (noise(seed + 1, Math.floor(m)) - 0.5) * vol * 0.15;
  return inst.base * (1 + trend + wobble);
}
function demoQuote(inst: Instrument, now = Date.now()): Quote {
  const price = demoPrice(inst, now);
  const dayStart = now - (now % 86_400_000);
  const open = demoPrice(inst, dayStart), prevClose = demoPrice(inst, dayStart - 60_000);
  const samples = Array.from({ length: 24 }, (_, i) => demoPrice(inst, dayStart + i * 3_600_000)).filter((_, i) => dayStart + i * 3_600_000 <= now).concat(price);
  const r = (n: number) => +n.toFixed(inst.decimals);
  return { symbol: inst.id, name: inst.name, kind: inst.kind, currency: inst.currency, decimals: inst.decimals, price: r(price), change: r(price - prevClose), changePct: +((price / prevClose - 1) * 100).toFixed(2), open: r(open), high: r(Math.max(...samples)), low: r(Math.min(...samples)), prevClose: r(prevClose), updatedAt: new Date(now).toISOString(), source: "demo" };
}
const INTERVAL_MS: Record<Interval, number> = { "15min": 900_000, "1h": 3_600_000, "4h": 14_400_000, "1day": 86_400_000 };
function demoCandles(inst: Instrument, interval: Interval, n = 120): Candle[] {
  const step = INTERVAL_MS[interval], now = Date.now(), end = now - (now % step);
  const seed = [...inst.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const out: Candle[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const t0 = end - i * step, o = demoPrice(inst, t0), c = demoPrice(inst, t0 + step - 1);
    const spread = Math.abs(c - o) + inst.base * (inst.kind === "crypto" ? 0.006 : inst.kind === "forex" ? 0.0008 : 0.002) * noise(seed + 7, t0 / step);
    const h = Math.max(o, c) + spread * noise(seed + 3, t0 / step), l = Math.min(o, c) - spread * noise(seed + 5, t0 / step);
    const r = (x: number) => +x.toFixed(inst.decimals);
    out.push({ t: Math.floor(t0 / 1000), o: r(o), h: r(h), l: r(l), c: r(c) });
  }
  return out;
}

/* ---------- Postgres cache ---------- */
async function cacheGet<T>(key: string): Promise<{ payload: T; age: number } | null> {
  const row = (await db.select().from(tables.marketCache).where(eq(tables.marketCache.key, key)))[0];
  return row ? { payload: row.payload as T, age: Date.now() - row.fetchedAt.getTime() } : null;
}
async function cacheSet(key: string, payload: unknown) {
  await db.insert(tables.marketCache).values({ key, payload, fetchedAt: new Date() }).onConflictDoUpdate({ target: tables.marketCache.key, set: { payload, fetchedAt: new Date() } });
}
async function spend(credits: number): Promise<boolean> {
  const key = "budget:" + new Date().toISOString().slice(0, 10);
  const cur = await cacheGet<{ used: number }>(key);
  const used = (cur?.payload.used ?? 0) + credits;
  if (used > DAILY_BUDGET) return false;
  await cacheSet(key, { used });
  return true;
}

/* ---------- Twelve Data ---------- */
type TdQuote = { symbol?: string; close?: string; open?: string; high?: string; low?: string; previous_close?: string; change?: string; percent_change?: string; datetime?: string; status?: string; code?: number; message?: string; currency?: string };
async function td(path: string, params: Record<string, string>) {
  const u = new URL("https://api.twelvedata.com/" + path);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  u.searchParams.set("apikey", KEY());
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
  try { const r = await fetch(u, { signal: ctrl.signal, cache: "no-store" }); return (await r.json()) as unknown; } finally { clearTimeout(t); }
}
function parseQuote(inst: Instrument, q: TdQuote): Quote | null {
  if (!q || q.status === "error" || q.code || !q.close) return null;
  const n = (s?: string) => (s == null ? NaN : +s);
  const price = n(q.close), prev = n(q.previous_close), open = n(q.open);
  if (!isFinite(price)) return null;
  const r = (x: number) => +x.toFixed(inst.decimals);
  return { symbol: inst.id, name: inst.name, kind: inst.kind, currency: inst.currency, decimals: inst.decimals, price: r(price), change: r(isFinite(n(q.change)) ? n(q.change) : price - prev), changePct: +(isFinite(n(q.percent_change)) ? n(q.percent_change) : (price / prev - 1) * 100).toFixed(2), open: r(isFinite(open) ? open : price), high: r(isFinite(n(q.high)) ? n(q.high) : price), low: r(isFinite(n(q.low)) ? n(q.low) : price), prevClose: r(isFinite(prev) ? prev : price), updatedAt: new Date().toISOString(), source: "twelvedata" };
}

/** Quotes for the universe (or a subset). Cached; falls back to the demo feed per symbol. */
export async function getQuotes(ids?: string[]): Promise<{ quotes: Quote[]; source: "twelvedata" | "demo" | "mixed" }> {
  const list = (ids?.length ? ids.map(byId).filter(Boolean) as Instrument[] : UNIVERSE);
  const out = new Map<string, Quote>();
  if (!KEY()) { list.forEach((i) => out.set(i.id, demoQuote(i))); return { quotes: list.map((i) => out.get(i.id)!), source: "demo" }; }
  const need: Instrument[] = [];
  for (const inst of list) {
    const hit = await cacheGet<Quote>("q:" + inst.id).catch(() => null);
    if (hit && hit.age < QUOTE_TTL) out.set(inst.id, hit.payload); else need.push(inst);
  }
  if (need.length && (await spend(need.length).catch(() => false))) {
    try {
      const res = (await td("quote", { symbol: need.map((i) => i.provider).join(",") })) as Record<string, TdQuote> | TdQuote;
      for (const inst of need) {
        const raw = need.length === 1 ? (res as TdQuote) : (res as Record<string, TdQuote>)[inst.provider];
        const q = parseQuote(inst, raw);
        if (q) { out.set(inst.id, q); await cacheSet("q:" + inst.id, q).catch(() => {}); }
      }
    } catch (e) { console.error("market quotes", e); }
  }
  // stale cache beats demo; demo beats nothing
  for (const inst of list) if (!out.has(inst.id)) {
    const hit = await cacheGet<Quote>("q:" + inst.id).catch(() => null);
    out.set(inst.id, hit ? { ...hit.payload, stale: true } : demoQuote(inst));
  }
  const quotes = list.map((i) => out.get(i.id)!);
  const srcs = new Set(quotes.map((q) => q.source));
  return { quotes, source: srcs.size > 1 ? "mixed" : (quotes[0]?.source ?? "demo") };
}

/** Candles for one instrument. Cached 15 min; demo when no key or on provider error. */
export async function getCandles(id: string, interval: Interval = "1h"): Promise<{ candles: Candle[]; source: "twelvedata" | "demo" }> {
  const inst = byId(id); if (!inst) return { candles: [], source: "demo" };
  if (!KEY()) return { candles: demoCandles(inst, interval), source: "demo" };
  const key = `c:${inst.id}:${interval}`;
  const hit = await cacheGet<Candle[]>(key).catch(() => null);
  if (hit && hit.age < CANDLE_TTL) return { candles: hit.payload, source: "twelvedata" };
  if (await spend(1).catch(() => false)) {
    try {
      const res = (await td("time_series", { symbol: inst.provider, interval, outputsize: "160" })) as { status?: string; values?: { datetime: string; open: string; high: string; low: string; close: string }[] };
      if (res.status !== "error" && Array.isArray(res.values) && res.values.length) {
        const candles = res.values.map((v) => ({ t: Math.floor(new Date(v.datetime.replace(" ", "T") + (v.datetime.length <= 10 ? "T00:00:00" : "") + "Z").getTime() / 1000), o: +v.open, h: +v.high, l: +v.low, c: +v.close })).filter((c) => isFinite(c.t) && isFinite(c.c)).sort((a, b) => a.t - b.t);
        await cacheSet(key, candles).catch(() => {});
        return { candles, source: "twelvedata" };
      }
    } catch (e) { console.error("market candles", e); }
  }
  return hit ? { candles: hit.payload, source: "twelvedata" } : { candles: demoCandles(inst, interval), source: "demo" };
}

/** Price lookup used by the practice engine (marks positions, fills orders). */
export async function priceOf(id: string): Promise<Quote | null> {
  const { quotes } = await getQuotes([id]);
  return quotes[0] ?? null;
}

export const nowSql = () => sql`now()`;

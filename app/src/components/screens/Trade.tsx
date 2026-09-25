"use client";
/* Practise — a practice portfolio in the spirit of a broker's demo mode, built to teach.
   £100,000 of virtual money per account, real (or illustrative) prices, candlestick charts,
   market/limit/stop orders, stop-loss and take-profit, positions, history and an equity
   curve. Money-at-risk is shown before upside on every ticket. Nothing here places a real
   order, and nothing here ever earns XP. Scenario drills and the journal live alongside. */
import { useCallback, useEffect, useRef, useState } from "react";
import { I } from "../icons";
import { api, money, Sheet, Disc, Segmented, type ToastFn } from "../ui";
import { Candles, Spark } from "../Chart";
import { DRILLS } from "@/content/drills";
import type { JournalRow } from "@/lib/app-data";
import type { Snapshot, Position, Pending } from "@/lib/practise";
import type { Quote, Candle, Interval } from "@/lib/market";
import { haptic } from "@/lib/native";

type Seg = "markets" | "portfolio" | "history" | "drills" | "journal";
const px = (n: number, d: number) => n.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const KIND: Record<string, string> = { forex: "FX", commodity: "Commodity", index: "Index", stock: "Stock", crypto: "Crypto" };

type Props = { journal: JournalRow[]; setJournal: (j: JournalRow[]) => void; toast: ToastFn; onXp: () => void };

export function TradeTab({ journal, setJournal, toast, onXp }: Props) {
  const [seg, setSeg] = useState<Seg>("markets");
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [posSheet, setPosSheet] = useState<Position | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const load = useCallback(async () => { try { setSnap(await api("/api/practise")); setErr(null); } catch (e) { setErr((e as Error).message); } }, []);
  useEffect(() => { const t0 = setTimeout(load, 0); timer.current = setInterval(load, 60_000); return () => { clearTimeout(t0); if (timer.current) clearInterval(timer.current); }; }, [load]);

  const acc = snap?.account; const pnl = acc ? acc.equityPence - acc.startPence : 0;
  const q = (s: string) => snap?.quotes.find((x) => x.symbol === s);
  const live = snap?.source === "twelvedata";

  return (<>
    <div className="pagehdr"><h1>Practise</h1><span className="pill o">Demo · virtual £</span></div>
    <div className="pad">
      <div className="card xpcard reveal">
        <div className="between">
          <div><div className="ttl">Practice account</div><div className="lvl">{acc ? money(acc.equityPence) : <span className="skel" style={{ display: "inline-block", width: 140, height: 28, background: "rgba(255,255,255,.12)" }} />}</div>
            {acc && <div style={{ fontSize: 12.5, color: "#c9d3de", marginTop: 2 }}>Cash {money(acc.cashPence)} · Open P&L <b className={acc.openPnlPence >= 0 ? "pos" : "neg"} style={{ color: acc.openPnlPence >= 0 ? "#58c095" : "#e08a6f" }}>{money(acc.openPnlPence)}</b></div>}
          </div>
          {acc && <div style={{ textAlign: "right" }}><div className="mono" style={{ fontSize: 18, color: pnl >= 0 ? "#58c095" : "#e08a6f" }}>{pnl >= 0 ? "+" : ""}{money(pnl)}</div><div style={{ fontSize: 11, color: "#c9d3de" }}>since {money(acc.startPence)}</div></div>}
        </div>
        {snap && snap.equity.length > 1 && <div style={{ marginTop: 12 }}><Spark values={snap.equity.map((e) => e.v)} height={40} /></div>}
        <div className="xpmeta"><span>{live ? "Prices via Twelve Data · may be delayed" : "Illustrative prices · demo feed"}</span><span>No XP for trading</span></div>
      </div>
      <div style={{ marginTop: 12 }}><Segmented value={seg} options={[["markets", "Markets"], ["portfolio", `Portfolio${snap?.positions.length ? " · " + snap.positions.length : ""}`], ["history", "History"], ["drills", "Drills"], ["journal", "Journal"]]} onChange={(v) => { haptic("selection"); setSeg(v as Seg); }} /></div>
      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}

      {seg === "markets" && (<>
        {!snap ? <div className="card" style={{ padding: "6px 14px" }}>{[0, 1, 2, 3, 4].map((i) => <div key={i} className="lrow" style={{ gap: 12 }}><span className="skel" style={{ width: 44, height: 44 }} /><span className="skel" style={{ flex: 1, height: 16 }} /><span className="skel" style={{ width: 70, height: 16 }} /></div>)}</div> : (
          <div className="card" style={{ padding: "4px 14px" }}>
            {snap.quotes.map((m) => <MarketRow key={m.symbol} m={m} held={snap.positions.some((p) => p.symbol === m.symbol)} onOpen={() => { haptic("light"); setDetail(m.symbol); }} />)}
          </div>
        )}
        <Disc>{live ? "Live and delayed prices from a market-data provider, shown for education." : "Illustrative prices from a demo feed. Add a market-data key to see live markets."} Tap a market for its chart and a demo order ticket. No real orders exist in this app.</Disc>
      </>)}

      {seg === "portfolio" && snap && (<>
        <div className="sec" style={{ marginTop: 14 }}><h2>Open positions</h2><span className="faint" style={{ fontSize: 12 }}>{snap.positions.length}</span></div>
        {snap.positions.length ? <div className="card" style={{ padding: "4px 14px" }}>{snap.positions.map((p) => (
          <button key={p.id} className="lrow" style={{ width: "100%", textAlign: "left" }} onClick={() => setPosSheet(p)}>
            <span style={{ flex: 1 }}><b style={{ display: "inline" }}>{p.name}</b> <span className={`pill ${p.side === "buy" ? "g" : "r"}`}>{p.side === "buy" ? "Buy" : "Sell"}</span><span className="d">{px(p.qty, 4).replace(/\.?0+$/, "")} @ {px(p.entryPrice, q(p.symbol)?.decimals ?? 2)} → {px(p.price, q(p.symbol)?.decimals ?? 2)}{p.stopLoss != null ? ` · SL ${px(p.stopLoss, q(p.symbol)?.decimals ?? 2)}` : ""}{p.takeProfit != null ? ` · TP ${px(p.takeProfit, q(p.symbol)?.decimals ?? 2)}` : ""}</span></span>
            <span className={`mono ${p.pnlPence >= 0 ? "pos" : "neg"}`}>{p.pnlPence >= 0 ? "+" : ""}{money(p.pnlPence)}</span>
          </button>
        ))}</div> : <div className="card" style={{ textAlign: "center", padding: "24px 18px" }}><h3 style={{ fontSize: 16 }}>No open positions</h3><p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>Pick a market, read the chart, decide the loss you can afford before the upside — then place a demo order.</p><button className="btn btn-sm" style={{ margin: "14px auto 0" }} onClick={() => setSeg("markets")}>See markets</button></div>}
        {snap.pending.length > 0 && (<>
          <div className="sec"><h2>Pending orders</h2><span className="faint" style={{ fontSize: 12 }}>{snap.pending.length}</span></div>
          <div className="card" style={{ padding: "4px 14px" }}>{snap.pending.map((o) => (
            <div key={o.id} className="lrow"><span style={{ flex: 1 }}><b style={{ display: "inline" }}>{o.name}</b> <span className={`pill ${o.side === "buy" ? "g" : "r"}`}>{o.side === "buy" ? "Buy" : "Sell"} {o.type}</span><span className="d">{px(o.qty, 4).replace(/\.?0+$/, "")} at {px(o.limitPrice, q(o.symbol)?.decimals ?? 2)}</span></span>
              <button className="btn btn-ghost btn-sm" onClick={async () => { const r = await api("/api/practise", { action: "cancel", id: o.id }); setSnap(r.snapshot); toast(0, "Order cancelled"); }}>Cancel</button></div>
          ))}</div>
        </>)}
        <button className="btn btn-ghost" style={{ marginTop: 16, color: "var(--muted)" }} onClick={async () => { if (!window.confirm("Reset the practice account to £100,000? Open positions and pending orders are cancelled; history is kept.")) return; const r = await api("/api/practise", { action: "reset" }); setSnap(r.snapshot); toast(0, "Practice account reset"); }}>Reset practice account</button>
        <Disc>Virtual money saved to your account. Fills happen at the price seen when the engine runs; no fees, no FX conversion, no leverage. A teaching tool, not a broker.</Disc>
      </>)}

      {seg === "history" && snap && (() => {
        const h = snap.history, wins = h.filter((t) => t.pnlPence > 0).length, net = h.reduce((a, t) => a + t.pnlPence, 0);
        return (<>
          <div className="grid2" style={{ marginTop: 14 }}>
            <div className="stat"><div className="k">Closed trades</div><div className="v">{h.length}</div></div>
            <div className="stat"><div className="k">Win rate</div><div className="v">{h.length ? Math.round((wins / h.length) * 100) + "%" : "—"}</div></div>
            <div className="stat"><div className="k">Net P&L</div><div className={`v ${net >= 0 ? "pos" : "neg"}`}>{money(net)}</div></div>
            <div className="stat"><div className="k">Resets</div><div className="v">{snap.account.resets}</div></div>
          </div>
          <div className="sec"><h2>Closed</h2></div>
          {h.length ? <div className="card" style={{ padding: "4px 14px" }}>{h.map((t) => (
            <div key={t.id} className="lrow"><span style={{ flex: 1 }}><b style={{ display: "inline" }}>{t.name}</b> <span className={`pill ${t.side === "buy" ? "g" : "r"}`}>{t.side === "buy" ? "Buy" : "Sell"}</span><span className="d">{px(t.entryPrice, q(t.symbol)?.decimals ?? 2)} → {px(t.exitPrice, q(t.symbol)?.decimals ?? 2)} · {t.exitReason} · {new Date(t.closedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></span><span className={`mono ${t.pnlPence >= 0 ? "pos" : "neg"}`}>{t.pnlPence >= 0 ? "+" : ""}{money(t.pnlPence)}</span></div>
          ))}</div> : <div className="card"><p className="muted" style={{ fontSize: 13.5 }}>Nothing closed yet. When you close a position it lands here with the reason it closed.</p></div>}
          <Disc>History is a mirror, not a scoreboard. Log the trades that taught you something in the Journal — that is where the learning lives.</Disc>
        </>);
      })()}

      {seg === "drills" && <Drills toast={toast} onXp={onXp} />}
      {seg === "journal" && <Journal journal={journal} setJournal={setJournal} />}
    </div>

    {detail && snap && <MarketSheet symbol={detail} quote={q(detail)!} position={snap.positions.find((p) => p.symbol === detail) ?? null} cashPence={snap.account.cashPence} onClose={() => setDetail(null)} onPlaced={(s) => { setSnap(s); setDetail(null); toast(0, "Demo order placed"); }} />}
    {posSheet && <PositionSheet p={posSheet} decimals={q(posSheet.symbol)?.decimals ?? 2} onClose={() => setPosSheet(null)} onChange={(s, msg) => { setSnap(s); setPosSheet(null); toast(0, msg); }} />}
  </>);
}

function MarketRow({ m, held, onOpen }: { m: Quote; held: boolean; onOpen: () => void }) {
  const span = Math.max(m.high - m.low, 1e-9), pos = Math.min(100, Math.max(0, ((m.price - m.low) / span) * 100));
  return (
    <button className="lrow mrow" onClick={onOpen}>
      <span className="mk"><b>{m.symbol}</b><span>{KIND[m.kind]}</span></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: "block", fontSize: 14.5 }}>{m.name}{held ? <span className="pill o" style={{ marginLeft: 6 }}>Held</span> : null}</b>
        <span className="range" aria-hidden="true"><i style={{ left: `${pos}%` }} /></span>
        <span className="d">L {px(m.low, m.decimals)} · H {px(m.high, m.decimals)}{m.stale ? " · stale" : ""}</span>
      </span>
      <span style={{ textAlign: "right" }}><span className="mono" style={{ fontSize: 15, display: "block" }}>{px(m.price, m.decimals)}</span><span className={`pill ${m.changePct >= 0 ? "g" : "r"}`}>{m.changePct >= 0 ? "▲" : "▼"} {Math.abs(m.changePct).toFixed(2)}%</span></span>
    </button>
  );
}

function MarketSheet({ symbol, quote, position, cashPence, onClose, onPlaced }: { symbol: string; quote: Quote; position: Position | null; cashPence: number; onClose: () => void; onPlaced: (s: Snapshot) => void }) {
  const [interval, setIntervalV] = useState<Interval>("1h");
  const [cs, setCs] = useState<{ key: string; candles: Candle[] } | null>(null);
  const [ticket, setTicket] = useState<"buy" | "sell" | null>(null);
  const ckey = `${symbol}|${interval}`;
  const candles = cs?.key === ckey ? cs.candles : null;
  useEffect(() => { let dead = false; api(`/api/market?symbol=${symbol}&interval=${interval}`).then((r) => { if (!dead) setCs({ key: `${symbol}|${interval}`, candles: r.candles }); }).catch(() => { if (!dead) setCs({ key: `${symbol}|${interval}`, candles: [] }); }); return () => { dead = true; }; }, [symbol, interval]);
  const d = quote.decimals;
  return (
    <Sheet onClose={onClose} tall>
      <div className="between"><div><span className="eyebrow">{KIND[quote.kind]} · {quote.symbol}</span><h2 style={{ fontSize: 21, marginTop: 2 }}>{quote.name}</h2></div><button className="iconbtn" onClick={onClose} aria-label="Close">{I.close}</button></div>
      <div style={{ flex: 1, overflowY: "auto", marginTop: 6 }}>
        {ticket ? <Ticket quote={quote} side={ticket} cashPence={cashPence} onBack={() => setTicket(null)} onPlaced={onPlaced} /> : (<>
          <div className="row" style={{ alignItems: "baseline", gap: 10, marginTop: 6 }}><span className="pricebig">{px(quote.price, d)}</span><span className={`pill ${quote.changePct >= 0 ? "g" : "r"}`}>{quote.changePct >= 0 ? "+" : ""}{px(quote.change, d)} · {quote.changePct >= 0 ? "+" : ""}{quote.changePct.toFixed(2)}%</span></div>
          <div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>{quote.source === "twelvedata" ? "Via Twelve Data · may be delayed" : "Illustrative demo price"} · {new Date(quote.updatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="row" style={{ gap: 6, margin: "12px 0 8px" }}>{(["15min", "1h", "4h", "1day"] as Interval[]).map((iv) => <button key={iv} className={`chip ${interval === iv ? "on" : ""}`} style={{ padding: "7px 12px" }} onClick={() => setIntervalV(iv)}>{iv === "15min" ? "15m" : iv === "1day" ? "1D" : iv.toUpperCase()}</button>)}</div>
          {candles === null ? <div className="skel" style={{ height: 230 }} /> : candles.length ? <Candles data={candles} decimals={d} /> : <div className="card" style={{ height: 230, display: "grid", placeItems: "center" }}><p className="muted">No chart data right now.</p></div>}
          <div className="grid2" style={{ marginTop: 12 }}>
            <div className="stat"><div className="k">Open</div><div className="v" style={{ fontSize: 16 }}>{px(quote.open, d)}</div></div>
            <div className="stat"><div className="k">Prev close</div><div className="v" style={{ fontSize: 16 }}>{px(quote.prevClose, d)}</div></div>
            <div className="stat"><div className="k">Day high</div><div className="v" style={{ fontSize: 16 }}>{px(quote.high, d)}</div></div>
            <div className="stat"><div className="k">Day low</div><div className="v" style={{ fontSize: 16 }}>{px(quote.low, d)}</div></div>
          </div>
          {position && <div className="card card-gold" style={{ marginTop: 12 }}><div className="between"><span><b>You hold</b> {px(position.qty, 4).replace(/\.?0+$/, "")} @ {px(position.entryPrice, d)}</span><b className={`mono ${position.pnlPence >= 0 ? "pos" : "neg"}`}>{money(position.pnlPence)}</b></div></div>}
          <div className="row" style={{ gap: 8, marginTop: 14 }}>
            <button className="btn" style={{ background: "var(--green)", color: "#fff", boxShadow: "none" }} onClick={() => { haptic("medium"); setTicket("buy"); }}>Buy · demo</button>
            <button className="btn" style={{ background: "var(--red)", color: "#fff", boxShadow: "none" }} onClick={() => { haptic("medium"); setTicket("sell"); }}>Sell · demo</button>
          </div>
          <Disc>A chart records what happened; it does not say what happens next. Educational only — this is not a recommendation to buy or sell anything.</Disc>
        </>)}
      </div>
    </Sheet>
  );
}

function Ticket({ quote, side, cashPence, onBack, onPlaced }: { quote: Quote; side: "buy" | "sell"; cashPence: number; onBack: () => void; onPlaced: (s: Snapshot) => void }) {
  const d = quote.decimals, p = quote.price;
  const [type, setType] = useState<"market" | "limit" | "stop">("market");
  const [qty, setQty] = useState(""); const [limit, setLimit] = useState(px(p, d).replace(/,/g, ""));
  const [sl, setSl] = useState(""); const [tp, setTp] = useState(""); const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const ref = type === "market" ? p : +limit || p;
  const q = +qty || 0, notional = ref * q;
  const risk = sl ? Math.abs(ref - +sl) * q : null, reward = tp ? Math.abs(+tp - ref) * q : null;
  const riskPct = risk != null ? (risk * 100) / (cashPence / 100 + 1e-9) * 1 : null;
  const amount = (gbp: number) => setQty((gbp / ref).toFixed(d >= 2 ? 4 : 6).replace(/\.?0+$/, ""));
  const pct = (setter: (s: string) => void, pc: number) => setter((ref * (1 + pc / 100)).toFixed(d));
  return (<>
    <div className="row" style={{ gap: 10, marginTop: 6 }}><button className="iconbtn" onClick={onBack} aria-label="Back">{I.back}</button><div><span className={`pill ${side === "buy" ? "g" : "r"}`}>{side === "buy" ? "Buy" : "Sell"}</span> <b>{quote.name}</b><div className="faint" style={{ fontSize: 12 }}>at {px(p, d)} · demo order</div></div></div>
    <div className="row" style={{ gap: 6, margin: "14px 0 10px" }}>{(["market", "limit", "stop"] as const).map((t) => <button key={t} className={`chip ${type === t ? "on" : ""}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setType(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
    <p className="faint" style={{ fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>{type === "market" ? "Fills now at the current price." : type === "limit" ? (side === "buy" ? "Fills only if the price falls to your limit or better." : "Fills only if the price rises to your limit or better.") : (side === "buy" ? "Fills once the price rises through your level (breakout)." : "Fills once the price falls through your level (breakdown).")}</p>
    {type !== "market" && <div className="field"><label>{type === "limit" ? "Limit price" : "Stop price"}</label><input className="inp mono" type="number" inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} /></div>}
    <div className="field"><label>Quantity (units)</label><input className="inp mono" type="number" inputMode="decimal" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
    <div className="row" style={{ gap: 6, marginBottom: 12, flexWrap: "wrap" }}>{[500, 1000, 5000, 10000].map((a) => <button key={a} className="chip" style={{ padding: "7px 11px" }} onClick={() => amount(a)}>£{a.toLocaleString()}</button>)}</div>
    <div className="grid2">
      <div className="field"><label>Stop-loss <span className="faint">(optional)</span></label><input className="inp mono" type="number" inputMode="decimal" placeholder="—" value={sl} onChange={(e) => setSl(e.target.value)} /><div className="row" style={{ gap: 4, marginTop: 6 }}>{[1, 2, 5].map((n) => <button key={n} className="chip" style={{ padding: "5px 9px", fontSize: 11.5 }} onClick={() => pct(setSl, side === "buy" ? -n : n)}>−{n}%</button>)}</div></div>
      <div className="field"><label>Take-profit <span className="faint">(optional)</span></label><input className="inp mono" type="number" inputMode="decimal" placeholder="—" value={tp} onChange={(e) => setTp(e.target.value)} /><div className="row" style={{ gap: 4, marginTop: 6 }}>{[2, 4, 10].map((n) => <button key={n} className="chip" style={{ padding: "5px 9px", fontSize: 11.5 }} onClick={() => pct(setTp, side === "buy" ? n : -n)}>+{n}%</button>)}</div></div>
    </div>
    <div className="field"><label>Why this trade? <span className="faint">(optional, for the journal)</span></label><input className="inp" placeholder="Planned breakout, waited for retest" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
    <div className="card" style={{ background: "var(--surface-2)", marginBottom: 12 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>Before the upside · the downside</div>
      <div className="kv"><span>Money at risk if the stop is hit</span><b className="mono" style={{ color: risk == null ? "var(--faint)" : riskPct! > 2 ? "var(--red)" : "var(--green)" }}>{risk == null ? "Set a stop-loss" : money(Math.round(risk * 100)) + (riskPct != null ? ` · ${riskPct.toFixed(1)}% of cash` : "")}</b></div>
      <div className="kv"><span>Possible gain at take-profit</span><b className="mono">{reward == null ? "—" : money(Math.round(reward * 100))}</b></div>
      <div className="kv"><span>Reward : risk</span><b className="mono">{risk && reward ? `1 : ${(reward / risk).toFixed(2)}` : "—"}</b></div>
      <div className="kv"><span>Cost (virtual)</span><b className="mono">{money(Math.round(notional * 100))} of {money(cashPence)}</b></div>
    </div>
    {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}
    <button className="btn" aria-busy={busy} disabled={!(q > 0)} onClick={async () => {
      setBusy(true); setErr(null);
      try { const r = await api("/api/practise", { action: "order", symbol: quote.symbol, side, type, qty: q, limitPrice: type === "market" ? null : +limit, stopLoss: sl ? +sl : null, takeProfit: tp ? +tp : null, reason }); haptic("medium"); onPlaced(r.snapshot); }
      catch (e) { setErr((e as Error).message); setBusy(false); }
    }}>Place demo {side === "buy" ? "buy" : "sell"} order</button>
    <p className="faint" style={{ textAlign: "center", fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>Virtual money. No real order is sent anywhere. Risk more than 2% of the account and the number above turns red — that is the lesson.</p>
  </>);
}

function PositionSheet({ p, decimals, onClose, onChange }: { p: Position; decimals: number; onClose: () => void; onChange: (s: Snapshot, msg: string) => void }) {
  const [sl, setSl] = useState(p.stopLoss != null ? String(p.stopLoss) : ""); const [tp, setTp] = useState(p.takeProfit != null ? String(p.takeProfit) : ""); const [busy, setBusy] = useState(false);
  return (
    <Sheet onClose={onClose}>
      <div className="between"><div><span className={`pill ${p.side === "buy" ? "g" : "r"}`}>{p.side === "buy" ? "Buy" : "Sell"}</span> <b style={{ fontSize: 18, fontFamily: "var(--display)" }}>{p.name}</b><div className="faint" style={{ fontSize: 12 }}>{px(p.qty, 4).replace(/\.?0+$/, "")} @ {px(p.entryPrice, decimals)} · now {px(p.price, decimals)}</div></div><button className="iconbtn" onClick={onClose} aria-label="Close">{I.close}</button></div>
      <div className="card xpcard" style={{ marginTop: 14 }}><div className="between"><span className="ttl">Open P&L</span><span className="lvl" style={{ color: p.pnlPence >= 0 ? "#58c095" : "#e08a6f" }}>{p.pnlPence >= 0 ? "+" : ""}{money(p.pnlPence)}</span></div>{p.reason && <div style={{ fontSize: 12.5, color: "#c9d3de", marginTop: 6 }}>“{p.reason}”</div>}</div>
      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="field"><label>Stop-loss</label><input className="inp mono" type="number" inputMode="decimal" placeholder="—" value={sl} onChange={(e) => setSl(e.target.value)} /></div>
        <div className="field"><label>Take-profit</label><input className="inp mono" type="number" inputMode="decimal" placeholder="—" value={tp} onChange={(e) => setTp(e.target.value)} /></div>
      </div>
      <button className="btn btn-ghost" aria-busy={busy} onClick={async () => { setBusy(true); try { const r = await api("/api/practise", { action: "amend", id: p.id, stopLoss: sl || null, takeProfit: tp || null }); onChange(r.snapshot, "Levels updated"); } finally { setBusy(false); } }}>Save levels</button>
      <button className="btn" style={{ marginTop: 10 }} aria-busy={busy} onClick={async () => { setBusy(true); try { const r = await api("/api/practise", { action: "close", id: p.id }); haptic("medium"); onChange(r.snapshot, `Closed · ${money(r.pnlPence)}`); } finally { setBusy(false); } }}>Close position at market</button>
      <Disc>Moving a stop further away to avoid a loss is how small losses become large ones. Decide the exit when you are calm.</Disc>
    </Sheet>
  );
}

function Drills({ toast, onXp }: { toast: ToastFn; onXp: () => void }) {
  const [drill, setDrill] = useState(0);
  const [verdict, setVerdict] = useState<{ choice: number; best: boolean; bestIndex: number; why: string } | null>(null);
  const d = DRILLS[drill];
  return (<>
    <div className="sec" style={{ marginTop: 14 }}><h2>Scenario drill</h2><span className="faint" style={{ fontSize: 12 }}>{drill + 1}/{DRILLS.length} · +25 XP for judgement</span></div>
    <div className="card card-gold reveal" key={d.id}>
      <div className="eyebrow">Practise judgement</div>
      <h3 style={{ fontSize: 17, margin: "8px 0 6px" }}>{d.title}</h3>
      <p className="muted" style={{ fontSize: 13.5 }}>{d.body}</p>
      <div style={{ marginTop: 12 }}>
        {d.options.map((o, n) => (
          <button key={n} disabled={!!verdict} className={`opt ${verdict ? (n === verdict.bestIndex ? "correct" : n === verdict.choice ? "wrong" : "") : ""}`} onClick={async () => {
            try { const r = await api("/api/drills", { id: d.id, choice: n }); setVerdict({ choice: n, ...r }); haptic(r.best ? "success" : "light"); if (r.xp) { toast(r.xp, "Good judgement"); onXp(); } r.badges?.forEach((b: string) => setTimeout(() => toast(0, `Badge unlocked · ${b === "judgement" ? "Good Judgement" : b}`), 900)); }
            catch (e) { toast(0, (e as Error).message); }
          }}><span className="ab">{String.fromCharCode(65 + n)}</span>{o.text}</button>
        ))}
      </div>
      {verdict && (<>
        <div className={`fb ${verdict.best ? "g" : "r"}`}><b>{verdict.best ? "Sound." : "Consider:"}</b> {verdict.why}</div>
        <button className="btn btn-ghost" onClick={() => { setDrill((drill + 1) % DRILLS.length); setVerdict(null); }}>Next scenario →</button>
      </>)}
    </div>
    <Disc>Drills reward the disciplined answer, once each. They are the only thing on this tab that earns XP.</Disc>
  </>);
}

function Journal({ journal, setJournal }: { journal: JournalRow[]; setJournal: (j: JournalRow[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ symbol: "", pnl: "", reason: "", planned: "true", emotionBefore: "", emotionAfter: "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const n = journal.length, wins = journal.filter((t) => t.pnlPence > 0).length, net = journal.reduce((a, t) => a + t.pnlPence, 0);
  const rate = (xs: JournalRow[]) => (xs.length ? Math.round((xs.filter((t) => t.pnlPence > 0).length / xs.length) * 100) : null);
  const pw = rate(journal.filter((t) => t.planned)), uw = rate(journal.filter((t) => !t.planned));
  return (<>
    <div className="grid2" style={{ marginTop: 14 }}>
      <div className="stat"><div className="k">Net (logged)</div><div className={`v ${net >= 0 ? "pos" : "neg"}`}>{money(net)}</div></div>
      <div className="stat"><div className="k">Win rate</div><div className="v">{n ? Math.round((wins / n) * 100) + "%" : "—"}</div></div>
    </div>
    {pw !== null && uw !== null && (
      <div className="card reveal" style={{ marginTop: 12, borderLeft: "3px solid var(--green)" }}>
        <p style={{ fontSize: 14 }}>{pw >= uw ? <>You do better with a plan: <b>planned trades win {pw}%</b> vs <b>{uw}% on impulse</b>.</> : <>Your impulse trades are winning more ({uw}% vs {pw}%) — small samples mislead. Keep logging and watch the trend.</>}</p>
      </div>
    )}
    <div className="sec"><h2>Trades</h2><button className="link" onClick={() => setAdding(!adding)}>{adding ? "Cancel" : "+ Log"}</button></div>
    {adding && (
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="grid2"><div className="field"><label>Asset</label><input className="inp" value={f.symbol} onChange={(e) => setF({ ...f, symbol: e.target.value })} placeholder="GBPUSD" /></div><div className="field"><label>P&L £</label><input className="inp mono" type="number" inputMode="decimal" value={f.pnl} onChange={(e) => setF({ ...f, pnl: e.target.value })} /></div></div>
        <div className="field"><label>Reason</label><input className="inp" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Planned breakout, waited for retest" /></div>
        <div className="grid2"><div className="field"><label>Planned?</label><select className="inp" value={f.planned} onChange={(e) => setF({ ...f, planned: e.target.value })}><option value="true">Yes</option><option value="false">No — impulse</option></select></div><div className="field"><label>Feeling before → after</label><div className="row" style={{ gap: 6 }}><input className="inp" value={f.emotionBefore} onChange={(e) => setF({ ...f, emotionBefore: e.target.value })} placeholder="Calm" /><input className="inp" value={f.emotionAfter} onChange={(e) => setF({ ...f, emotionAfter: e.target.value })} placeholder="Satisfied" /></div></div></div>
        {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}
        <button className="btn btn-sm" aria-busy={busy} onClick={async () => {
          setBusy(true); setErr(null);
          try { const r = await api("/api/journal", { ...f, pnl: +f.pnl || 0, planned: f.planned === "true" }); setJournal([r.entry, ...journal]); setAdding(false); setF({ symbol: "", pnl: "", reason: "", planned: "true", emotionBefore: "", emotionAfter: "" }); }
          catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
        }}>Save</button>
      </div>
    )}
    <div className="card" style={{ padding: "4px 14px" }}>
      {journal.length ? journal.map((t) => (
        <div key={t.id} className="lrow">
          <div style={{ flex: 1 }}><b style={{ display: "inline" }}>{t.symbol}</b> <span className={`pill ${t.direction === "Long" ? "g" : "r"}`}>{t.direction}</span>
            <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>{t.reason || "—"}</div>
            <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{t.date} · {t.emotionBefore || "—"} → {t.emotionAfter || "—"} · {t.planned ? "planned" : "impulse"}</div></div>
          <div style={{ textAlign: "right" }}><span className={`mono ${t.pnlPence >= 0 ? "pos" : "neg"}`}>{money(t.pnlPence)}</span><br /><button className="faint" style={{ fontSize: 11 }} onClick={async () => { await api("/api/journal", { id: t.id }, "DELETE"); setJournal(journal.filter((x) => x.id !== t.id)); }}>remove</button></div>
        </div>
      )) : <p className="muted" style={{ padding: "16px 0" }}>Nothing logged yet. The journal is where you learn about yourself — planned or impulse, calm or chasing.</p>}
    </div>
    <Disc>The journal records your own behaviour for reflection. No XP is ever awarded for logging trades — it must never feel like a reward for trading.</Disc>
  </>);
}

export type { Pending };

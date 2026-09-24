"use client";
/* Trade — a demo simulator (illustrative prices, no real money), scenario
   drills that practise judgement, and a journal that records behaviour.
   Nothing here rewards trade frequency. */
import { useState } from "react";
import { I } from "../icons";
import { api, money, fmt, Sheet, Disc, type ToastFn } from "../ui";
import { DRILLS, MARKETS } from "@/content/drills";
import type { JournalRow } from "@/lib/app-data";

type Pos = { id: number; sym: string; dir: "Long" | "Short"; size: number; entry: number; px: number };
const START = 100000;
const posPL = (p: Pos) => (p.px - p.entry) * (p.dir === "Long" ? 1 : -1) * p.size;
const SEED: Pos[] = [{ id: 1, sym: "XAUUSD", dir: "Long", size: 20, entry: 2398.4, px: 2412.6 }, { id: 2, sym: "UKX", dir: "Long", size: 2, entry: 8180, px: 8214.3 }];

function loadSim(): { cash: number; positions: Pos[] } {
  try { const s = JSON.parse(localStorage.getItem("tt-sim") || "null"); if (s && Array.isArray(s.positions)) return s; } catch { /* fresh */ }
  return { cash: START, positions: SEED };
}

type Props = { journal: JournalRow[]; setJournal: (j: JournalRow[]) => void; toast: ToastFn; onXp: () => void };

export function TradeTab({ journal, setJournal, toast, onXp }: Props) {
  const [seg, setSeg] = useState<"sim" | "journal">("sim");
  return (<>
    <div className="pagehdr"><h1>Trade</h1></div>
    <div className="pad">
      <div className="hscroll" style={{ marginBottom: 14 }}>
        <button className={`chip ${seg === "sim" ? "on" : ""}`} onClick={() => setSeg("sim")}>Simulator</button>
        <button className={`chip ${seg === "journal" ? "on" : ""}`} onClick={() => setSeg("journal")}>Journal</button>
      </div>
      {seg === "sim" ? <Simulator toast={toast} onXp={onXp} /> : <Journal journal={journal} setJournal={setJournal} />}
    </div>
  </>);
}

function Simulator({ toast, onXp }: { toast: ToastFn; onXp: () => void }) {
  // mounts client-side only (behind the Trade tab), so reading local storage in the initialiser is safe
  const [sim, setSim] = useState<{ cash: number; positions: Pos[] }>(() => (typeof window === "undefined" ? { cash: START, positions: SEED } : loadSim()));
  const [ticket, setTicket] = useState<string | null>(null);
  const [drill, setDrill] = useState(0);
  const [verdict, setVerdict] = useState<{ choice: number; best: boolean; bestIndex: number; why: string } | null>(null);
  const save = (s: { cash: number; positions: Pos[] }) => { setSim(s); try { localStorage.setItem("tt-sim", JSON.stringify(s)); } catch { /* per-device only */ } };
  const equity = sim.cash + sim.positions.reduce((a, p) => a + posPL(p), 0), pl = equity - START;
  const d = DRILLS[drill];

  return (<>
    <div className="grid2">
      <div className="stat"><div className="k">Equity (demo)</div><div className="v">{money(equity * 100)}</div></div>
      <div className="stat"><div className="k">Open P&L</div><div className={`v ${pl >= 0 ? "pos" : "neg"}`}>{money(pl * 100)}</div></div>
    </div>
    <div className="sec"><h2>Positions</h2><button className="btn btn-sm" onClick={() => setTicket("XAUUSD")}>+ Trade</button></div>
    <div className="card" style={{ padding: "4px 14px" }}>
      {sim.positions.length ? sim.positions.map((p) => (
        <div key={p.id} className="lrow">
          <div style={{ flex: 1 }}><span className={`pill ${p.dir === "Long" ? "g" : "r"}`}>{p.dir}</span> <b style={{ display: "inline" }}>{p.sym}</b> <span className="faint mono" style={{ fontSize: 12 }}>×{p.size}</span></div>
          <div style={{ textAlign: "right" }}><div className={`mono ${posPL(p) >= 0 ? "pos" : "neg"}`}>{money(posPL(p) * 100)}</div><button className="faint" style={{ fontSize: 12 }} onClick={() => save({ cash: sim.cash + posPL(p), positions: sim.positions.filter((x) => x.id !== p.id) })}>Close</button></div>
        </div>
      )) : <p className="muted" style={{ padding: "16px 0" }}>No open positions.</p>}
    </div>
    <div className="sec"><h2>Markets</h2><span className="faint" style={{ fontSize: 12 }}>illustrative</span></div>
    <div className="hscroll">{MARKETS.map((w) => (
      <button key={w.s} className="wtile" onClick={() => setTicket(w.s)}><div className="s">{w.s}</div><div className="n">{w.n}</div><div className="p">{fmt(w.p, w.p < 10 ? 4 : 2)}</div><div className={`mono ${w.c >= 0 ? "pos" : "neg"}`} style={{ fontSize: 12 }}>{w.c >= 0 ? "▲" : "▼"} {Math.abs(w.c)}%</div></button>
    ))}</div>
    <div className="sec"><h2>Scenario drill</h2><span className="faint" style={{ fontSize: 12 }}>{drill + 1}/{DRILLS.length}</span></div>
    <div className="card card-gold reveal" key={d.id}>
      <div className="eyebrow">Practise judgement</div>
      <h3 style={{ fontSize: 17, margin: "8px 0 6px" }}>{d.title}</h3>
      <p className="muted" style={{ fontSize: 13.5 }}>{d.body}</p>
      <div style={{ marginTop: 12 }}>
        {d.options.map((o, n) => (
          <button key={n} disabled={!!verdict} className={`opt ${verdict ? (n === verdict.bestIndex ? "correct" : n === verdict.choice ? "wrong" : "") : ""}`} onClick={async () => {
            try { const r = await api("/api/drills", { id: d.id, choice: n }); setVerdict({ choice: n, ...r }); if (r.xp) { toast(r.xp, "Good judgement"); onXp(); } r.badges?.forEach((b: string) => setTimeout(() => toast(0, `Badge unlocked · ${b === "judgement" ? "Good Judgement" : b}`), 900)); }
            catch (e) { toast(0, (e as Error).message); }
          }}><span className="ab">{String.fromCharCode(65 + n)}</span>{o.text}</button>
        ))}
      </div>
      {verdict && (<>
        <div className={`fb ${verdict.best ? "g" : "r"}`}><b>{verdict.best ? "Sound." : "Consider:"}</b> {verdict.why}</div>
        <button className="btn btn-ghost" onClick={() => { setDrill((drill + 1) % DRILLS.length); setVerdict(null); }}>Next scenario →</button>
      </>)}
    </div>
    <Disc>Demo capital, illustrative prices, saved on this device only. Built to teach behaviour, not to encourage frequent trading. No real money, no real orders.</Disc>
    {ticket && <Ticket sym={ticket} equity={equity} onClose={() => setTicket(null)} onPlace={(p) => { save({ ...sim, positions: [...sim.positions, p] }); setTicket(null); }} />}
  </>);
}

function Ticket({ sym, equity, onClose, onPlace }: { sym: string; equity: number; onClose: () => void; onPlace: (p: Pos) => void }) {
  const a = MARKETS.find((w) => w.s === sym) ?? MARKETS[0];
  const [dir, setDir] = useState<"Long" | "Short">("Long"); const [size, setSize] = useState("10");
  const [stop, setStop] = useState(fmt(a.p * 0.98, 2).replace(/,/g, "")); const [tp, setTp] = useState(fmt(a.p * 1.04, 2).replace(/,/g, ""));
  const risk = Math.abs(a.p - (+stop || 0)) * (+size || 0); const over = risk > equity * 0.02;
  return (
    <Sheet onClose={onClose}>
      <div className="between"><h2 style={{ fontSize: 20 }}>Trade {a.s}</h2><button className="iconbtn" onClick={onClose} aria-label="Close">{I.close}</button></div>
      <p className="faint" style={{ fontSize: 12, margin: "2px 0 14px" }}>{a.n} · {fmt(a.p, a.p < 10 ? 4 : 2)} · demo</p>
      <div className="row" style={{ gap: 8, marginBottom: 12 }}>
        <button className={`btn ${dir === "Long" ? "" : "btn-ghost"}`} style={dir === "Long" ? { background: "var(--green)", color: "#fff" } : undefined} onClick={() => setDir("Long")}>Buy</button>
        <button className={`btn ${dir === "Short" ? "" : "btn-ghost"}`} style={dir === "Short" ? { background: "var(--red)", color: "#fff" } : undefined} onClick={() => setDir("Short")}>Sell</button>
      </div>
      <div className="field"><label>Size (units)</label><input className="inp mono" type="number" inputMode="decimal" value={size} onChange={(e) => setSize(e.target.value)} /></div>
      <div className="grid2">
        <div className="field"><label>Stop</label><input className="inp mono" type="number" inputMode="decimal" value={stop} onChange={(e) => setStop(e.target.value)} /></div>
        <div className="field"><label>Take profit</label><input className="inp mono" type="number" inputMode="decimal" value={tp} onChange={(e) => setTp(e.target.value)} /></div>
      </div>
      <div className="disc" style={{ marginBottom: 12, marginTop: 0 }}><b>Risk if stopped:</b> {money(Math.round(risk) * 100)} · {over ? <span className="neg">above 2% — size down.</span> : <span className="pos">within 2%.</span>}</div>
      <button className="btn" onClick={() => onPlace({ id: Date.now(), sym: a.s, dir, size: +size || 1, entry: a.p, px: a.p })}>Place simulated order</button>
      <p className="faint" style={{ textAlign: "center", fontSize: 11, marginTop: 10 }}>Demo only. No real order is sent.</p>
    </Sheet>
  );
}

function Journal({ journal, setJournal }: { journal: JournalRow[]; setJournal: (j: JournalRow[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ symbol: "", pnl: "", reason: "", planned: "true", emotionBefore: "", emotionAfter: "" });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const n = journal.length, wins = journal.filter((t) => t.pnlPence > 0).length, net = journal.reduce((a, t) => a + t.pnlPence, 0);
  const rate = (xs: JournalRow[]) => (xs.length ? Math.round((xs.filter((t) => t.pnlPence > 0).length / xs.length) * 100) : null);
  const pw = rate(journal.filter((t) => t.planned)), uw = rate(journal.filter((t) => !t.planned));
  return (<>
    <div className="grid2">
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

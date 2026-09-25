"use client";
/* BUILD — the Ten Talents financial ecosystem beyond lessons: goals, wealth overview, financial
   health, the Wealth Builder journey, the Jubilee debt-freedom planner, giving and the Talent
   Ledger. REAL USER DATA: everything here is typed in by the user and saved to their account.
   Ten Talents holds no money, moves no money and gives no advice. */
import { useEffect, useRef, useState } from "react";
import { I, type IconName } from "../icons";
import { api, money, Ring, Sheet, Disc, type ToastFn } from "../ui";
import { StewardTab } from "./Steward";
import { ArtBadge } from "../art";
import { Scenario, badgeName } from "./Safety";
import type { GoalRow } from "@/lib/app-data";
import type { WealthAssets, WealthLiabilities } from "@/db/schema";
import { HEALTH_DIMENSIONS, priorities, type Priority } from "@/lib/health";
import { JOURNEY } from "@/content/journey";
import { jubilee, TOOLS } from "@/lib/calcs";

export type BuildSeg = "goals" | "wealth" | "health" | "journey" | "jubilee" | "giving" | "talents";
export const BUILD_SEGS: [BuildSeg, string, IconName][] = [["goals", "Goals", "target"], ["wealth", "Wealth", "wallet"], ["health", "Health", "heart"], ["journey", "Journey", "compass"], ["jubilee", "Jubilee", "refresh"], ["giving", "Giving", "hand"], ["talents", "Talents", "ledger"]];

type Snapshot = { id: string; assets: WealthAssets; liabilities: WealthLiabilities; note: string; takenAt: string };
type Debt = { id: string; name: string; balancePence: number; aprBp: number; minPaymentPence: number };
type Giving = { id: string; month: string; pct: number; note: string };
type Talent = { id: string; name: string; category: string; level: number; note: string };
export type BuildData = { wealth: Snapshot[]; health: { answers: Record<string, number>; takenAt: string } | null; reviews: unknown[]; debts: Debt[]; giving: Giving[]; talents: Talent[]; scenarios: { safety: string[]; journey: string[]; drill: string[] } };

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
const REAL = <span className="pill g" title="Saved to your account">Your data</span>;

type Props = {
  seg: BuildSeg; setSeg: (s: BuildSeg) => void;
  goals: GoalRow[]; setGoals: (g: GoalRow[]) => void;
  done: Record<string, 1>; toast: ToastFn; onXp: () => void;
  openStudy: (n: string) => void; openLesson: (lessonId: string) => void; openTool: (id: string) => void; goLearn: () => void;
  data: BuildData | null; setData: (d: BuildData) => void; onHealthSaved: (a: Record<string, number>) => void; onWealthSaved: (netPence: number) => void;
};

export function BuildTab(p: Props) {
  const { seg, setSeg, data, setData } = p;
  const fetched = useRef(false);
  useEffect(() => { if (fetched.current || data) return; fetched.current = true; api("/api/build").then(setData).catch(() => {}); }, [data, setData]);
  const patch = (d: Partial<BuildData>) => { if (data) setData({ ...data, ...d }); };
  const flash = (r: { xp?: number; badges?: string[] }, label: string) => { if (r.xp) { p.toast(r.xp, label); p.onXp(); } r.badges?.forEach((b) => setTimeout(() => p.toast(0, `Badge unlocked · ${badgeName(b)}`), 900)); };

  return (<>
    <div className="pagehdr"><h1>Build</h1><span className="faint" style={{ fontSize: 12.5 }}>Steward what you&rsquo;ve been given</span></div>
    <div className="pad">
      <div className="hscroll" style={{ marginBottom: 6 }}>{BUILD_SEGS.map(([k, label, ic]) => <button key={k} className={`chip ${seg === k ? "on" : ""}`} onClick={() => setSeg(k)}>{I[ic]}{label}</button>)}</div>
      {seg === "goals" && <StewardTab embedded goals={p.goals} setGoals={p.setGoals} toast={p.toast} onXp={p.onXp} openStudy={() => p.openStudy("01")} />}
      {seg === "wealth" && <Wealth data={data} onSaved={(s, r) => { patch({ wealth: [s, ...(data?.wealth ?? [])] }); flash(r, "Snapshot saved"); p.onWealthSaved(sum(s.assets) - sum(s.liabilities)); }} openTool={p.openTool} />}
      {seg === "health" && <Health data={data} onSaved={(a, r) => { patch({ health: { answers: a, takenAt: new Date().toISOString() } }); flash(r, "Health check"); p.onHealthSaved(a); }} go={(g) => { if (g === "learn") p.goLearn(); else if (g === "tools") p.openTool("emergency"); else setSeg(g as BuildSeg); }} />}
      {seg === "journey" && <Journey done={p.done} practised={data?.scenarios.journey ?? []} toast={p.toast} onXp={p.onXp} openLesson={p.openLesson} openTool={p.openTool} openStudy={p.openStudy} onDone={(id) => data && patch({ scenarios: { ...data.scenarios, journey: [...data.scenarios.journey, id] } })} />}
      {seg === "jubilee" && <Jubilee debts={data?.debts ?? []} setDebts={(d) => patch({ debts: d })} openStudy={p.openStudy} />}
      {seg === "giving" && <GivingTracker entries={data?.giving ?? []} setEntries={(g) => patch({ giving: g })} openStudy={p.openStudy} />}
      {seg === "talents" && <TalentLedger talents={data?.talents ?? []} setTalents={(t) => patch({ talents: t })} flash={flash} openStudy={p.openStudy} />}
    </div>
  </>);
}

/* ---------- Wealth Overview ---------- */
const ASSETS: [keyof WealthAssets, string][] = [["cash", "Cash and current accounts"], ["savings", "Savings and ISAs"], ["investments", "Investments and pensions"], ["property", "Property (your estimate)"], ["business", "Business value"], ["other", "Other assets"]];
const LIABS: [keyof WealthLiabilities, string][] = [["mortgage", "Mortgage"], ["loans", "Loans (incl. car, student)"], ["credit", "Credit cards and overdrafts"], ["other", "Other debts"]];

function Wealth({ data, onSaved, openTool }: { data: BuildData | null; onSaved: (s: Snapshot, r: { xp: number; badges: string[] }) => void; openTool: (id: string) => void }) {
  const latest = data?.wealth[0];
  const [form, setForm] = useState(false);
  const nw = latest ? sum(latest.assets) - sum(latest.liabilities) : null;
  const hist = data ? [...data.wealth].reverse().slice(-8) : [];
  const maxAbs = Math.max(1, ...hist.map((s) => Math.abs(sum(s.assets) - sum(s.liabilities))));
  return (<>
    <div className="between" style={{ margin: "14px 0 10px" }}><h2 style={{ fontSize: 19 }}>Wealth overview</h2>{REAL}</div>
    <div className="card xpcard reveal">
      <div className="ttl">Net worth · what you own minus what you owe</div>
      <div className="lvl" style={{ fontSize: 32 }}>{nw === null ? "—" : money(nw)}</div>
      {latest ? <div style={{ fontSize: 12.5, color: "#c9d3de", marginTop: 2 }}>Assets {money(sum(latest.assets))} · Liabilities {money(sum(latest.liabilities))} · {new Date(latest.takenAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div> : <div style={{ fontSize: 13, color: "#c9d3de", marginTop: 4 }}>Take your first snapshot. Your figures, your estimate — the direction over time is what matters.</div>}
      {hist.length > 1 && <div className="bars" style={{ marginTop: 14 }} aria-label="Net worth over time">{hist.map((s) => { const v = sum(s.assets) - sum(s.liabilities); return <i key={s.id} style={{ height: `${Math.max(4, (Math.abs(v) / maxAbs) * 100)}%`, opacity: v < 0 ? .45 : 1 }} title={money(v)} />; })}</div>}
      <button className="btn btn-sm" style={{ marginTop: 14, background: "rgba(255,255,255,.12)", boxShadow: "none", color: "#fff" }} onClick={() => setForm(true)}>{latest ? "New snapshot" : "Take a snapshot · +20 XP"}</button>
    </div>
    {latest && (<>
      <div className="sec"><h2>Breakdown</h2><button className="link" onClick={() => openTool("networth")}>Net worth tool</button></div>
      <div className="grid2">
        <div className="stat"><div className="k">Assets</div>{ASSETS.filter(([k]) => latest.assets[k]).map(([k, l]) => <div key={k} className="between" style={{ fontSize: 12.5, marginTop: 6 }}><span className="muted" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.split(" (")[0]}</span><span className="mono">{money(latest.assets[k])}</span></div>)}</div>
        <div className="stat"><div className="k">Liabilities</div>{LIABS.filter(([k]) => latest.liabilities[k]).length ? LIABS.filter(([k]) => latest.liabilities[k]).map(([k, l]) => <div key={k} className="between" style={{ fontSize: 12.5, marginTop: 6 }}><span className="muted" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.split(" (")[0]}</span><span className="mono">{money(latest.liabilities[k])}</span></div>) : <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>None recorded</div>}</div>
      </div>
    </>)}
    <Disc>Your snapshot is a picture you draw of your own position, saved to your account and shown only to you. Ten Talents does not connect to bank accounts, hold money or value anything. Not advice.</Disc>
    {form && <WealthForm prev={latest} onClose={() => setForm(false)} onSaved={(s, r) => { onSaved(s, r); setForm(false); }} />}
  </>);
}

function PoundField({ label, v, set }: { label: string; v: string; set: (s: string) => void }) {
  return <div className="kv" style={{ alignItems: "center" }}><span style={{ flex: 1, fontSize: 13.5 }}>{label}</span><span className="row" style={{ gap: 6 }}><span className="faint">£</span><input className="inp mono" type="number" inputMode="decimal" min="0" step="1" value={v} placeholder="0" style={{ width: 110, padding: "9px 10px", textAlign: "right" }} onChange={(e) => set(e.target.value)} aria-label={label} /></span></div>;
}

function WealthForm({ prev, onClose, onSaved }: { prev?: Snapshot; onClose: () => void; onSaved: (s: Snapshot, r: { xp: number; badges: string[] }) => void }) {
  const [a, setA] = useState<Record<string, string>>(() => Object.fromEntries(ASSETS.map(([k]) => [k, prev?.assets[k] ? String(prev.assets[k] / 100) : ""])));
  const [l, setL] = useState<Record<string, string>>(() => Object.fromEntries(LIABS.map(([k]) => [k, prev?.liabilities[k] ? String(prev.liabilities[k] / 100) : ""])));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const tot = (o: Record<string, string>) => Object.values(o).reduce((x, y) => x + (+y || 0), 0);
  return (
    <Sheet onClose={onClose} tall>
      <div className="between"><h2 style={{ fontSize: 20 }}>Wealth snapshot</h2><button className="iconbtn" onClick={onClose} aria-label="Close">{I.close}</button></div>
      <div style={{ flex: 1, overflowY: "auto", marginTop: 8 }}>
        <div className="eyebrow" style={{ margin: "8px 0 6px" }}>What you own</div>
        <div className="card" style={{ padding: "4px 14px" }}>{ASSETS.map(([k, label]) => <PoundField key={k} label={label} v={a[k]} set={(s) => setA({ ...a, [k]: s })} />)}</div>
        <div className="eyebrow" style={{ margin: "14px 0 6px" }}>What you owe</div>
        <div className="card" style={{ padding: "4px 14px" }}>{LIABS.map(([k, label]) => <PoundField key={k} label={label} v={l[k]} set={(s) => setL({ ...l, [k]: s })} />)}</div>
        <div className="card xpcard" style={{ marginTop: 14 }}><div className="between"><span className="ttl">Net worth</span><span className="lvl">{money(Math.round((tot(a) - tot(l)) * 100))}</span></div></div>
        {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
        <button className="btn" style={{ marginTop: 14 }} aria-busy={busy} onClick={async () => {
          setBusy(true); setErr(null);
          try { const r = await api("/api/build", { kind: "wealth", assets: Object.fromEntries(Object.entries(a).map(([k, v]) => [k, +v || 0])), liabilities: Object.fromEntries(Object.entries(l).map(([k, v]) => [k, +v || 0])) }); onSaved(r.snapshot, r); }
          catch (e) { setErr((e as Error).message); setBusy(false); }
        }}>Save snapshot</button>
        <Disc>Estimates are fine. Negative net worth is common early on. Saved to your account only.</Disc>
      </div>
    </Sheet>
  );
}

/* ---------- Financial Health ---------- */
function Health({ data, onSaved, go }: { data: BuildData | null; onSaved: (a: Record<string, number>, r: { xp: number; badges: string[] }) => void; go: (g: Priority["go"]) => void }) {
  const saved = data?.health?.answers ?? null;
  const [editing, setEditing] = useState(false);
  const [a, setA] = useState<Record<string, number>>(() => saved ?? {});
  const [busy, setBusy] = useState(false);
  const answered = HEALTH_DIMENSIONS.filter((d) => a[d.id]).length;
  if (saved && !editing) {
    const pr = priorities(saved);
    return (<>
      <div className="between" style={{ margin: "14px 0 10px" }}><h2 style={{ fontSize: 19 }}>Financial health</h2>{REAL}</div>
      <div className="card reveal">
        <div className="eyebrow">Your seven areas · self-assessed</div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>{HEALTH_DIMENSIONS.map((d) => <div key={d.id}><div className="between" style={{ fontSize: 13 }}><span>{d.name}</span><span className="faint">{["", "Needs attention", "Getting started", "Steady", "Strong", "Established"][saved[d.id] ?? 0]}</span></div><div className="cpbar" style={{ marginTop: 4 }}><i style={{ width: `${((saved[d.id] ?? 0) / 5) * 100}%` }} /></div></div>)}</div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setEditing(true)}>Update answers</button>
      </div>
      <div className="sec"><h2>Your next priorities</h2><span className="faint" style={{ fontSize: 12 }}>guidance, not a grade</span></div>
      {pr.map((x, i) => (
        <button key={x.title} className="card coursewide reveal" style={{ marginBottom: 12 }} onClick={() => go(x.go)}>
          <span className="th" style={{ background: "var(--gold-tint)", color: "var(--gold)", fontFamily: "var(--display)", fontWeight: 800, fontSize: 20 }}>{i + 1}</span>
          <span style={{ flex: 1, textAlign: "left" }}><h3>{x.title}</h3><p className="muted" style={{ fontSize: 13, marginTop: 3, lineHeight: 1.5 }}>{x.why}</p></span>{I.arrow}
        </button>
      ))}
      <Disc>A non-judgemental check based only on how you answered. It surfaces the next thing worth learning or building — it is not a score, a rating or advice.</Disc>
    </>);
  }
  return (<>
    <div className="between" style={{ margin: "14px 0 10px" }}><h2 style={{ fontSize: 19 }}>Financial health check</h2><span className="pill o">{saved ? "Update" : "+20 XP"}</span></div>
    <p className="muted" style={{ fontSize: 13.5, marginBottom: 12, lineHeight: 1.55 }}>Seven honest answers, one to five. Nobody sees these but you, and there is no wrong answer — only a starting point.</p>
    {HEALTH_DIMENSIONS.map((d) => (
      <div key={d.id} className="card" style={{ marginBottom: 10, padding: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{d.q}</div>
        <div className="row" style={{ gap: 6, marginTop: 10 }}>{[1, 2, 3, 4, 5].map((n) => <button key={n} className={`chip ${a[d.id] === n ? "on" : ""}`} style={{ flex: 1, justifyContent: "center", padding: "9px 0" }} onClick={() => setA({ ...a, [d.id]: n })} aria-pressed={a[d.id] === n}>{n}</button>)}</div>
        <div className="between" style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}><span>{d.low}</span><span>{d.high}</span></div>
      </div>
    ))}
    <button className="btn" disabled={answered < HEALTH_DIMENSIONS.length} aria-busy={busy} onClick={async () => {
      setBusy(true);
      try { const r = await api("/api/build", { kind: "health", answers: a }); onSaved(a, r); setEditing(false); } catch { /* retry */ } finally { setBusy(false); }
    }}>{answered < HEALTH_DIMENSIONS.length ? `${answered} of ${HEALTH_DIMENSIONS.length} answered` : "See my priorities"}</button>
    {saved && <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => setEditing(false)}>Cancel</button>}
  </>);
}

/* ---------- Wealth Builder journey ---------- */
function Journey({ done, practised, toast, onXp, openLesson, openTool, openStudy, onDone }: { done: Record<string, 1>; practised: string[]; toast: ToastFn; onXp: () => void; openLesson: (id: string) => void; openTool: (id: string) => void; openStudy: (n: string) => void; onDone: (id: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const prog = (s: (typeof JOURNEY)[number]) => { const ls = s.lessons.filter((l) => l.lessonId); const got = ls.filter((l) => done[l.lessonId!]).length; const sc = practised.includes(s.scenario.id) ? 1 : 0; return Math.round(((got + sc) / (ls.length + 1)) * 100); };
  const overall = Math.round(JOURNEY.reduce((a, s) => a + prog(s), 0) / JOURNEY.length);
  const studyFor = (title: string) => (/Joseph/.test(title) ? "01" : /Talents/.test(title) ? "02" : /Widow/.test(title) ? "03" : "01");
  return (<>
    <div className="between" style={{ margin: "14px 0 10px" }}><h2 style={{ fontSize: 19 }}>Wealth Builder journey</h2><span className="pill o">Builder badge at 7/7</span></div>
    <div className="card xpcard reveal">
      <div className="between"><div><div className="ttl">Earn → Manage → Save → Protect → Invest → Build → Give</div><div className="lvl">{overall}%</div><div style={{ fontSize: 12.5, color: "#c9d3de" }}>Seven stages. In order, because the order is the lesson.</div></div><Ring pct={overall} label={`${JOURNEY.filter((s) => prog(s) === 100).length}/7`} /></div>
      <div className="stages">{JOURNEY.map((s) => <i key={s.id} className={prog(s) === 100 ? "on" : prog(s) ? "part" : ""} title={s.name} />)}</div>
    </div>
    {JOURNEY.map((s, i) => { const pr = prog(s); const isOpen = open === s.id; return (
      <div key={s.id} className="card reveal" style={{ marginTop: 12, borderColor: pr === 100 ? "var(--green)" : undefined }}>
        <button className="between" style={{ width: "100%", textAlign: "left" }} onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
          <span className="row" style={{ gap: 12 }}><span className="lplay" style={{ width: 40, height: 40, background: pr === 100 ? "rgba(31,122,85,.14)" : undefined, color: pr === 100 ? "var(--green)" : undefined }}>{pr === 100 ? I.check : <b className="mono">{i + 1}</b>}</span><span><h3 style={{ fontSize: 16 }}>{s.name}</h3><span className="faint" style={{ fontSize: 12.5 }}>{s.tag}</span></span></span>
          <span className="mono" style={{ color: "var(--gold)", fontSize: 13 }}>{pr}%</span>
        </button>
        {isOpen && (<div className="reveal" style={{ marginTop: 12 }}>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>{s.explain}</p>
          <div className="eyebrow" style={{ margin: "12px 0 4px" }}>Lessons</div>
          {s.lessons.map((l) => (
            <button key={l.title} className="lrow" style={{ padding: "9px 0" }} onClick={() => (l.lessonId ? openLesson(l.lessonId) : openStudy(studyFor(l.title)))}>
              <span className={`lplay ${l.lessonId && done[l.lessonId] ? "done" : ""}`} style={{ width: 30, height: 30 }}>{l.lessonId && done[l.lessonId] ? I.check : l.lessonId ? I.play : I.wisdom}</span>
              <span style={{ flex: 1 }}><b style={{ fontSize: 14 }}>{l.title}</b></span>{I.arrow}
            </button>
          ))}
          <div className="eyebrow" style={{ margin: "12px 0 6px" }}>Tool</div>
          <button className="btn btn-ghost btn-sm" onClick={() => openTool(s.tool)}>{I.calc} {TOOLS.find((t) => t.id === s.tool)?.name}</button>
          <div style={{ height: 14 }} />
          <Scenario d={s.scenario} set="journey" done={practised.includes(s.scenario.id)} toast={toast} onXp={onXp} onDone={onDone} />
        </div>)}
      </div>
    ); })}
    <Disc>The journey teaches an order of operations, not a promise. Investing is one stage of seven, comes after a reserve, is not required of anyone and can lose money. Nothing here is advice.</Disc>
  </>);
}

/* ---------- Jubilee debt-freedom planner ---------- */
function Jubilee({ debts, setDebts, openStudy }: { debts: Debt[]; setDebts: (d: Debt[]) => void; openStudy: (n: string) => void }) {
  const [extra, setExtra] = useState(100); const [method, setMethod] = useState<"snowball" | "avalanche">("avalanche");
  const [form, setForm] = useState(false); const [f, setF] = useState({ name: "", balance: "", apr: "", min: "" }); const [busy, setBusy] = useState(false);
  const ins = debts.map((d) => ({ id: d.id, name: d.name, balance: d.balancePence / 100, apr: d.aprBp / 100, minPayment: d.minPaymentPence / 100 }));
  const out = ins.length ? jubilee(ins, extra, method) : null;
  const total = debts.reduce((a, d) => a + d.balancePence, 0);
  const free = out && !out.stuck ? new Date(new Date().getFullYear(), new Date().getMonth() + out.months, 1) : null;
  const max = out ? Math.max(...out.series, 1) : 1;
  return (<>
    <div className="between" style={{ margin: "14px 0 10px" }}><h2 style={{ fontSize: 19 }}>Jubilee planner</h2>{REAL}</div>
    <div className="card xpcard reveal">
      <div className="ttl">Debt-freedom date</div>
      <div className="lvl" style={{ fontSize: 28 }}>{!out ? "Add a debt to begin" : out.stuck ? "Payments don't cover interest yet" : free!.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
      {out && !out.stuck && <div style={{ fontSize: 12.5, color: "#c9d3de", marginTop: 2 }}>{out.months} months · {money(total)} owed · about {money(Math.round(out.totalInterest * 100))} interest along the way</div>}
      {out && out.series.length > 2 && <div className="bars" style={{ marginTop: 14 }} aria-label="Balance over time">{out.series.filter((_, i) => i % Math.max(1, Math.ceil(out.series.length / 40)) === 0).map((n, i) => <i key={i} style={{ height: `${Math.max(2, (n / max) * 100)}%` }} />)}</div>}
    </div>
    <div className="card" style={{ marginTop: 12 }}>
      <div className="between"><span style={{ fontSize: 14, fontWeight: 600 }}>Extra each month, beyond minimums</span><span className="row" style={{ gap: 6 }}><span className="faint">£</span><input className="inp mono" type="number" min="0" step="10" value={extra} style={{ width: 90, padding: "8px 10px", textAlign: "right" }} onChange={(e) => setExtra(Math.max(0, +e.target.value || 0))} aria-label="Extra monthly payment" /></span></div>
      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <button className={`chip ${method === "avalanche" ? "on" : ""}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setMethod("avalanche")}>Highest rate first</button>
        <button className={`chip ${method === "snowball" ? "on" : ""}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setMethod("snowball")}>Smallest first</button>
      </div>
      <p className="faint" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>{method === "avalanche" ? "Avalanche: cheapest overall — every spare pound hits the most expensive debt." : "Snowball: fastest first win — clear the smallest, roll its payment into the next."}</p>
    </div>
    <div className="sec"><h2>Your debts</h2><button className="link" onClick={() => setForm(true)}>+ Add debt</button></div>
    {debts.length ? <div className="card" style={{ padding: "4px 14px" }}>{debts.map((d) => { const o = out?.order.find((x) => x.id === d.id); return (
      <div key={d.id} className="kv" style={{ alignItems: "center" }}>
        <span><b style={{ fontSize: 14.5, display: "block" }}>{d.name}</b><span className="faint" style={{ fontSize: 12 }}>{(d.aprBp / 100).toFixed(2)}% APR · min {money(d.minPaymentPence)}/mo{o ? ` · clear in ${o.month} mo` : ""}</span></span>
        <span className="row" style={{ gap: 8 }}><b className="mono">{money(d.balancePence)}</b><button className="iconbtn" style={{ width: 32, height: 32 }} aria-label="Remove" onClick={async () => { if (!window.confirm(`Remove ${d.name}?`)) return; await api("/api/build", { kind: "debt_delete", id: d.id }); setDebts(debts.filter((x) => x.id !== d.id)); }}>{I.trash}</button></span>
      </div>
    ); })}</div> : (
      <div className="card" style={{ textAlign: "center", padding: "24px 18px" }}><div style={{ color: "var(--gold)", display: "grid", placeItems: "center" }}>{I.refresh}</div><h3 style={{ fontSize: 16, marginTop: 8 }}>Jubilee was a reset</h3><p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>Every fifty years, debts released. Yours can have a date too. List each debt with its balance, rate and minimum.</p><button className="btn btn-sm" style={{ margin: "14px auto 0" }} onClick={() => setForm(true)}>Add a debt</button></div>
    )}
    <div className="card card-gold" style={{ marginTop: 12 }}><div className="eyebrow">From the Wisdom library</div><h3 style={{ fontSize: 15, margin: "6px 0 4px" }}>Owe no one anything but love</h3><p className="muted" style={{ fontSize: 13 }}>Debt is not sin, but it is a claim on your future. The plan above is arithmetic; the freedom it buys is the point.</p><button className="btn btn-sm btn-ghost" style={{ marginTop: 10 }} onClick={() => openStudy("04")}>Read the Jubilee study</button></div>
    <Disc>An educational payoff simulator using figures you enter. It assumes fixed rates and payments and ignores fees, promotions and changes to your income. If debt feels unmanageable, free help exists: StepChange (0800 138 1111), National Debtline, Citizens Advice. Not advice.</Disc>
    {form && (
      <Sheet onClose={() => setForm(false)}>
        <div className="between"><h2 style={{ fontSize: 20 }}>Add a debt</h2><button className="iconbtn" onClick={() => setForm(false)} aria-label="Close">{I.close}</button></div>
        <div className="field" style={{ marginTop: 12 }}><label>Name</label><input className="inp" placeholder="e.g. Credit card" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="grid2"><div className="field"><label>Balance £</label><input className="inp mono" type="number" inputMode="decimal" min="0" value={f.balance} onChange={(e) => setF({ ...f, balance: e.target.value })} /></div><div className="field"><label>APR %</label><input className="inp mono" type="number" inputMode="decimal" min="0" step="0.1" value={f.apr} onChange={(e) => setF({ ...f, apr: e.target.value })} /></div></div>
        <div className="field"><label>Minimum payment £ / month</label><input className="inp mono" type="number" inputMode="decimal" min="0" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></div>
        <button className="btn" aria-busy={busy} disabled={!f.name.trim() || !(+f.balance > 0)} onClick={async () => {
          setBusy(true);
          try { const r = await api("/api/build", { kind: "debt", name: f.name, balance: +f.balance, apr: +f.apr || 0, minPayment: +f.min || 0 }); setDebts([...debts, r.debt]); setForm(false); setF({ name: "", balance: "", apr: "", min: "" }); } catch { /* retry */ } finally { setBusy(false); }
        }}>Add</button>
      </Sheet>
    )}
  </>);
}

/* ---------- Giving tracker ---------- */
function GivingTracker({ entries, setEntries, openStudy }: { entries: Giving[]; setEntries: (g: Giving[]) => void; openStudy: (n: string) => void }) {
  const month = new Date().toISOString().slice(0, 7);
  const cur = entries.find((e) => e.month === month);
  const [pct, setPct] = useState(cur?.pct ?? 10); const [note, setNote] = useState(cur?.note ?? ""); const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false);
  const last = [...entries].sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  const avg = entries.length ? Math.round(entries.reduce((a, e) => a + e.pct, 0) / entries.length) : 0;
  const fmtM = (m: string) => { const [y, mm] = m.split("-"); return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+mm - 1] + " " + y.slice(2); };
  return (<>
    <div className="between" style={{ margin: "14px 0 10px" }}><h2 style={{ fontSize: 19 }}>Giving</h2>{REAL}</div>
    <div className="card xpcard reveal">
      <div className="between"><div><div className="ttl">Decided in advance, like a saving rate</div><div className="lvl">{entries.length ? `${avg}%` : "—"}</div><div style={{ fontSize: 12.5, color: "#c9d3de", marginTop: 2 }}>{entries.length ? `Average across ${entries.length} month${entries.length === 1 ? "" : "s"} · percentages only, never amounts` : "Record the share of income you gave each month. No amounts — a habit, not a ledger."}</div></div><ArtBadge kind="giving" size={60} /></div>
      {last.length > 1 && <div className="bars" style={{ marginTop: 14 }} aria-label="Giving by month">{last.map((e) => <i key={e.id} style={{ height: `${Math.max(4, (e.pct / Math.max(10, ...last.map((x) => x.pct))) * 100)}%` }} title={`${fmtM(e.month)} · ${e.pct}%`} />)}</div>}
    </div>
    <div className="card" style={{ marginTop: 12 }}>
      <div className="between"><span style={{ fontWeight: 600 }}>This month · {fmtM(month)}</span><span className="mono" style={{ color: "var(--gold)", fontSize: 20 }}>{pct}%</span></div>
      <input type="range" min="0" max="30" step="1" value={pct} onChange={(e) => { setPct(+e.target.value); setSaved(false); }} style={{ width: "100%", marginTop: 10, accentColor: "#9a6f18" }} aria-label="Percentage of income given" />
      <div className="between" style={{ fontSize: 11, color: "var(--faint)" }}><span>0%</span><span>10% · a tithe</span><span>30%</span></div>
      <input className="inp" style={{ marginTop: 12 }} placeholder="Where it went (optional) — church, a person, a project" value={note} onChange={(e) => { setNote(e.target.value); setSaved(false); }} />
      <button className="btn btn-sm" style={{ marginTop: 12 }} aria-busy={busy} onClick={async () => {
        setBusy(true);
        try { const r = await api("/api/build", { kind: "giving", month, pct, note }); setEntries([r.entry, ...entries.filter((e) => e.month !== month)]); setSaved(true); } catch { /* retry */ } finally { setBusy(false); }
      }}>{saved ? "Saved ✓" : cur ? "Update this month" : "Record this month"}</button>
    </div>
    {last.length > 0 && <><div className="sec"><h2>History</h2></div><div className="card" style={{ padding: "4px 14px" }}>{[...last].reverse().map((e) => <div key={e.id} className="kv"><span>{fmtM(e.month)}{e.note ? <span className="faint" style={{ fontSize: 12 }}> · {e.note}</span> : null}</span><b className="mono">{e.pct}%</b></div>)}</div></>}
    <div className="card card-gold" style={{ marginTop: 12 }}><div className="eyebrow">From the Wisdom library</div><h3 style={{ fontSize: 15, margin: "6px 0 4px" }}>Wealth that builds more than wealth</h3><p className="muted" style={{ fontSize: 13 }}>Generosity is the end of the journey and the reason for it. The widow gave from little and it multiplied — not as a formula, as a posture.</p><button className="btn btn-sm btn-ghost" style={{ marginTop: 10 }} onClick={() => openStudy("03")}>Read the study</button></div>
    <Disc>Giving is recorded as a percentage you choose, never as an amount, and earns no XP — generosity isn&rsquo;t a game. Ten Talents does not collect, process or direct donations of any kind.</Disc>
  </>);
}

/* ---------- Talent Ledger ---------- */
function Dots({ n }: { n: number }) { return <span className="row" style={{ gap: 3 }} aria-label={`Level ${n} of 5`}>{[1, 2, 3, 4, 5].map((i) => <i key={i} style={{ width: 7, height: 7, borderRadius: 99, background: i <= n ? "var(--gold)" : "var(--line-2)", display: "inline-block" }} />)}</span>; }
const CATS: [string, string][] = [["skill", "Skill"], ["knowledge", "Knowledge"], ["habit", "Habit"], ["relationship", "Relationship"]];
function TalentLedger({ talents, setTalents, flash, openStudy }: { talents: Talent[]; setTalents: (t: Talent[]) => void; flash: (r: { xp?: number; badges?: string[] }, label: string) => void; openStudy: (n: string) => void }) {
  const [edit, setEdit] = useState<Partial<Talent> | null>(null); const [busy, setBusy] = useState(false);
  return (<>
    <div className="between" style={{ margin: "14px 0 10px" }}><h2 style={{ fontSize: 19 }}>Talent Ledger</h2>{REAL}</div>
    <div className="card xpcard reveal">
      <div className="between"><div><div className="ttl">What you&rsquo;ve been given</div><div className="lvl">{talents.length} talent{talents.length === 1 ? "" : "s"}</div><div style={{ fontSize: 12.5, color: "#c9d3de", marginTop: 2 }}>Skills, knowledge, habits and relationships — the capital that isn&rsquo;t money. Name it, rate it honestly, develop it.</div></div><ArtBadge kind="talents" size={60} /></div>
    </div>
    <div className="sec"><h2>Ledger</h2><button className="link" onClick={() => setEdit({ category: "skill", level: 1 })}>+ Add · 10 XP</button></div>
    {talents.length ? <div className="card" style={{ padding: "4px 14px" }}>{talents.map((t) => (
      <button key={t.id} className="kv" style={{ width: "100%", textAlign: "left", alignItems: "center" }} onClick={() => setEdit(t)}>
        <span><b style={{ fontSize: 14.5, display: "block" }}>{t.name}</b><span className="faint" style={{ fontSize: 12 }}>{CATS.find(([k]) => k === t.category)?.[1]}{t.note ? ` · ${t.note}` : ""}</span></span><Dots n={t.level} />
      </button>
    ))}</div> : (
      <div className="card" style={{ textAlign: "center", padding: "24px 18px" }}><div style={{ color: "var(--gold)", display: "grid", placeItems: "center" }}>{I.ledger}</div><h3 style={{ fontSize: 16, marginTop: 8 }}>An empty ledger</h3><p className="muted" style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>The servants were each given something. Start with three: a skill you have, something you know, a habit you keep.</p><button className="btn btn-sm" style={{ margin: "14px auto 0" }} onClick={() => setEdit({ category: "skill", level: 1 })}>Add your first talent</button></div>
    )}
    <div className="card card-gold" style={{ marginTop: 12 }}><div className="eyebrow">From the Wisdom library</div><h3 style={{ fontSize: 15, margin: "6px 0 4px" }}>The Mystery of the Talents</h3><p className="muted" style={{ fontSize: 13 }}>The rebuke in the parable was not for losing — it was for burying. Whatever is on this ledger is meant to be traded with.</p><button className="btn btn-sm btn-ghost" style={{ marginTop: 10 }} onClick={() => openStudy("02")}>Read the study</button></div>
    <Disc>A personal inventory saved to your account. Levels are your own honest rating; they change as you develop. Adding a talent earns 10 XP once — the reward is for naming it, the growth is yours.</Disc>
    {edit && (
      <Sheet onClose={() => setEdit(null)}>
        <div className="between"><h2 style={{ fontSize: 20 }}>{edit.id ? "Edit talent" : "Add a talent"}</h2><button className="iconbtn" onClick={() => setEdit(null)} aria-label="Close">{I.close}</button></div>
        <div className="field" style={{ marginTop: 12 }}><label>Name</label><input className="inp" placeholder="e.g. Spreadsheets, cooking, patience, my small group" value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Kind</div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 14 }}>{CATS.map(([k, l]) => <button key={k} className={`chip ${edit.category === k ? "on" : ""}`} onClick={() => setEdit({ ...edit, category: k })}>{l}</button>)}</div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Where it is today</div>
        <div className="row" style={{ gap: 6, marginBottom: 14 }}>{[1, 2, 3, 4, 5].map((n) => <button key={n} className={`chip ${edit.level === n ? "on" : ""}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setEdit({ ...edit, level: n })}>{n}</button>)}</div>
        <div className="field"><label>Note (optional)</label><input className="inp" placeholder="How you'll develop it" value={edit.note ?? ""} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></div>
        <button className="btn" aria-busy={busy} disabled={!(edit.name ?? "").trim()} onClick={async () => {
          setBusy(true);
          try { const r = await api("/api/build", { kind: "talent", id: edit.id, name: edit.name, category: edit.category, level: edit.level, note: edit.note ?? "" }); setTalents(edit.id ? talents.map((t) => (t.id === r.talent.id ? r.talent : t)) : [...talents, r.talent]); flash(r, "Talent recorded"); setEdit(null); } catch { /* retry */ } finally { setBusy(false); }
        }}>{edit.id ? "Save" : "Add to ledger"}</button>
        {edit.id && <button className="btn btn-ghost" style={{ marginTop: 10, color: "var(--red)" }} onClick={async () => { if (!window.confirm("Remove this talent?")) return; await api("/api/build", { kind: "talent_delete", id: edit.id }); setTalents(talents.filter((t) => t.id !== edit.id)); setEdit(null); }}>Remove</button>}
      </Sheet>
    )}
  </>);
}

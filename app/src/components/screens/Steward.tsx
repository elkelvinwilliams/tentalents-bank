"use client";
/* Steward — user-entered savings goals. A planning tool: Ten Talents holds no
   money, moves no money and gives no advice. Milestones pay learning XP. */
import { useState } from "react";
import { I, type IconName } from "../icons";
import { api, money, monthsTo, fmtYM, Ring, Sheet, Disc, type ToastFn } from "../ui";
import type { GoalRow } from "@/lib/app-data";

export const GOAL_ICONS: [IconName, string][] = [["home", "Home"], ["plane", "Travel"], ["shield", "Reserve"], ["gift", "Giving"], ["car", "Car"], ["book", "Study"], ["target", "Other"]];
export const gpct = (g: GoalRow) => Math.min(100, Math.floor((g.savedPence / g.targetPence) * 100));

type Props = { goals: GoalRow[]; setGoals: (g: GoalRow[]) => void; toast: ToastFn; onXp: () => void; openStudy: () => void };

export function StewardTab({ goals, setGoals, toast, onXp, openStudy }: Props) {
  const [sheet, setSheet] = useState<{ kind: "new" } | { kind: "edit"; g: GoalRow } | { kind: "detail"; id: string } | null>(null);
  const tot = goals.reduce((a, g) => a + g.savedPence, 0), tgt = goals.reduce((a, g) => a + g.targetPence, 0);
  const pct = tgt ? Math.round((tot / tgt) * 100) : 0;
  const detail = sheet?.kind === "detail" ? goals.find((g) => g.id === sheet.id) : null;

  const applyResult = (r: { goal: GoalRow; xp: number; badges: string[] }, label: string) => {
    setGoals(goals.some((g) => g.id === r.goal.id) ? goals.map((g) => (g.id === r.goal.id ? r.goal : g)) : [...goals, r.goal]);
    if (r.xp) toast(r.xp, label);
    r.badges.forEach((b) => setTimeout(() => toast(0, `Badge unlocked · ${b === "steward" ? "Steward" : b}`), 900));
    if (r.xp || r.badges.length) onXp();
  };

  return (<>
    <div className="pagehdr"><h1>Steward</h1><button className="iconbtn" aria-label="New goal" onClick={() => setSheet({ kind: "new" })}>{I.plus}</button></div>
    <div className="pad">
      <div className="card xpcard reveal">
        <div className="between">
          <div><div className="ttl">Your goals</div><div className="lvl">{money(tot)}</div><div style={{ fontSize: 12, color: "#c9d3de", marginTop: 2 }}>of {money(tgt)} across {goals.length} goal{goals.length === 1 ? "" : "s"}</div></div>
          <Ring pct={pct} label={`${pct}%`} />
        </div>
        <div className="xpbar"><i style={{ width: `${pct}%` }} /></div>
        <div className="xpmeta"><span>Steward today. Greater tomorrow.</span><span>Milestones earn XP</span></div>
      </div>
      <div className="sec"><h2>Goals</h2><button className="link" onClick={() => setSheet({ kind: "new" })}>+ New goal</button></div>
      {goals.length ? goals.map((g) => {
        const p = gpct(g), m = monthsTo(g.targetMonth), need = Math.max(0, (g.targetPence - g.savedPence) / m);
        const done = p >= 100;
        return (
          <button key={g.id} className="card coursewide reveal" style={{ marginBottom: 12, borderColor: done ? "var(--green)" : undefined }} onClick={() => setSheet({ kind: "detail", id: g.id })}>
            <span className="th" style={{ background: done ? "rgba(31,122,85,.14)" : "var(--gold-tint)", color: done ? "var(--green)" : "var(--gold)" }}>{done ? I.check : I[g.icon as IconName]}</span>
            <span style={{ flex: 1, textAlign: "left" }}>
              <h3>{g.name}</h3>
              <div className="cmeta"><span className="mono">{money(g.savedPence)} / {money(g.targetPence)}</span><span>{done ? "Complete" : g.targetMonth ? `${money(Math.round(need))} /mo to ${fmtYM(g.targetMonth)}` : `${p}%`}</span></div>
              <div className="cpbar"><i style={{ width: `${p}%`, background: done ? "var(--green)" : undefined }} /></div>
            </span>
            <span className="mono" style={{ fontSize: 13, color: done ? "var(--green)" : "var(--gold)" }}>{p}%</span>
          </button>
        );
      }) : (
        <div className="card" style={{ textAlign: "center", padding: "28px 18px" }}>
          <div style={{ color: "var(--gold)", marginBottom: 8, display: "grid", placeItems: "center" }}>{I.target}</div>
          <h3 style={{ fontSize: 17 }}>No goals yet</h3>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>Seven years of plenty, seven of famine. Start with a reserve.</p>
          <button className="btn btn-sm" style={{ margin: "14px auto 0" }} onClick={() => setSheet({ kind: "new" })}>Set a goal · +30 XP</button>
        </div>
      )}
      <div className="card card-gold" style={{ marginTop: 4 }}>
        <div className="eyebrow">From the Wisdom library</div>
        <h3 style={{ fontSize: 15, margin: "6px 0 4px" }}>The 20% reserve</h3>
        <p className="muted" style={{ fontSize: 13 }}>Joseph stored a fifth of the surplus in the good years. An emergency reserve is the personal version — set it aside while it feels least necessary.</p>
        <button className="btn btn-sm btn-ghost" style={{ marginTop: 10 }} onClick={openStudy}>Read the study</button>
      </div>
      <Disc>Your goals and figures are entered by you and saved to your account. Ten Talents holds no money, moves no money and gives no advice. This is a planning tool, not an account.</Disc>
    </div>

    {(sheet?.kind === "new" || sheet?.kind === "edit") && (
      <GoalForm g={sheet.kind === "edit" ? sheet.g : null} onClose={() => setSheet(null)}
        onSaved={(r, isNew) => { applyResult(r, isNew ? "Goal set" : "Goal updated"); setSheet(null); }}
        onDeleted={(id) => { setGoals(goals.filter((g) => g.id !== id)); setSheet(null); }} />
    )}
    {detail && (
      <Sheet onClose={() => setSheet(null)}>
        {(() => { const p = gpct(detail), m = monthsTo(detail.targetMonth), need = Math.max(0, (detail.targetPence - detail.savedPence) / m); return (<>
          <div className="between">
            <div className="row"><span className="lplay" style={{ width: 44, height: 44 }}>{I[detail.icon as IconName]}</span><div><h2 style={{ fontSize: 20 }}>{detail.name}</h2><div className="faint" style={{ fontSize: 12 }}>{detail.targetMonth ? "By " + fmtYM(detail.targetMonth) : "No date set"}</div></div></div>
            <button className="iconbtn" onClick={() => setSheet(null)} aria-label="Close">{I.close}</button>
          </div>
          <div className="card xpcard" style={{ marginTop: 14 }}>
            <div className="between"><div><div className="ttl">Saved</div><div className="lvl">{money(detail.savedPence)}</div><div style={{ fontSize: 12, color: "#c9d3de" }}>of {money(detail.targetPence)}</div></div><Ring pct={p} label={`${p}%`} /></div>
            <div className="xpbar"><i style={{ width: `${p}%` }} /></div>
            <div className="xpmeta"><span>{money(Math.max(0, detail.targetPence - detail.savedPence))} to go</span><span>{p >= 100 ? "Complete" : detail.targetMonth ? `${money(Math.round(need))} /mo` : ""}</span></div>
          </div>
          <AddMoney id={detail.id} onResult={(r) => { applyResult(r, `Saved ${money(r.addedPence)}`); setSheet(null); }} />
          <div className="row" style={{ gap: 8, marginTop: 14 }}><button className="btn btn-ghost" onClick={() => setSheet({ kind: "edit", g: detail })}>Edit goal</button></div>
          <Disc>Recording money you have set aside elsewhere — a savings account, a jar, a plan. Nothing moves here. +10 XP per update; +25 XP at 25 / 50 / 75%; +100 XP and the Steward badge at 100%.</Disc>
        </>); })()}
      </Sheet>
    )}
  </>);
}

function AddMoney({ id, onResult }: { id: string; onResult: (r: { goal: GoalRow; xp: number; badges: string[]; addedPence: number }) => void }) {
  const [amt, setAmt] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const add = async (v: number) => {
    if (!(v > 0) || busy) return; setBusy(true); setErr(null);
    try { const r = await api(`/api/goals/${id}`, { amount: v }); onResult({ ...r, addedPence: Math.round(v * 100) }); }
    catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (<>
    <div className="sec" style={{ marginTop: 18 }}><h2 style={{ fontSize: 17 }}>Add to this goal</h2></div>
    <div className="row" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>{[25, 50, 100, 250].map((v) => <button key={v} className="chip" disabled={busy} onClick={() => add(v)}>+£{v}</button>)}</div>
    <div className="row" style={{ gap: 8 }}><input className="inp mono" type="number" min="1" step="0.01" inputMode="decimal" placeholder="Amount £" value={amt} onChange={(e) => setAmt(e.target.value)} /><button className="btn" style={{ width: "auto", padding: "0 18px" }} aria-busy={busy} onClick={() => add(+amt)}>Add</button></div>
    {err && <div className="err">{err}</div>}
  </>);
}

function GoalForm({ g, onClose, onSaved, onDeleted }: { g: GoalRow | null; onClose: () => void; onSaved: (r: { goal: GoalRow; xp: number; badges: string[] }, isNew: boolean) => void; onDeleted: (id: string) => void }) {
  const [name, setName] = useState(g?.name ?? ""); const [icon, setIcon] = useState<IconName>((g?.icon as IconName) ?? "home");
  const [target, setTarget] = useState(g ? String(g.targetPence / 100) : ""); const [saved, setSaved] = useState(g ? String(g.savedPence / 100) : "0");
  const [date, setDate] = useState(g?.targetMonth ?? ""); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const t = +target || 0, sv = +saved || 0;
  const hint = t > 0 && date ? `About ${money(Math.max(0, Math.round(((t - sv) / monthsTo(date)) * 100)))} a month to get there by ${fmtYM(date)}.` : "";
  const save = async () => {
    if (!name.trim() || !(t > 0)) { setErr("Give the goal a name and a target."); return; }
    setBusy(true); setErr(null);
    try {
      const body = { name, icon, target: t, saved: sv, date: date || null };
      const r = g ? await api(`/api/goals/${g.id}`, body, "PATCH") : await api("/api/goals", body);
      onSaved(r, !g);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };
  return (
    <Sheet onClose={onClose}>
      <div className="between"><h2 style={{ fontSize: 20 }}>{g ? "Edit goal" : "New goal"}</h2><button className="iconbtn" onClick={onClose} aria-label="Close">{I.close}</button></div>
      <div className="field" style={{ marginTop: 14 }}><label>What are you saving for?</label><input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="House deposit" maxLength={60} /></div>
      <div className="field"><label>Icon</label><div className="hscroll">{GOAL_ICONS.map(([k, label]) => <button key={k} type="button" className={`chip ${icon === k ? "on" : ""}`} onClick={() => setIcon(k)}>{I[k]} {label}</button>)}</div></div>
      <div className="grid2">
        <div className="field"><label>Target £</label><input className="inp mono" type="number" min="1" step="0.01" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="25000" /></div>
        <div className="field"><label>Saved so far £</label><input className="inp mono" type="number" min="0" step="0.01" inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} /></div>
      </div>
      <div className="field"><label>Target date</label><input className="inp" type="month" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      {hint && <p className="faint" style={{ fontSize: 12, margin: "-4px 0 12px" }}>{hint}</p>}
      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}
      <button className="btn" aria-busy={busy} onClick={save}>{g ? "Save changes" : "Create goal · +30 XP"}</button>
      {g && <button className="btn btn-ghost" style={{ marginTop: 10, color: "var(--red)" }} onClick={async () => { if (!confirm(`Delete “${g.name}”?`)) return; await api(`/api/goals/${g.id}`, undefined, "DELETE"); onDeleted(g.id); }}>Delete goal</button>}
    </Sheet>
  );
}

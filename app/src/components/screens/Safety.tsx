"use client";
/* Money Safety — topics to read and Spot-the-Scam scenarios to practise. XP is awarded by the
   server once per scenario for the safer choice. */
import { useState } from "react";
import { I } from "../icons";
import { api, Disc, type ToastFn } from "../ui";
import { SAFETY_TOPICS, SCAM_SCENARIOS } from "@/content/safety";
import type { Drill } from "@/content/drills";
import { BADGES } from "@/lib/levels";
import { ArtBadge } from "../art";
import { haptic } from "@/lib/native";

export function badgeName(id: string) { return BADGES.find((b) => b.id === id)?.name ?? id; }

/** Generic scenario runner used by Spot-the-Scam and the Wealth Builder journey. */
export function Scenario({ d, set, done, toast, onXp, onDone }: { d: Drill; set: "safety" | "journey"; done: boolean; toast: ToastFn; onXp: () => void; onDone?: (id: string) => void }) {
  const [pick, setPick] = useState<{ n: number; best: boolean; bestIndex: number; why: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="card reveal" style={{ marginBottom: 12, borderColor: done ? "var(--green)" : undefined }}>
      <div className="between"><span className="eyebrow">{set === "safety" ? "Spot the scam" : "Scenario"}</span>{done ? <span className="pill g">Practised</span> : <span className="pill o">+25 XP</span>}</div>
      <h3 style={{ fontSize: 16, margin: "8px 0 6px" }}>{d.title}</h3>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>{d.body}</p>
      <div style={{ marginTop: 12 }}>
        {d.options.map((o, n) => (
          <button key={n} disabled={!!pick || busy} className={`opt ${pick && n === pick.bestIndex ? "correct" : ""} ${pick && n === pick.n && !pick.best ? "wrong" : ""}`} style={{ padding: "12px 14px", fontSize: 14 }} onClick={async () => {
            if (pick) return; setBusy(true);
            try {
              const r = await api("/api/scenarios", { set, id: d.id, choice: n });
              setPick({ n, best: r.best, bestIndex: r.bestIndex, why: r.why }); haptic(r.best ? "success" : "light");
              if (r.xp) { toast(r.xp, set === "safety" ? "Scam spotted" : "Good judgement"); onXp(); }
              r.badges?.forEach((b: string) => setTimeout(() => toast(0, `Badge unlocked · ${badgeName(b)}`), 900));
              if (r.best) onDone?.(d.id);
            } catch { /* leave for retry */ } finally { setBusy(false); }
          }}><span className="ab">{String.fromCharCode(65 + n)}</span>{o.text}</button>
        ))}
      </div>
      {pick && (<>
        <div className={`fb ${pick.best ? "g" : "r"}`}><b>{pick.best ? "Safer choice." : "Not the safest."}</b> {pick.why}</div>
        {!pick.best && <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setPick(null)}>Try again</button>}
      </>)}
    </div>
  );
}

export function SafetySection({ done, toast, onXp, onDone }: { done: string[]; toast: ToastFn; onXp: () => void; onDone: (id: string) => void }) {
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [seg, setSeg] = useState<"learn" | "practise">("practise");
  const got = SCAM_SCENARIOS.filter((s) => done.includes(s.id)).length;
  return (<>
    <div className="card xpcard reveal" style={{ marginTop: 14 }}>
      <div className="between"><div><div className="ttl">Money Safety</div><div className="lvl">{got}/{SCAM_SCENARIOS.length} spotted</div><div style={{ fontSize: 12.5, color: "#c9d3de", marginTop: 2 }}>Every scam has a pattern. Learn it once and it stops working on you.</div></div><ArtBadge kind="safety" size={60} /></div>
      <div className="xpbar"><i style={{ width: `${(got / SCAM_SCENARIOS.length) * 100}%` }} /></div>
      <div className="xpmeta"><span>Ten Talents never asks you to send money to invest.</span><span>Scam Spotter badge at 5/5</span></div>
    </div>
    <div className="hscroll" style={{ margin: "12px -18px 4px" }}>
      <button className={`chip ${seg === "practise" ? "on" : ""}`} onClick={() => setSeg("practise")}>Spot the scam</button>
      <button className={`chip ${seg === "learn" ? "on" : ""}`} onClick={() => setSeg("learn")}>Know the patterns</button>
    </div>
    {seg === "practise" ? SCAM_SCENARIOS.map((d) => <Scenario key={d.id} d={d} set="safety" done={done.includes(d.id)} toast={toast} onXp={onXp} onDone={onDone} />) : (
      <div className="card" style={{ padding: "4px 14px" }}>
        {SAFETY_TOPICS.map((t) => (
          <div key={t.id} className="term" style={{ padding: "12px 0" }}>
            <button className="between" style={{ width: "100%", textAlign: "left" }} onClick={() => setOpenTopic(openTopic === t.id ? null : t.id)} aria-expanded={openTopic === t.id}><b style={{ fontSize: 14.5 }}>{t.title}</b><span className="faint" style={{ transform: openTopic === t.id ? "rotate(90deg)" : undefined, transition: "transform .2s" }}>{I.arrow}</span></button>
            {openTopic === t.id && (<div className="reveal"><p style={{ marginTop: 6 }}>{t.body}</p><div className="eyebrow" style={{ margin: "10px 0 4px" }}>Warning signs</div><ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{t.signs.map((s) => <li key={s}>{s}</li>)}</ul></div>)}
          </div>
        ))}
      </div>
    )}
    <Disc>If you think you have been scammed: stop all payments, contact your bank, and report to Action Fraud (0300 123 2040). Check any firm on the FCA Register before sending money. Ten Talents is not authorised and never manages money.</Disc>
  </>);
}

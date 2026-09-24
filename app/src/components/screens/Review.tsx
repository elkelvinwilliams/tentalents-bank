"use client";
/* Weekly Money Review — a five-minute reflection that ends in a learning priority, never a
   verdict. Saved per ISO week; the first save each week earns 20 XP. Skipping is fine. */
import { useState } from "react";
import { I } from "../icons";
import { api, Disc, type ToastFn } from "../ui";
import { isoWeek } from "@/lib/week";
import { badgeName } from "./Safety";

const PROMPTS: [string, string, string][] = [
  ["learned", "What did you learn this week?", "A concept, a lesson, a mistake you understood."],
  ["practised", "What did you practise?", "Simulator trades, a tool you ran, a scenario, a saving transfer."],
  ["noticed", "What did you notice about your own behaviour?", "Impulse or plan? Calm or rushed? Anything you'd flag."],
  ["improve", "One thing to do differently next week", "Small and specific beats big and vague."],
];

export function WeeklyReview({ priority, onBack, toast, onXp, onSaved }: { priority: { title: string; why: string }; onBack: () => void; toast: ToastFn; onXp: () => void; onSaved: () => void }) {
  const [a, setA] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const week = isoWeek(new Date());
  const filled = PROMPTS.filter(([k]) => (a[k] ?? "").trim()).length;
  const save = async (skipped: boolean) => {
    setBusy(true);
    try {
      const r = await api("/api/build", { kind: "review", week, answers: a, skipped });
      if (r.xp) { toast(r.xp, "Weekly review"); onXp(); }
      r.badges?.forEach((b: string) => setTimeout(() => toast(0, `Badge unlocked · ${badgeName(b)}`), 900));
      onSaved(); if (skipped) onBack(); else setDone(true);
    } catch { /* leave for retry */ } finally { setBusy(false); }
  };
  return (<>
    <div className="pagehdr"><button className="iconbtn" onClick={onBack} aria-label="Back">{I.back}</button><h1 style={{ fontSize: 22 }}>Weekly review</h1><span className="pill o">{week}</span></div>
    <div className="pad">
      {done ? (
        <div className="reveal">
          <div className="card xpcard" style={{ textAlign: "center" }}><div style={{ color: "#edb671", display: "grid", placeItems: "center" }}>{I.compass}</div><div className="ttl" style={{ marginTop: 8 }}>Your next learning priority</div><h2 style={{ fontSize: 22, color: "#fff", marginTop: 6 }}>{priority.title}</h2><p style={{ color: "#c9d3de", fontSize: 14, marginTop: 8 }}>{priority.why}</p></div>
          <button className="btn" style={{ marginTop: 14 }} onClick={onBack}>Done for this week {I.arrow}</button>
          <Disc>A review is reflection, not scoring. Nothing here judges your money — it points at the next thing worth learning.</Disc>
        </div>
      ) : (<>
        <p className="muted" style={{ fontSize: 14, margin: "4px 0 14px", lineHeight: 1.55 }}>Five minutes, four questions. Progress over perfection — write a line or two, or skip this week without penalty.</p>
        {PROMPTS.map(([k, q, hint]) => (
          <div key={k} className="field" style={{ marginBottom: 12 }}>
            <label htmlFor={`rv-${k}`}>{q}</label>
            <textarea id={`rv-${k}`} className="inp" rows={2} placeholder={hint} value={a[k] ?? ""} onChange={(e) => setA({ ...a, [k]: e.target.value })} style={{ resize: "vertical", minHeight: 58 }} />
          </div>
        ))}
        <button className="btn" aria-busy={busy} disabled={!filled} onClick={() => save(false)}>Finish review · +20 XP</button>
        <button className="btn btn-ghost" style={{ marginTop: 10, border: 0, color: "var(--muted)" }} disabled={busy} onClick={() => save(true)}>Skip this week</button>
        <Disc>Your answers are saved to your account and shown only to you. The review ends with a learning priority, not a verdict on your finances.</Disc>
      </>)}
    </div>
  </>);
}

"use client";
/* Readiness Passport — an EDUCATIONAL readiness profile built from learning activity and
   simulated behaviour. Not suitability, not a credit score, not a performance prediction. */
import { useEffect, useRef, useState } from "react";
import { I } from "../icons";
import { api, Ring, Disc } from "../ui";
import type { Passport } from "@/lib/passport";

export function PassportView({ name, onBack }: { name: string; onBack: () => void }) {
  const [p, setP] = useState<Passport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fetched = useRef(false);
  useEffect(() => { if (fetched.current) return; fetched.current = true; api("/api/passport").then(setP).catch((e) => setErr((e as Error).message)); }, []);
  const stage = (n: number) => (n < 25 ? "Beginning" : n < 50 ? "Developing" : n < 75 ? "Practising" : "Established");
  return (<>
    <div className="pagehdr"><button className="iconbtn" onClick={onBack} aria-label="Back">{I.back}</button><h1 style={{ fontSize: 22 }}>Readiness Passport</h1></div>
    <div className="pad">
      {err ? <p className="muted">{err}</p> : !p ? <p className="muted">Building your profile…</p> : (<>
        <div className="passport reveal">
          <div className="between"><div><img className="logo" src="/logo-hand-gold.png" alt="" style={{ height: 26 }} /><div className="eyebrow" style={{ marginTop: 8 }}>Educational readiness profile</div><h2 style={{ fontSize: 22, color: "#fff", marginTop: 4 }}>{name || "Your name"}</h2><div style={{ fontSize: 12, color: "#c9d3de" }}>Issued {p.issuedAt} · updates as you learn</div></div><Ring pct={p.overall} size={84} label={String(p.overall)} /></div>
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {p.dims.map((d) => (
              <div key={d.id}>
                <div className="between" style={{ fontSize: 13 }}><span style={{ color: "#fff", fontWeight: 600 }}>{d.name}</span><span style={{ color: "#edb671" }}>{stage(d.pct)}</span></div>
                <div className="xpbar" style={{ marginTop: 5, height: 7 }}><i style={{ width: `${d.pct}%` }} /></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: "#c9d3de", lineHeight: 1.5, borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 10 }}>This profile reflects learning activity and simulated behaviour. It does not predict investment performance or determine suitability.</div>
        </div>
        <div className="sec"><h2>Evidence</h2><span className="faint" style={{ fontSize: 12 }}>from your account</span></div>
        <div className="card" style={{ padding: "4px 14px" }}>
          {p.dims.map((d) => (
            <div key={d.id} className="term" style={{ padding: "12px 0" }}>
              <div className="between"><b style={{ fontSize: 14.5 }}>{d.name}</b><span className="mono" style={{ color: "var(--gold)" }}>{d.pct}</span></div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{d.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" style={{ marginTop: 14 }} disabled title="Export arrives once the design is finalised">Export as PDF · coming soon</button>
        <Disc>The Readiness Passport is an educational record, not a qualification, a credit assessment or a measure of suitability for any product. It is built only from what you do inside Ten Talents Academy: lessons, quizzes, scenarios, reflections and the demo simulator.</Disc>
      </>)}
    </div>
  </>);
}

"use client";
/* Cohorts — churches, small groups, workplaces and families learning together. The board shows
   learning progress only: lessons, XP, streak. Never money, never trades. */
import { useEffect, useRef, useState } from "react";
import { I } from "../icons";
import { api, Disc } from "../ui";

type Cohort = { id: string; name: string; code: string | null; leader: boolean; members: { you: boolean; name: string; lessons: number; xp: number; streak: number }[] };

export function CohortsView({ onBack }: { onBack: () => void }) {
  const [list, setList] = useState<Cohort[] | null>(null);
  const [name, setName] = useState(""); const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null); const [ok, setOk] = useState<string | null>(null);
  const fetched = useRef(false);
  const load = () => api("/api/cohorts").then((d) => setList(d.cohorts)).catch((e) => setErr((e as Error).message));
  useEffect(() => { if (fetched.current) return; fetched.current = true; load(); }, []);
  const act = async (body: unknown, msg: (r: { code?: string; name?: string }) => string) => {
    setBusy(true); setErr(null); setOk(null);
    try { const r = await api("/api/cohorts", body); setOk(msg(r)); setName(""); setCode(""); await load(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (<>
    <div className="pagehdr"><button className="iconbtn" onClick={onBack} aria-label="Back">{I.back}</button><h1 style={{ fontSize: 22 }}>Cohorts</h1></div>
    <div className="pad">
      <div className="card card-gold reveal"><div className="eyebrow">Learn together</div><h3 style={{ fontSize: 16, margin: "8px 0 4px" }}>Churches, groups, families, workplaces</h3><p className="muted" style={{ fontSize: 13.5, lineHeight: 1.55 }}>Start a cohort and share the code, or join one. Members see each other&rsquo;s learning — lessons, XP, streaks — and nothing about anyone&rsquo;s money.</p></div>
      {list === null ? <p className="muted" style={{ marginTop: 12 }}>Loading…</p> : list.map((c) => (
        <div key={c.id} className="card" style={{ marginTop: 12 }}>
          <div className="between"><h3 style={{ fontSize: 17 }}>{c.name}</h3>{c.code && <span className="pill o mono" title="Share this code">Code {c.code}</span>}</div>
          <div style={{ marginTop: 10 }}>
            {c.members.map((m, i) => (
              <div key={i} className="kv" style={{ alignItems: "center" }}>
                <span className="row" style={{ gap: 10 }}><span className="mono faint" style={{ width: 18 }}>{i + 1}</span><span style={{ fontWeight: m.you ? 700 : 500 }}>{m.name}</span></span>
                <span className="row" style={{ gap: 12, fontSize: 12.5 }} title="lessons · streak · XP"><span className="faint">{m.lessons} lessons</span><span className="faint">{I.flame} {m.streak}</span><b className="mono" style={{ color: "var(--gold)" }}>{m.xp.toLocaleString()} XP</b></span>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
          {c.code && <button className="btn btn-ghost btn-sm" onClick={async () => { const text = `Join my Ten Talents Academy cohort "${c.name}" — code ${c.code}. ${window.location.origin}`; try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); setOk("Invite copied."); } } catch { /* cancelled */ } }}>Share invite</button>}
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--muted)" }} disabled={busy} onClick={() => { if (window.confirm(`Leave ${c.name}?`)) act({ action: "leave", id: c.id }, () => "Left the cohort."); }}>Leave</button>
          </div>
        </div>
      ))}
      <div className="sec"><h2>Start a cohort</h2></div>
      <div className="row" style={{ gap: 8 }}><input className="inp" placeholder="e.g. Grace Church young adults" value={name} onChange={(e) => setName(e.target.value)} aria-label="Cohort name" /><button className="btn" style={{ width: "auto", padding: "0 18px" }} disabled={!name.trim() || busy} onClick={() => act({ action: "create", name }, (r) => `Cohort created. Share code ${r.code}.`)}>Create</button></div>
      <div className="sec"><h2>Join with a code</h2></div>
      <div className="row" style={{ gap: 8 }}><input className="inp mono" placeholder="6-character code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} aria-label="Join code" /><button className="btn btn-nav" style={{ width: "auto", padding: "0 18px" }} disabled={code.length < 6 || busy} onClick={() => act({ action: "join", code }, (r) => `Joined ${r.name}.`)}>Join</button></div>
      {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
      {ok && <div className="ok" style={{ marginTop: 12 }}>{ok}</div>}
      <Disc>Cohorts share learning progress only — first names, lessons, XP and streaks. No balances, goals, trades or personal figures are ever visible to other members. Leaders see the join code; anyone can leave at any time.</Disc>
    </div>
  </>);
}

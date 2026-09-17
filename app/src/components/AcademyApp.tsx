"use client";

/* ============================================================
   Ten Talents Academy — production client shell.
   Every screen, flow, copy line and legal wording is ported
   verbatim from /academy/index.html (the prototype contract).
   Additions per spec: auth screens, server-synced state, Stripe
   billing, signals page link, certificate downloads.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { I } from "./icons";
import type { TrackMeta } from "@/lib/app-data";

const LOGO = <img className="logo" src="/logo-hand-gold.png" alt="" />;

/* ---- copy ported verbatim ---- */
const QUESTIONS: [string, string[]][] = [
  ["What best describes you right now?", ["Complete beginner", "I know a little", "I've tried trading before"]],
  ["How much time can you give to learning each week?", ["Under 1 hour", "1 to 3 hours", "More than 3 hours"]],
  ["What draws you to the markets?", ["Extra income", "Financial freedom", "Learning a new skill", "Understanding how markets work"]],
  ["Which markets interest you most?", ["Forex", "Gold and commodities", "Indices", "Stocks", "I'm not sure yet"]],
  ["Have you traded with real money before?", ["Never", "A little, on a demo", "Yes, and I lost money", "Yes, and I'm still going"]],
  ["What gets in your way most?", ["I don't know where to start", "I can't read charts", "I keep breaking my own rules", "I don't have much time"]],
  ["How do you learn best?", ["Reading at my own pace", "Short lessons with quizzes", "Worked examples", "Watching, then doing"]],
  ["How would you describe your risk tolerance?", ["Cautious", "Balanced", "Comfortable with swings", "I don't know yet"]],
  ["What would make the next six months a success?", ["Understanding the basics properly", "Building a repeatable routine", "Passing an evaluation", "Losing less than I do now"]],
  ["How did you hear about Ten Talents?", ["A friend", "Telegram", "Social media", "Search", "Somewhere else"]],
];

const TOUR: [keyof typeof I, string, string][] = [
  ["seed", "Ten Talents Academy", "Four tracks, built in order: money first, then markets, then risk, then building something of your own. Worked through, not skimmed."],
  ["stack", "Four tracks, in order", "Money Foundations first. Each track builds on the one before it, so nothing arrives before you're ready for it."],
  ["book", "Lessons that stay with you", "Short reads with worked examples and a takeaways box at the end of every lesson. Learn on the train, not at a desk."],
  ["check", "Quizzes that teach", "Every answer comes with an explanation of why it's right. Pass at 70%. Retake as often as you like."],
  ["cap", "Earn your certificates", "Finish a track and take away a certificate in your name."],
  ["chart", "See your progress", "Your place is saved. Pick up where you stopped, and watch the tracks fill in."],
  ["sim", "A simulator is coming", "Practise on a simulated account with no real money at stake. Not in this version — we're building the teaching first."],
  ["shield", "One thing before you start", "This is education, not advice. Nothing here tells you what to buy or sell, and nobody here manages money for you."],
];

const FOOT = (
  <div className="footnote">
    Ten Talents is an education and community business. Nothing here is financial advice, an investment
    recommendation, or an inducement to trade. Investing puts your capital at risk; never risk money you
    cannot afford to lose. For advice about your own circumstances, consult a financial adviser authorised
    by the Financial Conduct Authority.
  </div>
);

/* ---- types ---- */
type Content = { tracks: TrackMeta[]; glossary: [string, string][] };
type Ent = { member: boolean; signals: boolean; grace: boolean; status: string; signalsStatus: string; cancelAtPeriodEnd: boolean; currentPeriodEnd: string | null };
type UserState = {
  email: string; emailVerified: boolean; name: string; stage: string;
  answers: Record<string, number>; done: Record<string, 1>; scores: Record<string, number>;
  certs: { trackId: string; issuedAt: string }[]; ent: Ent; signalsEnabled: boolean;
};
type View =
  | { kind: "tabs" } | { kind: "track"; t: string }
  | { kind: "lesson"; t: string; l: string }
  | { kind: "quiz"; t: string; quizId: string };

async function api(path: string, body?: unknown, method?: string) {
  const res = await fetch(path, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Something went wrong."), { status: res.status, code: data.error });
  return data;
}

export default function AcademyApp({ content, state }: { content: Content; state: UserState | null }) {
  const [S, setS] = useState<UserState | null>(state);
  const [screen, setScreen] = useState<"gate" | "auth" | "onboard" | "tour" | "app">(
    state ? (state.stage === "onboard" ? "onboard" : state.stage === "tour" ? "tour" : "app") : "gate"
  );
  const [authMode, setAuthMode] = useState<"signup" | "signin" | "forgot" | "reset">("signup");
  const [consent, setConsent] = useState(false);
  const [qIdx, setQIdx] = useState(() => state ? Object.keys(state.answers).length % 10 : 0);
  const [tourIdx, setTourIdx] = useState(0);
  const [tab, setTab] = useState("home");
  const [view, setView] = useState<View>({ kind: "tabs" });
  const [paywall, setPaywall] = useState(false);
  const [gq, setGq] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("reset")) { setResetToken(p.get("reset")); setAuthMode("reset"); setScreen("auth"); }
    if (p.get("verified") === "1") setFlash("Email confirmed — welcome aboard.");
    if (p.get("checkout") === "success") { setFlash("Payment received. Your access updates the moment Stripe confirms it — refresh in a few seconds if needed."); }
    if (p.get("checkout") === "cancelled") setFlash("Checkout cancelled — nothing was charged.");
    if (p.size) window.history.replaceState({}, "", "/");
  }, []);

  const reload = useCallback(() => { window.location.href = "/"; }, []);

  /* ---------- derived (mirrors prototype logic) ---------- */
  const tracks = content.tracks;
  const allLessons = useMemo(() => tracks.flatMap(t => t.modules.flatMap(m => m.lessons.map(l => ({ t, m, l })))), [tracks]);
  const totalLessons = allLessons.length;
  const doneCount = S ? Object.keys(S.done).length : 0;
  const member = !!S?.ent.member;

  const modulePassed = (quizId: string | null) => !quizId || (S?.scores[quizId] ?? 0) >= 70;
  const moduleLocked = (t: TrackMeta, idx: number) => {
    if (idx === 0) return false;
    const prev = t.modules[idx - 1];
    return prev.quizId ? !modulePassed(prev.quizId) : false;
  };
  const lessonLocked = (l: { isFreePreview: boolean }) => (l.isFreePreview ? false : !member);
  const trackProgress = (t: TrackMeta) => {
    const all = t.modules.reduce((a, m) => a + m.lessons.length, 0);
    const got = t.modules.reduce((a, m) => a + m.lessons.filter(l => S?.done[l.id]).length, 0);
    return { got, all, pct: all ? Math.round((got / all) * 100) : 0 };
  };
  const nextUp = () => allLessons.find(({ l }) => !S?.done[l.id]) ?? null;

  /* ================= screens ================= */

  if (screen === "gate") return <Gate consent={consent} setConsent={setConsent} onContinue={() => setScreen("auth")} />;

  if (screen === "auth" || !S) {
    return <Auth mode={authMode} setMode={setAuthMode} consent={consent} resetToken={resetToken}
      flash={flash} onDone={reload} />;
  }

  if (screen === "onboard") {
    const [q, opts] = QUESTIONS[qIdx];
    return (
      <div className="shell">
        <Topbar back={qIdx > 0 ? () => setQIdx(qIdx - 1) : undefined} counter={`${qIdx + 1}/10`} rail={((qIdx + 1) / 10) * 100} />
        <div className="view"><div className="pad">
          <h1>{q}</h1><div style={{ height: 22 }} />
          {opts.map((o, n) => (
            <button key={n} className="choice" aria-pressed={S.answers[qIdx] === n} onClick={async () => {
              const answers = { ...S.answers, [qIdx]: n };
              setS({ ...S, answers });
              if (qIdx < QUESTIONS.length - 1) { setQIdx(qIdx + 1); api("/api/state", { answers }).catch(() => {}); }
              else { api("/api/state", { answers, stage: "tour" }).catch(() => {}); setScreen("tour"); }
            }}>{o}</button>
          ))}
        </div></div>
      </div>
    );
  }

  if (screen === "tour") {
    const [icon, title, body] = TOUR[tourIdx];
    const last = tourIdx === TOUR.length - 1;
    const begin = () => { api("/api/state", { stage: "app" }).catch(() => {}); setScreen("app"); };
    return (
      <div className="shell">
        <Topbar counter={`${tourIdx + 1}/${TOUR.length}`} />
        <div className="view" style={{ display: "flex", flexDirection: "column" }}>
          <div className="tour">
            <div className="badge">{I[icon]}</div>
            <h1>{title}</h1>
            <p className="sub" style={{ marginTop: 14 }}>{body}</p>
            <div className="dots">{TOUR.map((_, n) => <i key={n} className={n === tourIdx ? "on" : ""} />)}</div>
          </div>
          <div style={{ padding: "0 20px 22px" }}>
            <div className="row">
              <button className="btn ghost" disabled={tourIdx === 0} onClick={() => setTourIdx(tourIdx - 1)}>Back</button>
              <button className="btn" onClick={() => (last ? begin() : setTourIdx(tourIdx + 1))}>{last ? "Begin learning" : "Next"}</button>
            </div>
            <button className="btn ghost" style={{ marginTop: 10, border: 0, color: "var(--muted)" }} onClick={begin}>Skip</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- the app (five tabs) ---------- */

  if (view.kind === "track") {
    const t = tracks.find(x => x.id === view.t)!;
    return (
      <div className="shell">
        <Topbar back={() => { setView({ kind: "tabs" }); setTab("academy"); }} />
        <div className="view">
          <div className="pad"><h1>{t.name}</h1><p className="sub" style={{ marginTop: 8 }}>{t.blurb}</p></div>
          {t.modules.map((m, mi) => {
            const locked = moduleLocked(t, mi);
            return (
              <div key={m.id}>
                <div className="sechead"><h2>{m.name}</h2>{locked ? <span>pass the last quiz first</span> : null}</div>
                {m.lessons.map(l => {
                  const done = !!S.done[l.id];
                  const pay = lessonLocked(l);
                  const ready = l.minutes > 0;
                  return (
                    <button key={l.id} className="lesson-row" style={locked ? { opacity: .45 } : undefined}
                      aria-disabled={locked} onClick={() => {
                        if (locked) return;
                        if (pay) return setPaywall(true);
                        setView({ kind: "lesson", t: t.id, l: l.id });
                      }}>
                      <span className={`tick ${done ? "on" : ""}`}>{done ? I.check : null}</span>
                      <span style={{ flex: 1 }}><b>{l.title}</b><span>{ready ? `${l.minutes} min read` : "Content coming soon"}</span></span>
                      {l.isFreePreview && !member ? <span className="pill">Free</span> : (pay ? <span className="lockicon">{I.lock}</span> : null)}
                    </button>
                  );
                })}
                {m.quizId ? (() => {
                  const sc = S.scores[m.quizId!];
                  return (
                    <button className="lesson-row" style={locked ? { opacity: .45 } : undefined} aria-disabled={locked}
                      onClick={() => { if (locked) return; if (!member) return setPaywall(true); setView({ kind: "quiz", t: t.id, quizId: m.quizId! }); }}>
                      <span className={`tick ${(sc ?? 0) >= 70 ? "on" : ""}`}>{(sc ?? 0) >= 70 ? I.check : null}</span>
                      <span style={{ flex: 1 }}><b>Module quiz</b><span>{sc != null ? `Best score ${sc}%` : `${m.quizCount} questions · pass at 70%`}</span></span>
                      {!member ? <span className="lockicon">{I.lock}</span> : null}
                    </button>
                  );
                })() : null}
              </div>
            );
          })}
        </div>
        {paywall && <Paywall S={S} onClose={() => setPaywall(false)} />}
      </div>
    );
  }

  if (view.kind === "lesson") {
    return <Lesson key={view.l} S={S} tracks={tracks} tId={view.t} lId={view.l}
      onBack={() => setView({ kind: "track", t: view.t })}
      onDone={(lid) => { setS({ ...S, done: { ...S.done, [lid]: 1 } }); setView({ kind: "track", t: view.t }); }} />;
  }

  if (view.kind === "quiz") {
    return <Quiz key={view.quizId} quizId={view.quizId}
      onExit={() => setView({ kind: "track", t: view.t })}
      onScored={(quizId, pct) => setS({ ...S, scores: { ...S.scores, [quizId]: Math.max(S.scores[quizId] ?? 0, pct) } })} />;
  }

  /* tabs */
  const tabs: [string, string, React.ReactNode][] = [
    ["home", "Home", I.home], ["academy", "Academy", I.stack], ["glossary", "Glossary", I.az],
    ["sim", "Simulator", I.sim], ["profile", "Profile", I.user],
  ];

  let body: React.ReactNode;
  if (tab === "home") {
    const pct = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0;
    const n = nextUp();
    const rec = tracks[0];
    body = (<>
      <div className="hero">
        <div className="eyebrow">{member ? "Member" : "Free preview"}</div>
        <h1>{doneCount ? "Pick up where you stopped" : "Start with money, not markets"}</h1>
        <div className="ring"><Ring pct={pct} /><div><b>{doneCount} of {totalLessons}</b><span>lessons complete</span></div></div>
      </div>
      {n ? (
        <button className="card press" onClick={() => {
          if (lessonLocked(n.l)) return setPaywall(true);
          setView({ kind: "lesson", t: n.t.id, l: n.l.id });
        }}>
          <h3>{n.l.title}</h3><p>{n.t.name} · {n.m.name}</p>
        </button>
      ) : (
        <div className="card"><h3>Every lesson done</h3><p>Your certificates are on the profile tab.</p></div>
      )}
      <div className="sechead"><h2>Recommended for you</h2><span>from your answers</span></div>
      <button className="card press" style={{ marginTop: 14 }} onClick={() => setTab("academy")}>
        <h3>{rec.name}</h3><p>{rec.blurb}</p>
      </button>
      {!member && (
        <div className="card" style={{ borderColor: "var(--gold-dim)" }}>
          <h3>Unlock the full Academy</h3>
          <p>All four tracks, every quiz and your certificates. £15.99 a month.</p>
          <button className="btn" style={{ marginTop: 14 }} onClick={() => setPaywall(true)}>See membership</button>
        </div>
      )}
    </>);
  } else if (tab === "academy") {
    body = (<>
      <div className="sechead"><h2>Four tracks</h2><span>in order</span></div>
      {tracks.map((t, i) => {
        const p = trackProgress(t);
        const cls = p.pct === 100 ? "done" : (p.got > 0 ? "active" : "");
        return (
          <button key={t.id} className={`track ${cls}`} onClick={() => setView({ kind: "track", t: t.id })}>
            <span className="step">{p.pct === 100 ? I.check : i + 1}</span>
            <span style={{ flex: 1 }}><b>{t.name}</b><p>{t.blurb}</p>
              <span className="meta">{p.got} of {p.all} lessons</span></span>
            {!member && i !== 1 ? <span className="lockicon">{I.lock}</span> : null}
          </button>
        );
      })}
    </>);
  } else if (tab === "glossary") {
    const q = gq.toLowerCase();
    const list = content.glossary.filter(([t, d]) => !q || t.toLowerCase().includes(q) || d.toLowerCase().includes(q));
    body = (<>
      <div className="sechead"><h2>Glossary</h2><span>{list.length} terms</span></div>
      <div style={{ padding: "14px 20px" }}>
        <input className="search" placeholder="Search terms" value={gq} onChange={e => setGq(e.target.value)} aria-label="Search terms" />
      </div>
      <div>{list.length ? list.map(([t, d]) => <div className="term" key={t}><b>{t}</b><p>{d}</p></div>)
        : <div className="term"><p>No term matches that. Try a shorter word.</p></div>}</div>
    </>);
  } else if (tab === "profile") {
    body = <Profile S={S} setS={setS} tracks={tracks} trackProgress={trackProgress} doneCount={doneCount} totalLessons={totalLessons} openPaywall={() => setPaywall(true)} />;
  } else {
    body = (
      <div className="soon"><div className="badge">{I.sim}</div><h2>Simulator coming soon</h2>
        <p className="sub" style={{ marginTop: 12 }}>A simulated account with no real money at stake, so you can practise what the Academy teaches. We are building the teaching first.</p></div>
    );
  }

  return (
    <div className="shell">
      <Topbar />
      {S.ent.grace && (
        <div className="grace" role="status">Your last payment didn&rsquo;t go through. Update your card on the profile tab to keep your access — nothing you&rsquo;ve done is lost.</div>
      )}
      {flash && <div className="grace" style={{ background: "rgba(95,185,143,.12)", borderColor: "rgba(95,185,143,.4)", color: "#9fd8bc" }} role="status">{flash}</div>}
      <div className="view">{body}{FOOT}</div>
      <nav className="tabs">{tabs.map(([k, label, ic]) => (
        <button key={k} className={`tab ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); setView({ kind: "tabs" }); }}>{ic}<span>{label}</span></button>
      ))}</nav>
      {paywall && <Paywall S={S} onClose={() => setPaywall(false)} />}
    </div>
  );
}

/* ================= pieces ================= */

function Topbar({ back, counter, rail, close }: { back?: () => void; counter?: string; rail?: number; close?: () => void }) {
  return (<>
    <div className="topbar">
      {back ? <button className="iconbtn" onClick={back} aria-label="Back">{I.back}</button> : <span style={{ width: 34 }} />}
      <div className="mark">{LOGO}<span className="wordmark">Ten Talents</span></div>
      {counter ? <span className="counter">{counter}</span> :
        close ? <button className="iconbtn" onClick={close} aria-label="Close">{I.close}</button> : <span style={{ width: 34 }} />}
    </div>
    {rail != null && <div className="rail"><i style={{ width: `${rail}%` }} /></div>}
  </>);
}

function Ring({ pct }: { pct: number }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#2E2E3A" strokeWidth="5" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="#EDB671" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 32 32)" />
    </svg>
  );
}

/* ---------- legal gate (wording verbatim) ---------- */
function Gate({ consent, setConsent, onContinue }: { consent: boolean; setConsent: (b: boolean) => void; onContinue: () => void }) {
  return (
    <div className="gate"><div className="gate-inner">
      <div className="gate-head">
        {LOGO}
        <span className="wordmark">Ten Talents</span>
        <div className="sub">Academy</div>
      </div>
      <div className="verse"><div className="dots3">•••</div>
        <p>He who had received the <b>five</b> talents went at once and traded with them, and he made <b>five talents <i>more</i></b>.</p>
        <small>Matthew 25:16</small></div>
      <div className="warn"><h3>Risk warning</h3><p>Trading leveraged products carries a high risk of losing money rapidly. Most retail accounts lose money. You could lose your entire stake.</p></div>
      <div className="blocks">
        <div className="block"><span style={{ color: "var(--gold)" }}>{I.book}</span><div><h3>Education only</h3><p>Ten Talents teaches how markets work. Nothing here is financial advice, a recommendation, or an invitation to trade.</p></div></div>
        <div className="block"><span style={{ color: "var(--gold)" }}>{I.scale}</span><div><h3>Not regulated</h3><p>Ten Talents is not a bank and is not authorised or regulated by the Financial Conduct Authority. Speak to a licensed adviser before risking real money.</p></div></div>
        <div className="block"><span style={{ color: "var(--risk)" }}>{I.alert}</span><div><h3>Real trading risks</h3><p>If you trade with real money elsewhere you can lose all of it. Nothing you learn here changes that.</p></div></div>
        <div className="block"><span style={{ color: "var(--gain)" }}>{I.shield}</span><div><h3>Over 18 only</h3><p>This app is for people aged 18 or over.</p></div></div>
      </div>
      <div className="links"><a href="../legal.html#privacy">Privacy</a>|<a href="../legal.html#terms">Terms</a>|<a href="../legal.html#disclaimer">Disclaimer</a></div>
      <label className="consent">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
        <span className="box">{I.check}</span>
        <span>I am 18 or over, I understand this is educational content only and not financial advice, and I accept the risks of trading.</span>
      </label>
      <div className="gate-cta"><button className="btn" disabled={!consent} onClick={onContinue}>Continue</button></div>
    </div></div>
  );
}

/* ---------- auth ---------- */
function Auth({ mode, setMode, consent, resetToken, flash, onDone }: {
  mode: "signup" | "signin" | "forgot" | "reset";
  setMode: (m: "signup" | "signin" | "forgot" | "reset") => void;
  consent: boolean; resetToken: string | null; flash: string | null; onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(flash);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr(null); setBusy(true);
    try {
      if (mode === "signup") { await api("/api/auth/signup", { email, password: pw, consent }); onDone(); }
      else if (mode === "signin") { await api("/api/auth/signin", { email, password: pw }); onDone(); }
      else if (mode === "forgot") { await api("/api/auth/forgot", { email }); setOk("If that address has an account, a reset link is on its way."); }
      else { await api("/api/auth/reset", { token: resetToken, password: pw }); onDone(); }
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };

  const titles = {
    signup: ["Create your account", "Your progress, scores and certificates live here."],
    signin: ["Welcome back", "Sign in to pick up where you stopped."],
    forgot: ["Reset your password", "We'll email you a one-time link."],
    reset: ["Choose a new password", "At least 8 characters."],
  } as const;
  const [title, sub] = titles[mode];

  return (
    <div className="shell">
      <Topbar />
      <div className="view" style={{ display: "flex", flexDirection: "column" }}>
        <form className="authwrap" onSubmit={e => { e.preventDefault(); submit(); }}>
          <h1>{title}</h1>
          <p className="sub">{sub}</p>
          {mode !== "reset" && (<>
            <label className="flabel" htmlFor="em">Email</label>
            <input id="em" className="field" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </>)}
          {mode !== "forgot" && (<>
            <label className="flabel" htmlFor="pw">Password</label>
            <input id="pw" className="field" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={8} value={pw} onChange={e => setPw(e.target.value)} />
          </>)}
          {err && <div className="err" role="alert">{err}</div>}
          {ok && <div className="ok" role="status">{ok}</div>}
          <div style={{ height: 20 }} />
          <button className="btn" type="submit" aria-busy={busy}>
            {mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : mode === "forgot" ? "Send reset link" : "Set new password"}
          </button>
          <div className="authlinks">
            {mode === "signup" && <>Already learning with us? <button type="button" onClick={() => setMode("signin")}>Sign in</button></>}
            {mode === "signin" && <><button type="button" onClick={() => setMode("signup")}>Create an account</button> · <button type="button" onClick={() => setMode("forgot")}>Forgot password?</button></>}
            {(mode === "forgot" || mode === "reset") && <button type="button" onClick={() => setMode("signin")}>Back to sign in</button>}
          </div>
        </form>
        {FOOT}
      </div>
    </div>
  );
}

/* ---------- lesson ---------- */
function Lesson({ S, tracks, tId, lId, onBack, onDone }: {
  S: UserState; tracks: TrackMeta[]; tId: string; lId: string;
  onBack: () => void; onDone: (lid: string) => void;
}) {
  const t = tracks.find(x => x.id === tId)!;
  const m = t.modules.find(mm => mm.lessons.some(l => l.id === lId))!;
  const l = m.lessons.find(x => x.id === lId)!;
  const done = !!S.done[lId];
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fetched = useRef(false);
  useEffect(() => {
    if (fetched.current) return; fetched.current = true;
    api(`/api/lessons/${lId}`).then(d => setHtml(d.bodyHtml)).catch(e => setErr((e as Error).message));
  }, [lId]);

  return (
    <div className="shell">
      <Topbar back={onBack} />
      <div className="view">
        <div className="pad"><div className="eyebrow">{t.name} · {m.name}</div><h1>{l.title}</h1></div>
        <div className="reader">
          {err ? <p className="sub">{err === "membership_required" ? "This lesson is for members." : err}</p> :
            html === null ? <p className="sub">Loading…</p> :
            html ? <div dangerouslySetInnerHTML={{ __html: html }} /> :
            <p className="sub">This lesson is not written yet. Content is added through the admin area — see the note below the app.</p>}
        </div>
        {html ? (
          <div style={{ padding: "0 20px 24px" }}>
            <button className="btn" onClick={async () => {
              try { await api(`/api/lessons/${lId}/complete`, {}); onDone(lId); } catch { /* keep reading */ }
            }}>{done ? "Completed" : "Mark complete"}</button>
          </div>
        ) : null}
        {FOOT}
      </div>
    </div>
  );
}

/* ---------- quiz (server-authoritative) ---------- */
function Quiz({ quizId, onExit, onScored }: { quizId: string; onExit: () => void; onScored: (quizId: string, pct: number) => void }) {
  const [data, setData] = useState<{ passPct: number; questions: { q: string; options: string[] }[] } | null>(null);
  const [i, setI] = useState(0);
  const [choices, setChoices] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<{ n: number; correct: boolean; correctIndex: number; why: string } | null>(null);
  const [result, setResult] = useState<{ scorePct: number; pass: boolean } | null>(null);
  const fetched = useRef(false);
  useEffect(() => {
    if (fetched.current) return; fetched.current = true;
    api(`/api/quizzes/${quizId}`).then(setData).catch(() => onExit());
  }, [quizId, onExit]);

  if (!data) return <div className="shell"><Topbar close={onExit} /><div className="view"><div className="q"><p className="sub">Loading…</p></div></div></div>;

  if (result) {
    const pass = result.pass;
    return (
      <div className="shell">
        <Topbar close={onExit} />
        <div className="view">
          <div className="score"><div className={`big ${pass ? "pass" : "fail"}`}>{result.scorePct}%</div>
            <h2>{pass ? "Module passed" : "Not passed yet"}</h2>
            <p className="sub" style={{ marginTop: 10 }}>{pass ? "The next module is now open. Your best score is kept." : "You need 70% to move on. Retake it as often as you like — the explanations are the lesson."}</p></div>
          <div style={{ padding: "26px 20px 0" }}>
            <button className="btn" onClick={() => { setI(0); setChoices([]); setVerdict(null); setResult(null); }}>Retake quiz</button>
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={onExit}>Back to track</button>
          </div>
          {FOOT}
        </div>
      </div>
    );
  }

  const q = data.questions[i];
  const last = i === data.questions.length - 1;
  return (
    <div className="shell">
      <Topbar close={onExit} counter={`${i + 1}/${data.questions.length}`} rail={((verdict ? i + 1 : i) / data.questions.length) * 100} />
      <div className="view"><div className="q">
        <div className="num">Question {i + 1}</div><h2>{q.q}</h2><div style={{ height: 18 }} />
        {q.options.map((o, n) => (
          <button key={n} disabled={!!verdict}
            className={`opt ${verdict && n === verdict.correctIndex ? "right" : ""} ${verdict && n === verdict.n && !verdict.correct ? "wrong" : ""}`}
            onClick={async () => {
              if (verdict) return;
              const v = await api(`/api/quizzes/${quizId}`, { i, n });
              setVerdict({ n, ...v });
              setChoices(cs => { const c = [...cs]; c[i] = n; return c; });
            }}>{o}</button>
        ))}
        {verdict && (<>
          <div className="why"><b>{verdict.correct ? "Correct." : "Not quite."}</b> {verdict.why}</div>
          <button className="btn" onClick={async () => {
            if (last) {
              const r = await api(`/api/quizzes/${quizId}`, { finish: choices });
              onScored(quizId, r.scorePct);
              setResult(r);
            } else { setI(i + 1); setVerdict(null); }
          }}>{last ? "See your score" : "Next question"}</button>
        </>)}
      </div>{FOOT}</div>
    </div>
  );
}

/* ---------- paywall (copy verbatim; Stripe checkout behind it) ---------- */
function Paywall({ S, onClose }: { S: UserState; onClose: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const buy = async (addon: boolean) => {
    setBusy(addon ? "both" : "one"); setErr(null);
    try {
      const { url } = await api("/api/stripe/checkout", { addon });
      window.location.href = url;
    } catch (e) { setErr((e as Error).message); setBusy(null); }
  };
  return (
    <div className="sheet" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet-inner">
        <h2>Ten Talents Academy</h2>
        <p className="sub" style={{ marginTop: 8 }}>The first lesson is free. Membership opens the rest.</p>
        <div className="plan"><div><b>Membership</b><p>All four tracks, every quiz, your certificates.</p></div><span className="price">£15.99<small style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: 12 }}>/mo</small></span></div>
        {S.signalsEnabled && (
          <div className="plan"><div><b>Signals access</b><p>Members only. Educational commentary, not advice.</p></div><span className="price">£4.99<small style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: 12 }}>/mo</small></span></div>
        )}
        <div style={{ height: 18 }} />
        {err && <div className="err" role="alert" style={{ marginBottom: 12 }}>{err}</div>}
        <button className="btn" aria-busy={busy === "one"} onClick={() => buy(false)}>Start membership</button>
        {S.signalsEnabled && (
          <button className="btn ghost" style={{ marginTop: 10 }} aria-busy={busy === "both"} onClick={() => buy(true)}>Membership and signals</button>
        )}
        <button className="btn ghost" style={{ marginTop: 10, border: 0, color: "var(--muted)" }} onClick={onClose}>Not now</button>
        <p className="demo-note">Secure payment by Stripe. Cancel any time from your profile — access runs to the end of the period you&rsquo;ve paid for.</p>
      </div>
    </div>
  );
}

/* ---------- profile / account ---------- */
function Profile({ S, setS, tracks, trackProgress, doneCount, totalLessons, openPaywall }: {
  S: UserState; setS: (s: UserState) => void; tracks: TrackMeta[];
  trackProgress: (t: TrackMeta) => { got: number; all: number; pct: number };
  doneCount: number; totalLessons: number; openPaywall: () => void;
}) {
  const certs = tracks.filter(t => trackProgress(t).pct === 100);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ent = S.ent;
  const periodEnd = ent.currentPeriodEnd ? new Date(ent.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

  const act = async (path: string, body: unknown, key: string) => {
    setBusy(key); setErr(null);
    try {
      const d = await api(path, body);
      if (d.url) { window.location.href = d.url; return; }
      window.location.href = "/";
    } catch (e) { setErr((e as Error).message); setBusy(null); }
  };

  return (<>
    <div className="sechead"><h2>Your account</h2></div>
    <div className="kv"><span>Signed in as</span><b className="dim">{S.email}{S.emailVerified ? "" : " · unverified"}</b></div>
    <div className="kv"><span>Membership</span><b>{ent.member ? `Active · £15.99/mo${ent.grace ? " · payment issue" : ""}${ent.cancelAtPeriodEnd && periodEnd ? ` · ends ${periodEnd}` : ""}` : "Free preview"}</b></div>
    <div className="kv"><span>Signals access</span><b>{ent.signals ? "Active · £4.99/mo" : "Not added"}</b></div>
    <div className="kv"><span>Lessons complete</span><b>{doneCount} of {totalLessons}</b></div>
    <div className="kv"><span>Quizzes passed</span><b>{Object.values(S.scores).filter(s => s >= 70).length}</b></div>
    <div style={{ padding: "18px 20px 0" }}>
      <label className="sub" htmlFor="nm">Name on your certificates</label>
      <input className="field" id="nm" value={S.name} placeholder="Your full name" onChange={e => {
        const name = e.target.value;
        setS({ ...S, name });
        if (nameTimer.current) clearTimeout(nameTimer.current);
        nameTimer.current = setTimeout(() => api("/api/state", { name }).catch(() => {}), 600);
      }} />
    </div>
    {err && <div className="err" role="alert" style={{ margin: "14px 20px 0" }}>{err}</div>}
    <div style={{ padding: "18px 20px 0" }}>
      {ent.member ? (<>
        <button className="btn ghost" aria-busy={busy === "portal"} onClick={() => act("/api/stripe/portal", {}, "portal")}>Update card · manage billing</button>
        {S.signalsEnabled && !ent.signals && (
          <button className="btn" style={{ marginTop: 10 }} aria-busy={busy === "addon"} onClick={() => act("/api/stripe/addon", { action: "add" }, "addon")}>Add signals access · £4.99/mo</button>
        )}
        {ent.signals && (
          <button className="btn ghost" style={{ marginTop: 10 }} aria-busy={busy === "addon"} onClick={() => act("/api/stripe/addon", { action: "remove" }, "addon")}>Remove signals access</button>
        )}
        {!ent.cancelAtPeriodEnd && (
          <button className="btn ghost" style={{ marginTop: 10 }} aria-busy={busy === "cancel"} onClick={() => {
            if (window.confirm("Cancel your membership? You keep access until the end of the period you've paid for, and everything you've done is saved.")) {
              act("/api/stripe/cancel", {}, "cancel");
            }
          }}>Cancel membership</button>
        )}
      </>) : (
        <button className="btn" onClick={openPaywall}>See membership</button>
      )}
    </div>
    {ent.signals && (
      <div className="card" style={{ borderColor: "var(--gold-dim)" }}><h3>Signals channel</h3>
        <p>Your invite link lives here. Educational commentary only, not advice. Past performance does not indicate future results.</p>
        <a className="btn" style={{ marginTop: 14, textDecoration: "none" }} href="/signals">Open your access page</a></div>
    )}
    <div className="sechead"><h2>Certificates</h2><span>{certs.length}</span></div>
    {certs.length ? certs.map(t => (
      <div key={t.id}>
        <div className="cert">{LOGO}
          <div className="sub">Certificate of completion</div>
          <div className="name">{S.name || "Your name"}</div>
          <div className="track-name">{t.name}</div><div className="line"></div>
          <small>Ten Talents Academy · educational programme · not a regulated qualification</small></div>
        <div style={{ padding: "0 20px 8px" }}>
          <a className="btn ghost" style={{ textDecoration: "none" }} href={`/api/certificates/${t.id}/pdf`}>Download PDF</a>
        </div>
      </div>
    )) : <div className="card"><h3>Nothing yet</h3><p>Finish every lesson in a track and its certificate appears here.</p></div>}
    <div style={{ padding: "8px 20px 0" }}>
      <button className="btn ghost" onClick={async () => { await api("/api/auth/signout", {}); window.location.href = "/"; }}>Sign out</button>
      <a className="btn ghost" style={{ marginTop: 10, border: 0, color: "var(--muted)", textDecoration: "none" }} href="../index.html">Back to tentalents site</a>
    </div>
  </>);
}

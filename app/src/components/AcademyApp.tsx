"use client";

/* ============================================================
   Ten Talents — the app. One product: this and the vision prototype
   share a design contract. Learn · Trade · Steward · Profile on a
   phone-first shell; auth, content, billing and progress are server-
   authoritative; learning XP is awarded only by the server.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { I, type IconName } from "./icons";
import type { TrackMeta, GoalRow, JournalRow } from "@/lib/app-data";
import { api, money, Ring, XpCard, TrackHero, Sheet, Toasts, useToasts, setTheme, getTheme, Disc, type Stats, type ToastFn } from "./ui";
import { levelOf, levelTitle, BADGES } from "@/lib/levels";
import { StewardTab, gpct } from "./screens/Steward";
import { readiness } from "@/lib/readiness";
import { TradeTab } from "./screens/Trade";
import { WisdomList, WisdomStudy } from "./screens/Wisdom";

const LOGO = <img className="logo" src="/logo-hand-gold.png" alt="" style={{ height: 28, width: "auto" }} />;

/* ---- copy (assessment + tour) ---- */
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

const TOUR: [IconName, string, string][] = [
  ["seed", "Ten Talents Academy", "Learn → Understand → Simulate → then decide. Four tracks, a simulator, a journal, a wisdom library and your own goals — one Academy."],
  ["learn", "Four tracks, in order", "Money Foundations first. Each track builds on the one before it, so nothing arrives before you're ready for it."],
  ["star", "Learning is gamified", "XP, levels, streaks and badges — for lessons, quizzes and saving discipline. Never for trading. Trading is not a game."],
  ["trade", "Practise before it costs you", "A demo simulator that shows money-at-risk before upside, scenario drills that practise judgement, and a journal that shows you your own behaviour."],
  ["target", "Steward what you've been given", "Set goals — a house deposit, a reserve, a trip. Your numbers, your account. Ten Talents holds no money and gives no advice."],
  ["wisdom", "The deeper things", "Biblical Mysteries and Biblical Wealth — the economics of scripture, studied as interpretation, never as prediction."],
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
export type UserState = {
  email: string; emailVerified: boolean; name: string; stage: string;
  answers: Record<string, number>; done: Record<string, 1>; scores: Record<string, number>;
  certs: { trackId: string; issuedAt: string }[]; ent: Ent; signalsEnabled: boolean;
  stats: Stats; goals: GoalRow[]; journal: JournalRow[];
};
type Tab = "home" | "learn" | "trade" | "steward" | "profile";
type View =
  | { kind: "tabs" } | { kind: "track"; t: string }
  | { kind: "lesson"; t: string; l: string }
  | { kind: "quiz"; t: string; quizId: string }
  | { kind: "study"; n: string };

export default function AcademyApp({ content, state }: { content: Content; state: UserState | null }) {
  const [S, setS] = useState<UserState | null>(state);
  const [screen, setScreen] = useState<"gate" | "auth" | "onboard" | "results" | "tour" | "app">(
    state ? (state.stage === "onboard" ? "onboard" : state.stage === "tour" ? "tour" : "app") : "gate"
  );
  const [authMode, setAuthMode] = useState<"signup" | "signin" | "forgot" | "reset">("signup");
  const [consent, setConsent] = useState(false);
  const [qIdx, setQIdx] = useState(() => state ? Object.keys(state.answers).length % 10 : 0);
  const [tourIdx, setTourIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("home");
  const [learnSeg, setLearnSeg] = useState<"courses" | "wisdom" | "glossary">("courses");
  const [wisdomSeg, setWisdomSeg] = useState<"myst" | "wealth">("myst");
  const [view, setView] = useState<View>({ kind: "tabs" });
  const [paywall, setPaywall] = useState(false);
  const [gq, setGq] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [toasts, toast] = useToasts();
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("reset")) { setResetToken(p.get("reset")); setAuthMode("reset"); setScreen("auth"); }
    if (p.get("verified") === "1") setFlash("Email confirmed — welcome aboard.");
    if (p.get("checkout") === "success") { setFlash("Payment received. Your access updates the moment Stripe confirms it — refresh in a few seconds if needed."); }
    if (p.get("checkout") === "cancelled") setFlash("Checkout cancelled — nothing was charged.");
    if (p.size) window.history.replaceState({}, "", "/");
  }, []);
  useEffect(() => { viewRef.current?.scrollTo({ top: 0 }); }, [tab, view]);

  const reload = useCallback(() => { window.location.href = "/"; }, []);
  const refreshStats = useCallback(async () => {
    try { const st = await api("/api/stats"); setS((s) => (s ? { ...s, stats: st } : s)); } catch { /* keep local */ }
  }, []);

  /* ---------- derived ---------- */
  const tracks = content.tracks;
  const allLessons = useMemo(() => tracks.flatMap(t => t.modules.flatMap(m => m.lessons.map(l => ({ t, m, l })))), [tracks]);
  const readyLessons = useMemo(() => allLessons.filter(({ l }) => l.minutes > 0), [allLessons]);
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
  // next lesson that is written and not yet done — the home card never points at "coming soon"
  const nextUp = () => readyLessons.find(({ l }) => !S?.done[l.id]) ?? allLessons.find(({ l }) => !S?.done[l.id]) ?? null;
  const openLesson = (t: string, l: { id: string; isFreePreview: boolean; minutes: number }) => {
    if (l.minutes === 0) return;
    if (lessonLocked(l)) return setPaywall(true);
    setView({ kind: "lesson", t, l: l.id });
  };

  /* ================= pre-app screens ================= */

  if (screen === "gate") return <Gate consent={consent} setConsent={setConsent} onContinue={() => setScreen("auth")} />;

  if (screen === "auth" || !S) {
    return <Auth mode={authMode} setMode={setAuthMode} consent={consent} resetToken={resetToken} flash={flash} onDone={reload} />;
  }

  if (screen === "onboard") {
    const [q, opts] = QUESTIONS[qIdx];
    return (
      <div className="shell"><div className="splash">
        <div className="pad" style={{ paddingTop: "calc(20px + env(safe-area-inset-top,0px))" }}>
          <div className="between" style={{ marginBottom: 18 }}>
            {qIdx > 0 ? <button className="iconbtn" onClick={() => setQIdx(qIdx - 1)} aria-label="Back" style={{ background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.15)", color: "#fff" }}>{I.back}</button> : <span style={{ width: 38 }} />}
            <div className="qprog" style={{ margin: "0 14px", background: "rgba(255,255,255,.14)" }}><i style={{ width: `${(qIdx / QUESTIONS.length) * 100}%` }} /></div>
            <span className="mono" style={{ color: "#c3cbd6", fontSize: 13 }}>{qIdx + 1}/{QUESTIONS.length}</span>
          </div>
          <span className="eyebrow">Readiness check · +60 XP</span>
          <h1 style={{ fontSize: 26, margin: "10px 0 18px" }}>{q}</h1>
          {opts.map((o, n) => (
            <button key={n} className="opt" aria-pressed={S.answers[qIdx] === n} style={S.answers[qIdx] === n ? { borderColor: "#edb671" } : undefined} onClick={async () => {
              const answers = { ...S.answers, [qIdx]: n };
              setS({ ...S, answers });
              if (qIdx < QUESTIONS.length - 1) { setQIdx(qIdx + 1); api("/api/state", { answers }).catch(() => {}); }
              else {
                setScreen("results");
                api("/api/state", { answers, stage: "tour" }).then((r) => { if (r.xp) { toast(r.xp, "Assessment done"); refreshStats(); } }).catch(() => {});
              }
            }}><span className="ab">{String.fromCharCode(65 + n)}</span>{o}</button>
          ))}
        </div>
        {FOOT}
      </div><Toasts items={toasts} /></div>
    );
  }

  if (screen === "results") {
    const rd = readiness(S.answers);
    return (
      <div className="shell"><div className="splash">
        <div className="pad reveal" style={{ paddingTop: "calc(24px + env(safe-area-inset-top,0px))" }}>
          <span className="eyebrow">Your readiness profile</span>
          <div className="card xpcard" style={{ marginTop: 14, textAlign: "center" }}>
            <Ring pct={rd.score} size={120} label={String(rd.score)} />
            <h1 style={{ fontSize: 26, marginTop: 10 }}>{rd.label}</h1>
            <p style={{ color: "#c9d3de", fontSize: 14, marginTop: 8 }}>{rd.blurb}</p>
          </div>
          <div className="card" style={{ marginTop: 12, background: "rgba(255,255,255,.05)", borderColor: "rgba(239,235,206,.16)" }}>
            <span className="eyebrow">Recommended for you · from your answers</span>
            <h3 style={{ fontSize: 17, color: "#fff", margin: "8px 0 4px" }}>{rd.trackName}</h3>
            <p style={{ color: "#c3cbd6", fontSize: 13.5 }}>{rd.reason}</p>
            <ul style={{ margin: "12px 0 0", paddingLeft: 18, color: "#c3cbd6", fontSize: 13.5, lineHeight: 1.6 }}>{rd.next.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <button className="btn" style={{ marginTop: 18 }} onClick={() => setScreen("tour")}>Continue {I.arrow}</button>
          <Disc>A guide to where to start — not a verdict, not advice. You can retake the assessment from your Profile.</Disc>
        </div>
        {FOOT}
      </div><Toasts items={toasts} /></div>
    );
  }

  if (screen === "tour") {
    const [icon, title, body] = TOUR[tourIdx];
    const last = tourIdx === TOUR.length - 1;
    const begin = () => { api("/api/state", { stage: "app" }).catch(() => {}); setScreen("app"); };
    return (
      <div className="shell"><div className="splash">
        <div className="pagehdr" style={{ background: "transparent", backdropFilter: "none" }}><div className="mark" style={{ margin: "0 auto" }}>{LOGO}</div><span className="mono" style={{ color: "#c3cbd6", fontSize: 13, position: "absolute", right: 18 }}>{tourIdx + 1}/{TOUR.length}</span></div>
        <div className="tour reveal" key={tourIdx}>
          <div className="tourbadge">{I[icon]}</div>
          <h1 className="brand-serif" style={{ fontSize: 28 }}>{title}</h1>
          <p className="sub" style={{ marginTop: 14, fontSize: 15 }}>{body}</p>
          <div className="dots">{TOUR.map((_, n) => <i key={n} className={n === tourIdx ? "on" : ""} />)}</div>
        </div>
        <div style={{ padding: "0 18px 22px" }}>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-ghost" disabled={tourIdx === 0} onClick={() => setTourIdx(tourIdx - 1)}>Back</button>
            <button className="btn" onClick={() => (last ? begin() : setTourIdx(tourIdx + 1))}>{last ? "Begin" : "Next"}</button>
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 10, border: 0, color: "#8f9bab" }} onClick={begin}>Skip</button>
        </div>
      </div><Toasts items={toasts} /></div>
    );
  }

  /* ================= the app ================= */
  const stats = S.stats;
  const firstName = (S.name || S.email.split("@")[0]).split(" ")[0];
  const initial = (firstName[0] || "T").toUpperCase();
  const tabs: [Tab, string, React.ReactNode][] = [["home", "Home", I.home], ["learn", "Learn", I.learn], ["trade", "Trade", I.trade], ["steward", "Steward", I.target], ["profile", "Profile", I.profile]];
  const go = (t: Tab) => { setTab(t); setView({ kind: "tabs" }); };

  let body: React.ReactNode;

  if (view.kind === "track") {
    const t = tracks.find(x => x.id === view.t)!;
    const p = trackProgress(t);
    const first = t.modules[0]?.lessons[0];
    body = (<>
      <div style={{ position: "relative" }}>
        <TrackHero kind={t.id} h={210} />
        <button className="iconbtn" style={{ position: "absolute", top: "calc(14px + env(safe-area-inset-top,0px))", left: 16, background: "rgba(255,255,255,.9)", color: "#06182e" }} onClick={() => go("learn")} aria-label="Back">{I.back}</button>
      </div>
      <div className="pad" style={{ marginTop: -30, position: "relative" }}>
        <div className="card reveal">
          <div className="row" style={{ gap: 8 }}><span className="pill o">{member ? "Member" : "Free preview"}</span><span className="faint" style={{ fontSize: 12 }}>{p.all} lessons · {p.got} done</span></div>
          <h1 style={{ fontSize: 24, margin: "12px 0 8px" }}>{t.name}</h1>
          <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>{t.blurb}</p>
        </div>
        {t.modules.map((m, mi) => {
          const locked = moduleLocked(t, mi);
          return (
            <div key={m.id}>
              <div className="sec"><h2>{m.name}</h2>{locked ? <span className="faint" style={{ fontSize: 12 }}>pass the last quiz first</span> : null}</div>
              <div className="card" style={{ padding: "4px 14px", opacity: locked ? .55 : 1 }}>
                {m.lessons.map(l => {
                  const done = !!S.done[l.id]; const pay = lessonLocked(l); const ready = l.minutes > 0;
                  return (
                    <button key={l.id} className="lrow" aria-disabled={locked || !ready} style={!ready ? { opacity: .6 } : undefined} onClick={() => { if (locked) return; openLesson(t.id, l); }}>
                      <span className={`lplay ${done ? "done" : ""}`}>{done ? I.check : ready ? (pay ? I.lock : I.play) : I.lock}</span>
                      <span style={{ flex: 1 }}><b>{l.title}</b><span className="d">{ready ? `${l.minutes} min · +40 XP` : "Coming soon"}</span></span>
                      {l.isFreePreview && !member ? <span className="pill o">Free</span> : null}
                    </button>
                  );
                })}
                {m.quizId ? (() => { const sc = S.scores[m.quizId!]; return (
                  <button className="lrow" aria-disabled={locked} onClick={() => { if (locked) return; if (!member) return setPaywall(true); setView({ kind: "quiz", t: t.id, quizId: m.quizId! }); }}>
                    <span className={`lplay ${(sc ?? 0) >= 70 ? "done" : ""}`}>{(sc ?? 0) >= 70 ? I.check : I.star}</span>
                    <span style={{ flex: 1 }}><b>Module quiz</b><span className="d">{sc != null ? `Best ${sc}%` : `${m.quizCount} questions · pass at 70% · +100 XP`}</span></span>
                    {!member ? <span className="pill o">Members</span> : null}
                  </button>
                ); })() : null}
              </div>
            </div>
          );
        })}
        <div style={{ height: 14 }} />
        {first && first.minutes > 0 && <button className="btn" onClick={() => openLesson(t.id, first)}>{p.got ? "Continue" : "Start course"} {I.arrow}</button>}
        <div style={{ height: 20 }} />
      </div>
    </>);
  } else if (view.kind === "lesson") {
    body = <Lesson key={view.l} S={S} tracks={tracks} tId={view.t} lId={view.l} toast={toast}
      onBack={() => setView({ kind: "track", t: view.t })}
      onDone={(lid, st) => { setS({ ...S, done: { ...S.done, [lid]: 1 }, stats: st ?? S.stats }); setView({ kind: "track", t: view.t }); }} />;
  } else if (view.kind === "quiz") {
    body = <Quiz key={view.quizId} quizId={view.quizId} toast={toast}
      onExit={() => setView({ kind: "track", t: view.t })}
      onScored={(quizId, pct, st) => setS({ ...S, scores: { ...S.scores, [quizId]: Math.max(S.scores[quizId] ?? 0, pct) }, stats: st ?? S.stats })} />;
  } else if (view.kind === "study") {
    body = <WisdomStudy n={view.n} back={() => { setTab("learn"); setLearnSeg("wisdom"); setView({ kind: "tabs" }); }} open={(n) => setView({ kind: "study", n })} />;
  } else if (tab === "home") {
    const n = nextUp();
    const topGoal = [...S.goals].sort((a, b) => gpct(b) - gpct(a))[0];
    const rd = readiness(S.answers);
    const recTrack = tracks.find((t) => t.id === rd.track) ?? tracks[0];
    body = (<>
      <header className="hdr">
        <button className="av" onClick={() => go("profile")} aria-label="Profile">{initial}</button>
        <div className="hi"><div className="g">Ten Talents Academy</div><div className="n">Hi, {firstName}</div></div>
        <span className="streak" title="Learning streak">{I.flame} {stats.streak}</span>
      </header>
      <div className="pad">
        <div className="sec" style={{ marginTop: 6 }}><h2>Continue learning</h2><button className="link" onClick={() => go("learn")}>All courses</button></div>
        {n ? (
          <button className="card coursewide reveal" onClick={() => openLesson(n.t.id, n.l)}>
            <span className="th"><TrackHero kind={n.t.id} h={74} /></span>
            <span style={{ flex: 1, textAlign: "left" }}><h3>{n.l.title}</h3><div className="cmeta"><span>{n.t.name}</span><span>{n.l.minutes ? `${n.l.minutes} min` : "Coming soon"}</span><span>{trackProgress(n.t).pct}% done</span></div><div className="cpbar"><i style={{ width: `${trackProgress(n.t).pct}%` }} /></div></span>
            {I.arrow}
          </button>
        ) : (
          <div className="card"><h3>Every lesson done</h3><p className="muted" style={{ fontSize: 13.5 }}>Your certificates are on the Profile tab.</p></div>
        )}
        <div className="hscroll" style={{ marginTop: 12 }}>
          {tracks.map((t, i) => { const p = trackProgress(t); return (
            <button key={t.id} className="wtile" style={{ width: 150, display: "flex", alignItems: "center", gap: 10, padding: 12 }} onClick={() => setView({ kind: "track", t: t.id })}>
              <Ring pct={p.pct} size={44} label={`${p.pct}%`} track="var(--surface-2)" color="var(--ink)" />
              <span style={{ minWidth: 0 }}><span className="s" style={{ fontSize: 12.5, display: "block", lineHeight: 1.2 }}>{t.name}</span><span className="n">{i + 1} of 4 · {p.got}/{p.all}</span></span>
            </button>
          ); })}
        </div>
        <div className="sec"><h2>Recommended for you</h2><span className="faint" style={{ fontSize: 12 }}>from your answers</span></div>
        <button className="card card-gold reveal" style={{ width: "100%", textAlign: "left" }} onClick={() => setView({ kind: "track", t: recTrack.id })}>
          <div className="between"><span className="eyebrow">{rd.label} · readiness {rd.score}</span>{I.arrow}</div>
          <h3 style={{ fontSize: 16, margin: "8px 0 4px" }}>{recTrack.name}</h3>
          <p className="muted" style={{ fontSize: 13.5 }}>{rd.reason}</p>
        </button>
        <div style={{ height: 14 }} />
        <XpCard stats={stats} />
        <div className="sec"><h2>Steward</h2><button className="link" onClick={() => go("steward")}>{S.goals.length ? "All goals" : "Open"}</button></div>
        {topGoal ? (
          <button className="card coursewide reveal" onClick={() => go("steward")}>
            <span className="th" style={{ background: "var(--gold-tint)", color: "var(--gold)" }}>{I[topGoal.icon as IconName]}</span>
            <span style={{ flex: 1, textAlign: "left" }}><h3>{topGoal.name}</h3><div className="cmeta"><span className="mono">{money(topGoal.savedPence)} / {money(topGoal.targetPence)}</span><span>{gpct(topGoal)}%</span></div><div className="cpbar"><i style={{ width: `${gpct(topGoal)}%` }} /></div></span>
            {I.arrow}
          </button>
        ) : (
          <button className="card card-gold" style={{ width: "100%", textAlign: "left" }} onClick={() => go("steward")}>
            <div className="eyebrow">Your goals</div><h3 style={{ fontSize: 16, margin: "8px 0 4px" }}>Set your first goal</h3>
            <p className="muted" style={{ fontSize: 13.5 }}>A house deposit, a reserve, a trip — your numbers, your account. +30 XP.</p>
          </button>
        )}
        <div className="sec"><h2>Your snapshot</h2></div>
        <div className="grid2">
          <div className="stat"><div className="k">Lessons</div><div className="v">{doneCount}<span className="faint" style={{ fontSize: 13 }}>/{totalLessons}</span></div></div>
          <div className="stat"><div className="k">Readiness</div><div className="v">{rd.score}<span className="faint" style={{ fontSize: 13 }}>/100</span></div></div>
        </div>
        {!member && (
          <div className="card card-gold reveal" style={{ marginTop: 12 }}>
            <div className="eyebrow">Membership</div>
            <h3 style={{ fontSize: 16, margin: "8px 0 4px" }}>Unlock the full Academy</h3>
            <p className="muted" style={{ fontSize: 13.5 }}>All four tracks, every quiz and your certificates. £15.99 a month, cancel any time.</p>
            <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => setPaywall(true)}>See membership {I.arrow}</button>
          </div>
        )}
        <Disc>Ten Talents is an education app. Nothing here is financial advice or an inducement to trade.</Disc>
      </div>
    </>);
  } else if (tab === "learn") {
    const q = gq.toLowerCase();
    const list = content.glossary.filter(([t, d]) => !q || t.toLowerCase().includes(q) || d.toLowerCase().includes(q));
    body = (<>
      <div className="pagehdr"><h1>Learn</h1></div>
      <div className="pad">
        <div className="hscroll" style={{ marginBottom: 10 }}>
          {([["courses", "Courses"], ["wisdom", "Wisdom"], ["glossary", "Glossary"]] as const).map(([k, label]) => <button key={k} className={`chip ${learnSeg === k ? "on" : ""}`} onClick={() => setLearnSeg(k)}>{k === "wisdom" ? I.wisdom : null}{label}</button>)}
        </div>
        {learnSeg === "courses" && (<>
          <div className="sec" style={{ marginTop: 14 }}><h2>Four tracks</h2><span className="faint" style={{ fontSize: 13 }}>in order</span></div>
          {tracks.map((t, i) => { const p = trackProgress(t); const mins = t.modules.reduce((a, m) => a + m.lessons.reduce((b, l) => b + l.minutes, 0), 0); return (
            <button key={t.id} className="card coursewide reveal" style={{ marginBottom: 12 }} onClick={() => setView({ kind: "track", t: t.id })}>
              <span className="th"><TrackHero kind={t.id} h={74} /></span>
              <span style={{ flex: 1, textAlign: "left" }}><h3>{t.name}</h3><div className="cmeta"><span>{p.all} lessons</span>{mins ? <span>{mins} min</span> : null}<span>{i === 1 && !member ? "First lesson free" : p.got ? `${p.pct}% done` : "Start"}</span></div><div className="cpbar"><i style={{ width: `${p.pct}%` }} /></div></span>
              {!member && i !== 1 ? I.lock : I.arrow}
            </button>
          ); })}
        </>)}
        {learnSeg === "wisdom" && <div style={{ marginTop: 6 }}><WisdomList seg={wisdomSeg} setSeg={setWisdomSeg} open={(n) => setView({ kind: "study", n })} /></div>}
        {learnSeg === "glossary" && (<>
          <input className="search" style={{ margin: "6px 0 4px" }} placeholder="Search terms" value={gq} onChange={e => setGq(e.target.value)} aria-label="Search terms" />
          <div className="card" style={{ padding: "4px 16px", marginTop: 12 }}>{list.length ? list.map(([t, d]) => <div className="term" key={t}><b>{t}</b><p>{d}</p></div>) : <div className="term"><p>No term matches that. Try a shorter word.</p></div>}</div>
        </>)}
      </div>
    </>);
  } else if (tab === "trade") {
    body = <TradeTab journal={S.journal} setJournal={(j) => setS({ ...S, journal: j })} toast={toast} onXp={refreshStats} />;
  } else if (tab === "steward") {
    body = <StewardTab goals={S.goals} setGoals={(g) => setS({ ...S, goals: g })} toast={toast} onXp={refreshStats} openStudy={() => setView({ kind: "study", n: "01" })} />;
  } else {
    body = <Profile S={S} setS={setS} tracks={tracks} trackProgress={trackProgress} doneCount={doneCount} totalLessons={totalLessons} openPaywall={() => setPaywall(true)} initial={initial}
      onRetake={() => { setS({ ...S, answers: {} }); setQIdx(0); api("/api/state", { stage: "onboard", answers: {} }).catch(() => {}); setScreen("onboard"); }} />;
  }

  const deep = view.kind !== "tabs";
  return (
    <div className="shell">
      {S.ent.grace && <div className="grace" role="status">Your last payment didn&rsquo;t go through. Update your card on the Profile tab to keep your access — nothing you&rsquo;ve done is lost.</div>}
      {flash && <div className="grace good" role="status">{flash}</div>}
      <div className="view" ref={viewRef}>{body}{view.kind === "tabs" ? FOOT : null}</div>
      <nav className="tabbar">{tabs.map(([k, label, ic]) => (
        <button key={k} className={`tab ${tab === k && (!deep || view.kind === "study" && k === "learn") ? "on" : ""}`} onClick={() => go(k)}><span className="ti">{ic}</span>{label}</button>
      ))}</nav>
      <Toasts items={toasts} />
      {paywall && <Paywall S={S} onClose={() => setPaywall(false)} />}
    </div>
  );
}

/* ================= pieces ================= */

/* ---------- legal gate (wording verbatim) ---------- */
function Gate({ consent, setConsent, onContinue }: { consent: boolean; setConsent: (b: boolean) => void; onContinue: () => void }) {
  return (
    <div className="gate"><div className="gate-inner">
      <div className="gate-head">
        <img className="logo" src="/logo-hand-gold.png" alt="" />
        <span className="wordmark">Ten Talents</span>
        <div className="sub">Academy · Markets · Wealth · Wisdom</div>
      </div>
      <div className="verse"><div className="dots3">•••</div>
        <p>He who had received the <b>five</b> talents went at once and traded with them, and he made <b>five talents <i>more</i></b>.</p>
        <small>Matthew 25:16</small></div>
      <div className="warn"><h3>Risk warning</h3><p>Trading leveraged products carries a high risk of losing money rapidly. Most retail accounts lose money. You could lose your entire stake.</p></div>
      <div className="blocks">
        <div className="block"><span>{I.book}</span><div><h3>Education only</h3><p>Ten Talents teaches how markets work. Nothing here is financial advice, a recommendation, or an invitation to trade.</p></div></div>
        <div className="block"><span>{I.scale}</span><div><h3>Not regulated</h3><p>Ten Talents is not a bank and is not authorised or regulated by the Financial Conduct Authority. Speak to a licensed adviser before risking real money.</p></div></div>
        <div className="block"><span style={{ color: "#e08a6f" }}>{I.alert}</span><div><h3>Real trading risks</h3><p>If you trade with real money elsewhere you can lose all of it. Nothing you learn here changes that.</p></div></div>
        <div className="block"><span style={{ color: "#58c095" }}>{I.shield}</span><div><h3>Over 18 only</h3><p>This app is for people aged 18 or over.</p></div></div>
      </div>
      <div className="links"><a href="../legal.html#privacy">Privacy</a>|<a href="../legal.html#terms">Terms</a>|<a href="../legal.html#disclaimer">Disclaimer</a></div>
      <label className="consent">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
        <span className="box"><span>{I.check}</span></span>
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
    signup: ["Create your account", "Your progress, goals and certificates live here."],
    signin: ["Welcome back", "Sign in to pick up where you stopped."],
    forgot: ["Reset your password", "We'll email you a one-time link."],
    reset: ["Choose a new password", "At least 8 characters."],
  } as const;
  const [title, sub] = titles[mode];

  return (
    <div className="shell"><div className="splash">
      <div style={{ textAlign: "center", paddingTop: "calc(28px + env(safe-area-inset-top,0px))" }}><div className="mark"><img src="/logo-hand-gold.png" alt="" style={{ height: 56 }} /></div><div className="eyebrow" style={{ marginTop: 12 }}>Ten Talents Academy</div></div>
      <form className="authwrap" onSubmit={e => { e.preventDefault(); submit(); }}>
        <h1>{title}</h1>
        <p className="sub">{sub}</p>
        {mode !== "reset" && (<>
          <label className="flabel" htmlFor="em">Email</label>
          <input id="em" className="inp" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </>)}
        {mode !== "forgot" && (<>
          <label className="flabel" htmlFor="pw">Password</label>
          <input id="pw" className="inp" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required minLength={8} value={pw} onChange={e => setPw(e.target.value)} />
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
    </div></div>
  );
}

/* ---------- lesson ---------- */
function Lesson({ S, tracks, tId, lId, toast, onBack, onDone }: {
  S: UserState; tracks: TrackMeta[]; tId: string; lId: string; toast: ToastFn;
  onBack: () => void; onDone: (lid: string, stats: Stats | null) => void;
}) {
  const t = tracks.find(x => x.id === tId)!;
  const m = t.modules.find(mm => mm.lessons.some(l => l.id === lId))!;
  const l = m.lessons.find(x => x.id === lId)!;
  const done = !!S.done[lId];
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fetched = useRef(false);
  useEffect(() => {
    if (fetched.current) return; fetched.current = true;
    api(`/api/lessons/${lId}`).then(d => setHtml(d.bodyHtml)).catch(e => setErr((e as Error).message));
  }, [lId]);

  return (<>
    <div className="pagehdr"><button className="iconbtn" onClick={onBack} aria-label="Back">{I.back}</button><div style={{ flex: 1 }}><span className="eyebrow">{t.name} · {m.name}</span></div><span className="pill o">{l.minutes} min</span></div>
    <div className="reader reveal">
      <h1 style={{ fontSize: 27, marginBottom: 16 }}>{l.title}</h1>
      {err ? <p className="muted">{err === "membership_required" ? "This lesson is for members." : err}</p> :
        html === null ? <p className="muted">Loading…</p> :
        html ? <div dangerouslySetInnerHTML={{ __html: html }} /> :
        <p className="muted">This lesson is not written yet.</p>}
      {html ? (<>
        <button className="btn" style={{ marginTop: 18 }} aria-busy={busy} disabled={done} onClick={async () => {
          setBusy(true);
          try { const r = await api(`/api/lessons/${lId}/complete`, {}); if (r.xp) toast(r.xp, "Lesson complete"); r.badges?.forEach((b: string) => setTimeout(() => toast(0, `Badge unlocked · ${BADGES.find(x => x.id === b)?.name ?? b}`), 900)); onDone(lId, r.stats ?? null); }
          catch { setBusy(false); }
        }}>{done ? "Completed ✓" : "Mark complete · +40 XP"}</button>
      </>) : null}
      <Disc>Educational content only. Examples are simplified. Not advice.</Disc>
    </div>
  </>);
}

/* ---------- quiz (server-authoritative) ---------- */
function Quiz({ quizId, toast, onExit, onScored }: { quizId: string; toast: ToastFn; onExit: () => void; onScored: (quizId: string, pct: number, stats: Stats | null) => void }) {
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

  if (!data) return <div className="q"><p className="muted">Loading…</p></div>;

  if (result) {
    const pass = result.pass;
    return (<>
      <div className="pagehdr"><button className="iconbtn" onClick={onExit} aria-label="Close">{I.close}</button></div>
      <div className="score reveal"><div className={`big ${pass ? "pass" : "fail"}`}>{result.scorePct}%</div>
        <h2 style={{ fontSize: 22 }}>{pass ? "Module passed" : "Not passed yet"}</h2>
        <p className="muted" style={{ marginTop: 10 }}>{pass ? "The next module is now open. Your best score is kept." : "You need 70% to move on. Retake it as often as you like — the explanations are the lesson."}</p></div>
      <div style={{ padding: "26px 18px 0" }}>
        <button className="btn" onClick={() => { setI(0); setChoices([]); setVerdict(null); setResult(null); }}>Retake quiz</button>
        <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={onExit}>Back to track</button>
      </div>
    </>);
  }

  const q = data.questions[i];
  const last = i === data.questions.length - 1;
  return (<>
    <div className="pagehdr"><button className="iconbtn" onClick={onExit} aria-label="Close">{I.close}</button><div className="qprog" style={{ margin: "0 14px" }}><i style={{ width: `${((verdict ? i + 1 : i) / data.questions.length) * 100}%` }} /></div><span className="mono faint" style={{ fontSize: 13 }}>{i + 1}/{data.questions.length}</span></div>
    <div className="pad reveal" key={i}>
      <div className="q" style={{ padding: "8px 0 0" }}><div className="num">Question {i + 1}</div><h1 style={{ fontSize: 24, marginBottom: 18 }}>{q.q}</h1></div>
      {q.options.map((o, n) => (
        <button key={n} disabled={!!verdict}
          className={`opt ${verdict && n === verdict.correctIndex ? "correct" : ""} ${verdict && n === verdict.n && !verdict.correct ? "wrong" : ""}`}
          onClick={async () => {
            if (verdict) return;
            const v = await api(`/api/quizzes/${quizId}`, { i, n });
            setVerdict({ n, ...v });
            setChoices(cs => { const c = [...cs]; c[i] = n; return c; });
          }}><span className="ab">{String.fromCharCode(65 + n)}</span>{o}</button>
      ))}
      {verdict && (<>
        <div className={`fb ${verdict.correct ? "g" : "r"}`}><b>{verdict.correct ? "Correct." : "Not quite."}</b> {verdict.why}</div>
        <button className="btn" onClick={async () => {
          if (last) {
            const r = await api(`/api/quizzes/${quizId}`, { finish: choices });
            onScored(quizId, r.scorePct, r.stats ?? null);
            if (r.xp) toast(r.xp, "Module passed");
            r.badges?.forEach((b: string) => setTimeout(() => toast(0, `Badge unlocked · ${BADGES.find(x => x.id === b)?.name ?? b}`), 900));
            setResult(r);
          } else { setI(i + 1); setVerdict(null); }
        }}>{last ? "See your score" : "Next question"}</button>
      </>)}
    </div>
  </>);
}

/* ---------- paywall (Stripe checkout behind it) ---------- */
function Paywall({ S, onClose }: { S: UserState; onClose: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const buy = async (addon: boolean) => {
    setBusy(addon ? "both" : "one"); setErr(null);
    try { const { url } = await api("/api/stripe/checkout", { addon }); window.location.href = url; }
    catch (e) { setErr((e as Error).message); setBusy(null); }
  };
  return (
    <Sheet onClose={onClose}>
      <div className="between"><h2 style={{ fontSize: 20 }}>Ten Talents Academy</h2><button className="iconbtn" onClick={onClose} aria-label="Close">{I.close}</button></div>
      <p className="muted" style={{ marginTop: 8 }}>The first lesson is free. Membership opens the rest.</p>
      <div className="plan"><div><b>Membership</b><p>All four tracks, every quiz, your certificates.</p></div><span className="price">£15.99<small style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: 12 }}>/mo</small></span></div>
      {S.signalsEnabled && (
        <div className="plan"><div><b>Signals access</b><p>Members only. Educational commentary, not advice.</p></div><span className="price">£4.99<small style={{ color: "var(--muted)", fontFamily: "var(--sans)", fontSize: 12 }}>/mo</small></span></div>
      )}
      <div style={{ height: 18 }} />
      {err && <div className="err" role="alert" style={{ marginBottom: 12 }}>{err}</div>}
      <button className="btn" aria-busy={busy === "one"} onClick={() => buy(false)}>Start membership</button>
      {S.signalsEnabled && <button className="btn btn-ghost" style={{ marginTop: 10 }} aria-busy={busy === "both"} onClick={() => buy(true)}>Membership and signals</button>}
      <button className="btn btn-ghost" style={{ marginTop: 10, border: 0, color: "var(--muted)" }} onClick={onClose}>Not now</button>
      <p className="demo-note">Secure payment by Stripe. Cancel any time from your profile — access runs to the end of the period you&rsquo;ve paid for.</p>
    </Sheet>
  );
}

/* ---------- profile / account ---------- */
function Profile({ S, setS, tracks, trackProgress, doneCount, totalLessons, openPaywall, initial, onRetake }: {
  S: UserState; setS: (s: UserState) => void; tracks: TrackMeta[];
  trackProgress: (t: TrackMeta) => { got: number; all: number; pct: number };
  doneCount: number; totalLessons: number; openPaywall: () => void; initial: string; onRetake: () => void;
}) {
  const certs = tracks.filter(t => trackProgress(t).pct === 100);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(() => (typeof window === "undefined" ? "system" : getTheme()));
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ent = S.ent; const stats = S.stats;
  const periodEnd = ent.currentPeriodEnd ? new Date(ent.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
  const earned = new Set(stats.badges);

  const act = async (path: string, body: unknown, key: string) => {
    setBusy(key); setErr(null);
    try { const d = await api(path, body); if (d.url) { window.location.href = d.url; return; } window.location.href = "/"; }
    catch (e) { setErr((e as Error).message); setBusy(null); }
  };

  return (<>
    <div className="pagehdr"><h1>Profile</h1></div>
    <div className="pad">
      <div className="card xpcard reveal" style={{ textAlign: "center" }}>
        <div className="av" style={{ margin: "0 auto 12px", width: 64, height: 64, fontSize: 26 }}>{initial}</div>
        <h2 style={{ fontSize: 22, color: "#fff" }}>{S.name || S.email.split("@")[0]}</h2>
        <div className="ttl" style={{ marginTop: 2 }}>Level {levelOf(stats.xp)} · {levelTitle(stats.xp)} · {stats.xp.toLocaleString()} XP</div>
        <div className="xpbar"><i style={{ width: `${Math.min(100, ((stats.xp % 1500) / 1500) * 100)}%` }} /></div>
        <div className="row" style={{ justifyContent: "center", gap: 24, marginTop: 14 }}>
          <div><div className="mono" style={{ fontSize: 20, color: "#fff" }}>{stats.streak}</div><div style={{ fontSize: 11, color: "#c9d3de" }}>day streak</div></div>
          <div><div className="mono" style={{ fontSize: 20, color: "#fff" }}>{doneCount}</div><div style={{ fontSize: 11, color: "#c9d3de" }}>lessons</div></div>
          <div><div className="mono" style={{ fontSize: 20, color: "#fff" }}>{certs.length}</div><div style={{ fontSize: 11, color: "#c9d3de" }}>certificates</div></div>
        </div>
      </div>
      {(() => { const rd = readiness(S.answers); return (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="row" style={{ gap: 14 }}>
            <Ring pct={rd.score} size={64} label={String(rd.score)} track="var(--surface-2)" color="var(--ink)" />
            <div style={{ flex: 1 }}><div className="eyebrow">Readiness · from your answers</div><h3 style={{ fontSize: 16, marginTop: 4 }}>{rd.label}</h3><p className="muted" style={{ fontSize: 13 }}>Start here: {rd.trackName}</p></div>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={onRetake}>Retake assessment</button>
            <button className="btn btn-ghost btn-sm" onClick={async () => {
              const url = window.location.origin + "/?ref=friend"; const text = "Learn how money and markets actually work with me on Ten Talents Academy — first lesson free.";
              try { if (navigator.share) await navigator.share({ title: "Ten Talents Academy", text, url }); else { await navigator.clipboard.writeText(text + " " + url); alert("Invite copied — paste it anywhere."); } } catch { /* cancelled */ }
            }}>Invite a friend</button>
          </div>
        </div>
      ); })()}
      <div className="sec"><h2>Badges</h2><span className="faint" style={{ fontSize: 13 }}>{earned.size}/{BADGES.length}</span></div>
      <div className="hscroll">{BADGES.map(b => <div key={b.id} className={`badge ${earned.has(b.id) ? "" : "locked"}`} title={b.how}><span className="bic">{earned.has(b.id) ? I[b.icon as IconName] : I.lock}</span><span>{b.name}</span></div>)}</div>

      <div className="sec"><h2>Your account</h2></div>
      <div className="card" style={{ padding: "4px 16px" }}>
        <div className="kv"><span>Signed in as</span><b className="dim">{S.email}{S.emailVerified ? "" : " · unverified"}</b></div>
        <div className="kv"><span>Membership</span><b>{ent.member ? `Active · £15.99/mo${ent.grace ? " · payment issue" : ""}${ent.cancelAtPeriodEnd && periodEnd ? ` · ends ${periodEnd}` : ""}` : "Free preview"}</b></div>
        {S.signalsEnabled && <div className="kv"><span>Signals access</span><b>{ent.signals ? "Active · £4.99/mo" : "Not added"}</b></div>}
        <div className="kv"><span>Lessons complete</span><b>{doneCount} of {totalLessons}</b></div>
        <div className="kv"><span>Quizzes passed</span><b>{Object.values(S.scores).filter(s => s >= 70).length}</b></div>
      </div>
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="nm">Name on your certificates</label>
        <input className="inp" id="nm" value={S.name} placeholder="Your full name" onChange={e => {
          const name = e.target.value; setS({ ...S, name });
          if (nameTimer.current) clearTimeout(nameTimer.current);
          nameTimer.current = setTimeout(() => api("/api/state", { name }).catch(() => {}), 600);
        }} />
      </div>
      {err && <div className="err" role="alert" style={{ marginBottom: 12 }}>{err}</div>}
      {ent.member ? (<>
        <button className="btn btn-ghost" aria-busy={busy === "portal"} onClick={() => act("/api/stripe/portal", {}, "portal")}>Update card · manage billing</button>
        {S.signalsEnabled && !ent.signals && <button className="btn" style={{ marginTop: 10 }} aria-busy={busy === "addon"} onClick={() => act("/api/stripe/addon", { action: "add" }, "addon")}>Add signals access · £4.99/mo</button>}
        {ent.signals && <button className="btn btn-ghost" style={{ marginTop: 10 }} aria-busy={busy === "addon"} onClick={() => act("/api/stripe/addon", { action: "remove" }, "addon")}>Remove signals access</button>}
        {!ent.cancelAtPeriodEnd && <button className="btn btn-ghost" style={{ marginTop: 10 }} aria-busy={busy === "cancel"} onClick={() => { if (window.confirm("Cancel your membership? You keep access until the end of the period you've paid for, and everything you've done is saved.")) act("/api/stripe/cancel", {}, "cancel"); }}>Cancel membership</button>}
      </>) : (
        <button className="btn" onClick={openPaywall}>See membership</button>
      )}
      {ent.signals && (
        <div className="card card-gold" style={{ marginTop: 12 }}><h3>Signals channel</h3>
          <p className="muted" style={{ fontSize: 13.5 }}>Your invite link lives here. Educational commentary only, not advice. Past performance does not indicate future results.</p>
          <a className="btn btn-sm" style={{ marginTop: 12 }} href="/signals">Open your access page</a></div>
      )}

      <div className="sec"><h2>Certificates</h2><span className="faint" style={{ fontSize: 13 }}>{certs.length}</span></div>
      {certs.length ? certs.map(t => (
        <div key={t.id}>
          <div className="cert"><img className="logo" src="/logo-hand-gold.png" alt="" />
            <div className="sub">Certificate of completion</div>
            <div className="name">{S.name || "Your name"}</div>
            <div className="track-name">{t.name}</div><div className="line"></div>
            <small>Ten Talents Academy · educational programme · not a regulated qualification</small></div>
          <a className="btn btn-ghost" href={`/api/certificates/${t.id}/pdf`}>Download PDF</a>
        </div>
      )) : <div className="card"><h3>Nothing yet</h3><p className="muted" style={{ fontSize: 13.5 }}>Finish every lesson in a track and its certificate appears here.</p></div>}

      <div className="sec"><h2>Settings</h2></div>
      <div className="card">
        <div className="between" style={{ padding: "4px 0" }}><span>Appearance</span><div className="row" style={{ gap: 6 }}>{(["light", "dark", "system"] as const).map(m => <button key={m} className={`chip ${theme === m ? "on" : ""}`} style={{ padding: "7px 12px" }} onClick={() => { setTheme(m); setThemeState(m); }}>{m === "system" ? "Auto" : m[0].toUpperCase() + m.slice(1)}</button>)}</div></div>
      </div>
      <div style={{ marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={async () => { await api("/api/auth/signout", {}); window.location.href = "/"; }}>Sign out</button>
        <a className="btn btn-ghost" style={{ marginTop: 10, border: 0, color: "var(--muted)" }} href="../index.html">Back to the Ten Talents site</a>
      </div>
      <Disc>XP, levels, streaks and badges reward learning and saving discipline only. Nothing in this app rewards trading.</Disc>
    </div>
  </>);
}

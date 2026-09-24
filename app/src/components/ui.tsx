"use client";
/* Shared UI for the Ten Talents app — mirrors the vision prototype. */
import { useEffect, useState, type ReactNode } from "react";
import { I } from "./icons";
import { levelOf, levelTitle, levelProgress, DAILY_GOAL_XP } from "@/lib/levels";

export const money = (pence: number, dec = 0) => (pence < 0 ? "−£" : "£") + (Math.abs(pence) / 100).toLocaleString("en-GB", { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const fmt = (n: number, d = 2) => Number(n).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
export const monthsTo = (ym: string | null) => { if (!ym) return 0; const [y, m] = ym.split("-").map(Number); const now = new Date(); return Math.max(1, (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth())); };
export const fmtYM = (ym: string | null) => { if (!ym) return ""; const [y, m] = ym.split("-"); return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+m - 1] + " " + y; };

export async function api(path: string, body?: unknown, method?: string) {
  const res = await fetch(path, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Something went wrong."), { status: res.status, code: data.error });
  return data;
}

export type Stats = { xp: number; streak: number; todayXp: number; badges: string[] };
export type Toast = { id: number; xp: number; label: string };
export type ToastFn = (xp: number, label: string) => void;

export function Ring({ pct, size = 64, label, track = "rgba(255,255,255,.18)", color = "#fff" }: { pct: number; size?: number; label: string; track?: string; color?: string }) {
  const r = size / 2 - 6, c = 2 * Math.PI * r;
  return (
    <svg className="goalring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#edb671" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, Math.max(0, pct)) / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)" }} />
      <text x="50%" y="53%" textAnchor="middle" fontSize={size * 0.26} fontFamily="var(--mono)" fill={color} fontWeight="600" dominantBaseline="middle">{label}</text>
    </svg>
  );
}

export function XpCard({ stats, compact }: { stats: Stats; compact?: boolean }) {
  const lp = levelProgress(stats.xp);
  return (
    <div className="card xpcard reveal">
      <div className="between">
        <div>
          <div className="ttl">Level {levelOf(stats.xp)} · {levelTitle(stats.xp)}</div>
          <div className="lvl">{stats.xp.toLocaleString()} XP</div>
        </div>
        <Ring pct={(stats.todayXp / DAILY_GOAL_XP) * 100} label={`${Math.min(stats.todayXp, 999)}/${DAILY_GOAL_XP}`} />
      </div>
      <div className="xpbar"><i style={{ width: `${lp.pct}%` }} /></div>
      {!compact && (
        <div className="xpmeta"><span>{lp.cur} / {lp.need} to Level {lp.level + 1}</span><span>Daily goal: {stats.todayXp}/{DAILY_GOAL_XP} XP</span></div>
      )}
    </div>
  );
}

/* Brand-pure duotone hero graphics for the four tracks. */
export function TrackHero({ kind, h = 74 }: { kind: string; h?: number }) {
  const id = "g" + kind + h;
  const motif: Record<string, ReactNode> = {
    t1: <><path d="M40 84h60M50 72h40M60 60h20" stroke="#f5cf98" strokeWidth="3" strokeLinecap="round" opacity=".9" /><circle cx="70" cy="46" r="12" stroke="#f5cf98" strokeWidth="3" fill="none" /><text x="70" y="51" fontSize="11" fill="#f5cf98" textAnchor="middle" fontFamily="serif">£</text></>,
    t2: <g stroke="#f5cf98" strokeWidth="3"><line x1="38" y1="40" x2="38" y2="88" /><rect x="32" y="52" width="12" height="24" fill="#f5cf98" opacity=".3" /><line x1="64" y1="34" x2="64" y2="80" /><rect x="58" y="44" width="12" height="20" fill="#f5cf98" opacity=".5" /><line x1="90" y1="46" x2="90" y2="92" /><rect x="84" y="58" width="12" height="26" fill="#f5cf98" opacity=".4" /></g>,
    t3: <><path d="M70 30l30 12v14c0 20-14 30-30 36-16-6-30-16-30-36V42z" stroke="#f5cf98" strokeWidth="3" fill="none" /><path d="M70 52v14M70 74v.5" stroke="#f5cf98" strokeWidth="3" strokeLinecap="round" /></>,
    t4: <><path d="M45 88V64l25-16 25 16v24z" stroke="#f5cf98" strokeWidth="3" fill="none" /><path d="M45 64l25 16 25-16" stroke="#f5cf98" strokeWidth="3" fill="none" /><path d="M70 48v-14M62 40l8-6 8 6" stroke="#f5cf98" strokeWidth="3" fill="none" strokeLinecap="round" /></>,
  };
  return (
    <svg width="100%" height={h} viewBox={`0 0 140 ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#021c3d" /><stop offset=".55" stopColor="#083058" /><stop offset="1" stopColor="#12508a" /></linearGradient>
        <radialGradient id={id + "r"} cx="85%" cy="15%" r="60%"><stop offset="0" stopColor="#edb671" stopOpacity=".28" /><stop offset="1" stopColor="#edb671" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="140" height={h} fill={`url(#${id})`} /><rect width="140" height={h} fill={`url(#${id + "r"})`} />
      <g transform={`translate(0,${(h - 132) / 2})`}>{motif[kind] ?? motif.t1}</g>
    </svg>
  );
}

export function Sheet({ onClose, children, tall }: { onClose: () => void; children: ReactNode; tall?: boolean }) {
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="ovl" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" style={tall ? { height: "92%", display: "flex", flexDirection: "column" } : undefined} role="dialog" aria-modal="true">
        <div className="grab" />{children}
      </div>
    </div>
  );
}

export function Toasts({ items }: { items: Toast[] }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => <div key={t.id} className="toast">{t.xp ? <>{I.bolt}<span className="xp">+{t.xp} XP</span></> : I.star}<span>{t.label}</span></div>)}
    </div>
  );
}

export function useToasts(): [Toast[], ToastFn] {
  const [items, setItems] = useState<Toast[]>([]);
  const push: ToastFn = (xp, label) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-2), { id, xp, label }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 2400);
  };
  return [items, push];
}

export function Segmented({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="hscroll" style={{ marginBottom: 10 }}>
      {options.map(([k, label]) => <button key={k} className={`chip ${value === k ? "on" : ""}`} onClick={() => onChange(k)}>{label}</button>)}
    </div>
  );
}

export const Disc = ({ children }: { children: ReactNode }) => <div className="disc">{children}</div>;

export function setTheme(mode: "light" | "dark" | "system") {
  try {
    if (mode === "system") { localStorage.removeItem("tt-theme"); document.documentElement.removeAttribute("data-theme"); }
    else { localStorage.setItem("tt-theme", mode); document.documentElement.setAttribute("data-theme", mode); }
  } catch { document.documentElement.setAttribute("data-theme", mode === "system" ? "" : mode); }
}
export function getTheme(): "light" | "dark" | "system" {
  try { const t = localStorage.getItem("tt-theme"); return t === "light" || t === "dark" ? t : "system"; } catch { return "system"; }
}

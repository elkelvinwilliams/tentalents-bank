"use client";
/* Shared UI for the Ten Talents app — mirrors the vision prototype. */
import { useEffect, useState, type ReactNode } from "react";
import { I } from "./icons";
import { levelOf, levelTitle, levelProgress, DAILY_GOAL_XP } from "@/lib/levels";
import { Art, TRACK_ART } from "./art";
import { haptic } from "@/lib/native";

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

/* Track heroes are now the bespoke engraved artwork (art.tsx). Kept as a thin alias. */
export function TrackHero({ kind, h = 74 }: { kind: string; h?: number }) {
  return <Art kind={TRACK_ART[kind] ?? "t1"} h={h} />;
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
    haptic(xp ? "success" : "light");
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

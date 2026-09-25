"use client";
/* ============================================================
   Ten Talents artwork — bespoke, in-brand, vector.
   "Gold foil engraving on navy": layered navy gradients, a gold radial
   glow, fine diagonal hatching for shading, foil-gradient fills, a paper
   grain and a soft vignette. Crisp at any size, tiny on the wire, and
   identical in light and dark mode (the art is always navy).
   ============================================================ */
import { useId, type ReactNode } from "react";

export type ArtKind = "t1" | "t2" | "t3" | "t4" | "tools" | "safety" | "wealth" | "health" | "journey" | "jubilee" | "giving" | "talents" | "wisdom" | "passport" | "cohort" | "practise" | "goals" | "ai";

const GOLD = "#edb671", PALE = "#f5cf98", DEEP = "#b3811f";

function motif(kind: ArtKind, id: string): ReactNode {
  const foil = `url(#${id}f)`, hatch = `url(#${id}h)`, glow = `url(#${id}g)`;
  const S = { stroke: GOLD, strokeWidth: 2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const s1 = { ...S, strokeWidth: 1.2, stroke: PALE, opacity: 0.7 };
  switch (kind) {
    case "t1": // Money Foundations — stacked coins, rising arcs
      return (<g>
        <g opacity=".35" stroke={PALE} strokeWidth="1"><path d="M10 96 Q70 38 130 96" /><path d="M0 108 Q70 44 140 108" /><path d="M22 86 Q70 46 118 86" /></g>
        {[92, 82, 72].map((y, i) => (<g key={y}>
          <path d={`M42 ${y} v-7 a28 7 0 0 1 56 0 v7`} fill={foil} filter={glow} opacity={0.95 - i * 0.08} />
          <ellipse cx="70" cy={y - 7} rx="28" ry="7" fill={PALE} stroke={DEEP} strokeWidth="1" />
          <ellipse cx="70" cy={y - 7} rx="21" ry="5" fill="none" stroke={DEEP} strokeWidth=".8" strokeDasharray="2 2" />
          <path d={`M42 ${y - 7} v7 a28 7 0 0 0 56 0 v-7`} fill={hatch} />
          <path d={`M42 ${y - 7} v7 a28 7 0 0 0 56 0`} fill="none" stroke={DEEP} strokeWidth="1" />
        </g>))}
        <text x="70" y="68" textAnchor="middle" fontSize="7" fontFamily="Georgia,serif" fill={DEEP}>£</text>
      </g>);
    case "t2": case "practise": // How Markets Work — candles with glow, curve
      return (<g>
        <g stroke={PALE} strokeWidth=".6" opacity=".22">{[36, 54, 72, 90, 108].map((y) => <line key={y} x1="14" y1={y} x2="126" y2={y} />)}</g>
        <path d="M14 96 C38 90 44 62 60 66 S86 84 102 56 S124 40 128 34" fill="none" stroke={PALE} strokeWidth="1.2" opacity=".55" strokeDasharray="3 3" />
        {[[30, 58, 78, 44], [48, 44, 70, 62], [66, 50, 92, 40], [84, 40, 66, 58], [102, 34, 60, 30], [118, 42, 52, 36]].map(([x, top, bot, bodyTop], i) => {
          const up = i % 2 === 0;
          return (<g key={x} filter={up ? glow : undefined}>
            <line x1={x} y1={top} x2={x} y2={bot} stroke={GOLD} strokeWidth="1.4" />
            <rect x={x - 5} y={bodyTop} width="10" height={Math.max(8, Math.abs(bot - bodyTop) * 0.45)} rx="1.5" fill={up ? foil : "#06182e"} stroke={GOLD} strokeWidth="1.2" />
            {!up && <rect x={x - 5} y={bodyTop} width="10" height={Math.max(8, Math.abs(bot - bodyTop) * 0.45)} rx="1.5" fill={hatch} />}
          </g>);
        })}
      </g>);
    case "t3": case "safety": // Understanding Risk — engraved shield
      return (<g>
        <path d="M70 22 L104 34 V62 C104 88 88 104 70 112 C52 104 36 88 36 62 V34 Z" fill={foil} opacity=".18" />
        <path d="M70 22 L104 34 V62 C104 88 88 104 70 112 C52 104 36 88 36 62 V34 Z" fill={hatch} />
        <path d="M70 22 L104 34 V62 C104 88 88 104 70 112 C52 104 36 88 36 62 V34 Z" {...S} strokeWidth="2.2" filter={glow} />
        <path d="M70 32 L96 41 V62 C96 82 84 95 70 102 C56 95 44 82 44 62 V41 Z" {...s1} />
        <path d="M70 42 L88 48 V62 C88 76 80 86 70 92 C60 86 52 76 52 62 V48 Z" {...s1} strokeDasharray="2 2" />
        {kind === "t3" ? <><path d="M70 54 v18" stroke={PALE} strokeWidth="3" strokeLinecap="round" /><circle cx="70" cy="80" r="2.2" fill={PALE} /></>
          : <><rect x="61" y="62" width="18" height="15" rx="3" fill="#06182e" stroke={PALE} strokeWidth="1.6" /><path d="M64 62 v-5 a6 6 0 0 1 12 0 v5" fill="none" stroke={PALE} strokeWidth="1.6" /><circle cx="70" cy="69" r="1.8" fill={PALE} /></>}
      </g>);
    case "t4": // Building Something — arch, columns, keystone
      return (<g>
        <line x1="20" y1="110" x2="120" y2="110" stroke={GOLD} strokeWidth="1.6" />
        <g opacity=".3" stroke={PALE} strokeWidth="1"><path d="M70 14 v14 M40 22 l8 12 M100 22 l-8 12" /></g>
        <rect x="40" y="70" width="12" height="40" fill={hatch} stroke={GOLD} strokeWidth="1.6" />
        <rect x="88" y="70" width="12" height="40" fill={hatch} stroke={GOLD} strokeWidth="1.6" />
        <rect x="36" y="66" width="20" height="5" rx="1" fill={foil} /><rect x="84" y="66" width="20" height="5" rx="1" fill={foil} />
        <path d="M40 70 A30 30 0 0 1 100 70" {...S} strokeWidth="2.2" filter={glow} />
        <path d="M46 70 A24 24 0 0 1 94 70" {...s1} strokeDasharray="2 2" />
        <path d="M65 40 L75 40 L78 52 L62 52 Z" fill={foil} stroke={DEEP} strokeWidth=".8" />
      </g>);
    case "tools": // abacus
      return (<g>
        <rect x="30" y="30" width="80" height="76" rx="6" fill={hatch} stroke={GOLD} strokeWidth="2" />
        <rect x="30" y="30" width="80" height="76" rx="6" fill="none" stroke={GOLD} strokeWidth="2" filter={glow} />
        {[46, 60, 74, 88].map((y, r) => (<g key={y}>
          <line x1="34" y1={y} x2="106" y2={y} stroke={PALE} strokeWidth="1" opacity=".6" />
          {[0, 1, 2, 3, 4].map((i) => { const on = (i + r) % 3 !== 0; const x = on ? 42 + i * 8 : 74 + i * 8; return <circle key={i} cx={x} cy={y} r="4" fill={on ? foil : "#06182e"} stroke={DEEP} strokeWidth=".8" />; })}
        </g>))}
      </g>);
    case "wealth": // vault door
      return (<g>
        <circle cx="70" cy="66" r="40" fill={hatch} stroke={GOLD} strokeWidth="2.2" filter={glow} />
        <circle cx="70" cy="66" r="32" {...s1} strokeDasharray="3 3" />
        <circle cx="70" cy="66" r="14" fill={foil} opacity=".9" />
        <circle cx="70" cy="66" r="5" fill="#06182e" stroke={DEEP} strokeWidth="1" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="70" y1="66" x2={70 + 24 * Math.cos((a * Math.PI) / 180)} y2={66 + 24 * Math.sin((a * Math.PI) / 180)} stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" />)}
        {[30, 150, 270].map((a) => <circle key={a} cx={70 + 36 * Math.cos((a * Math.PI) / 180)} cy={66 + 36 * Math.sin((a * Math.PI) / 180)} r="2.2" fill={PALE} />)}
      </g>);
    case "health": // heart + pulse
      return (<g>
        <path d="M70 104 C40 84 30 70 30 54 a18 18 0 0 1 40 -10 a18 18 0 0 1 40 10 c0 16 -10 30 -40 50z" fill={hatch} stroke={GOLD} strokeWidth="2.2" filter={glow} />
        <path d="M70 96 C46 80 38 68 38 55" {...s1} />
        <path d="M22 70 h26 l6 -14 l8 28 l8 -22 l6 8 h42" fill="none" stroke={PALE} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      </g>);
    case "journey": // compass rose
      return (<g>
        <circle cx="70" cy="66" r="42" {...S} strokeWidth="1.6" filter={glow} />
        <circle cx="70" cy="66" r="36" {...s1} strokeDasharray="2 4" />
        <path d="M70 26 L78 60 L114 66 L78 72 L70 106 L62 72 L26 66 L62 60 Z" fill={hatch} stroke={GOLD} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M70 26 L78 60 L70 66 Z M70 106 L62 72 L70 66Z" fill={foil} />
        <path d="M114 66 L78 72 L70 66Z M26 66 L62 60 L70 66Z" fill={DEEP} opacity=".7" />
        <circle cx="70" cy="66" r="4" fill="#06182e" stroke={PALE} strokeWidth="1.4" />
        <text x="70" y="21" textAnchor="middle" fontSize="7" fontFamily="Georgia,serif" fill={PALE}>N</text>
      </g>);
    case "jubilee": // sunrise over horizon, opened link
      return (<g>
        {[-60, -40, -20, 0, 20, 40, 60].map((a) => <line key={a} x1={70 + 22 * Math.sin((a * Math.PI) / 180)} y1={82 - 22 * Math.cos((a * Math.PI) / 180)} x2={70 + 40 * Math.sin((a * Math.PI) / 180)} y2={82 - 40 * Math.cos((a * Math.PI) / 180)} stroke={PALE} strokeWidth="1.4" opacity=".7" strokeLinecap="round" />)}
        <path d="M50 82 a20 20 0 0 1 40 0z" fill={foil} filter={glow} />
        <path d="M50 82 a20 20 0 0 1 40 0z" fill={hatch} />
        <line x1="16" y1="82" x2="124" y2="82" stroke={GOLD} strokeWidth="2" />
        <g opacity=".85" stroke={PALE} strokeWidth="2" fill="none"><rect x="38" y="94" width="18" height="10" rx="5" /><path d="M62 94 h6 a5 5 0 0 1 0 10 h-6" /><path d="M78 99 h8" strokeDasharray="2 3" /></g>
      </g>);
    case "giving": // open hand with coin
      return (<g>
        <circle cx="70" cy="46" r="15" fill={foil} filter={glow} /><circle cx="70" cy="46" r="15" fill={hatch} /><circle cx="70" cy="46" r="11" fill="none" stroke={DEEP} strokeWidth=".9" strokeDasharray="2 2" />
        <text x="70" y="50" textAnchor="middle" fontSize="9" fontFamily="Georgia,serif" fill={DEEP}>£</text>
        <path d="M36 84 c0 -8 6 -12 14 -12 h30 c6 0 9 4 9 8 c0 4 -3 7 -9 7 h-16" {...S} strokeWidth="2.2" />
        <path d="M36 84 v12 c0 6 6 10 14 10 h28 c10 0 20 -6 28 -18 l6 -9 c2 -3 0 -7 -4 -7 c-3 0 -5 2 -7 5 l-8 10" {...S} strokeWidth="2.2" filter={glow} />
        <path d="M46 92 h22 M46 99 h18" {...s1} />
      </g>);
    case "talents": // ledger with quill
      return (<g>
        <path d="M34 36 h58 a4 4 0 0 1 4 4 v64 a4 4 0 0 1 -4 4 h-58 a4 4 0 0 1 -4 -4 v-64 a4 4 0 0 1 4 -4z" fill={hatch} stroke={GOLD} strokeWidth="2" filter={glow} />
        <path d="M30 44 h66 M42 36 v72" {...s1} />
        {[56, 66, 76, 86, 96].map((y) => <line key={y} x1="48" y1={y} x2={y % 20 === 16 ? 78 : 84} y2={y} stroke={PALE} strokeWidth="1.2" opacity=".6" />)}
        <path d="M118 30 c-12 6 -22 22 -26 44 l-4 10 l10 -5 c18 -10 24 -30 20 -49z" fill={foil} stroke={DEEP} strokeWidth=".8" />
        <path d="M112 38 c-8 8 -14 20 -18 34" stroke={DEEP} strokeWidth=".9" fill="none" />
      </g>);
    case "wisdom": // scroll
      return (<g>
        <path d="M36 40 h68 v56 h-68z" fill={hatch} stroke={GOLD} strokeWidth="1.8" />
        <rect x="28" y="34" width="84" height="12" rx="6" fill={foil} stroke={DEEP} strokeWidth=".8" filter={glow} />
        <rect x="28" y="90" width="84" height="12" rx="6" fill={foil} stroke={DEEP} strokeWidth=".8" />
        {[56, 64, 72, 80].map((y, i) => <line key={y} x1="46" y1={y} x2={i === 3 ? 74 : 94} y2={y} stroke={PALE} strokeWidth="1.3" opacity=".65" />)}
      </g>);
    case "passport": // seal
      return (<g>
        <circle cx="70" cy="66" r="38" fill={hatch} stroke={GOLD} strokeWidth="2" filter={glow} />
        <circle cx="70" cy="66" r="31" {...s1} strokeDasharray="1.5 3" />
        {Array.from({ length: 24 }, (_, i) => i * 15).map((a) => <line key={a} x1={70 + 38 * Math.cos((a * Math.PI) / 180)} y1={66 + 38 * Math.sin((a * Math.PI) / 180)} x2={70 + 43 * Math.cos((a * Math.PI) / 180)} y2={66 + 43 * Math.sin((a * Math.PI) / 180)} stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />)}
        <path d="M70 46 l6 12 13 2 -9 9 2 13 -12 -6 -12 6 2 -13 -9 -9 13 -2z" fill={foil} stroke={DEEP} strokeWidth=".8" />
      </g>);
    case "cohort": // three figures
      return (<g>
        {[[44, 0.8], [96, 0.8], [70, 1]].map(([x, k], i) => (<g key={i} opacity={k === 1 ? 1 : 0.8}>
          <circle cx={x} cy={k === 1 ? 52 : 58} r={k === 1 ? 12 : 9} fill={k === 1 ? foil : hatch} stroke={GOLD} strokeWidth="1.8" filter={k === 1 ? glow : undefined} />
          <path d={`M${(x as number) - (k === 1 ? 22 : 16)} 106 c0 -${k === 1 ? 20 : 16} ${k === 1 ? 10 : 7} -${k === 1 ? 30 : 24} ${k === 1 ? 22 : 16} -${k === 1 ? 30 : 24} s22 ${k === 1 ? 10 : 8} 22 ${k === 1 ? 30 : 24}`} fill={k === 1 ? hatch : "none"} stroke={GOLD} strokeWidth="1.8" />
        </g>))}
      </g>);
    case "goals": // target with arrow
      return (<g>
        <circle cx="70" cy="66" r="38" fill={hatch} stroke={GOLD} strokeWidth="2" filter={glow} />
        <circle cx="70" cy="66" r="26" fill="#06182e" stroke={GOLD} strokeWidth="1.6" /><circle cx="70" cy="66" r="14" fill={foil} stroke={DEEP} strokeWidth=".8" /><circle cx="70" cy="66" r="4" fill="#06182e" />
        <path d="M70 66 L112 24" stroke={PALE} strokeWidth="2.2" strokeLinecap="round" /><path d="M112 24 l-12 2 M112 24 l-2 12" stroke={PALE} strokeWidth="2.2" strokeLinecap="round" />
      </g>);
    case "ai": // lantern / lamp of understanding
      return (<g>
        <path d="M56 100 h28 M60 106 h20" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M46 62 a24 24 0 1 1 48 0 c0 10 -6 16 -10 22 l-2 8 h-24 l-2 -8 c-4 -6 -10 -12 -10 -22z" fill={hatch} stroke={GOLD} strokeWidth="2.2" filter={glow} />
        <path d="M70 46 v22 M62 60 h16" stroke={PALE} strokeWidth="2" strokeLinecap="round" />
        {[-50, -25, 0, 25, 50].map((a) => <line key={a} x1={70 + 32 * Math.sin((a * Math.PI) / 180)} y1={62 - 32 * Math.cos((a * Math.PI) / 180)} x2={70 + 40 * Math.sin((a * Math.PI) / 180)} y2={62 - 40 * Math.cos((a * Math.PI) / 180)} stroke={PALE} strokeWidth="1.4" opacity=".6" strokeLinecap="round" />)}
      </g>);
  }
}

/* Flat variant: one bold gold line-icon on the navy gradient — cleaner at tile sizes. */
function flatMotif(kind: ArtKind, id: string): ReactNode | null {
  const S = { stroke: GOLD, strokeWidth: 3.2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, filter: `url(#${id}g)` };
  switch (kind) {
    case "t1": return (<g {...S}>
      <ellipse cx="60" cy="72" rx="24" ry="8" />
      <path d="M36 72v10c0 4.4 10.7 8 24 8s24-3.6 24-8V72" /><path d="M36 82v10c0 4.4 10.7 8 24 8s24-3.6 24-8V82" />
      <circle cx="90" cy="44" r="17" /><text x="90" y="51" textAnchor="middle" fontSize="19" fontFamily="Georgia,serif" fill={GOLD} stroke="none">£</text>
    </g>);
    case "t2": case "practise": return (<g {...S}>
      {[[40, 44, 100, 60, 84], [62, 34, 88, 44, 72], [84, 52, 106, 62, 92], [106, 30, 78, 38, 62]].map(([x, top, bot, bt, bb]) => (<g key={x}><line x1={x} y1={top} x2={x} y2={bot} /><rect x={x - 8} y={bt} width="16" height={bb - bt} rx="2" /></g>))}
    </g>);
    case "t3": case "safety": return (<g {...S}>
      <path d="M70 22 L106 36 V64 C106 90 88 106 70 114 C52 106 34 90 34 64 V36 Z" />
      <path d="M70 52v22" strokeWidth="4" /><circle cx="70" cy="86" r="2.6" fill={GOLD} stroke="none" />
    </g>);
    case "t4": return (<g {...S}>
      {[[38, 84], [56, 72], [74, 62], [92, 50]].map(([x, y]) => <rect key={x} x={x - 6} y={y} width="12" height={110 - y} rx="2" />)}
      <path d="M32 58 C48 50 62 44 80 30 L104 26" /><path d="M92 24l12 2-2 12" />
    </g>);
    default: return null;
  }
}

/** Full-bleed artwork. Fills its box; the motif stays centred (viewBox 140×132, slice). */
export function Art({ kind, h = 74, w = "100%", label, className, style, flat }: { kind: ArtKind; h?: number | string; w?: number | string; label?: string; className?: string; style?: React.CSSProperties; flat?: boolean }) {
  const id = "a" + useId().replace(/[:]/g, "");
  return (
    <svg className={className} style={style} width={w} height={h} viewBox="0 0 140 132" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id + "bg"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#02193a" /><stop offset=".55" stopColor="#062a52" /><stop offset="1" stopColor="#0b3c6a" /></linearGradient>
        <radialGradient id={id + "r"} cx="80%" cy="12%" r="70%"><stop offset="0" stopColor={GOLD} stopOpacity=".34" /><stop offset=".6" stopColor={GOLD} stopOpacity=".06" /><stop offset="1" stopColor={GOLD} stopOpacity="0" /></radialGradient>
        <radialGradient id={id + "v"} cx="50%" cy="50%" r="70%"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".45" /></radialGradient>
        <linearGradient id={id + "f"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fbe6c2" /><stop offset=".35" stopColor={PALE} /><stop offset=".6" stopColor={GOLD} /><stop offset="1" stopColor={DEEP} /></linearGradient>
        <pattern id={id + "h"} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" stroke={GOLD} strokeWidth=".7" strokeOpacity=".28" /></pattern>
        <filter id={id + "g"} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6" result="b" /><feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .55 0" result="c" /><feMerge><feMergeNode in="c" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id={id + "n"}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="table" tableValues="0 .08" /></feComponentTransfer></filter>
      </defs>
      <rect width="140" height="132" fill={`url(#${id}bg)`} />
      <rect width="140" height="132" fill={`url(#${id}r)`} />
      {!flat && <g opacity=".5" stroke={PALE} strokeWidth=".5" fill="none"><circle cx="70" cy="66" r="58" opacity=".18" /><circle cx="70" cy="66" r="50" opacity=".12" strokeDasharray="1 4" /></g>}
      {(flat && flatMotif(kind, id)) || motif(kind, id)}
      {label && <text x="70" y="74" textAnchor="middle" fontSize="30" fontFamily="var(--serif),Georgia,serif" fill={PALE} style={{ paintOrder: "stroke" }} stroke="#06182e" strokeWidth="4">{label}</text>}
      <rect width="140" height="132" filter={`url(#${id}n)`} opacity=".9" />
      <rect width="140" height="132" fill={`url(#${id}v)`} />
    </svg>
  );
}

/** Small rounded badge, e.g. beside a section title. */
export function ArtBadge({ kind, size = 56, radius = 16, label }: { kind: ArtKind; size?: number; radius?: number; label?: string }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: radius, overflow: "hidden", flex: "none", boxShadow: "0 8px 20px -10px rgba(1,25,54,.7), inset 0 0 0 1px rgba(237,182,113,.35)" }}><Art kind={kind} w={size} h={size} label={label} /></span>;
}

export const TRACK_ART: Record<string, ArtKind> = { t1: "t1", t2: "t2", t3: "t3", t4: "t4" };

"use client";
/* Financial Tools — inputs → calculation → result → what this means. Neutral, educational; the
   figures are illustrative and marked DEMO. No recommendations. */
import { useMemo, useState } from "react";
import { I } from "../icons";
import { Sheet, Disc } from "../ui";
import { TOOLS, type Tool } from "@/lib/calcs";

export function ToolsList({ open, highlight }: { open: (id: string) => void; highlight?: string }) {
  return (<>
    <div className="sec" style={{ marginTop: 14 }}><h2>Financial tools</h2><span className="pill o">Demo figures</span></div>
    <p className="muted" style={{ fontSize: 13.5, marginBottom: 12 }}>Ten calculators that show how the numbers actually work. Each ends with what the result means — never what you should do.</p>
    <div className="grid2">
      {TOOLS.map((t) => (
        <button key={t.id} className="stat" style={{ textAlign: "left", borderColor: highlight === t.id ? "var(--gold)" : undefined }} onClick={() => open(t.id)}>
          <div style={{ color: "var(--gold)", marginBottom: 6 }}>{I.calc}</div>
          <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 14.5, letterSpacing: "-.01em" }}>{t.name}</div>
          <div className="faint" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>{t.blurb}</div>
        </button>
      ))}
    </div>
    <Disc>Every tool is arithmetic on figures you type in. Rates are assumptions, not forecasts. Nothing here is advice, and Ten Talents holds no money.</Disc>
  </>);
}

export function ToolSheet({ id, onClose, preset }: { id: string; onClose: () => void; preset?: Record<string, number> }) {
  const tool = TOOLS.find((t) => t.id === id) as Tool;
  const [v, setV] = useState<Record<string, number>>(() => Object.fromEntries(tool.fields.map((f) => [f.key, preset?.[f.key] ?? f.def])));
  const r = useMemo(() => { try { return tool.run(v); } catch { return null; } }, [tool, v]);
  const max = r?.series ? Math.max(...r.series, 1) : 1;
  return (
    <Sheet onClose={onClose} tall>
      <div className="between"><div><span className="eyebrow">Tool · demo figures</span><h2 style={{ fontSize: 21, marginTop: 4 }}>{tool.name}</h2></div><button className="iconbtn" onClick={onClose} aria-label="Close">{I.close}</button></div>
      <div style={{ flex: 1, overflowY: "auto", marginTop: 10 }}>
        <div className="eyebrow" style={{ margin: "8px 0 6px" }}>Inputs</div>
        <div className="card" style={{ padding: "4px 14px" }}>
          {tool.fields.map((f) => (
            <div key={f.key} className="kv" style={{ alignItems: "center" }}>
              <span style={{ flex: 1, fontSize: 13.5 }}>{f.label}</span>
              <span className="row" style={{ gap: 6 }}>
                {f.unit === "£" && <span className="faint">£</span>}
                <input className="inp mono" type="number" inputMode="decimal" min={f.min} max={f.max} step={f.step ?? 1} value={v[f.key]} style={{ width: 104, padding: "9px 10px", textAlign: "right" }}
                  onChange={(e) => setV({ ...v, [f.key]: e.target.value === "" ? 0 : Math.max(f.min ?? -1e12, Math.min(f.max ?? 1e12, +e.target.value)) })} aria-label={f.label} />
                {f.unit && f.unit !== "£" && <span className="faint" style={{ width: 24 }}>{f.unit}</span>}
              </span>
            </div>
          ))}
        </div>
        {r && (<>
          <div className="eyebrow" style={{ margin: "16px 0 6px" }}>Result</div>
          <div className="card xpcard">
            {r.rows.map(([k, val], i) => (
              <div key={k} className="between" style={{ padding: "6px 0", borderTop: i ? "1px solid rgba(255,255,255,.1)" : undefined }}><span style={{ fontSize: 13, color: "#c9d3de" }}>{k}</span><span className="mono" style={{ fontSize: i === r.rows.length - 1 ? 20 : 15, color: i === r.rows.length - 1 ? "#edb671" : "#fff" }}>{val}</span></div>
            ))}
            {r.series && r.series.length > 2 && (
              <div className="bars" aria-hidden="true" style={{ marginTop: 12 }}>{r.series.map((n, i) => <i key={i} style={{ height: `${Math.max(3, (n / max) * 100)}%` }} />)}</div>
            )}
          </div>
          <div className="take" style={{ marginTop: 12 }}><div className="eyebrow" style={{ marginBottom: 4 }}>What this means</div><p style={{ fontSize: 14, lineHeight: 1.55 }}>{r.meaning}</p></div>
          {r.caution && <p className="muted" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>{r.caution}</p>}
        </>)}
        <Disc>Illustrative only. Demo figures, your inputs, simplified maths. Not a forecast, not advice.</Disc>
      </div>
    </Sheet>
  );
}

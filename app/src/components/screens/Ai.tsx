"use client";
/* Ten Talents AI — rules-based educational tutor with three modes. Every reply carries the
   "Educational only — not financial advice" indicator; the boundary is enforced in lib/ai.ts. */
import { useEffect, useRef, useState } from "react";
import { I } from "../icons";
import { Sheet } from "../ui";
import { answer, type AiMode, type AiContext, type AiReply } from "@/lib/ai";

type Msg = { r: "u" | "a"; t: string; table?: AiReply["table"]; boundary?: boolean; suggest?: string[] };

const MODES: [AiMode, string, string][] = [["learn", "Learn", "Explain a concept"], ["reflect", "Reflect", "Patterns in your learning"], ["understand", "Understand", "Charts, maths, jargon"]];
const HELLO: Record<AiMode, string> = {
  learn: "I'm Ten Talents AI. I explain how money and markets work — leverage, spreads, compounding, inflation, the parable. I never tell you what to buy or sell.",
  reflect: "Reflect mode looks at your own learning and simulated behaviour — planned versus impulse, streaks, gaps in the tracks — and reflects it back without judgement. Ask me what I notice.",
  understand: "Understand mode turns charts, calculations and jargon into plain language. Paste a term or describe what you're looking at.",
};

export function AiSheet({ ctx, onClose, onOpenTool }: { ctx: AiContext; onClose: () => void; onOpenTool?: (id: string) => void }) {
  const [mode, setMode] = useState<AiMode>("learn");
  const [feed, setFeed] = useState<Msg[]>([{ r: "a", t: HELLO.learn, suggest: ["What is leverage?", "Explain compounding", "How does a spread work?"] }]);
  const [q, setQ] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);
  useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight }); }, [feed]);

  const ask = (text: string) => {
    const t = text.trim(); if (!t) return;
    const a = answer(mode, t, ctx);
    setFeed((f) => [...f, { r: "u", t }, { r: "a", t: a.text, table: a.table, boundary: a.boundary, suggest: a.suggest }]);
    setQ("");
  };
  const switchMode = (m: AiMode) => { setMode(m); setFeed((f) => [...f, { r: "a", t: HELLO[m], suggest: m === "reflect" ? ["What do you notice about my learning?", "Am I planning my trades?"] : m === "understand" ? ["Explain a candlestick", "What is APR?", "What's a pip?"] : ["What is leverage?", "Explain compounding", "How does a spread work?"] }]); };
  const suggestAction = (s: string) => {
    const m = /Try the (.+?) tool/i.exec(s); if (m && onOpenTool) { const id = ({ "leverage": "leverage", "position size": "position", "compound interest": "compound", "inflation": "inflation", "emergency fund": "emergency", "loan repayment": "loan" } as Record<string, string>)[m[1].toLowerCase()]; if (id) { onOpenTool(id); return; } }
    if (/^Open |^Read:/.test(s)) { ask(s.replace(/^Open |^Read: /, "")); return; }
    ask(s);
  };

  return (
    <Sheet onClose={onClose} tall>
      <div className="between" style={{ marginBottom: 8 }}>
        <div className="row"><div className="av" style={{ width: 34, height: 34, fontSize: 14, borderWidth: 1.5 }}>{I.ai}</div><div><b style={{ fontSize: 15, fontFamily: "var(--display)" }}>Ten Talents AI</b><div className="faint" style={{ fontSize: 11 }}>Explains · reflects · never advises</div></div></div>
        <button className="iconbtn" onClick={onClose} aria-label="Close">{I.close}</button>
      </div>
      <div className="hscroll" style={{ margin: "0 -18px 8px" }}>{MODES.map(([m, label, d]) => <button key={m} className={`chip ${mode === m ? "on" : ""}`} onClick={() => switchMode(m)} title={d}>{label}</button>)}</div>
      <div className="ai-ind" role="note">{I.shield}<span>Educational only — not financial advice</span></div>
      <div ref={feedRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "10px 0" }}>
        {feed.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.r === "u" ? "flex-end" : "flex-start", gap: 6 }}>
            <div className={`msg ${m.r}`} style={m.boundary ? { borderColor: "var(--gold)" } : undefined}>{m.t}</div>
            {m.table && (
              <div className="card" style={{ padding: "4px 14px", maxWidth: "84%" }}>
                <table className="aitab"><thead><tr>{m.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{m.table.rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} className={ci ? "mono" : ""}>{c}</td>)}</tr>)}</tbody></table>
              </div>
            )}
            {m.r === "a" && m.suggest && i === feed.length - 1 && (
              <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>{m.suggest.map((s) => <button key={s} className="chip" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => suggestAction(s)}>{s}</button>)}</div>
            )}
          </div>
        ))}
      </div>
      <form className="row" style={{ gap: 8 }} onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder={mode === "reflect" ? "Ask what I notice…" : "Ask about a concept…"} aria-label="Ask Ten Talents AI" />
        <button className="btn" type="submit" style={{ width: "auto", padding: "0 18px" }} aria-label="Send">{I.arrow}</button>
      </form>
      <p className="demo-note" style={{ marginTop: 8 }}>Rules-based tutor built on Academy content. No buy/sell recommendations, no predictions, no personal advice. Ten Talents is not FCA authorised.</p>
    </Sheet>
  );
}

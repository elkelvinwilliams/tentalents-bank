"use client";
/* Wisdom — Biblical Mysteries and Biblical Wealth. Interpretation, never prediction. */
import { I } from "../icons";
import { Disc } from "../ui";
import { MYSTERIES, WEALTH_PRINCIPLES } from "@/content/wisdom";

export function WisdomList({ seg, setSeg, open }: { seg: "myst" | "wealth"; setSeg: (s: "myst" | "wealth") => void; open: (n: string) => void }) {
  return (<>
    <div className="hscroll" style={{ marginBottom: 14 }}>
      <button className={`chip ${seg === "myst" ? "on" : ""}`} onClick={() => setSeg("myst")}>Biblical Mysteries</button>
      <button className={`chip ${seg === "wealth" ? "on" : ""}`} onClick={() => setSeg("wealth")}>Biblical Wealth</button>
    </div>
    {seg === "myst" ? (<>
      <p className="muted" style={{ fontSize: 14, marginBottom: 14 }}>The lesser-discussed economics of scripture — preparation, debt, ownership, power. Curious, never sensational. Interpretations shown as interpretations.</p>
      {MYSTERIES.map((m) => (
        <button key={m.n} className="card coursewide reveal" style={{ marginBottom: 11, opacity: m.open ? 1 : 0.6 }} onClick={() => open(m.n)}>
          <span className="th" style={{ background: "var(--xp-grad)", color: "var(--gold-bright)", fontFamily: "var(--serif)", fontSize: 26 }}>{m.n}</span>
          <span style={{ flex: 1, textAlign: "left" }}><h3 style={{ fontSize: 15 }}>{m.title}</h3><p className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>{m.blurb}</p></span>
          {m.open ? I.arrow : I.lock}
        </button>
      ))}
    </>) : (<>
      <p className="muted" style={{ fontSize: 14, marginBottom: 14 }}>Stewardship principles set beside modern practice — diligence, saving, generosity, debt, preparation.</p>
      <div className="grid2">{WEALTH_PRINCIPLES.map((b, i) => <div key={b} className="card" style={{ padding: 14 }}><span className="mono faint" style={{ fontSize: 11 }}>{String(i + 1).padStart(2, "0")}</span><div style={{ fontWeight: 600, marginTop: 5 }}>{b}</div></div>)}</div>
      <div className="card card-gold reveal" style={{ marginTop: 12 }}>
        <div className="eyebrow">Featured</div><h3 style={{ fontSize: 17, margin: "8px 0 4px" }}>The Parable of the Talents</h3>
        <p className="muted" style={{ fontSize: 13.5 }}>Capital entrusted to three servants; two grow it, one buries it in fear. A study in stewardship.</p>
        <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => open("02")}>Open {I.arrow}</button>
      </div>
    </>)}
    <Disc>Interpretive study. Theological views are perspectives, not uncontested fact. Nothing here claims scripture predicts prices.</Disc>
  </>);
}

export function WisdomStudy({ n, back, open }: { n: string; back: () => void; open: (n: string) => void }) {
  const m = MYSTERIES.find((x) => x.n === n) ?? MYSTERIES[0];
  return (<>
    <div className="pagehdr"><button className="iconbtn" onClick={back} aria-label="Back">{I.back}</button><div style={{ flex: 1 }}><span className="eyebrow">Biblical Mysteries · {m.n}</span></div></div>
    <div className="reader reveal">
      <h1 style={{ fontSize: 27, marginBottom: 16 }}>{m.title}</h1>
      {m.parts.map(([h, body]) => <div key={h} className="card" style={{ marginBottom: 12 }}><div className="eyebrow">{h}</div><p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-line", marginBottom: 0 }}>{body}</p></div>)}
      {!m.open && (
        <div className="card card-gold"><b>Study 01 is fully written.</b><p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Open “The Economics of Joseph” to see the format in full. The rest publish as they are written.</p><button className="btn btn-sm" style={{ marginTop: 12 }} onClick={() => open("01")}>Read 01 {I.arrow}</button></div>
      )}
      <Disc>Interpretive study. Theological views are perspectives, not uncontested fact. Nothing claims scripture predicts prices.</Disc>
    </div>
  </>);
}

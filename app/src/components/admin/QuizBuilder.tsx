"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Q = { q: string; options: string[]; correct: number; why: string };
const blank = (): Q => ({ q: "", options: ["", "", "", ""], correct: 0, why: "" });

export default function QuizBuilder({ moduleId, initial }: { moduleId: string; initial: Q[] }) {
  const router = useRouter();
  const [qs, setQs] = useState<Q[]>(initial.length ? initial : [blank()]);
  const [msg, setMsg] = useState<string | null>(null);
  const upd = (i: number, patch: Partial<Q>) => setQs(qs.map((q, n) => (n === i ? { ...q, ...patch } : q)));

  const save = async () => {
    setMsg(null);
    const res = await fetch("/api/admin/content", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "quiz-upsert", parentId: moduleId, questions: qs }),
    });
    const d = await res.json();
    setMsg(res.ok ? (d.removed ? "No valid questions — quiz removed from the module." : `Saved ${d.count} questions.`) : d.error ?? "Save failed.");
    router.refresh();
  };

  return (
    <div>
      {qs.map((q, i) => (
        <div className="card" style={{ margin: "16px 0" }} key={i}>
          <label className="flabel" htmlFor={`q${i}`}>Question {i + 1}</label>
          <input id={`q${i}`} className="afield" value={q.q} onChange={(e) => upd(i, { q: e.target.value })} />
          {q.options.map((o, oi) => (
            <div key={oi} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="radio" name={`correct${i}`} checked={q.correct === oi} onChange={() => upd(i, { correct: oi })}
                aria-label={`Mark option ${oi + 1} correct`} />
              <input className="afield" style={{ margin: "4px 0" }} placeholder={`Option ${oi + 1}`} value={o}
                onChange={(e) => upd(i, { options: q.options.map((x, xi) => (xi === oi ? e.target.value : x)) })} />
            </div>
          ))}
          <label className="flabel" htmlFor={`w${i}`}>Explanation (shown after answering)</label>
          <textarea id={`w${i}`} className="afield" rows={2} value={q.why} onChange={(e) => upd(i, { why: e.target.value })} />
          <button className="abtn danger" onClick={() => setQs(qs.filter((_, n) => n !== i))}>Remove question</button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className="abtn ghost" onClick={() => setQs([...qs, blank()])}>+ Question</button>
        <button className="abtn" onClick={save}>Save quiz</button>
        {msg && <span style={{ fontSize: 14, color: "var(--gold)" }}>{msg}</span>}
      </div>
    </div>
  );
}

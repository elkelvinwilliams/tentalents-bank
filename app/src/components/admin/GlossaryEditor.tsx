"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Term = { id: string; term: string; definition: string; position: number };

export default function GlossaryEditor({ terms }: { terms: Term[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const act = async (body: unknown) => {
    setBusy(true);
    await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false); router.refresh();
  };
  return (
    <div>
      <table className="atable" style={{ marginTop: 16 }}>
        <thead><tr><th style={{ width: "22%" }}>Term</th><th>Definition</th><th style={{ width: 200 }}>Actions</th></tr></thead>
        <tbody>
          {terms.map((t) => (
            <tr key={t.id}>
              <td><input className="afield" style={{ margin: 0 }} defaultValue={t.term} aria-label={`Term ${t.term}`}
                onBlur={(e) => e.target.value !== t.term && act({ op: "update", kind: "glossary", id: t.id, fields: { term: e.target.value } })} /></td>
              <td><textarea className="afield" style={{ margin: 0 }} rows={2} defaultValue={t.definition} aria-label={`Definition of ${t.term}`}
                onBlur={(e) => e.target.value !== t.definition && act({ op: "update", kind: "glossary", id: t.id, fields: { definition: e.target.value } })} /></td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button className="abtn ghost" disabled={busy} aria-label="Move up" onClick={() => act({ op: "reorder", kind: "glossary", id: t.id, direction: "up" })}>↑</button>
                <button className="abtn ghost" disabled={busy} aria-label="Move down" onClick={() => act({ op: "reorder", kind: "glossary", id: t.id, direction: "down" })}>↓</button>
                <button className="abtn danger" disabled={busy} onClick={() => window.confirm(`Delete "${t.term}"?`) && act({ op: "glossary-delete", id: t.id })}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 14 }}>
        <button className="abtn" disabled={busy} onClick={() => act({ op: "create", kind: "glossary" })}>+ New term</button>
      </div>
    </div>
  );
}

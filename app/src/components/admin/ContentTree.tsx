"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type L = { id: string; title: string; minutes: number; isFreePreview: boolean; published: boolean };
type M = { id: string; name: string; published: boolean; lessons: L[]; hasQuiz: boolean };
type T = { id: string; name: string; blurb: string; published: boolean; modules: M[] };

export default function ContentTree({ data }: { data: T[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const act = async (body: unknown) => {
    setBusy(true);
    await fetch("/api/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    router.refresh();
  };
  const Move = ({ kind, id, parentId }: { kind: string; id: string; parentId?: string }) => (<>
    <button className="abtn ghost" aria-label="Move up" disabled={busy} onClick={() => act({ op: "reorder", kind, id, parentId, direction: "up" })}>↑</button>
    <button className="abtn ghost" aria-label="Move down" disabled={busy} onClick={() => act({ op: "reorder", kind, id, parentId, direction: "down" })}>↓</button>
  </>);
  const Pub = ({ kind, id, published }: { kind: string; id: string; published: boolean }) => (
    <button className={`abtn ${published ? "ghost" : ""}`} disabled={busy}
      onClick={() => act({ op: "update", kind, id, fields: { published: !published } })}>
      {published ? "Unpublish" : "Publish"}
    </button>
  );

  return (
    <div>
      {data.map((t) => (
        <div key={t.id} className="card" style={{ margin: "16px 0" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={{ flex: 1 }}>{t.name}{!t.published && <span style={{ color: "var(--risk)", fontSize: 12 }}> · unpublished</span>}</h3>
            <input className="afield" style={{ maxWidth: 260, margin: 0 }} defaultValue={t.name} aria-label={`Rename ${t.name}`}
              onBlur={(e) => e.target.value !== t.name && act({ op: "update", kind: "track", id: t.id, fields: { name: e.target.value } })} />
            <Move kind="track" id={t.id} /><Pub kind="track" id={t.id} published={t.published} />
          </div>
          <textarea className="afield" defaultValue={t.blurb} rows={2} aria-label={`Blurb for ${t.name}`}
            onBlur={(e) => e.target.value !== t.blurb && act({ op: "update", kind: "track", id: t.id, fields: { blurb: e.target.value } })} />
          {t.modules.map((m) => (
            <div key={m.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input className="afield" style={{ maxWidth: 240, margin: 0, fontWeight: 600 }} defaultValue={m.name} aria-label={`Rename module ${m.name}`}
                  onBlur={(e) => e.target.value !== m.name && act({ op: "update", kind: "module", id: m.id, fields: { name: e.target.value } })} />
                <Move kind="module" id={m.id} parentId={t.id} /><Pub kind="module" id={m.id} published={m.published} />
                <Link className="abtn ghost" href={`/admin/quiz/${m.id}`}>{m.hasQuiz ? "Edit quiz" : "Add quiz"}</Link>
              </div>
              <table className="atable" style={{ marginTop: 8 }}>
                <tbody>
                  {m.lessons.map((l) => (
                    <tr key={l.id}>
                      <td style={{ width: "45%" }}>{l.title}{!l.published && <span style={{ color: "var(--risk)", fontSize: 12 }}> · unpublished</span>}{l.isFreePreview && <span style={{ color: "var(--gold)", fontSize: 12 }}> · free preview</span>}</td>
                      <td>{l.minutes ? `${l.minutes} min` : "no content"}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <Link className="abtn" href={`/admin/lesson/${l.id}`}>Edit</Link>
                        <Move kind="lesson" id={l.id} parentId={m.id} />
                        <Pub kind="lesson" id={l.id} published={l.published} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="abtn ghost" disabled={busy} onClick={() => act({ op: "create", kind: "lesson", parentId: m.id })}>+ Lesson</button>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <button className="abtn ghost" disabled={busy} onClick={() => act({ op: "create", kind: "module", parentId: t.id })}>+ Module</button>
          </div>
        </div>
      ))}
      <button className="abtn" disabled={busy} onClick={() => act({ op: "create", kind: "track" })}>+ New track</button>
    </div>
  );
}

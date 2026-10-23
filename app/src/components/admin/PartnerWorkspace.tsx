"use client";
/* Affiliate Partnerships — one firm's workspace. Sections A–G from the brief plus the audit
   trail. Fields auto-save on blur/change through the admin API, which validates everything
   server-side and writes the audit trail. Three independent status axes; plain labels. */
import { useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Workspace } from "@/lib/partners-data";
import { APPLICATION_STATUS, TERMS_STATUS, COMPLIANCE_STATUS, MODEL, COUNTRY_ELIGIBILITY, PERMITTED, RESEARCH_TOPICS, VERIFICATION, TERM_KEYS, CHANNELS, COMM_KIND, TASK_PRIORITY, TASK_STATUS, LEDGER_KIND, REPORT_SOURCE, label, commLabel, COMM_LABEL, fmtDate, overdue, money } from "@/lib/partners";
import { Status, Logo } from "./PartnersOverview";

type Tab = "overview" | "research" | "application" | "terms" | "compliance" | "comms" | "performance" | "audit";
const TABS: [Tab, string][] = [["overview", "Overview"], ["research", "Research & eligibility"], ["application", "Application"], ["terms", "Commercial terms"], ["compliance", "Compliance"], ["comms", "Communications & tasks"], ["performance", "Performance & payments"], ["audit", "Audit trail"]];
const MONEY_KEYS = new Set(["cpa_amount", "min_deposit", "min_payout"]);

function useSave(firmId: string) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = useCallback(async (entity: string, action: "create" | "update" | "delete", id: string | undefined, fields?: Record<string, unknown>) => {
    const r = await fetch(`/api/admin/partners/${firmId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entity, action, id, fields }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg({ ok: false, text: d.error ?? "Could not save." }); return false; }
    setMsg({ ok: true, text: "Saved" }); setTimeout(() => setMsg(null), 1800); router.refresh(); return true;
  }, [firmId, router]);
  return { save, msg };
}

/* ---- field primitives (defaultValue + save on blur / change) ---- */
function F({ label: l, hint, full, children }: { label: string; hint?: string; full?: boolean; children: ReactNode }) { return <div className={`ptfield ${full ? "full" : ""}`}><label>{l}</label>{children}{hint && <div className="hint">{hint}</div>}</div>; }
function Txt({ value, onSave, rows, placeholder, type = "text" }: { value: string | null | undefined; onSave: (v: string) => void; rows?: number; placeholder?: string; type?: string }) {
  const v = value ?? "";
  return rows ? <textarea className="afield" rows={rows} defaultValue={v} placeholder={placeholder} onBlur={(e) => e.target.value !== v && onSave(e.target.value)} /> : <input className="afield" type={type} defaultValue={v} placeholder={placeholder} onBlur={(e) => e.target.value !== v && onSave(e.target.value)} />;
}
function Sel({ value, options, onSave, allowEmpty }: { value: string | null | undefined; options: readonly string[] | [string, string][]; onSave: (v: string) => void; allowEmpty?: string }) {
  return <select className="afield" value={value ?? ""} onChange={(e) => onSave(e.target.value)}>{allowEmpty !== undefined && <option value="">{allowEmpty}</option>}{options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{label(o)}</option>))}</select>;
}
const Dt = ({ value, onSave }: { value: string | null | undefined; onSave: (v: string) => void }) => <input className="afield" type="date" defaultValue={value ?? ""} onBlur={(e) => (e.target.value || "") !== (value ?? "") && onSave(e.target.value)} />;

export default function PartnerWorkspace({ ws }: { ws: Workspace }) {
  const { firm } = ws; const { save, msg } = useSave(firm.id);
  const [tab, setTab] = useState<Tab>("overview");
  const up = (entity: string, id?: string) => (fields: Record<string, unknown>) => save(entity, "update", id, fields);
  const firmUp = up("firm");
  const approved = firm.applicationStatus === "approved";

  return (<>
    <div className="row" style={{ gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
      <Logo name={firm.name} url={ws.logoSrc} />
      <div style={{ flex: 1, minWidth: 240 }}>
        <h1 style={{ fontSize: 24 }}>{firm.name}</h1>
        <div className="sub" style={{ marginTop: 2 }}>{label(firm.model)} · Owner {firm.owner || "—"} · Research {fmtDate(firm.lastResearchAt)} · {firm.programmeUrl ? <a href={firm.programmeUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>Official programme page ↗</a> : "no programme URL"}</div>
      </div>
      <div className={`ptsaved ${msg && !msg.ok ? "err" : ""}`} role="status">{msg?.text ?? ""}</div>
    </div>
    <div className="ptstats" style={{ marginTop: 14 }}>
      <div className="ptstat"><div className="k">Application</div><div style={{ marginTop: 6 }}><Status v={firm.applicationStatus} /></div></div>
      <div className="ptstat"><div className="k">Commercial terms</div><div style={{ marginTop: 6 }}><Status v={firm.termsStatus} /></div></div>
      <div className="ptstat"><div className="k">Compliance</div><div style={{ marginTop: 6 }}><Status v={firm.complianceStatus} /></div></div>
      <div className="ptstat"><div className="k">Next action due</div><div className="v" style={{ fontSize: 16, color: overdue(firm.nextActionDue) ? "var(--red)" : undefined }}>{fmtDate(firm.nextActionDue)}{overdue(firm.nextActionDue) ? " · overdue" : ""}</div></div>
    </div>
    <div className="pttabs" role="tablist">{TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>

    {/* ---------- A. Overview ---------- */}
    {tab === "overview" && (<>
      <div className="ptnote">The three statuses are independent. Approved application ≠ confirmed terms ≠ compliance approval. Change a status only when the evidence for it is recorded in the matching section.</div>
      <div className="ptform">
        <F label="Company name"><Txt value={firm.name} onSave={(v) => firmUp({ name: v })} /></F>
        <F label="Logo URL" hint="Optional. Leave blank for the text fallback."><Txt value={firm.logoUrl} onSave={(v) => firmUp({ logoUrl: v || null })} placeholder="https://" /></F>
        <F label="Official programme URL"><Txt value={firm.programmeUrl} onSave={(v) => firmUp({ programmeUrl: v })} placeholder="https://" /></F>
        <F label="Official application / contact route"><Txt value={firm.applyUrl} onSave={(v) => firmUp({ applyUrl: v })} placeholder="https:// or 'email partnerships@…'" /></F>
        <F label="Requirements page URL"><Txt value={firm.requirementsUrl} onSave={(v) => firmUp({ requirementsUrl: v })} placeholder="https://" /></F>
        <F label="Partnership model under consideration"><Sel value={firm.model} options={MODEL} onSave={(v) => firmUp({ model: v })} /></F>
        <F label="Application status"><Sel value={firm.applicationStatus} options={APPLICATION_STATUS} onSave={(v) => firmUp({ applicationStatus: v })} /></F>
        <F label="Commercial terms status" hint="Confirmed requires at least one term marked Confirmed with its source."><Sel value={firm.termsStatus} options={TERMS_STATUS} onSave={(v) => firmUp({ termsStatus: v })} /></F>
        <F label="Compliance status"><Sel value={firm.complianceStatus} options={COMPLIANCE_STATUS} onSave={(v) => firmUp({ complianceStatus: v })} /></F>
        <F label="Country eligibility"><Sel value={firm.countryEligibility} options={COUNTRY_ELIGIBILITY} onSave={(v) => firmUp({ countryEligibility: v })} /></F>
        <F label="Country eligibility note"><Txt value={firm.countryNote} onSave={(v) => firmUp({ countryNote: v })} placeholder="e.g. UK publishers accepted; UK customers eligible — confirmed by email 1 Nov" /></F>
        <F label="Target countries" hint="ISO codes, comma-separated (GB, IE…)."><Txt value={(firm.targetCountries ?? []).join(", ")} onSave={(v) => firmUp({ targetCountries: v.split(/[,\s]+/).filter(Boolean) })} /></F>
        <F label="Assigned owner"><Txt value={firm.owner} onSave={(v) => firmUp({ owner: v })} /></F>
        <F label="Last research date"><Dt value={firm.lastResearchAt} onSave={(v) => firmUp({ lastResearchAt: v || null })} /></F>
        <F label="Last contact date" hint="Also set automatically when a communication is logged."><Dt value={firm.lastContactAt} onSave={(v) => firmUp({ lastContactAt: v || null })} /></F>
        <F label="Next action" full><Txt rows={2} value={firm.nextAction} onSave={(v) => firmUp({ nextAction: v })} /></F>
        <F label="Next-action due date"><Dt value={firm.nextActionDue} onSave={(v) => firmUp({ nextActionDue: v || null })} /></F>
        <F label="Internal notes" full hint="Operational notes only. Never paste identity documents, bank details or passwords here."><Txt rows={5} value={firm.notes} onSave={(v) => firmUp({ notes: v })} /></F>
      </div>
    </>)}

    {/* ---------- B. Research & eligibility ---------- */}
    {tab === "research" && (<>
      <div className="ptnote">Each claim carries its source and a verification state. <b>Assumption</b> = taken from a public page or the brief, not yet checked. <b>Verified</b> = checked against the linked official source on the date shown. <b>Open question</b> = needs written confirmation from the firm.</div>
      <div className="ptsec"><h2>Claims</h2><button className="abtn ghost" onClick={() => save("research", "create", undefined, { topic: "other", claim: "", verification: "open_question" })}>+ Add claim</button></div>
      {ws.research.length ? <div className="ptwrap"><table className="pttable"><thead><tr><th style={{ width: 200 }}>Topic</th><th>Claim</th><th style={{ width: 220 }}>Source URL</th><th style={{ width: 150 }}>Verification</th><th style={{ width: 150 }}>Verified on</th><th>Notes</th><th /></tr></thead><tbody>
        {ws.research.map((r) => { const u = up("research", r.id); return (
          <tr key={r.id}>
            <td><Sel value={r.topic} options={RESEARCH_TOPICS} onSave={(v) => u({ topic: v })} /></td>
            <td><Txt rows={2} value={r.claim} onSave={(v) => u({ claim: v })} /></td>
            <td><Txt value={r.sourceUrl} onSave={(v) => u({ sourceUrl: v })} placeholder="https://" />{r.sourceUrl && <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: "var(--gold)" }}>open ↗</a>}</td>
            <td><Sel value={r.verification} options={VERIFICATION} onSave={(v) => u({ verification: v })} /><div style={{ marginTop: 4 }}><Status v={r.verification} /></div></td>
            <td><Dt value={r.verifiedAt} onSave={(v) => u({ verifiedAt: v || null })} /></td>
            <td><Txt rows={2} value={r.notes} onSave={(v) => u({ notes: v })} /></td>
            <td><button className="abtn danger" onClick={() => window.confirm("Delete this claim?") && save("research", "delete", r.id)}>Delete</button></td>
          </tr>); })}
      </tbody></table></div> : <div className="ptempty">No research recorded yet.</div>}
      <div className="ptsec"><h2>Open questions requiring written confirmation</h2></div>
      <div className="ptcard">{ws.research.filter((r) => r.verification === "open_question").length ? <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>{ws.research.filter((r) => r.verification === "open_question").map((r) => <li key={r.id}><b>{label(r.topic)}:</b> {r.claim}</li>)}</ul> : <span className="muted" style={{ fontSize: 13.5 }}>None open.</span>}</div>
    </>)}

    {/* ---------- C. Application ---------- */}
    {tab === "application" && (() => { const a = ws.application; const u = up("application"); const cl = a?.checklist ?? []; const docs = a?.documents ?? []; return (<>
      <div className="ptnote">Store <b>references</b> to documents (e.g. “password manager › Axi › ID”), never the documents, numbers or images themselves.</div>
      <div className="ptsec"><h2>Application checklist</h2><button className="abtn ghost" onClick={() => u({ checklist: [...cl, { label: "New item", done: false }] })}>+ Item</button></div>
      <div className="ptcard">{cl.length ? cl.map((c, i) => <div key={i} className="ptcheck"><input type="checkbox" checked={c.done} onChange={(e) => u({ checklist: cl.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)) })} aria-label={c.label} /><input className="afield" defaultValue={c.label} onBlur={(e) => e.target.value !== c.label && u({ checklist: cl.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} style={{ flex: 1 }} /><button className="abtn danger" onClick={() => u({ checklist: cl.filter((_, j) => j !== i) })}>×</button></div>) : <span className="muted">Empty.</span>}</div>
      <div className="ptsec"><h2>Document checklist</h2><button className="abtn ghost" onClick={() => u({ documents: [...docs, { label: "New document", locationRef: "", done: false }] })}>+ Document</button></div>
      <div className="ptcard">{docs.length ? docs.map((d, i) => <div key={i} className="ptcheck"><input type="checkbox" checked={d.done} onChange={(e) => u({ documents: docs.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)) })} aria-label={d.label} /><input className="afield" defaultValue={d.label} onBlur={(e) => e.target.value !== d.label && u({ documents: docs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} style={{ flex: 1 }} /><input className="afield" defaultValue={d.locationRef} placeholder="secure location reference" onBlur={(e) => e.target.value !== d.locationRef && u({ documents: docs.map((x, j) => (j === i ? { ...x, locationRef: e.target.value } : x)) })} style={{ flex: 1 }} /><button className="abtn danger" onClick={() => u({ documents: docs.filter((_, j) => j !== i) })}>×</button></div>) : <span className="muted">Empty.</span>}</div>
      <div className="ptsec"><h2>Submission</h2></div>
      <div className="ptform">
        <F label="Submission date" hint="Leave blank until actually submitted."><Dt value={a?.submittedAt} onSave={(v) => u({ submittedAt: v || null })} /></F>
        <F label="Broker reference number"><Txt value={a?.referenceNo} onSave={(v) => u({ referenceNo: v })} /></F>
        <F label="Contact person"><Sel value={a?.contactId ?? ""} options={ws.contacts.map((c) => [c.id, `${c.name || "(unnamed)"}${c.role ? " · " + c.role : ""}`] as [string, string])} onSave={(v) => u({ contactId: v || null })} allowEmpty="— none —" /></F>
        <F label="Follow-up date"><Dt value={a?.followUpAt} onSave={(v) => u({ followUpAt: v || null })} /></F>
        <F label="Outcome"><Txt value={a?.outcome} onSave={(v) => u({ outcome: v })} placeholder="e.g. Accepted / Declined / Pending" /></F>
        <F label="Reasons given (if declined)" full><Txt rows={3} value={a?.outcomeReason} onSave={(v) => u({ outcomeReason: v })} /></F>
        <F label="Application notes" full><Txt rows={4} value={a?.notes} onSave={(v) => u({ notes: v })} /></F>
      </div>
      <div className="ptsec"><h2>Contacts</h2><button className="abtn ghost" onClick={() => save("contact", "create", undefined, { name: "", isPrimary: ws.contacts.length === 0 })}>+ Contact</button></div>
      {ws.contacts.length ? <div className="ptwrap"><table className="pttable"><thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Primary</th><th>Notes</th><th /></tr></thead><tbody>
        {ws.contacts.map((c) => { const cu = up("contact", c.id); return (<tr key={c.id}>
          <td><Txt value={c.name} onSave={(v) => cu({ name: v })} /></td><td><Txt value={c.role} onSave={(v) => cu({ role: v })} /></td><td><Txt value={c.email} onSave={(v) => cu({ email: v })} type="email" /></td><td><Txt value={c.phone} onSave={(v) => cu({ phone: v })} /></td>
          <td><input type="radio" name="primary" checked={c.isPrimary} onChange={() => cu({ isPrimary: true })} aria-label="Primary contact" /></td><td><Txt value={c.notes} onSave={(v) => cu({ notes: v })} /></td>
          <td><button className="abtn danger" onClick={() => window.confirm("Delete contact?") && save("contact", "delete", c.id)}>Delete</button></td></tr>); })}
      </tbody></table></div> : <div className="ptempty">No contacts recorded. Use the official contact route on the programme page.</div>}
    </>); })()}

    {/* ---------- D. Commercial terms ---------- */}
    {tab === "terms" && (<>
      <div className="ptnote">Every value has its own source and status. A public <b>“up to”</b> figure is a ceiling, not a rate: record it as <b>Unverified</b> with the page URL until the firm confirms the actual terms in writing. A registration is not a qualified referral until the contract conditions are met.</div>
      <div className="ptwrap"><table className="pttable"><thead><tr><th style={{ width: 210 }}>Term</th><th>Value</th><th style={{ width: 70 }}>Ccy</th><th style={{ width: 200 }}>Source URL</th><th>Source note</th><th style={{ width: 150 }}>Status</th><th style={{ width: 150 }}>Verified on</th></tr></thead><tbody>
        {TERM_KEYS.map((key) => { const t = ws.terms.find((x) => x.key === key); const u = up("term", key); return (<tr key={key}>
          <td style={{ fontWeight: 600 }}>{label(key)}</td>
          <td><Txt value={t?.value} onSave={(v) => u({ value: v })} placeholder={MONEY_KEYS.has(key) ? "amount" : ""} /></td>
          <td>{MONEY_KEYS.has(key) ? <Txt value={t?.currency} onSave={(v) => u({ currency: v.toUpperCase() })} placeholder="GBP" /> : <span className="faint">—</span>}</td>
          <td><Txt value={t?.sourceUrl} onSave={(v) => u({ sourceUrl: v })} placeholder="https://" /></td>
          <td><Txt value={t?.sourceNote} onSave={(v) => u({ sourceNote: v })} placeholder="e.g. email from partner manager, 3 Nov" /></td>
          <td><Sel value={t?.status ?? "unverified"} options={TERMS_STATUS} onSave={(v) => u({ status: v })} /><div style={{ marginTop: 4 }}><Status v={t?.status ?? "unverified"} /></div></td>
          <td><Dt value={t?.verifiedAt} onSave={(v) => u({ verifiedAt: v || null })} /></td>
        </tr>); })}
      </tbody></table></div>
    </>)}

    {/* ---------- E. Compliance ---------- */}
    {tab === "compliance" && (() => { const c = ws.compliance; const u = up("compliance"); return (<>
      <div className="ptnote">An affiliate agreement is <b>not</b> permission to communicate regulated financial promotions. Ten Talents is not FCA-authorised; approval of each channel’s content by the broker’s compliance team (or an authorised approver) must be recorded here before anything is published. If authorisation might be required, flag it for qualified legal review.</div>
      <div className="ptform">
        <F label="Is Ten Talents permitted to promote this product to the intended audience?"><Sel value={c?.permittedToPromote ?? "unknown"} options={PERMITTED} onSave={(v) => u({ permittedToPromote: v })} /></F>
        <F label="Legal entity that contracts with the programme"><Txt value={c?.contractingEntity} onSave={(v) => u({ contractingEntity: v })} placeholder="Kelvin Williams (sole trader) until incorporation" /></F>
        <F label="External legal advice required?"><label className="ptcheck" style={{ border: 0, padding: "8px 0" }}><input type="checkbox" checked={!!c?.legalAdviceRequired} onChange={(e) => u({ legalAdviceRequired: e.target.checked })} /> <span>Flag for qualified legal / compliance review</span></label></F>
        <F label="Country and product restrictions" full><Txt rows={3} value={c?.restrictions} onSave={(v) => u({ restrictions: v })} /></F>
        <F label="Required risk warnings" full><Txt rows={3} value={c?.riskWarnings} onSave={(v) => u({ riskWarnings: v })} placeholder="Exact wording required by the firm / applicable rules" /></F>
        <F label="Affiliate disclosure wording" full><Txt rows={3} value={c?.disclosureWording} onSave={(v) => u({ disclosureWording: v })} /></F>
        <F label="Outstanding questions for the broker's compliance team" full><Txt rows={3} value={c?.openQuestions} onSave={(v) => u({ openQuestions: v })} /></F>
        <F label="Compliance notes" full><Txt rows={3} value={c?.notes} onSave={(v) => u({ notes: v })} /></F>
      </div>
      <div className="ptsec"><h2>Channel approvals</h2><span className="sub">one record per channel; “Approved for Specified Use” needs a content reference</span></div>
      <div className="ptwrap"><table className="pttable"><thead><tr><th style={{ width: 200 }}>Channel</th><th style={{ width: 190 }}>Status</th><th>Approved content reference</th><th style={{ width: 90 }}>Version</th><th style={{ width: 150 }}>Approved on</th><th style={{ width: 150 }}>Review / expiry</th><th>Notes</th></tr></thead><tbody>
        {CHANNELS.map((ch) => { const r = ws.channels.find((x) => x.channel === ch); const cu = up("channel", ch); return (<tr key={ch}>
          <td style={{ fontWeight: 600 }}>{label(ch)}</td>
          <td><Sel value={r?.status ?? "not_reviewed"} options={COMPLIANCE_STATUS} onSave={(v) => cu({ status: v })} /><div style={{ marginTop: 4 }}><Status v={r?.status ?? "not_reviewed"} /></div></td>
          <td><Txt value={r?.contentRef} onSave={(v) => cu({ contentRef: v })} placeholder="URL or document reference" /></td>
          <td><Txt value={r?.version} onSave={(v) => cu({ version: v })} /></td>
          <td><Dt value={r?.approvedAt} onSave={(v) => cu({ approvedAt: v || null })} /></td>
          <td><Dt value={r?.reviewAt} onSave={(v) => cu({ reviewAt: v || null })} /></td>
          <td><Txt value={r?.notes} onSave={(v) => cu({ notes: v })} /></td>
        </tr>); })}
      </tbody></table></div>
    </>); })()}

    {/* ---------- F. Communications & tasks ---------- */}
    {tab === "comms" && <CommsTasks ws={ws} save={save} />}

    {/* ---------- G. Performance & payments ---------- */}
    {tab === "performance" && (!approved ? (
      <div className="ptempty" style={{ padding: "40px 20px" }}><b>No performance data.</b><br />This section activates only once the application status is <b>Approved</b> and legitimate tracking is available. Nothing is tracked, estimated or implied for a prospect.</div>
    ) : <Performance ws={ws} save={save} />)}

    {/* ---------- Audit ---------- */}
    {tab === "audit" && (<>
      <div className="ptnote">Status, commercial-value, compliance and ledger changes are recorded automatically. The actor is the admin session (one shared admin credential today; per-user roles are a follow-up).</div>
      {ws.audit.length ? <div className="ptwrap"><table className="pttable ptaudit"><thead><tr><th>When</th><th>Entity</th><th>Field</th><th>From</th><th>To</th><th>Actor</th></tr></thead><tbody>
        {ws.audit.map((a) => <tr key={a.id}><td style={{ whiteSpace: "nowrap" }}>{new Date(a.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td>{a.entity}{a.entityId && a.entity !== "firm" ? <span className="faint"> · {a.entityId.slice(0, 18)}</span> : null}</td><td>{a.field}</td><td className="faint">{a.oldValue || "—"}</td><td>{a.newValue || "—"}</td><td className="faint">{a.actor}</td></tr>)}
      </tbody></table></div> : <div className="ptempty">No changes recorded yet.</div>}
    </>)}
  </>);
}

type Save = (entity: string, action: "create" | "update" | "delete", id: string | undefined, fields?: Record<string, unknown>) => Promise<boolean>;

function CommsTasks({ ws, save }: { ws: Workspace; save: Save }) {
  const [c, setC] = useState({ at: new Date().toISOString().slice(0, 10), kind: "email", contactName: "", summary: "", commitments: "", questionsOpen: "", nextFollowUp: "" });
  const [t, setT] = useState({ title: "", owner: ws.firm.owner, dueAt: "", priority: "normal" });
  const up = (entity: string, id: string) => (fields: Record<string, unknown>) => save(entity, "update", id, fields);
  return (<>
    <div className="ptsec"><h2>Tasks and follow-ups</h2></div>
    <div className="ptcard">
      <div className="ptform">
        <F label="New task" full><input className="afield" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder="What needs doing" /></F>
        <F label="Owner"><input className="afield" value={t.owner} onChange={(e) => setT({ ...t, owner: e.target.value })} /></F>
        <F label="Due"><input className="afield" type="date" value={t.dueAt} onChange={(e) => setT({ ...t, dueAt: e.target.value })} /></F>
        <F label="Priority"><Sel value={t.priority} options={TASK_PRIORITY} onSave={(v) => setT({ ...t, priority: v })} /></F>
      </div>
      <button className="abtn" style={{ marginTop: 10 }} disabled={!t.title.trim()} onClick={async () => { if (await save("task", "create", undefined, { ...t, dueAt: t.dueAt || null })) setT({ ...t, title: "", dueAt: "" }); }}>Add task</button>
    </div>
    {ws.tasks.length ? <div className="ptwrap"><table className="pttable"><thead><tr><th>Task</th><th style={{ width: 130 }}>Owner</th><th style={{ width: 150 }}>Due</th><th style={{ width: 110 }}>Priority</th><th style={{ width: 120 }}>Status</th><th>Notes</th><th /></tr></thead><tbody>
      {ws.tasks.map((k) => { const u = up("task", k.id); const od = overdue(k.dueAt, k.status); return (<tr key={k.id} style={k.status !== "open" ? { opacity: .6 } : undefined}>
        <td><Txt value={k.title} onSave={(v) => u({ title: v })} /></td><td><Txt value={k.owner} onSave={(v) => u({ owner: v })} /></td>
        <td><Dt value={k.dueAt} onSave={(v) => u({ dueAt: v || null })} />{od && <div className="ptdue over">overdue</div>}</td>
        <td><Sel value={k.priority} options={TASK_PRIORITY} onSave={(v) => u({ priority: v })} /></td><td><Sel value={k.status} options={TASK_STATUS} onSave={(v) => u({ status: v })} /></td>
        <td><Txt value={k.notes} onSave={(v) => u({ notes: v })} /></td><td><button className="abtn danger" onClick={() => window.confirm("Delete task?") && save("task", "delete", k.id)}>×</button></td></tr>); })}
    </tbody></table></div> : <div className="ptempty">No tasks.</div>}

    <div className="ptsec"><h2>Correspondence log</h2><span className="sub">logging a contact updates the firm’s last-contact date</span></div>
    <div className="ptcard">
      <div className="ptform">
        <F label="Date"><input className="afield" type="date" value={c.at} onChange={(e) => setC({ ...c, at: e.target.value })} /></F>
        <F label="Type"><Sel value={c.kind} options={COMM_KIND.map((k) => [k, COMM_LABEL[k]] as [string, string])} onSave={(v) => setC({ ...c, kind: v })} /></F>
        <F label="Contact person"><input className="afield" value={c.contactName} onChange={(e) => setC({ ...c, contactName: e.target.value })} /></F>
        <F label="Next follow-up"><input className="afield" type="date" value={c.nextFollowUp} onChange={(e) => setC({ ...c, nextFollowUp: e.target.value })} /></F>
        <F label="Summary" full><textarea className="afield" rows={2} value={c.summary} onChange={(e) => setC({ ...c, summary: e.target.value })} /></F>
        <F label="Commitments made (by either side)" full><textarea className="afield" rows={2} value={c.commitments} onChange={(e) => setC({ ...c, commitments: e.target.value })} /></F>
        <F label="Questions awaiting answers" full><textarea className="afield" rows={2} value={c.questionsOpen} onChange={(e) => setC({ ...c, questionsOpen: e.target.value })} /></F>
      </div>
      <button className="abtn" style={{ marginTop: 10 }} disabled={!c.at || !c.summary.trim()} onClick={async () => { if (await save("comm", "create", undefined, { ...c, nextFollowUp: c.nextFollowUp || null })) setC({ ...c, summary: "", commitments: "", questionsOpen: "", nextFollowUp: "" }); }}>Log communication</button>
    </div>
    {ws.comms.length ? ws.comms.map((m) => (
      <div key={m.id} className="ptcard">
        <div className="between"><b>{fmtDate(m.at)} · {commLabel(m.kind)}{m.contactName ? ` · ${m.contactName}` : ""}</b><button className="abtn danger" onClick={() => window.confirm("Delete this entry?") && save("comm", "delete", m.id)}>×</button></div>
        <div className="ptkv" style={{ marginTop: 8 }}><span className="k">Summary</span><span>{m.summary}</span>{m.commitments && <><span className="k">Commitments</span><span>{m.commitments}</span></>}{m.questionsOpen && <><span className="k">Awaiting answers</span><span>{m.questionsOpen}</span></>}{m.nextFollowUp && <><span className="k">Next follow-up</span><span className={overdue(m.nextFollowUp) ? "ptdue over" : ""}>{fmtDate(m.nextFollowUp)}</span></>}</div>
      </div>
    )) : <div className="ptempty">No correspondence logged.</div>}
  </>);
}

function Performance({ ws, save }: { ws: Workspace; save: Save }) {
  const [r, setR] = useState({ periodStart: "", periodEnd: "", impressions: "", clicks: "", registrations: "", verifiedReferrals: "", qualifiedReferrals: "", pending: "", approved: "", reversed: "", paid: "", currency: "GBP", expectedPaymentAt: "", paidAt: "", source: "manual", sourceNote: "", enteredBy: ws.firm.owner, reconciliationNotes: "" });
  const [l, setL] = useState({ at: new Date().toISOString().slice(0, 10), kind: "pending", amount: "", currency: "GBP", reference: "", note: "", source: "" });
  const num = (v: string) => (v === "" ? null : Number(v));
  const sums = LEDGER_KIND.map((k) => [k, ws.ledger.filter((x) => x.kind === k).reduce((a, x) => a + x.amountMinor, 0)] as const);
  const ccy = ws.ledger[0]?.currency ?? "GBP";
  return (<>
    <div className="ptnote">All figures here are <b>entered by hand</b> from the partner’s own reports unless the source says otherwise. They are not live and are not independently verified. Commission is only “earned” when the partner has approved it under the contract; pending and reversed amounts are shown separately.</div>
    <div className="ptstats">{sums.map(([k, v]) => <div key={k} className="ptstat"><div className="k">{label(k)}</div><div className="v" style={{ fontSize: 18 }}>{money(v, ccy)}</div><div className="d">from {ws.ledger.filter((x) => x.kind === k).length} manual entr{ws.ledger.filter((x) => x.kind === k).length === 1 ? "y" : "ies"}</div></div>)}</div>

    <div className="ptsec"><h2>Aggregate performance by period</h2></div>
    <div className="ptcard"><div className="ptform">
      <F label="Period start"><input className="afield" type="date" value={r.periodStart} onChange={(e) => setR({ ...r, periodStart: e.target.value })} /></F>
      <F label="Period end"><input className="afield" type="date" value={r.periodEnd} onChange={(e) => setR({ ...r, periodEnd: e.target.value })} /></F>
      {(["impressions", "clicks", "registrations", "verifiedReferrals", "qualifiedReferrals"] as const).map((k) => <F key={k} label={label(k.replace(/([A-Z])/g, "_$1").toLowerCase())}><input className="afield" type="number" min="0" value={r[k]} onChange={(e) => setR({ ...r, [k]: e.target.value })} /></F>)}
      {(["pending", "approved", "reversed", "paid"] as const).map((k) => <F key={k} label={`${label(k)} commission`}><input className="afield" type="number" step="0.01" value={r[k]} onChange={(e) => setR({ ...r, [k]: e.target.value })} /></F>)}
      <F label="Currency"><input className="afield" value={r.currency} maxLength={3} onChange={(e) => setR({ ...r, currency: e.target.value.toUpperCase() })} /></F>
      <F label="Expected payment date"><input className="afield" type="date" value={r.expectedPaymentAt} onChange={(e) => setR({ ...r, expectedPaymentAt: e.target.value })} /></F>
      <F label="Actual payment date"><input className="afield" type="date" value={r.paidAt} onChange={(e) => setR({ ...r, paidAt: e.target.value })} /></F>
      <F label="Source"><Sel value={r.source} options={REPORT_SOURCE} onSave={(v) => setR({ ...r, source: v })} /></F>
      <F label="Source note (required)" full><input className="afield" value={r.sourceNote} onChange={(e) => setR({ ...r, sourceNote: e.target.value })} placeholder="e.g. partner portal export, 1–31 Jan, downloaded 3 Feb" /></F>
      <F label="Entered by"><input className="afield" value={r.enteredBy} onChange={(e) => setR({ ...r, enteredBy: e.target.value })} /></F>
      <F label="Discrepancies and reconciliation notes" full><textarea className="afield" rows={2} value={r.reconciliationNotes} onChange={(e) => setR({ ...r, reconciliationNotes: e.target.value })} /></F>
    </div>
      <button className="abtn" style={{ marginTop: 10 }} disabled={!r.periodStart || !r.periodEnd || !r.sourceNote.trim()} onClick={async () => { const f: Record<string, unknown> = { ...r }; for (const k of ["impressions", "clicks", "registrations", "verifiedReferrals", "qualifiedReferrals", "pending", "approved", "reversed", "paid"]) f[k] = num(r[k as keyof typeof r] as string); f.expectedPaymentAt = r.expectedPaymentAt || null; f.paidAt = r.paidAt || null; if (await save("report", "create", undefined, f)) setR({ ...r, periodStart: "", periodEnd: "", sourceNote: "" }); }}>Add period report</button>
    </div>
    {ws.reports.length ? <div className="ptwrap"><table className="pttable"><thead><tr><th>Period</th><th>Clicks</th><th>Regs</th><th>Verified</th><th>Qualified</th><th>Pending</th><th>Approved</th><th>Reversed</th><th>Paid</th><th>Source</th><th /></tr></thead><tbody>
      {ws.reports.map((p) => <tr key={p.id}><td style={{ whiteSpace: "nowrap" }}>{fmtDate(p.periodStart)} → {fmtDate(p.periodEnd)}</td><td>{p.clicks ?? "—"}</td><td>{p.registrations ?? "—"}</td><td>{p.verifiedReferrals ?? "—"}</td><td>{p.qualifiedReferrals ?? "—"}</td><td>{money(p.pendingMinor, p.currency)}</td><td>{money(p.approvedMinor, p.currency)}</td><td>{money(p.reversedMinor, p.currency)}</td><td>{money(p.paidMinor, p.currency)}</td><td><span className="ptstatus">{label(p.source)}</span><div className="faint" style={{ fontSize: 11.5 }}>{p.sourceNote}</div></td><td><button className="abtn danger" onClick={() => window.confirm("Delete this report?") && save("report", "delete", p.id)}>×</button></td></tr>)}
    </tbody></table></div> : <div className="ptempty">No period reports entered.</div>}

    <div className="ptsec"><h2>Commission ledger</h2><span className="sub">append-only; every entry needs a source</span></div>
    <div className="ptcard"><div className="ptform">
      <F label="Date"><input className="afield" type="date" value={l.at} onChange={(e) => setL({ ...l, at: e.target.value })} /></F>
      <F label="Kind"><Sel value={l.kind} options={LEDGER_KIND} onSave={(v) => setL({ ...l, kind: v })} /></F>
      <F label="Amount"><input className="afield" type="number" step="0.01" value={l.amount} onChange={(e) => setL({ ...l, amount: e.target.value })} /></F>
      <F label="Currency"><input className="afield" value={l.currency} maxLength={3} onChange={(e) => setL({ ...l, currency: e.target.value.toUpperCase() })} /></F>
      <F label="Reference"><input className="afield" value={l.reference} onChange={(e) => setL({ ...l, reference: e.target.value })} placeholder="statement / invoice ref" /></F>
      <F label="Source (required)"><input className="afield" value={l.source} onChange={(e) => setL({ ...l, source: e.target.value })} placeholder="e.g. partner statement Jan-2027" /></F>
      <F label="Note" full><input className="afield" value={l.note} onChange={(e) => setL({ ...l, note: e.target.value })} /></F>
    </div>
      <button className="abtn" style={{ marginTop: 10 }} disabled={!l.at || !l.amount || !l.source.trim()} onClick={async () => { if (await save("ledger", "create", undefined, { ...l, amount: Number(l.amount) })) setL({ ...l, amount: "", reference: "", note: "" }); }}>Add ledger entry</button>
    </div>
    {ws.ledger.length ? <div className="ptwrap"><table className="pttable"><thead><tr><th>Date</th><th>Kind</th><th>Amount</th><th>Reference</th><th>Source</th><th>Note</th><th /></tr></thead><tbody>
      {ws.ledger.map((e) => <tr key={e.id}><td>{fmtDate(e.at)}</td><td><span className="ptstatus">{label(e.kind)}</span></td><td className="mono">{money(e.amountMinor, e.currency)}</td><td>{e.reference || "—"}</td><td>{e.source}</td><td>{e.note || "—"}</td><td><button className="abtn danger" onClick={() => window.confirm("Delete this entry? (recorded in the audit trail)") && save("ledger", "delete", e.id)}>×</button></td></tr>)}
    </tbody></table></div> : <div className="ptempty">No commission entries.</div>}
  </>);
}

"use client";
/* Affiliate Partnerships — overview: summary, search/filter/sort, firm tiles, consolidated
   next actions. Statuses are three independent axes and are shown as plain labels. */
import { useMemo, useState } from "react";
import Link from "next/link";
import type { FirmSummary } from "@/lib/partners-data";
import { APPLICATION_STATUS, TERMS_STATUS, COMPLIANCE_STATUS, label, tone, fmtDate, overdue, dueSoon } from "@/lib/partners";

type Action = { kind: "action" | "task"; firmId: string; firmName: string; slug: string; title: string; due: string | null; owner: string; priority: string; id: string; overdue: boolean };
type Sort = "due" | "name" | "contact" | "application";

export function Status({ v }: { v: string | null | undefined }) { return <span className={`ptstatus ${tone(v)}`}>{label(v)}</span>; }
export function Logo({ name, url }: { name: string; url?: string | null }) {
  const initials = name.split(/[\s/]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  // Plain <img>: logo URLs are entered at runtime from arbitrary official domains, so next/image remotePatterns cannot be pre-declared.
  // eslint-disable-next-line @next/next/no-img-element
  return <span className="ptlogo" aria-hidden="true">{url ? <img src={url} alt="" /> : initials}</span>;
}
function Due({ d }: { d: string | null | undefined }) {
  if (!d) return <span className="faint">no date</span>;
  const cls = overdue(d) ? "over" : dueSoon(d) ? "soon" : "";
  return <span className={`ptdue ${cls}`}>{fmtDate(d)}{overdue(d) ? " · overdue" : dueSoon(d) ? " · due soon" : ""}</span>;
}

export default function PartnersOverview({ firms, actions }: { firms: FirmSummary[]; actions: Action[] }) {
  const [q, setQ] = useState(""); const [fa, setFa] = useState(""); const [ft, setFt] = useState(""); const [fc, setFc] = useState(""); const [sort, setSort] = useState<Sort>("due");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = firms.filter((f) => (!s || f.name.toLowerCase().includes(s) || f.slug.includes(s) || f.nextAction.toLowerCase().includes(s)) && (!fa || f.applicationStatus === fa) && (!ft || f.termsStatus === ft) && (!fc || f.complianceStatus === fc));
    const key = (f: FirmSummary) => sort === "name" ? f.name.toLowerCase() : sort === "contact" ? (f.lastContactAt ?? "0000") : sort === "application" ? String(APPLICATION_STATUS.indexOf(f.applicationStatus as never)).padStart(2, "0") : (f.nextActionDue ?? "9999");
    return out.sort((a, b) => (sort === "contact" ? (key(a) < key(b) ? 1 : -1) : key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
  }, [firms, q, fa, ft, fc, sort]);
  const n = (p: (f: FirmSummary) => boolean) => firms.filter(p).length;
  const overdueCount = actions.filter((a) => a.overdue).length;

  return (<>
    <div className="ptnote"><b>Provisional throughout.</b> All firms shown are prospects. Application, commercial-terms and compliance statuses are independent and change only when the matching evidence is recorded. An affiliate agreement is not permission to communicate financial promotions; every channel needs its own approval record.</div>
    <div className="ptstats">
      <div className="ptstat"><div className="k">Prospects</div><div className="v">{firms.length}</div><div className="d">firms tracked</div></div>
      <div className="ptstat"><div className="k">Applications submitted</div><div className="v">{n((f) => ["application_submitted", "awaiting_response", "more_info_required"].includes(f.applicationStatus))}</div><div className="d">{n((f) => f.applicationStatus === "ready_to_apply")} ready to apply</div></div>
      <div className="ptstat"><div className="k">Approved programmes</div><div className="v">{n((f) => f.applicationStatus === "approved")}</div><div className="d">{n((f) => f.applicationStatus === "declined")} declined</div></div>
      <div className="ptstat"><div className="k">Confirmed agreements</div><div className="v">{n((f) => f.termsStatus === "confirmed")}</div><div className="d">terms confirmed in writing</div></div>
      <div className="ptstat"><div className="k">Compliance approved</div><div className="v">{n((f) => f.complianceStatus === "approved_for_specified_use")}</div><div className="d">for specified use</div></div>
      <div className="ptstat"><div className="k">Overdue actions</div><div className="v" style={overdueCount ? { color: "var(--red)" } : undefined}>{overdueCount}</div><div className="d">{actions.length} open in total</div></div>
    </div>

    <div className="pttools">
      <input className="afield" placeholder="Search firm or next action" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search firms" />
      <select className="afield" value={fa} onChange={(e) => setFa(e.target.value)} aria-label="Filter by application status"><option value="">Application: all</option>{APPLICATION_STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
      <select className="afield" value={ft} onChange={(e) => setFt(e.target.value)} aria-label="Filter by terms status"><option value="">Terms: all</option>{TERMS_STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
      <select className="afield" value={fc} onChange={(e) => setFc(e.target.value)} aria-label="Filter by compliance status"><option value="">Compliance: all</option>{COMPLIANCE_STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
      <select className="afield" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort"><option value="due">Sort: next action due</option><option value="name">Sort: name</option><option value="contact">Sort: last contact</option><option value="application">Sort: application stage</option></select>
    </div>

    {list.length ? (
      <div className="ptgrid">
        {list.map((f) => (
          <div key={f.id} className={`pttile ${f.flags.overdue ? "overdue" : ""}`}>
            <div className="head"><Logo name={f.name} url={f.logoUrl} /><div style={{ minWidth: 0 }}><h3>{f.name}</h3><div className="model">{label(f.model)}{f.primaryContact ? ` · ${f.primaryContact}` : ""}</div></div></div>
            <div className="ptrows">
              <span className="k">Application</span><span className="v"><Status v={f.applicationStatus} /></span>
              <span className="k">Country</span><span className="v"><Status v={f.countryEligibility} /></span>
              <span className="k">Terms</span><span className="v"><Status v={f.termsStatus} /></span>
              <span className="k">Compliance</span><span className="v"><Status v={f.complianceStatus} /></span>
              <span className="k">Last contact</span><span className="v">{f.lastContactAt ? fmtDate(f.lastContactAt) : <span className="faint">none logged</span>}</span>
              <span className="k">Next due</span><span className="v"><Due d={f.nextActionDue} /></span>
            </div>
            <div className="next"><b>Next:</b> {f.nextAction || <span className="faint">not set</span>}</div>
            <div className="foot"><span>Owner: {f.owner || "—"}{f.openTasks ? ` · ${f.openTasks} open task${f.openTasks === 1 ? "" : "s"}` : ""}{f.overdueTasks ? <span style={{ color: "var(--red)" }}> · {f.overdueTasks} overdue</span> : null}</span><Link className="abtn" href={`/admin/partners/${f.slug}`}>Open workspace</Link></div>
          </div>
        ))}
      </div>
    ) : <div className="ptempty">No firm matches that search or filter.</div>}

    <div className="ptsec"><h2>Next actions across all firms</h2><span className="sub">firm next actions and open tasks, soonest first</span></div>
    <div className="ptcard">
      {actions.length ? <div className="ptactions">{actions.slice(0, 30).map((a) => (
        <div key={a.kind + a.id} className="ptaction">
          <span className={`when ${a.overdue ? "over" : ""}`}>{a.due ? fmtDate(a.due) : "no date"}{a.overdue ? " · overdue" : ""}</span>
          <span style={{ flex: 1, minWidth: 0 }}><Link href={`/admin/partners/${a.slug}`} className="firm" style={{ textDecoration: "none" }}>{a.firmName}</Link> · {a.kind === "task" ? "Task" : "Next action"}{a.priority === "high" || a.priority === "urgent" ? ` · ${label(a.priority)}` : ""}<div>{a.title}</div></span>
          <span className="faint" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{a.owner || "—"}</span>
        </div>
      ))}</div> : <div className="ptempty">No open actions.</div>}
    </div>
  </>);
}

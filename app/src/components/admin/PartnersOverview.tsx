"use client";
/* Affiliate Partnerships — overview: summary, search/filter/sort, firm tiles, consolidated
   next actions. Statuses are three independent axes and are shown as plain labels. */
import { useMemo, useState } from "react";
import Link from "next/link";
import type { FirmSummary } from "@/lib/partners-data";
import type { RankRow } from "@/lib/partners-rank";
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

export default function PartnersOverview({ firms, actions, ranking }: { firms: FirmSummary[]; actions: Action[]; ranking: RankRow[] }) {
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
            <div className="foot"><span>Owner: {f.owner || "—"}{f.openTasks ? ` · ${f.openTasks} open task${f.openTasks === 1 ? "" : "s"}` : ""}{f.overdueTasks ? <span style={{ color: "var(--red)" }}> · {f.overdueTasks} overdue</span> : null}</span><Link prefetch={false} className="abtn" href={`/admin/partners/${f.slug}`}>Open workspace</Link></div>
          </div>
        ))}
      </div>
    ) : <div className="ptempty">No firm matches that search or filter.</div>}

    <div className="ptsec"><h2>Comparison and ranking</h2><span className="sub">35% payout speed · 30% achievable CPA · 20% country eligibility and compliance · 15% minimum withdrawal</span></div>
    <div className="ptnote"><b>Provisional.</b> Confirmed terms count in full; advertised or received-but-unconfirmed values count at 60%; values the sources contradict count at 40%; an empty input scores 0. Compliance status Review Required halves the UK axis and Suspended zeroes it. Anything not confirmed is listed as Needs Confirmation. The ranking therefore rewards verified, payable, permitted terms, not the biggest advertised ceiling.</div>
    {ranking.length ? <div className="ptwrap"><table className="pttable"><thead><tr><th>#</th><th>Programme</th><th>Advertised max CPA</th><th>Approved CPA</th><th>Payment frequency</th><th>Min. withdrawal</th><th>UK / countries</th><th>Score</th><th>Needs Confirmation</th><th>Next action</th></tr></thead><tbody>
      {ranking.map((r, i) => (<tr key={r.id}>
        <td><b>{i + 1}</b></td>
        <td style={{ whiteSpace: "nowrap" }}><Link prefetch={false} href={`/admin/partners/${r.slug}`} style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>{r.name}</Link><div className="faint" style={{ fontSize: 11.5 }}>{label(r.model)} · {label(r.applicationStatus)}</div></td>
        <td style={{ minWidth: 180 }}>{r.advertisedCpa || <span className="faint">—</span>}</td>
        <td style={{ minWidth: 120 }}>{r.approvedCpa || <span className="faint">not confirmed</span>}</td>
        <td style={{ minWidth: 160 }}>{r.paymentFrequency || <span className="faint">—</span>}</td>
        <td style={{ minWidth: 140 }}>{r.minPayout || <span className="faint">—</span>}</td>
        <td style={{ minWidth: 160 }}><Status v={r.countryEligibility} /> <Status v={r.permitted === "unknown" ? "not_reviewed" : r.permitted} />{r.countries ? <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>{r.countries}</div> : null}</td>
        <td style={{ whiteSpace: "nowrap" }}><b style={{ fontSize: 16 }}>{r.total}</b><div className="faint" style={{ fontSize: 11 }}>pay {r.scores.payout} · cpa {r.scores.cpa} · uk {r.scores.country} · min {r.scores.ease}</div></td>
        <td style={{ minWidth: 160 }}>{r.needsConfirmation.length ? <span className="ptstatus warn">{r.needsConfirmation.length} of 4</span> : <span className="ptstatus good">verified</span>}<div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>{r.needsConfirmation.join(" · ")}</div></td>
        <td style={{ minWidth: 220, fontSize: 12.5 }}>{r.nextAction}{r.nextActionDue ? <div className="faint" style={{ fontSize: 11.5 }}>due {fmtDate(r.nextActionDue)}</div> : null}</td>
      </tr>))}
    </tbody></table></div> : null}

    <div className="ptsec"><h2>Next actions across all firms</h2><span className="sub">firm next actions and open tasks, soonest first</span></div>
    <div className="ptcard">
      {actions.length ? <div className="ptactions">{actions.slice(0, 30).map((a) => (
        <div key={a.kind + a.id} className="ptaction">
          <span className={`when ${a.overdue ? "over" : ""}`}>{a.due ? fmtDate(a.due) : "no date"}{a.overdue ? " · overdue" : ""}</span>
          <span style={{ flex: 1, minWidth: 0 }}><Link prefetch={false} href={`/admin/partners/${a.slug}`} className="firm" style={{ textDecoration: "none" }}>{a.firmName}</Link> · {a.kind === "task" ? "Task" : "Next action"}{a.priority === "high" || a.priority === "urgent" ? ` · ${label(a.priority)}` : ""}<div>{a.title}</div></span>
          <span className="faint" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{a.owner || "—"}</span>
        </div>
      ))}</div> : <div className="ptempty">No open actions.</div>}
    </div>
  </>);
}

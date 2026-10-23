import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { isAdmin, nid } from "@/lib/auth";
import { loadWorkspace, firmById, audit } from "@/lib/partners-data";
import { APPLICATION_STATUS, TERMS_STATUS, COMPLIANCE_STATUS, MODEL, COUNTRY_ELIGIBILITY, PERMITTED, RESEARCH_TOPICS, VERIFICATION, TERM_KEYS, CHANNELS, COMM_KIND, TASK_PRIORITY, TASK_STATUS, LEDGER_KIND, REPORT_SOURCE, AUDITED_FIRM_FIELDS, str, dateOrNull, oneOf, bool, int, minor, strip, isDate } from "@/lib/partners";
import type { ChecklistItem, DocRef } from "@/db/schema";

/* ============================================================
   Affiliate Partnerships — firm workspace API.
   GET  → the whole workspace.   POST { entity, action, id?, fields } → one mutation.
   Every request: admin gate (server-side) · firm must exist · child rows must belong
   to the firm · every field validated against a whitelist/enum · audited where it matters.
   Nothing here talks to a broker. Performance rows are MANUAL unless source says otherwise.
   ============================================================ */

const ENTITIES = ["firm", "research", "contact", "application", "term", "compliance", "channel", "comm", "task", "report", "ledger"] as const;
const ACTIONS = ["create", "update", "delete"] as const;
type Body = { entity?: string; action?: string; id?: string; fields?: Record<string, unknown> };
const bad = (m: string, status = 400) => NextResponse.json({ error: m }, { status });
const ccy = (v: unknown) => (typeof v === "string" && /^[A-Z]{3}$/.test(v) ? v : undefined);
const url = (v: unknown) => (typeof v === "string" && (v === "" || /^https?:\/\//.test(v)) ? v.slice(0, 500) : undefined);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return bad("Admin sign-in required.", 401);
  const { id } = await params;
  const ws = await loadWorkspace(id);
  if (!ws) return bad("Not found.", 404);
  return NextResponse.json(ws, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return bad("Admin sign-in required.", 401);
  const { id: firmKey } = await params;
  const firm = (await firmById(firmKey)) ?? (await loadWorkspace(firmKey))?.firm ?? null;
  if (!firm) return bad("Not found.", 404);
  const fid = firm.id;
  const b = (await req.json().catch(() => ({}))) as Body;
  const entity = oneOf(ENTITIES, b.entity), action = oneOf(ACTIONS, b.action);
  if (!entity || !action) return bad("Unknown entity or action.");
  const f = (b.fields ?? {}) as Record<string, unknown>;
  const rowId = typeof b.id === "string" ? b.id : "";
  const needId = () => (rowId ? null : bad("Missing id."));

  try {
    switch (entity) {
      /* ---------- firm ---------- */
      case "firm": {
        if (action !== "update") return bad("Firms are seeded; create/delete is not exposed here.");
        const set = strip({
          name: str(f.name, 120), logoUrl: f.logoUrl === "none" ? "none" : url(f.logoUrl) ?? (f.logoUrl === null ? null : undefined), programmeUrl: url(f.programmeUrl), applyUrl: url(f.applyUrl), requirementsUrl: url(f.requirementsUrl), affiliateId: str(f.affiliateId, 120), trackingLink: url(f.trackingLink),
          model: oneOf(MODEL, f.model), applicationStatus: oneOf(APPLICATION_STATUS, f.applicationStatus), termsStatus: oneOf(TERMS_STATUS, f.termsStatus), complianceStatus: oneOf(COMPLIANCE_STATUS, f.complianceStatus),
          countryEligibility: oneOf(COUNTRY_ELIGIBILITY, f.countryEligibility), countryNote: str(f.countryNote), targetCountries: Array.isArray(f.targetCountries) ? f.targetCountries.filter((x): x is string => typeof x === "string").map((x) => x.toUpperCase().slice(0, 2)).slice(0, 40) : undefined,
          owner: str(f.owner, 120), nextAction: str(f.nextAction, 1000), nextActionDue: dateOrNull(f.nextActionDue), lastContactAt: dateOrNull(f.lastContactAt), lastResearchAt: dateOrNull(f.lastResearchAt), notes: str(f.notes, 20000),
        });
        for (const k of Object.keys(f)) if (!(k in set) && f[k] !== undefined && !["logoUrl"].includes(k)) { if (typeof f[k] === "string" && ["model", "applicationStatus", "termsStatus", "complianceStatus", "countryEligibility", "nextActionDue", "lastContactAt", "lastResearchAt", "programmeUrl", "applyUrl", "requirementsUrl"].includes(k)) return bad(`Invalid value for ${k}.`); }
        if (!Object.keys(set).length) return bad("Nothing to update.");
        if (set.termsStatus === "confirmed" && !(await db.select().from(tables.partnerTermItems).where(and(eq(tables.partnerTermItems.firmId, fid), eq(tables.partnerTermItems.status, "confirmed")))).length) return bad("Mark at least one commercial term as Confirmed (with its source) before confirming the agreement.", 409);
        for (const k of AUDITED_FIRM_FIELDS) if (k in set) await audit(fid, "firm", fid, k, firm[k], set[k]);
        await db.update(tables.partnerFirms).set({ ...set, updatedAt: sql`now()` }).where(eq(tables.partnerFirms.id, fid));
        return NextResponse.json({ ok: true });
      }

      /* ---------- research claims ---------- */
      case "research": {
        const set = strip({ topic: oneOf(RESEARCH_TOPICS, f.topic), claim: str(f.claim, 2000), sourceUrl: url(f.sourceUrl), verification: oneOf(VERIFICATION, f.verification), verifiedAt: dateOrNull(f.verifiedAt), notes: str(f.notes, 4000) });
        if (action === "create") { const id = nid(); await db.insert(tables.partnerResearch).values({ id, firmId: fid, ...set, verifiedAt: set.verifiedAt ?? (set.verification === "verified" ? new Date().toISOString().slice(0, 10) : null) }); return NextResponse.json({ ok: true, id }); }
        const r = needId(); if (r) return r;
        const row = (await db.select().from(tables.partnerResearch).where(and(eq(tables.partnerResearch.id, rowId), eq(tables.partnerResearch.firmId, fid))))[0];
        if (!row) return bad("Not found.", 404);
        if (action === "delete") { await db.delete(tables.partnerResearch).where(eq(tables.partnerResearch.id, rowId)); return NextResponse.json({ ok: true }); }
        if (set.verification === "verified" && !(set.verifiedAt ?? row.verifiedAt)) set.verifiedAt = new Date().toISOString().slice(0, 10);
        if ("verification" in set) await audit(fid, "research", rowId, "verification", row.verification, set.verification);
        await db.update(tables.partnerResearch).set(set).where(eq(tables.partnerResearch.id, rowId));
        return NextResponse.json({ ok: true });
      }

      /* ---------- contacts ---------- */
      case "contact": {
        const set = strip({ name: str(f.name, 120), role: str(f.role, 120), email: str(f.email, 200), phone: str(f.phone, 60), isPrimary: bool(f.isPrimary), notes: str(f.notes, 2000) });
        if (action === "create") { const id = nid(); if (set.isPrimary) await db.update(tables.partnerContacts).set({ isPrimary: false }).where(eq(tables.partnerContacts.firmId, fid)); await db.insert(tables.partnerContacts).values({ id, firmId: fid, ...set }); return NextResponse.json({ ok: true, id }); }
        const r = needId(); if (r) return r;
        const row = (await db.select().from(tables.partnerContacts).where(and(eq(tables.partnerContacts.id, rowId), eq(tables.partnerContacts.firmId, fid))))[0];
        if (!row) return bad("Not found.", 404);
        if (action === "delete") { await db.delete(tables.partnerContacts).where(eq(tables.partnerContacts.id, rowId)); return NextResponse.json({ ok: true }); }
        if (set.isPrimary) await db.update(tables.partnerContacts).set({ isPrimary: false }).where(eq(tables.partnerContacts.firmId, fid));
        await db.update(tables.partnerContacts).set(set).where(eq(tables.partnerContacts.id, rowId));
        return NextResponse.json({ ok: true });
      }

      /* ---------- application (one per firm) ---------- */
      case "application": {
        if (action !== "update") return bad("One application record per firm.");
        const list = <T,>(v: unknown, map: (x: Record<string, unknown>) => T | null) => (Array.isArray(v) ? v.map((x) => (x && typeof x === "object" ? map(x as Record<string, unknown>) : null)).filter((x): x is T => !!x).slice(0, 60) : undefined);
        const checklist = list<ChecklistItem>(f.checklist, (x) => (typeof x.label === "string" ? { label: x.label.slice(0, 300), done: !!x.done } : null));
        const documents = list<DocRef>(f.documents, (x) => (typeof x.label === "string" ? { label: x.label.slice(0, 300), locationRef: typeof x.locationRef === "string" ? x.locationRef.slice(0, 500) : "", done: !!x.done } : null));
        const set = strip({ checklist, documents, submittedAt: dateOrNull(f.submittedAt), referenceNo: str(f.referenceNo, 120), contactId: f.contactId === null ? null : str(f.contactId, 40), followUpAt: dateOrNull(f.followUpAt), outcome: str(f.outcome, 200), outcomeReason: str(f.outcomeReason, 4000), notes: str(f.notes, 20000) });
        if (!Object.keys(set).length) return bad("Nothing to update.");
        const row = (await db.select().from(tables.partnerApplications).where(eq(tables.partnerApplications.firmId, fid)))[0];
        if (set.contactId && !(await db.select().from(tables.partnerContacts).where(and(eq(tables.partnerContacts.id, set.contactId), eq(tables.partnerContacts.firmId, fid)))).length) return bad("Contact does not belong to this firm.");
        for (const k of ["submittedAt", "referenceNo", "outcome"] as const) if (k in set) await audit(fid, "application", row?.id ?? "", k, row?.[k], set[k]);
        if (row) await db.update(tables.partnerApplications).set({ ...set, updatedAt: sql`now()` }).where(eq(tables.partnerApplications.id, row.id));
        else await db.insert(tables.partnerApplications).values({ id: nid(), firmId: fid, ...set });
        return NextResponse.json({ ok: true });
      }

      /* ---------- commercial term items (one row per key, each with source + status) ---------- */
      case "term": {
        if (action !== "update") return bad("Term keys are fixed; update a key.");
        const key = oneOf(TERM_KEYS, b.id); if (!key) return bad("Unknown term key.");
        const set = strip({ value: str(f.value, 2000), currency: f.currency === "" ? "" : ccy(f.currency), sourceUrl: url(f.sourceUrl), sourceNote: str(f.sourceNote, 1000), status: oneOf(TERMS_STATUS, f.status), verifiedAt: dateOrNull(f.verifiedAt), notes: str(f.notes, 4000) });
        if (!Object.keys(set).length) return bad("Nothing to update.");
        const row = (await db.select().from(tables.partnerTermItems).where(and(eq(tables.partnerTermItems.firmId, fid), eq(tables.partnerTermItems.key, key))))[0];
        const next = { ...row, ...set };
        if (next.status === "confirmed" && !(next.sourceUrl || next.sourceNote)) return bad("A term can only be Confirmed with a source (URL or written reference).", 409);
        if (set.status === "confirmed" && !next.verifiedAt) set.verifiedAt = new Date().toISOString().slice(0, 10);
        for (const k of ["value", "status"] as const) if (k in set) await audit(fid, "term", key, k, row?.[k], set[k]);
        if (row) await db.update(tables.partnerTermItems).set({ ...set, updatedAt: sql`now()` }).where(eq(tables.partnerTermItems.id, row.id));
        else await db.insert(tables.partnerTermItems).values({ id: nid(), firmId: fid, key, ...set });
        return NextResponse.json({ ok: true });
      }

      /* ---------- compliance (one per firm) ---------- */
      case "compliance": {
        if (action !== "update") return bad("One compliance record per firm.");
        const set = strip({ permittedToPromote: oneOf(PERMITTED, f.permittedToPromote), contractingEntity: str(f.contractingEntity, 300), restrictions: str(f.restrictions, 6000), riskWarnings: str(f.riskWarnings, 6000), disclosureWording: str(f.disclosureWording, 6000), openQuestions: str(f.openQuestions, 6000), legalAdviceRequired: bool(f.legalAdviceRequired), notes: str(f.notes, 20000) });
        if (!Object.keys(set).length) return bad("Nothing to update.");
        const row = (await db.select().from(tables.partnerCompliance).where(eq(tables.partnerCompliance.firmId, fid)))[0];
        for (const k of ["permittedToPromote", "legalAdviceRequired", "contractingEntity"] as const) if (k in set) await audit(fid, "compliance", row?.id ?? "", k, row?.[k], set[k]);
        if (row) await db.update(tables.partnerCompliance).set({ ...set, updatedAt: sql`now()` }).where(eq(tables.partnerCompliance.id, row.id));
        else await db.insert(tables.partnerCompliance).values({ id: nid(), firmId: fid, ...set });
        return NextResponse.json({ ok: true });
      }

      /* ---------- per-channel approvals ---------- */
      case "channel": {
        if (action !== "update") return bad("Channels are fixed; update a channel.");
        const channel = oneOf(CHANNELS, b.id); if (!channel) return bad("Unknown channel.");
        const set = strip({ status: oneOf(COMPLIANCE_STATUS, f.status), contentRef: str(f.contentRef, 500), version: str(f.version, 60), approvedAt: dateOrNull(f.approvedAt), reviewAt: dateOrNull(f.reviewAt), notes: str(f.notes, 4000) });
        if (!Object.keys(set).length) return bad("Nothing to update.");
        const row = (await db.select().from(tables.partnerChannelApprovals).where(and(eq(tables.partnerChannelApprovals.firmId, fid), eq(tables.partnerChannelApprovals.channel, channel))))[0];
        const next = { ...row, ...set };
        if (next.status === "approved_for_specified_use" && !next.contentRef) return bad("Approval needs a reference to the approved content and version.", 409);
        if (set.status === "approved_for_specified_use" && !next.approvedAt) set.approvedAt = new Date().toISOString().slice(0, 10);
        if ("status" in set) await audit(fid, "channel", channel, "status", row?.status, set.status);
        if (row) await db.update(tables.partnerChannelApprovals).set({ ...set, updatedAt: sql`now()` }).where(eq(tables.partnerChannelApprovals.id, row.id));
        else await db.insert(tables.partnerChannelApprovals).values({ id: nid(), firmId: fid, channel, ...set });
        return NextResponse.json({ ok: true });
      }

      /* ---------- communications log ---------- */
      case "comm": {
        const set = strip({ at: dateOrNull(f.at) ?? undefined, kind: oneOf(COMM_KIND, f.kind), contactName: str(f.contactName, 120), summary: str(f.summary, 4000), commitments: str(f.commitments, 4000), questionsOpen: str(f.questionsOpen, 4000), nextFollowUp: dateOrNull(f.nextFollowUp) });
        if (action === "create") {
          if (!isDate(set.at)) return bad("A date is required.");
          const id = nid(); await db.insert(tables.partnerComms).values({ id, firmId: fid, ...set, at: set.at as string });
          if (!firm.lastContactAt || (set.at as string) > firm.lastContactAt) await db.update(tables.partnerFirms).set({ lastContactAt: set.at as string, updatedAt: sql`now()` }).where(eq(tables.partnerFirms.id, fid));
          return NextResponse.json({ ok: true, id });
        }
        const r = needId(); if (r) return r;
        const row = (await db.select().from(tables.partnerComms).where(and(eq(tables.partnerComms.id, rowId), eq(tables.partnerComms.firmId, fid))))[0];
        if (!row) return bad("Not found.", 404);
        if (action === "delete") { await db.delete(tables.partnerComms).where(eq(tables.partnerComms.id, rowId)); return NextResponse.json({ ok: true }); }
        await db.update(tables.partnerComms).set(set).where(eq(tables.partnerComms.id, rowId));
        return NextResponse.json({ ok: true });
      }

      /* ---------- tasks ---------- */
      case "task": {
        const set = strip({ title: str(f.title, 300), owner: str(f.owner, 120), dueAt: dateOrNull(f.dueAt), priority: oneOf(TASK_PRIORITY, f.priority), status: oneOf(TASK_STATUS, f.status), notes: str(f.notes, 4000) });
        if (action === "create") { if (!set.title?.trim()) return bad("A title is required."); const id = nid(); await db.insert(tables.partnerTasks).values({ id, firmId: fid, ...set, title: set.title }); return NextResponse.json({ ok: true, id }); }
        const r = needId(); if (r) return r;
        const row = (await db.select().from(tables.partnerTasks).where(and(eq(tables.partnerTasks.id, rowId), eq(tables.partnerTasks.firmId, fid))))[0];
        if (!row) return bad("Not found.", 404);
        if (action === "delete") { await db.delete(tables.partnerTasks).where(eq(tables.partnerTasks.id, rowId)); return NextResponse.json({ ok: true }); }
        const completedAt = set.status === undefined ? undefined : set.status === "done" ? new Date() : null;
        if ("status" in set) await audit(fid, "task", rowId, "status", row.status, set.status);
        await db.update(tables.partnerTasks).set(strip({ ...set, completedAt })).where(eq(tables.partnerTasks.id, rowId));
        return NextResponse.json({ ok: true });
      }

      /* ---------- performance reports (aggregate, manual unless an official feed exists) ---------- */
      case "report": {
        if (firm.applicationStatus !== "approved") return bad("Performance data can only be recorded once the programme is Approved. Nothing is tracked for prospects.", 409);
        const set = strip({
          periodStart: dateOrNull(f.periodStart) ?? undefined, periodEnd: dateOrNull(f.periodEnd) ?? undefined,
          impressions: int(f.impressions), clicks: int(f.clicks), registrations: int(f.registrations), verifiedReferrals: int(f.verifiedReferrals), qualifiedReferrals: int(f.qualifiedReferrals),
          pendingMinor: minor(f.pending), approvedMinor: minor(f.approved), reversedMinor: minor(f.reversed), paidMinor: minor(f.paid), currency: ccy(f.currency),
          expectedPaymentAt: dateOrNull(f.expectedPaymentAt), paidAt: dateOrNull(f.paidAt), source: oneOf(REPORT_SOURCE, f.source), sourceNote: str(f.sourceNote, 1000), enteredBy: str(f.enteredBy, 120), reconciliationNotes: str(f.reconciliationNotes, 6000),
        });
        if (action === "create") {
          if (!isDate(set.periodStart) || !isDate(set.periodEnd)) return bad("A period start and end are required.");
          if (!set.sourceNote?.trim()) return bad("State the source of these figures (e.g. partner portal export, statement reference).");
          const id = nid(); await db.insert(tables.partnerReports).values({ id, firmId: fid, ...set, periodStart: set.periodStart as string, periodEnd: set.periodEnd as string, source: set.source ?? "manual" }); return NextResponse.json({ ok: true, id });
        }
        const r = needId(); if (r) return r;
        const row = (await db.select().from(tables.partnerReports).where(and(eq(tables.partnerReports.id, rowId), eq(tables.partnerReports.firmId, fid))))[0];
        if (!row) return bad("Not found.", 404);
        if (action === "delete") { await audit(fid, "report", rowId, "deleted", `${row.periodStart}→${row.periodEnd}`, ""); await db.delete(tables.partnerReports).where(eq(tables.partnerReports.id, rowId)); return NextResponse.json({ ok: true }); }
        await db.update(tables.partnerReports).set(set).where(eq(tables.partnerReports.id, rowId));
        return NextResponse.json({ ok: true });
      }

      /* ---------- commission ledger ---------- */
      case "ledger": {
        if (firm.applicationStatus !== "approved") return bad("Commission entries can only be recorded once the programme is Approved.", 409);
        if (action === "update") return bad("Ledger entries are append-only; delete and re-enter if wrong.");
        if (action === "create") {
          const at = dateOrNull(f.at), kind = oneOf(LEDGER_KIND, f.kind), amountMinor = minor(f.amount), currency = ccy(f.currency) ?? "GBP";
          if (!at || !kind || amountMinor == null) return bad("Date, kind and amount are required.");
          const source = str(f.source, 500)?.trim(); if (!source) return bad("State the source (statement, portal, invoice reference).");
          const id = nid(); await db.insert(tables.partnerLedger).values({ id, firmId: fid, at, kind, amountMinor, currency, reference: str(f.reference, 200) ?? "", note: str(f.note, 2000) ?? "", source });
          await audit(fid, "ledger", id, "entry", "", `${kind} ${(amountMinor / 100).toFixed(2)} ${currency} (${source})`);
          return NextResponse.json({ ok: true, id });
        }
        const r = needId(); if (r) return r;
        const row = (await db.select().from(tables.partnerLedger).where(and(eq(tables.partnerLedger.id, rowId), eq(tables.partnerLedger.firmId, fid))))[0];
        if (!row) return bad("Not found.", 404);
        await audit(fid, "ledger", rowId, "deleted", `${row.kind} ${(row.amountMinor / 100).toFixed(2)} ${row.currency}`, "");
        await db.delete(tables.partnerLedger).where(eq(tables.partnerLedger.id, rowId));
        return NextResponse.json({ ok: true });
      }
    }
  } catch (e) {
    console.error("partners api", entity, action, (e as Error).message); // never logs field contents
    return bad("Could not save that.", 500);
  }
  return bad("Unhandled.");
}

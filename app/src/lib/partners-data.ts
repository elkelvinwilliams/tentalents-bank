import { db, tables } from "@/db";
import { and, asc, desc, eq } from "drizzle-orm";
import { nid } from "./auth";
import { SEED_FIRMS, seedNote, SEED_RESEARCH_DATE as SEED_DATE, SEED_OWNER, SEED_TERM_KEYS, SEED_CHANNELS, addDays, RETIRED_SLUGS, FOUNDER_UPDATES } from "@/content/partners-seed";
import { overdue, dueSoon, today } from "./partners";

/* ============================================================
   Affiliate Partnerships — data access (server only).
   ============================================================ */

type Rows = {
  firms: (typeof tables.partnerFirms.$inferInsert)[]; research: (typeof tables.partnerResearch.$inferInsert)[]; applications: (typeof tables.partnerApplications.$inferInsert)[];
  terms: (typeof tables.partnerTermItems.$inferInsert)[]; compliance: (typeof tables.partnerCompliance.$inferInsert)[]; channels: (typeof tables.partnerChannelApprovals.$inferInsert)[];
  tasks: (typeof tables.partnerTasks.$inferInsert)[]; audit: (typeof tables.partnerAudit.$inferInsert)[];
};

/** Deterministic seed rows for the tracked programmes (same ids in db-setup and the Neon SQL file). */
export function seedRows(): Rows {
  const R: Rows = { firms: [], research: [], applications: [], terms: [], compliance: [], channels: [], tasks: [], audit: [] };
  for (const f of SEED_FIRMS) {
    const id = "pf_" + f.slug; const SEED_RESEARCH_DATE = f.seededOn ?? SEED_DATE;
    R.firms.push({ id, slug: f.slug, name: f.name, programmeUrl: f.programmeUrl, applyUrl: f.applyUrl ?? "", requirementsUrl: f.requirementsUrl ?? "", model: f.model, applicationStatus: "researching", termsStatus: "unverified", complianceStatus: f.complianceStatus ?? "not_reviewed", countryNote: f.countryNote ?? "", countryEligibility: "unknown", targetCountries: ["GB"], owner: SEED_OWNER, nextAction: f.nextAction, nextActionDue: addDays(SEED_RESEARCH_DATE, f.nextActionDueDays), lastResearchAt: SEED_RESEARCH_DATE, notes: f.notes + "\n\n" + seedNote(SEED_RESEARCH_DATE) });
    f.research.forEach((r, i) => R.research.push({ id: `pr_${f.slug}_${i + 1}`, firmId: id, topic: r.topic, claim: r.claim, sourceUrl: r.sourceUrl, verification: r.verification ?? "assumption", verifiedAt: null, notes: "Seeded " + SEED_RESEARCH_DATE + "; not yet verified against the source." }));
    R.applications.push({ id: "pa_" + f.slug, firmId: id, checklist: f.checklist.map((label) => ({ label, done: false })), documents: f.documents.map((label) => ({ label, locationRef: "", done: false })) });
    SEED_TERM_KEYS.forEach((key) => { const t = f.terms?.find((x) => x.key === key); R.terms.push({ id: `pt_${f.slug}_${key}`, firmId: id, key, status: "unverified", ...(t ? { value: t.value, currency: t.currency, sourceUrl: t.sourceUrl ?? "", sourceNote: t.sourceNote ?? "" } : {}) }); });
    R.compliance.push({ id: "pc_" + f.slug, firmId: id, permittedToPromote: "unknown", legalAdviceRequired: true, restrictions: f.complianceRestrictions ?? "", openQuestions: "Is Ten Talents (not FCA-authorised) permitted to communicate this firm's financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?" });
    SEED_CHANNELS.forEach((channel) => R.channels.push({ id: `pch_${f.slug}_${channel}`, firmId: id, channel, status: "not_reviewed" }));
    f.tasks.forEach((t, i) => R.tasks.push({ id: `pk_${f.slug}_${i + 1}`, firmId: id, title: t.title, owner: SEED_OWNER, priority: t.priority ?? "normal", dueAt: t.dueDays ? addDays(SEED_RESEARCH_DATE, t.dueDays) : null }));
    R.audit.push({ id: "pau_" + f.slug, firmId: id, entity: "firm", entityId: id, field: "created", oldValue: "", newValue: "added to the tracker (" + SEED_RESEARCH_DATE + ")", actor: "seed" });
  }
  return R;
}

/** Remove retired firms, insert tracked programmes if (and only if) they are missing, then apply founder-confirmed
 *  status updates once. Never overwrites edits. */
export async function seedPartners() {
  for (const slug of RETIRED_SLUGS) await db.delete(tables.partnerFirms).where(eq(tables.partnerFirms.slug, slug)); // cascades to every child table
  const R = seedRows(); let created = 0;
  for (const firm of R.firms) {
    const exists = (await db.select({ id: tables.partnerFirms.id }).from(tables.partnerFirms).where(eq(tables.partnerFirms.slug, firm.slug)))[0];
    if (exists) continue;
    await db.insert(tables.partnerFirms).values(firm);
    const mine = <T extends { firmId: string }>(rows: T[]) => rows.filter((r) => r.firmId === firm.id);
    for (const r of mine(R.research)) await db.insert(tables.partnerResearch).values(r);
    for (const r of mine(R.applications)) await db.insert(tables.partnerApplications).values(r);
    for (const r of mine(R.terms)) await db.insert(tables.partnerTermItems).values(r);
    for (const r of mine(R.compliance)) await db.insert(tables.partnerCompliance).values(r);
    for (const r of mine(R.channels)) await db.insert(tables.partnerChannelApprovals).values(r);
    for (const r of mine(R.tasks)) await db.insert(tables.partnerTasks).values(r);
    for (const r of mine(R.audit)) await db.insert(tables.partnerAudit).values(r);
    created++;
  }
  await seedPatches(R);
  await applyFounderUpdates();
  return created;
}

/** For firms that already exist: add seed rows that are missing (new research claims, new term keys with their
 *  seeded values) and fill empty URLs. Never overwrites a value that is already set. */
async function seedPatches(R: Rows) {
  const firms = await db.select().from(tables.partnerFirms);
  for (const f of firms) {
    const seed = SEED_FIRMS.find((x) => x.slug === f.slug); if (!seed) continue;
    const fill: Partial<typeof tables.partnerFirms.$inferInsert> = {};
    if (!f.requirementsUrl && seed.requirementsUrl) fill.requirementsUrl = seed.requirementsUrl;
    if (!f.applyUrl && seed.applyUrl) fill.applyUrl = seed.applyUrl;
    if (Object.keys(fill).length) await db.update(tables.partnerFirms).set(fill).where(eq(tables.partnerFirms.id, f.id));
    const haveR = new Set((await db.select({ id: tables.partnerResearch.id }).from(tables.partnerResearch).where(eq(tables.partnerResearch.firmId, f.id))).map((r) => r.id));
    for (const r of R.research.filter((r) => r.firmId === f.id && !haveR.has(r.id))) await db.insert(tables.partnerResearch).values(r);
    const existingT = await db.select().from(tables.partnerTermItems).where(eq(tables.partnerTermItems.firmId, f.id));
    for (const t of R.terms.filter((t) => t.firmId === f.id)) {
      const cur = existingT.find((x) => x.key === t.key);
      if (!cur) { await db.insert(tables.partnerTermItems).values(t); continue; }
      if (!cur.value?.trim() && t.value) await db.update(tables.partnerTermItems).set({ value: t.value, currency: cur.currency ?? t.currency ?? null, sourceUrl: cur.sourceUrl || t.sourceUrl || "", sourceNote: cur.sourceNote || t.sourceNote || "" }).where(eq(tables.partnerTermItems.id, cur.id));
    }
  }
}

/* Statuses a founder update may move a firm from: forward only, never over Approved, Declined or On Hold. */
const MOVABLE_FROM: Record<string, string[]> = {
  application_submitted: ["not_started", "researching", "ready_to_apply"],
  approved: ["not_started", "researching", "ready_to_apply", "application_submitted", "awaiting_response", "more_info_required"],
};

/** Founder-confirmed status updates: applied once per firm and status (the audit row's fixed id is the marker).
 *  Terms and compliance are not touched; a next action the founder wrote is kept. */
async function applyFounderUpdates() {
  for (const u of FOUNDER_UPDATES) {
    const f = (await db.select().from(tables.partnerFirms).where(eq(tables.partnerFirms.slug, u.slug)))[0];
    if (!f || !MOVABLE_FROM[u.status].includes(f.applicationStatus)) continue;
    const marker = `pau_${u.slug}_${u.status}`;
    if ((await db.select({ id: tables.partnerAudit.id }).from(tables.partnerAudit).where(eq(tables.partnerAudit.id, marker)))[0]) continue;
    const seededAction = SEED_FIRMS.find((s) => s.slug === u.slug)?.nextAction;
    const nextAction = !f.nextAction || f.nextAction === seededAction ? u.nextAction : null; // keep an action the founder wrote
    const contacted = u.comm.kind !== "other" && (!f.lastContactAt || f.lastContactAt < u.on); // a message from the firm counts as contact, as in the dashboard
    await db.update(tables.partnerFirms).set({ applicationStatus: u.status, ...(nextAction ? { nextAction, nextActionDue: addDays(u.on, 14) } : {}), ...(contacted ? { lastContactAt: u.on } : {}), updatedAt: new Date() }).where(eq(tables.partnerFirms.id, f.id));
    await db.insert(tables.partnerAudit).values({ id: marker, firmId: f.id, entity: "firm", entityId: f.id, field: "applicationStatus", oldValue: f.applicationStatus, newValue: u.status, actor: "founder" });
    if (nextAction) await audit(f.id, "firm", f.id, "nextAction", f.nextAction, nextAction, "founder");
    if (u.status === "application_submitted") {
      const app = (await db.select().from(tables.partnerApplications).where(eq(tables.partnerApplications.firmId, f.id)))[0];
      if (app && !app.submittedAt) { await db.update(tables.partnerApplications).set({ submittedAt: u.on, updatedAt: new Date() }).where(eq(tables.partnerApplications.id, app.id)); await audit(f.id, "application", app.id, "submittedAt", null, u.on, "founder"); }
    }
    await db.insert(tables.partnerComms).values({ id: `pcm_${u.slug}_${u.status}`, firmId: f.id, at: u.on, kind: u.comm.kind, contactName: u.comm.contactName, summary: u.comm.summary, questionsOpen: u.comm.questionsOpen, nextFollowUp: addDays(u.on, 14) }).onConflictDoNothing();
    await db.insert(tables.partnerTasks).values({ id: `pk_${u.slug}_${u.status}`, firmId: f.id, title: u.task.title, owner: SEED_OWNER, priority: u.task.priority ?? "high", dueAt: addDays(u.on, u.task.dueDays) }).onConflictDoNothing();
    const open = await db.select().from(tables.partnerTasks).where(and(eq(tables.partnerTasks.firmId, f.id), eq(tables.partnerTasks.status, "open")));
    for (const k of open.filter((k) => k.title.startsWith("Apply to programme"))) {
      await db.update(tables.partnerTasks).set({ status: "cancelled", notes: (u.status === "approved" ? "Not needed: agreement confirmed by the founder on " : "Done: applied on ") + u.on + ".", completedAt: new Date() }).where(eq(tables.partnerTasks.id, k.id));
      await audit(f.id, "task", k.id, "status", "open", "cancelled", "founder");
    }
  }
}

/* Firm logos: an explicit logoUrl wins; otherwise, when LOGO_DEV_KEY is configured, derive the logo from the
   firm's official domain via Logo.dev (publishable key, admin pages only). Null → initials fallback. */
export function brandDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const p = host.split(".");
    if (p.length <= 2) return host;
    const second = p[p.length - 2], tld = p[p.length - 1];
    return (tld.length === 2 && ["co", "com", "org", "net", "ac", "gov"].includes(second)) ? p.slice(-3).join(".") : p.slice(-2).join(".");
  } catch { return null; }
}
export function logoFor(f: { logoUrl: string | null; programmeUrl: string | null }): string | null {
  if (f.logoUrl === "none") return null; // explicit opt-out: show initials even when a key is configured
  if (f.logoUrl) return f.logoUrl;
  const key = process.env.LOGO_DEV_KEY; const d = brandDomain(f.programmeUrl);
  return key && d ? `https://img.logo.dev/${d}?token=${encodeURIComponent(key)}&size=150&format=webp&retina=true` : null;
}
export const logoAttribution = () => !!process.env.LOGO_DEV_KEY;

export type FirmSummary = typeof tables.partnerFirms.$inferSelect & { openTasks: number; overdueTasks: number; nextTaskDue: string | null; primaryContact: string | null; flags: { overdue: boolean; dueSoon: boolean } };

export async function listFirms(): Promise<FirmSummary[]> {
  const firms = await db.select().from(tables.partnerFirms).orderBy(asc(tables.partnerFirms.name));
  const tasks = await db.select().from(tables.partnerTasks).where(eq(tables.partnerTasks.status, "open"));
  const contacts = await db.select().from(tables.partnerContacts).where(eq(tables.partnerContacts.isPrimary, true));
  return firms.map((f) => {
    const mine = tasks.filter((t) => t.firmId === f.id);
    const dues = mine.map((t) => t.dueAt).filter((d): d is string => !!d).sort();
    return { ...f, logoUrl: logoFor(f), openTasks: mine.length, overdueTasks: mine.filter((t) => overdue(t.dueAt, t.status)).length, nextTaskDue: dues[0] ?? null, primaryContact: contacts.find((c) => c.firmId === f.id)?.name ?? null, flags: { overdue: overdue(f.nextActionDue) || mine.some((t) => overdue(t.dueAt, t.status)), dueSoon: dueSoon(f.nextActionDue) } };
  });
}

export async function loadWorkspace(idOrSlug: string) {
  const firm = (await db.select().from(tables.partnerFirms).where(eq(tables.partnerFirms.id, idOrSlug)))[0]
    ?? (await db.select().from(tables.partnerFirms).where(eq(tables.partnerFirms.slug, idOrSlug)))[0];
  if (!firm) return null;
  const id = firm.id;
  const [research, contacts, application, terms, compliance, channels, comms, tasks, reports, ledger, audit] = await Promise.all([
    db.select().from(tables.partnerResearch).where(eq(tables.partnerResearch.firmId, id)).orderBy(asc(tables.partnerResearch.createdAt)),
    db.select().from(tables.partnerContacts).where(eq(tables.partnerContacts.firmId, id)).orderBy(desc(tables.partnerContacts.isPrimary), asc(tables.partnerContacts.name)),
    db.select().from(tables.partnerApplications).where(eq(tables.partnerApplications.firmId, id)),
    db.select().from(tables.partnerTermItems).where(eq(tables.partnerTermItems.firmId, id)),
    db.select().from(tables.partnerCompliance).where(eq(tables.partnerCompliance.firmId, id)),
    db.select().from(tables.partnerChannelApprovals).where(eq(tables.partnerChannelApprovals.firmId, id)),
    db.select().from(tables.partnerComms).where(eq(tables.partnerComms.firmId, id)).orderBy(desc(tables.partnerComms.at), desc(tables.partnerComms.createdAt)),
    db.select().from(tables.partnerTasks).where(eq(tables.partnerTasks.firmId, id)).orderBy(asc(tables.partnerTasks.status), asc(tables.partnerTasks.dueAt)),
    db.select().from(tables.partnerReports).where(eq(tables.partnerReports.firmId, id)).orderBy(desc(tables.partnerReports.periodStart)),
    db.select().from(tables.partnerLedger).where(eq(tables.partnerLedger.firmId, id)).orderBy(desc(tables.partnerLedger.at), desc(tables.partnerLedger.createdAt)),
    db.select().from(tables.partnerAudit).where(eq(tables.partnerAudit.firmId, id)).orderBy(desc(tables.partnerAudit.at)).limit(200),
  ]);
  return { firm, logoSrc: logoFor(firm), research, contacts, application: application[0] ?? null, terms, compliance: compliance[0] ?? null, channels, comms, tasks, reports, ledger, audit };
}
export type Workspace = NonNullable<Awaited<ReturnType<typeof loadWorkspace>>>;

/** Consolidated next actions across all firms: firm next actions + open tasks, soonest first. */
export async function nextActions() {
  const firms = await db.select().from(tables.partnerFirms);
  const tasks = await db.select().from(tables.partnerTasks).where(eq(tables.partnerTasks.status, "open"));
  const name = (id: string) => firms.find((f) => f.id === id);
  const items = [
    ...firms.filter((f) => f.nextAction).map((f) => ({ kind: "action" as const, firmId: f.id, firmName: f.name, slug: f.slug, title: f.nextAction, due: f.nextActionDue, owner: f.owner, priority: "normal", id: f.id })),
    ...tasks.map((t) => ({ kind: "task" as const, firmId: t.firmId, firmName: name(t.firmId)?.name ?? "", slug: name(t.firmId)?.slug ?? "", title: t.title, due: t.dueAt, owner: t.owner, priority: t.priority, id: t.id })),
  ];
  const t = today();
  return items.sort((a, b) => ((a.due ?? "9999") < (b.due ?? "9999") ? -1 : (a.due ?? "9999") > (b.due ?? "9999") ? 1 : 0)).map((i) => ({ ...i, overdue: !!i.due && i.due < t }));
}

export async function audit(firmId: string, entity: string, entityId: string, field: string, oldValue: unknown, newValue: unknown, actor = "admin") {
  const o = oldValue == null ? "" : typeof oldValue === "object" ? JSON.stringify(oldValue) : String(oldValue);
  const n = newValue == null ? "" : typeof newValue === "object" ? JSON.stringify(newValue) : String(newValue);
  if (o === n) return;
  await db.insert(tables.partnerAudit).values({ id: nid(), firmId, entity, entityId, field, oldValue: o.slice(0, 2000), newValue: n.slice(0, 2000), actor });
}

export const firmById = async (id: string) => (await db.select().from(tables.partnerFirms).where(eq(tables.partnerFirms.id, id)))[0] ?? null;
export const whereOwned = (firmIdCol: { firmId: unknown }, firmId: string, idCol: unknown, id: string) => and(eq(firmIdCol.firmId as never, firmId), eq(idCol as never, id));

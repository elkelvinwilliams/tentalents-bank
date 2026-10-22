/* ============================================================
   Affiliate Partnerships — shared vocabulary, labels and validation.
   Internal operations module (admin-only). Three INDEPENDENT status axes:
   application · commercial terms · compliance. Never collapse them.
   ============================================================ */

export const APPLICATION_STATUS = ["not_started", "researching", "ready_to_apply", "application_submitted", "awaiting_response", "more_info_required", "approved", "declined", "on_hold"] as const;
export const TERMS_STATUS = ["unverified", "requested", "received", "under_review", "confirmed", "not_offered", "not_applicable"] as const;
export const COMPLIANCE_STATUS = ["not_reviewed", "review_required", "submitted_for_approval", "approved_for_specified_use", "changes_required", "suspended"] as const;
export const MODEL = ["cpa", "revenue_share", "hybrid", "ib", "enquiry_pending"] as const;
export const COUNTRY_ELIGIBILITY = ["unknown", "eligible", "conditional", "ineligible"] as const;
export const PERMITTED = ["unknown", "yes", "no", "conditional"] as const;
export const RESEARCH_TOPICS = ["eligibility", "min_age", "countries", "website_audience", "traffic_sources", "identity_verification", "company_registration", "tax_payout", "programme_model", "other"] as const;
export const VERIFICATION = ["assumption", "verified", "open_question"] as const;
export const TERM_KEYS = ["cpa_amount", "cpa_conditions", "revshare_pct", "revshare_basis", "hybrid_rules", "ib_terms", "min_deposit", "min_trading", "account_verification", "qualification_deadline", "tracking_window", "payment_frequency", "min_payout", "clawback_rules", "attribution_rules", "permitted_traffic", "country_rates", "contract_start", "contract_end", "terms_confirmed_at", "agreement_ref"] as const;
export const CHANNELS = ["website", "social", "email", "paid_ads", "webinar_community"] as const;
export const COMM_KIND = ["email", "call", "meeting", "portal", "other"] as const;
export const TASK_PRIORITY = ["low", "normal", "high", "urgent"] as const;
export const TASK_STATUS = ["open", "done", "cancelled"] as const;
export const LEDGER_KIND = ["pending", "approved", "reversed", "paid", "adjustment"] as const;
export const REPORT_SOURCE = ["manual", "export", "api"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];
export type TermsStatus = (typeof TERMS_STATUS)[number];
export type ComplianceStatus = (typeof COMPLIANCE_STATUS)[number];

const title = (s: string) => s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
export const LABEL: Record<string, string> = {
  not_started: "Not Started", researching: "Researching", ready_to_apply: "Ready to Apply", application_submitted: "Application Submitted", awaiting_response: "Awaiting Response", more_info_required: "More Information Required", approved: "Approved", declined: "Declined", on_hold: "On Hold",
  unverified: "Unverified", requested: "Requested", received: "Received", under_review: "Under Review", confirmed: "Confirmed", not_offered: "Not Offered", not_applicable: "Not Applicable",
  not_reviewed: "Not Reviewed", review_required: "Review Required", submitted_for_approval: "Submitted for Approval", approved_for_specified_use: "Approved for Specified Use", changes_required: "Changes Required", suspended: "Suspended",
  cpa: "CPA", revenue_share: "Revenue share", hybrid: "Hybrid", ib: "Introducing broker", enquiry_pending: "Enquiry pending",
  unknown: "Unknown", eligible: "Eligible", conditional: "Conditional", ineligible: "Ineligible", yes: "Yes", no: "No",
  assumption: "Assumption", verified: "Verified", open_question: "Open question",
  eligibility: "Individual / corporate eligibility", min_age: "Minimum age", countries: "Approved and excluded countries", website_audience: "Website and audience requirements", traffic_sources: "Allowed traffic sources", identity_verification: "Identity verification", company_registration: "Company registration", tax_payout: "Tax and payout verification", programme_model: "Programme model", other: "Other",
  cpa_amount: "CPA amount", cpa_conditions: "CPA qualification conditions", revshare_pct: "Revenue-share %", revshare_basis: "Revenue-share calculation basis", hybrid_rules: "Hybrid payment rules", ib_terms: "IB terms", min_deposit: "Minimum deposit", min_trading: "Minimum trading requirement", account_verification: "Account verification requirements", qualification_deadline: "Qualification deadline", tracking_window: "Referral tracking window", payment_frequency: "Payment frequency", min_payout: "Minimum payout threshold", clawback_rules: "Refund, reversal and clawback rules", attribution_rules: "Attribution rules", permitted_traffic: "Permitted traffic sources", country_rates: "Country-specific rates", contract_start: "Contract start", contract_end: "Contract expiry", terms_confirmed_at: "Date terms confirmed", agreement_ref: "Governing agreement (link or reference)",
  website: "Website", social: "Social accounts", email: "Email marketing", paid_ads: "Paid advertising", webinar_community: "Webinars and community channels",
  email_: "Email", call: "Call", meeting: "Meeting", portal: "Partner portal", low: "Low", normal: "Normal", high: "High", urgent: "Urgent", open: "Open", done: "Done", cancelled: "Cancelled",
  pending: "Pending", reversed: "Reversed", paid: "Paid", adjustment: "Adjustment", manual: "Manual entry", export: "Partner export", api: "API",
};
export const label = (v: string | null | undefined) => (v ? LABEL[v] ?? title(v) : "—");

/* Tone for status pills. Deliberately muted: only "approved"-class values get the green
   text treatment, and even then as a label, never a celebratory badge. */
export const tone = (v: string | null | undefined): "neutral" | "active" | "good" | "warn" | "bad" => {
  switch (v) {
    case "approved": case "confirmed": case "approved_for_specified_use": case "verified": case "eligible": case "yes": return "good";
    case "declined": case "suspended": case "ineligible": case "no": return "bad";
    case "more_info_required": case "changes_required": case "review_required": case "open_question": case "conditional": return "warn";
    case "application_submitted": case "awaiting_response": case "requested": case "received": case "under_review": case "submitted_for_approval": case "researching": case "ready_to_apply": return "active";
    default: return "neutral";
  }
};

export const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const today = () => new Date().toISOString().slice(0, 10);
export const overdue = (due: string | null | undefined, status?: string) => !!due && due < today() && status !== "done" && status !== "cancelled";
export const dueSoon = (due: string | null | undefined, days = 7) => { if (!due) return false; const d = new Date(due + "T00:00:00Z").getTime(); const n = Date.now(); return d >= n - 864e5 && d <= n + days * 864e5; };
export const fmtDate = (s: string | null | undefined) => (s && isDate(s) ? new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const money = (minor: number | null | undefined, ccy = "GBP") => (minor == null ? "—" : (minor / 100).toLocaleString("en-GB", { style: "currency", currency: ccy }));

/* Validation helpers for the API: coerce-or-undefined, so `strip()` drops untouched fields. */
export const str = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max) : undefined);
export const dateOrNull = (v: unknown) => (v === "" || v === null ? null : isDate(v) ? v : undefined);
export const oneOf = <T extends readonly string[]>(list: T, v: unknown): T[number] | undefined => (typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T[number]) : undefined);
export const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
export const int = (v: unknown, min = 0, max = 1e12) => (v === "" || v === null ? null : typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : undefined);
/** Money typed in pounds → minor units; "" → null. */
export const minor = (v: unknown) => (v === "" || v === null ? null : typeof v === "number" && Number.isFinite(v) ? Math.round(v * 100) : typeof v === "string" && v.trim() !== "" && Number.isFinite(+v) ? Math.round(+v * 100) : undefined);
export const strip = <T extends object>(o: T): Partial<T> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

/** Fields whose changes are written to the audit trail. */
export const AUDITED_FIRM_FIELDS = ["applicationStatus", "termsStatus", "complianceStatus", "model", "countryEligibility", "owner", "nextAction", "nextActionDue"] as const;

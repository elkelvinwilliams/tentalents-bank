import { db, tables } from "@/db";
import type { FirmSummary } from "./partners-data";

/* Comparison ranking for the affiliate prospects (brief, 23 Oct 2026).
   Weights: 35% payout speed · 30% achievable CPA · 20% country eligibility & compliance · 15% minimum withdrawal / ease of payment.
   Rules are deliberately simple and visible. Inputs that are not Confirmed count as provisional and are listed as
   "Needs Confirmation"; an input with no usable value scores 0 on that axis. Verified (Confirmed) terms take precedence
   over advertised ones, so a programme cannot rank first on an advertised ceiling alone. */

export type RankRow = {
  id: string; slug: string; name: string; model: string; applicationStatus: string;
  advertisedCpa: string; approvedCpa: string; paymentFrequency: string; minPayout: string; countries: string;
  countryEligibility: string; permitted: string; nextAction: string; nextActionDue: string | null;
  scores: { payout: number; cpa: number; country: number; ease: number }; total: number;
  needsConfirmation: string[]; verifiedInputs: number;
};

const WEIGHTS = { payout: 0.35, cpa: 0.30, country: 0.20, ease: 0.15 } as const;
/* Evidence multipliers: a Confirmed term counts in full; an advertised / received-but-unconfirmed value counts at 60%;
   a value the sources contradict counts at 40%. This is what stops an unverified "up to" ceiling from ranking first. */
export const EVIDENCE = { confirmed: 1, advertised: 0.6, conflicting: 0.4 } as const;
export function evidenceFactor(value: string, status: string | undefined): number {
  if (status === "confirmed") return EVIDENCE.confirmed;
  return /conflict|needs confirmation/i.test(value) ? EVIDENCE.conflicting : EVIDENCE.advertised;
}
/* Compliance status factor on the country/compliance axis. */
export function complianceFactor(status: string): number {
  return ({ approved_for_specified_use: 1, not_reviewed: 1, submitted_for_approval: 0.9, review_required: 0.5, changes_required: 0.5, suspended: 0 } as Record<string, number>)[status] ?? 1;
}

/** First money-like number in a string, e.g. "$1,000" → 1000, "1850 USD" → 1850. Null when none. */
const firstAmount = (v: string) => { const m = v.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/); return m ? Number(m[1]) : null; };
/** Largest money-like number in a string (for "up to" ceilings such as "$600–$1,200"). */
const maxAmount = (v: string) => { const ms = [...v.replace(/,/g, "").matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1])); return ms.length ? Math.max(...ms) : null; };

/** Conservative: when a value mentions several cadences (sources disagree), the slowest one counts. */
export function payoutScore(v: string): number {
  const t = v.toLowerCase(); if (!t.trim() || t.startsWith("needs confirmation")) return 0;
  const found: number[] = [];
  if (/daily|next day|every day/.test(t)) found.push(100);
  if (/twice (a )?week|two times a week/.test(t)) found.push(85);
  if (/(^|[^-])\bweekly\b/.test(t.replace(/bi-?weekly|twice weekly|twice a week/g, ""))) found.push(80);
  if (/bi-?weekly|fortnight|every two weeks/.test(t)) found.push(60);
  if (/monthly|month/.test(t)) found.push(40);
  if (/quarter/.test(t)) found.push(15);
  return found.length ? Math.min(...found) : 0;
}
export function cpaScore(amount: number | null): number {
  if (amount === null || amount <= 0) return 0;
  if (amount >= 1500) return 100; if (amount >= 1000) return 85; if (amount >= 600) return 65; if (amount >= 400) return 50; if (amount >= 200) return 30; return 15;
}
export function easeScore(v: string): number {
  const t = v.toLowerCase(); if (!t.trim() || t.startsWith("needs confirmation")) return 0;
  if (/no minimum|none|no threshold/.test(t) && !/\$\s?\d/.test(t)) return 100;
  const a = firstAmount(t); if (a === null) return 0;
  if (a <= 10) return 100; if (a <= 50) return 85; if (a <= 100) return 70; if (a <= 500) return 45; if (a <= 2000) return 20; return 10;
}
export function countryScore(eligibility: string, permitted: string): number {
  const e = { eligible: 100, conditional: 60, unknown: 25, ineligible: 0 }[eligibility] ?? 0;
  const p = { yes: 100, conditional: 60, unknown: 25, no: 0 }[permitted] ?? 0;
  return Math.round((e + p) / 2);
}

export async function rankFirms(firms: FirmSummary[]): Promise<RankRow[]> {
  // Sequential on purpose: the embedded dev database (PGlite) is single-connection and has crashed under parallel selects.
  const terms = await db.select().from(tables.partnerTermItems);
  const compliance = await db.select().from(tables.partnerCompliance);
  const rows = firms.map((f) => {
    const T = (key: string) => terms.find((t) => t.firmId === f.id && t.key === key);
    const val = (key: string) => T(key)?.value?.trim() ?? "";
    const confirmed = (key: string) => T(key)?.status === "confirmed";
    const c = compliance.find((x) => x.firmId === f.id);
    const approved = val("cpa_amount"), advertised = val("cpa_advertised_max");
    const cpaBasis = confirmed("cpa_amount") && firstAmount(approved) !== null ? firstAmount(approved) : maxAmount(advertised);
    const needs: string[] = [];
    if (!confirmed("payment_frequency")) needs.push("Payment frequency");
    if (!confirmed("cpa_amount")) needs.push("Approved CPA rate");
    if (!confirmed("min_payout")) needs.push("Minimum withdrawal");
    if (f.countryEligibility === "unknown" || (c?.permittedToPromote ?? "unknown") === "unknown") needs.push("UK eligibility / permission to promote");
    const ef = (key: string) => evidenceFactor(val(key), T(key)?.status);
    const scores = {
      payout: Math.round(payoutScore(val("payment_frequency")) * ef("payment_frequency")),
      cpa: Math.round(cpaScore(cpaBasis) * (confirmed("cpa_amount") ? 1 : ef("cpa_advertised_max"))),
      country: Math.round(countryScore(f.countryEligibility, c?.permittedToPromote ?? "unknown") * complianceFactor(f.complianceStatus)),
      ease: Math.round(easeScore(val("min_payout")) * ef("min_payout")),
    };
    const total = Math.round(scores.payout * WEIGHTS.payout + scores.cpa * WEIGHTS.cpa + scores.country * WEIGHTS.country + scores.ease * WEIGHTS.ease);
    return { id: f.id, slug: f.slug, name: f.name, model: f.model, applicationStatus: f.applicationStatus, advertisedCpa: advertised, approvedCpa: approved, paymentFrequency: val("payment_frequency"), minPayout: val("min_payout"), countries: val("countries_accepted"), countryEligibility: f.countryEligibility, permitted: c?.permittedToPromote ?? "unknown", nextAction: f.nextAction, nextActionDue: f.nextActionDue, scores, total, needsConfirmation: needs, verifiedInputs: 4 - needs.length } satisfies RankRow;
  });
  return rows.sort((a, b) => b.total - a.total || a.needsConfirmation.length - b.needsConfirmation.length || a.name.localeCompare(b.name));
}

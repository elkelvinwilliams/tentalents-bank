/* ============================================================
   Affiliate Partnerships — seed for the four PROSPECTS.
   Everything here is PROVISIONAL and truthful: no application has been
   submitted, nothing is approved, no terms are confirmed, no commission exists.
   Research claims are recorded as ASSUMPTIONS drawn from the brief and the
   programmes' public pages; they must be re-verified against the official
   source and marked "verified" with a date by a human. Seed is insert-if-missing:
   re-running never overwrites edits made in the dashboard.
   ============================================================ */
import { TERM_KEYS, CHANNELS } from "../lib/partners";

export const SEED_RESEARCH_DATE = "2026-10-21";
export const SEED_NOTE = "Seeded from the partnerships brief on " + SEED_RESEARCH_DATE + ". Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.";

export type SeedClaim = { topic: string; claim: string; sourceUrl: string; verification?: "assumption" | "verified" | "open_question" };
export type SeedTask = { title: string; priority?: "low" | "normal" | "high" | "urgent"; dueDays?: number };
export type SeedFirm = {
  slug: string; name: string; programmeUrl: string; applyUrl?: string; requirementsUrl?: string;
  model: string; notes: string; nextAction: string; nextActionDueDays: number;
  research: SeedClaim[]; tasks: SeedTask[]; checklist: string[]; documents: string[];
};

const OWNER = "Kelvin Williams";
const STANDARD_CHECKLIST = ["Confirm the correct legal entity to contract (sole trader now; company after incorporation)", "Website audit against the programme's publisher requirements", "Prepare audience and traffic description (education-first, UK)", "Prepare affiliate-disclosure and risk-warning wording", "Identify every channel to be approved (website, social, email, paid, community)", "Record official contact route and reference"];
const STANDARD_DOCS = ["Proof of identity (reference to secure store only)", "Proof of address (reference to secure store only)", "Company registration certificate (after incorporation)", "Bank / payout details (reference to secure store only)", "Tax form if required (e.g. W-8BEN)"];

/* Firms removed by founder decision. db:setup deletes them (and everything attached) if present; they are never re-seeded.
   ig — IG declined the application on 2026-10-23; dropped (D-027). */
export const RETIRED_SLUGS = ["ig"] as const;

export const SEED_FIRMS: SeedFirm[] = [
  {
    slug: "axi", name: "Axi", programmeUrl: "https://www.axi.com/uk/partnerships/affiliate-program", model: "cpa",
    notes: "Prospect. Public page advertises CPA 'up to' a stated maximum for qualified clients; the maximum is a ceiling, not a rate.",
    nextAction: "Review the UK programme; request the current rate card; confirm UK audience eligibility, exact client qualification rules and which Ten Talents channels can be approved.", nextActionDueDays: 14,
    research: [
      { topic: "programme_model", claim: "Axi advertises CPA payments 'up to' a stated maximum for qualified clients.", sourceUrl: "https://www.axi.com/uk/partnerships/affiliate-program" },
      { topic: "eligibility", claim: "Qualification may require account verification, a minimum deposit and trading volume, depending on the agreement.", sourceUrl: "https://www.axi.com/uk/partnerships/affiliate-program" },
      { topic: "countries", claim: "UK audience eligibility and excluded jurisdictions not yet confirmed in writing.", sourceUrl: "https://www.axi.com/uk/partnerships/affiliate-program", verification: "open_question" },
      { topic: "traffic_sources", claim: "Which Ten Talents promotional channels can be approved is unknown.", sourceUrl: "https://www.axi.com/uk/partnerships/affiliate-program", verification: "open_question" },
    ],
    tasks: [{ title: "Review the UK affiliate programme page and record verified facts", priority: "high", dueDays: 7 }, { title: "Request the current rate card and qualification rules in writing", priority: "high", dueDays: 14 }, { title: "Ask which promotional channels can be approved", dueDays: 14 }],
    checklist: STANDARD_CHECKLIST, documents: STANDARD_DOCS,
  },
  {
    slug: "pepperstone", name: "Pepperstone", programmeUrl: "https://partnership.pepperstone.com/en/affiliates-program/", model: "enquiry_pending",
    notes: "Prospect. Pepperstone distinguishes CPA affiliate arrangements from introducing-broker (IB) arrangements; availability and terms depend on programme and country.",
    nextAction: "Confirm whether a UK-based Ten Talents affiliate can participate; request current CPA terms and qualification rules; ask separately about IB arrangements; record approved marketing channels.", nextActionDueDays: 14,
    research: [
      { topic: "programme_model", claim: "CPA affiliate and IB arrangements are separate programmes with different terms.", sourceUrl: "https://partnership.pepperstone.com/en/affiliates-program/" },
      { topic: "countries", claim: "Availability and commission terms depend on the applicable programme and country; UK participation not confirmed.", sourceUrl: "https://partnership.pepperstone.com/en/affiliates-program/", verification: "open_question" },
      { topic: "traffic_sources", claim: "Approved marketing channels unknown.", sourceUrl: "https://partnership.pepperstone.com/en/affiliates-program/", verification: "open_question" },
    ],
    tasks: [{ title: "Confirm UK affiliate participation in writing", priority: "high", dueDays: 14 }, { title: "Request current CPA terms and qualification rules", priority: "high", dueDays: 14 }, { title: "Ask separately about IB terms and requirements", dueDays: 21 }],
    checklist: STANDARD_CHECKLIST, documents: STANDARD_DOCS,
  },
  {
    slug: "plus500", name: "Plus500 / 500Affiliates", programmeUrl: "https://www.500affiliates.com/", model: "enquiry_pending",
    notes: "Prospect. Do not assume older help pages represent the current agreement; only the current official programme rules count.",
    nextAction: "Review the current official programme rules; confirm UK affiliate and UK customer eligibility; request current commission terms, qualification rules, approved traffic sources and compliance requirements.", nextActionDueDays: 14,
    research: [
      { topic: "programme_model", claim: "Commercial model and current commission terms unknown until the current official rules are reviewed.", sourceUrl: "https://www.500affiliates.com/", verification: "open_question" },
      { topic: "countries", claim: "UK affiliate eligibility and UK customer eligibility not confirmed.", sourceUrl: "https://www.500affiliates.com/", verification: "open_question" },
      { topic: "traffic_sources", claim: "Approved traffic sources and compliance requirements not confirmed.", sourceUrl: "https://www.500affiliates.com/", verification: "open_question" },
    ],
    tasks: [{ title: "Review the current official 500Affiliates programme rules", priority: "high", dueDays: 7 }, { title: "Confirm UK affiliate and UK customer eligibility in writing", priority: "high", dueDays: 14 }, { title: "Request commission terms, qualification rules, traffic sources and compliance requirements", dueDays: 14 }],
    checklist: STANDARD_CHECKLIST, documents: STANDARD_DOCS,
  },
  {
    slug: "trading212", name: "Trading 212", programmeUrl: "https://helpcentre.trading212.com/hc/en-us/articles/360008095077-How-can-I-become-a-Trading-212-Affiliate", model: "enquiry_pending",
    notes: "Prospect. Trading 212 invites finance, investing and stock-market publishers to contact its partnerships team. No current CPA rate is assumed and acceptance is not guaranteed.",
    nextAction: "Prepare a professional partnership enquiry (mission, audience, website, education content, proposed channels); ask whether a suitable current programme is available; request eligibility, commission and approval terms in writing.", nextActionDueDays: 14,
    research: [
      { topic: "programme_model", claim: "Publishers are invited to contact the partnerships team; no public rate card.", sourceUrl: "https://helpcentre.trading212.com/hc/en-us/articles/360008095077-How-can-I-become-a-Trading-212-Affiliate" },
      { topic: "eligibility", claim: "Acceptance is at Trading 212's discretion; eligibility criteria not published.", sourceUrl: "https://helpcentre.trading212.com/hc/en-us/articles/360008095077-How-can-I-become-a-Trading-212-Affiliate", verification: "open_question" },
    ],
    tasks: [{ title: "Draft the partnership enquiry (mission, audience, site, content, channels)", priority: "high", dueDays: 10 }, { title: "Send the enquiry via the official route and log the correspondence", dueDays: 14 }],
    checklist: STANDARD_CHECKLIST, documents: STANDARD_DOCS,
  },
];

export const SEED_TERM_KEYS = TERM_KEYS;
export const SEED_CHANNELS = CHANNELS;
export const SEED_OWNER = OWNER;

export const addDays = (iso: string, days: number) => new Date(new Date(iso + "T00:00:00Z").getTime() + days * 864e5).toISOString().slice(0, 10);

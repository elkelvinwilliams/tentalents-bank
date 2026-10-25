/* ============================================================
   Affiliate Partnerships — seed for the programmes Ten Talents tracks.
   Public code: programme URLs, provisional facts and founder-confirmed statuses
   only. Agreement references, affiliate IDs, contacts and figures are entered in
   the dashboard (private database), never here.
   Research claims are ASSUMPTIONS drawn from the programmes' public pages until a
   human verifies them against the source. Seed is insert-if-missing: re-running
   never overwrites edits made in the dashboard. Founder-confirmed agreements
   (FOUNDER_UPDATES) are applied once at deploy.
   ============================================================ */
import { TERM_KEYS, CHANNELS } from "../lib/partners";

export const SEED_RESEARCH_DATE = "2026-10-21";
export const seedNote = (date: string) => "Seeded on " + date + " from the partnerships brief and the programmes' public pages. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.";

export type SeedClaim = { topic: string; claim: string; sourceUrl: string; verification?: "assumption" | "verified" | "open_question" };
export type SeedTask = { title: string; priority?: "low" | "normal" | "high" | "urgent"; dueDays?: number };
export type SeedTerm = { key: string; value: string; currency?: string; sourceUrl?: string; sourceNote?: string };
export type SeedFirm = {
  slug: string; name: string; programmeUrl: string; applyUrl?: string; requirementsUrl?: string;
  model: string; notes: string; nextAction: string; nextActionDueDays: number;
  research: SeedClaim[]; tasks: SeedTask[]; checklist: string[]; documents: string[];
  /** Optional: pre-filled commercial terms (always status "unverified" — label them Needs Confirmation in the sourceNote). */
  terms?: SeedTerm[];
  /** Optional: per-firm seed date (defaults to SEED_RESEARCH_DATE). */
  seededOn?: string;
  countryNote?: string; complianceRestrictions?: string; complianceStatus?: string;
};

/* Standard action tracker for every programme (brief, 23 Oct 2026). Added to new firms at seed time. */
export const STANDARD_TASKS: SeedTask[] = [
  { title: "Confirm UK eligibility (publisher and referred clients) in writing", priority: "high", dueDays: 7 },
  { title: "Request CPA rate card for Ten Talents' target countries", priority: "high", dueDays: 10 },
  { title: "Confirm payment frequency, minimum withdrawal and withdrawal methods/fees", priority: "high", dueDays: 10 },
  { title: "Apply to programme (only after eligibility and compliance are confirmed)", priority: "normal", dueDays: 21 },
  { title: "Obtain approved promotional materials and required risk-warning wording", priority: "normal", dueDays: 30 },
  { title: "Test tracking links before any use", priority: "normal" },
  { title: "Verify first commission payment against the statement", priority: "normal" },
];
const NC = "Needs Confirmation";

const OWNER = "Kelvin Williams";
const STANDARD_CHECKLIST = ["Confirm the correct legal entity to contract (sole trader now; company after incorporation)", "Website audit against the programme's publisher requirements", "Prepare audience and traffic description (education-first, UK)", "Prepare affiliate-disclosure and risk-warning wording", "Identify every channel to be approved (website, social, email, paid, community)", "Record official contact route and reference"];
const STANDARD_DOCS = ["Proof of identity (reference to secure store only)", "Proof of address (reference to secure store only)", "Company registration certificate (after incorporation)", "Bank / payout details (reference to secure store only)", "Tax form if required (e.g. W-8BEN)"];

/* Firms removed by founder decision. db:setup deletes them (and everything attached) if present; they are never re-seeded.
   ig — IG declined the application on 2026-10-23; dropped (D-027). */
export const RETIRED_SLUGS = ["ig"] as const;

/* Vantage added 2026-10-25: the founder confirmed an agreement on 2026-10-24 (D-029); it was not yet tracked. */
/* AvaTrade added 2026-10-25 as a prospect at the founder's request. */
const AVATRADE_PARTNERS = "https://avatrade.com.au/about-avatrade/partners";
const VANTAGE_HELP = "https://global.vantagehelpcenter.com/hc/en-us/articles/14111897392655-How-to-become-CPA-Affiliate";
export const SEED_FIRMS: SeedFirm[] = [
  {
    slug: "axi", name: "Axi", programmeUrl: "https://www.axi.com/uk/partnerships/affiliate-program", requirementsUrl: "https://www.axiaffiliates.com/frequently-asked-questions/", model: "cpa",
    notes: "Prospect. Public page advertises CPA 'up to' a stated maximum for qualified clients; the maximum is a ceiling, not a rate.",
    nextAction: "Review the UK programme; request the current rate card; confirm UK audience eligibility, exact client qualification rules and which Ten Talents channels can be approved.", nextActionDueDays: 14,
    research: [
      { topic: "programme_model", claim: "Axi advertises CPA payments 'up to' a stated maximum for qualified clients.", sourceUrl: "https://www.axi.com/uk/partnerships/affiliate-program" },
      { topic: "eligibility", claim: "Qualification may require account verification, a minimum deposit and trading volume, depending on the agreement.", sourceUrl: "https://www.axi.com/uk/partnerships/affiliate-program" },
      { topic: "countries", claim: "UK audience eligibility and excluded jurisdictions not yet confirmed in writing.", sourceUrl: "https://www.axi.com/uk/partnerships/affiliate-program", verification: "open_question" },
      { topic: "traffic_sources", claim: "Which Ten Talents promotional channels can be approved is unknown.", sourceUrl: "https://www.axi.com/uk/partnerships/affiliate-program", verification: "open_question" },
      { topic: "programme_model", claim: "Axi affiliate pages advertise CPA 'up to' figures that differ by page and region ($600 to $1,200 per qualified client) plus 10% on sub-affiliate earnings. Steven (Axi, 22 Oct 2026) confirmed a tiered CPA set in the individual agreement. " + NC + " for the UK tier.", sourceUrl: "https://www.axi.com/int/partnerships/affiliate-program" },
      { topic: "tax_payout", claim: "Payment schedule conflicts across Axi pages: 'biweekly' on the affiliate page, 'monthly' on another version; Axi partner support says commissions become payable once the balance reaches $2,000 and 5 qualified clients, then no minimum per withdrawal, via the Client Portal. " + NC + " with the Account Manager.", sourceUrl: "https://support.axi.com/hc/en-us/articles/49786766640537-How-can-I-withdraw-my-CPA-commission" },
      { topic: "eligibility", claim: "One Axi page states commission starts once referred clients reach a 400k standard volume; Steven stated two standard lots + minimum deposit within 60 days + verification. Conflict. " + NC + ".", sourceUrl: "https://www.axiaffiliates.com/frequently-asked-questions/", verification: "open_question" },
    ],
    tasks: [{ title: "Review the UK affiliate programme page and record verified facts", priority: "high", dueDays: 7 }, { title: "Request the current rate card and qualification rules in writing", priority: "high", dueDays: 14 }, { title: "Ask which promotional channels can be approved", dueDays: 14 }],
    checklist: STANDARD_CHECKLIST, documents: STANDARD_DOCS,
    terms: [
      { key: "cpa_advertised_max", value: "Up to $600–$1,200 per qualified client depending on page/region (ceiling); tiered CPA per agreement", currency: "USD", sourceUrl: "https://www.axi.com/int/partnerships/affiliate-program", sourceNote: NC + " — advertised ceiling, not a rate; UK tier set in the individual agreement (Steven, 22 Oct 2026)" },
      { key: "payment_frequency", value: "Monthly per Steven (22 Oct 2026); Axi pages say biweekly or monthly", sourceUrl: "https://www.axi.com/int/partnerships/affiliate-program", sourceNote: "Received from Axi support; " + NC + " in the Affiliate Agreement" },
      { key: "min_payout", value: "$2,000 balance and 5 qualified clients before first payout (partner support article); no minimum thereafter", currency: "USD", sourceUrl: "https://support.axi.com/hc/en-us/articles/49786766640537-How-can-I-withdraw-my-CPA-commission", sourceNote: NC + " with Account Manager" },
      { key: "withdrawal_methods", value: "Via the Axi Client Portal; client withdrawals free above US$50 (general policy, not affiliate-specific)", sourceUrl: "https://support.axi.com/hc/en-us/articles/32999103656857-Minimum-withdrawals-and-Withdrawal-fees", sourceNote: NC },
      { key: "countries_accepted", value: "UK clients via Axi Financial Services (UK) Ltd (Steven, 22 Oct 2026); other countries " + NC, sourceNote: "Received from Axi support" },
    ],
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
  {
    slug: "xm", name: "XM — XM Partners", programmeUrl: "https://partners.xm.com/paymentplans", applyUrl: "https://partners.xm.com/", model: "cpa", seededOn: "2026-10-23",
    notes: "Prospect added 2026-10-23 (brief: highest achievable CPA, fastest payouts). Official page advertises CPA up to $1,000 per client paid upfront and daily payouts; third-party guides and XM's own partner-terms PDF describe other schedules (twice weekly; monthly with balances under $500 carried forward). Every figure here is " + NC + ": the official pages could not be fetched from the build environment, so claims come from search results of official and third-party pages.",
    countryNote: "UK status conflicting: some 2026 sources say UK clients are no longer accepted or are routed offshore; others cite an FCA-licensed entity (Trading Point of Financial Instruments UK Ltd, 705428). Check the FCA Register and XM's UK terms. " + NC + ".",
    nextAction: "Confirm whether XM accepts UK publishers and UK referred clients (FCA Register: Trading Point of Financial Instruments UK Ltd, ref 705428), then request the rate card and the written payment schedule (daily vs twice-weekly vs monthly) and minimum withdrawal.", nextActionDueDays: 14,
    research: [
      { topic: "programme_model", claim: "Official partner page advertises CPA up to $1,000 per client, paid in full upfront; reviews say rates vary by country and are negotiated with a partner manager. " + NC + ".", sourceUrl: "https://partners.xm.com/paymentplans" },
      { topic: "tax_payout", claim: "Official page advertises daily payouts and instant withdrawals (bank transfer, Skrill, Neteller, USDT). Third-party guides say twice weekly (Tue/Thu) or weekly; XM's partner-programme terms PDF describes monthly payment with balances under $500 carried forward. Conflict — " + NC + ".", sourceUrl: "https://partners.xm.com/advantages", verification: "open_question" },
      { topic: "tax_payout", claim: "Minimum withdrawal reported as $5 by most third-party sources (one says none); not stated on the official page in the sources found. " + NC + ".", sourceUrl: "https://www.xm.com/assets/pdf/new/terms/XM-Partner-Program.pdf", verification: "open_question" },
      { topic: "countries", claim: "US and Canada excluded per one review. UK: conflicting sources on whether UK clients are accepted and under which entity. " + NC + " via FCA Register and XM.", sourceUrl: "https://partners.xm.com/", verification: "open_question" },
    ],
    tasks: STANDARD_TASKS, checklist: STANDARD_CHECKLIST, documents: STANDARD_DOCS,
    terms: [
      { key: "cpa_advertised_max", value: "Up to $1,000 per client (advertised ceiling; varies by country)", currency: "USD", sourceUrl: "https://partners.xm.com/paymentplans", sourceNote: NC + " — advertised, not country-specific" },
      { key: "payment_frequency", value: "Daily (advertised on official page); conflicting: twice weekly / weekly / monthly in other sources", sourceUrl: "https://partners.xm.com/advantages", sourceNote: NC },
      { key: "min_payout", value: "$5 (third-party sources; one says none)", currency: "USD", sourceNote: NC + " — not seen on official page" },
      { key: "withdrawal_methods", value: "Bank transfer, Skrill, Neteller, USDT (advertised); fees " + NC, sourceUrl: "https://partners.xm.com/advantages", sourceNote: NC },
      { key: "countries_accepted", value: "Not US/Canada (third-party); UK " + NC, sourceNote: NC },
    ],
  },
  {
    slug: "exness", name: "Exness — Exness Affiliates", programmeUrl: "https://www.exnessaffiliates.com/affiliates-commission-plan/", applyUrl: "https://www.exnessaffiliates.com/", model: "cpa", seededOn: "2026-10-23",
    notes: "Prospect added 2026-10-23. Official site lists regional CPA ceilings (MENA up to $1,850; APAC $1,760; SSA $1,080; LATAM $960; CIS $680) with no UK or European figure. Multiple sources state Exness does not onboard UK retail clients. If UK residents cannot open accounts there is nothing to promote to a UK audience; the programme would only make sense for a legitimate non-UK audience. All figures " + NC + ".",
    countryNote: "UK retail onboarding reported closed (several sources, Oct 2026); FCA status of Exness (UK) Ltd disputed between sources. Check the FCA Register and ask Exness in writing. " + NC + ".",
    nextAction: "Confirm in writing whether Exness accepts UK residents as clients. If not, decide whether Ten Talents has a legitimate, compliant non-UK audience before applying; otherwise put On Hold.", nextActionDueDays: 14,
    research: [
      { topic: "programme_model", claim: "Official commission-plan page lists CPA ceilings by region: MENA up to $1,850; APAC $1,760; SSA $1,080; LATAM $960; CIS $680. No UK/Europe figure. " + NC + ".", sourceUrl: "https://www.exnessaffiliates.com/affiliates-commission-plan/" },
      { topic: "eligibility", claim: "Qualified client (official help centre): first-time deposit (cumulative deposits within 24h of the first) above a region-specific minimum, qualifying trading activity, and a new unique Exness user; exact regional minimums only visible in the Partner Personal Area. " + NC + ".", sourceUrl: "https://get.exness-affiliates.help/hc/en-us/articles/360011039839-The-Cost-Per-Action-CPA-Program" },
      { topic: "tax_payout", claim: "Help centre: affiliate reward calculated daily and credited the next day after qualification. Withdrawal schedule, minimum and methods " + NC + ".", sourceUrl: "https://get.exness-affiliates.help/hc/en-us/articles/360016773680-How-to-become-a-Digital-Affiliate-DA" },
      { topic: "countries", claim: "Several sources state Exness is not available to UK retail clients (onboarding closed); FCA licence status of Exness (UK) Ltd disputed. " + NC + " — FCA Register and Exness in writing.", sourceUrl: "https://brokerchooser.com/broker-reviews/exness-review/exness-uk", verification: "open_question" },
    ],
    tasks: STANDARD_TASKS, checklist: STANDARD_CHECKLIST, documents: STANDARD_DOCS,
    terms: [
      { key: "cpa_advertised_max", value: "Up to $1,850 (MENA); $1,760 APAC; $1,080 SSA; $960 LATAM; $680 CIS — regional ceilings; no UK figure", currency: "USD", sourceUrl: "https://www.exnessaffiliates.com/affiliates-commission-plan/", sourceNote: NC + " — ceilings, not UK-available rates" },
      { key: "cpa_conditions", value: "FTD above regional minimum + qualifying trading + new unique user (official help centre); exact minimums in Partner Personal Area", sourceUrl: "https://get.exness-affiliates.help/hc/en-us/articles/360011039839-The-Cost-Per-Action-CPA-Program", sourceNote: NC },
      { key: "payment_frequency", value: "Reward credited daily (next day after qualification); withdrawal schedule " + NC, sourceUrl: "https://get.exness-affiliates.help/hc/en-us/articles/360016773680-How-to-become-a-Digital-Affiliate-DA", sourceNote: NC },
      { key: "min_payout", value: NC, sourceNote: NC },
      { key: "countries_accepted", value: "UK retail onboarding reported closed; regional programme (MENA, APAC, SSA, LATAM, CIS)", sourceNote: NC },
    ],
  },
  {
    slug: "primexbt", name: "PrimeXBT — PrimeXBT Partners", programmeUrl: "https://primexbt.partners/", applyUrl: "https://primexbt.partners/", model: "hybrid", seededOn: "2026-10-23", complianceStatus: "review_required",
    notes: "Prospect added 2026-10-23. Crypto-margin / CFD platform. Third-party sources report CPA (figures from up to $450 to up to $2,500 per qualified trader, conflicting) and up to 50% revenue share; payout schedule reported as daily, weekly or monthly; minimum payout reported as none or $100. The official primexbt.partners terms were not surfaced in search. UK: PrimeXBT's own documents say its rewards terms are not intended for UK/EEA residents and that it does not market in the UK/EU; the FCA has banned the sale of crypto derivatives to UK retail consumers since January 2021 and cryptoasset financial promotions have been restricted since October 2023. Promotion to a UK audience is very likely not permitted. Nothing here is verified.",
    countryNote: "Restricted jurisdictions reported: US, Canada, Japan, Israel, New Zealand, Russia (+ Cuba, Iran in some lists). UK: not marketed per PrimeXBT notices; UK retail crypto-derivatives ban. " + NC + " with solicitor and PrimeXBT.",
    complianceRestrictions: "FCA ban on the sale of crypto derivatives to UK retail consumers (PS20/10, in force 6 Jan 2021) and the UK cryptoasset financial-promotions regime (from 8 Oct 2023) — likely prohibit promoting this platform to UK consumers. Obtain qualified legal advice before any application or content.",
    nextAction: "Do not apply yet. Obtain the solicitor's view on promoting a crypto-derivatives platform to a UK audience (retail ban since Jan 2021; crypto promotions regime since Oct 2023) and confirm PrimeXBT's own UK stance; then a go / no-go decision.", nextActionDueDays: 21,
    research: [
      { topic: "programme_model", claim: "Third-party sources report both CPA (up to $450 … up to $2,500 per qualified trader, conflicting) and up to 50% revenue share; official partner terms not found in search. " + NC + ".", sourceUrl: "https://primexbt.partners/" },
      { topic: "tax_payout", claim: "Payout schedule conflicting across sources: daily with no minimum (2026 announcement) vs weekly / monthly / every Monday; minimum payout reported as none or $100. " + NC + ".", sourceUrl: "https://primexbt.partners/", verification: "open_question" },
      { topic: "countries", claim: "Restricted jurisdictions reported: US, Canada, Japan, Israel, New Zealand, Russia (+ Cuba, Iran in some lists). PrimeXBT's Rewards terms state they are not intended for UK/EEA residents and a company notice says it does not market in the UK/EU. " + NC + ".", sourceUrl: "https://primexbt.com/company-blog/important-information-for-users-residing-in-the-eu-and-uk/", verification: "open_question" },
      { topic: "eligibility", claim: "UK regulatory position: FCA ban on sale of crypto derivatives to retail consumers (since 6 Jan 2021) and cryptoasset financial-promotions regime (since 8 Oct 2023). Likely prohibits promoting this platform to UK consumers — qualified legal review required before any step.", sourceUrl: "https://www.fca.org.uk/", verification: "open_question" },
    ],
    tasks: [{ title: "Legal review: UK crypto-derivatives retail ban and cryptoasset promotions regime — go / no-go", priority: "urgent", dueDays: 14 }, ...STANDARD_TASKS],
    checklist: STANDARD_CHECKLIST, documents: STANDARD_DOCS,
    terms: [
      { key: "cpa_advertised_max", value: "Reported $450 to $2,500 per qualified trader (third-party, conflicting)", currency: "USD", sourceNote: NC + " — no official figure found" },
      { key: "revshare_pct", value: "Up to 50% (third-party reports)", sourceNote: NC },
      { key: "payment_frequency", value: "Conflicting: daily / weekly / monthly", sourceNote: NC },
      { key: "min_payout", value: "Conflicting: none / $100", currency: "USD", sourceNote: NC },
      { key: "countries_accepted", value: "Excludes US, CA, JP, IL, NZ, RU (reported); UK not marketed; UK retail crypto-derivatives ban", sourceNote: NC },
    ],
  },
  {
    slug: "vantage", name: "Vantage", programmeUrl: "https://www.vantagemarkets.com/", requirementsUrl: VANTAGE_HELP, model: "cpa", seededOn: "2026-10-25",
    notes: "Added 2026-10-25. The founder confirmed an affiliate agreement with Vantage on 2026-10-24. Vantage's help centre describes a CPA affiliate programme with an affiliate dashboard and no fee to join. Any figure below is an advertised ceiling, not Ten Talents' rate.",
    countryNote: "Which countries' clients qualify, and which Vantage entity serves UK clients: " + NC + ".",
    nextAction: "Record the partner-portal link, the agreement reference and the affiliate ID; enter the commercial terms from the agreement.", nextActionDueDays: 7,
    research: [
      { topic: "programme_model", claim: "Vantage's help centre describes a CPA affiliate programme: refer qualified clients, with an affiliate dashboard and marketing tools; no fee to join.", sourceUrl: VANTAGE_HELP },
      { topic: "countries", claim: "Which countries' clients qualify, and under which Vantage entity UK clients are served, is not yet confirmed in writing.", sourceUrl: "https://www.vantagemarkets.com/", verification: "open_question" },
      { topic: "traffic_sources", claim: "Which Ten Talents channels may be used, and whether accounts traded by an expert adviser (bot) count as qualified clients, is not yet confirmed in writing.", sourceUrl: "https://www.vantagemarkets.com/", verification: "open_question" },
    ],
    tasks: [
      { title: "Confirm in writing which countries' clients qualify and which Vantage entity serves UK clients", priority: "high", dueDays: 7 },
      { title: "Confirm whether accounts traded by an expert adviser (bot) count as qualified clients", priority: "normal", dueDays: 14 },
      { title: "Obtain approved promotional materials and required risk-warning wording", priority: "normal", dueDays: 30 },
      { title: "Test tracking links before any use", priority: "normal" },
      { title: "Verify first commission payment against the statement", priority: "normal" },
    ],
    checklist: STANDARD_CHECKLIST, documents: STANDARD_DOCS,
    terms: [{ key: "cpa_advertised_max", value: "Up to $1,200 per qualified client (help centre)", currency: "USD", sourceUrl: VANTAGE_HELP, sourceNote: NC + " — advertised ceiling; third-party reviews quote up to $800" }],
  },
  {
    slug: "avatrade", name: "AvaTrade — AvaPartner", programmeUrl: "https://www.avatrade.com/", applyUrl: "email support@avapartner.com", requirementsUrl: AVATRADE_PARTNERS, model: "enquiry_pending", seededOn: "2026-10-25",
    notes: "Prospect added 2026-10-25 at the founder's request. AvaTrade's partners page describes tailored CPA, revenue-share (trade rebates) or hybrid deals for affiliates; it publishes no CPA figure. Whether AvaTrade accepts UK clients is contradicted across sources: check the FCA Register and AvaTrade's own terms before any contact.",
    countryNote: "UK: conflicting. Comparison sites (2024–25) say AvaTrade no longer accepts UK clients; another source cites an FCA temporary permission for Ava Trade EU Ltd (Central Bank of Ireland). " + NC + " on the FCA Register.",
    complianceRestrictions: "Sources mention an FCA warning about a clone firm using AvaTrade group details. Contact AvaTrade only through its official website, and check firm details on the FCA Register.",
    nextAction: "Check the FCA Register and AvaTrade's own terms for UK client acceptance (beware the clone-firm warning). If UK clients are accepted, ask AvaPartner for the rate card, qualification rules and approved channels.", nextActionDueDays: 7,
    research: [
      { topic: "programme_model", claim: "AvaTrade's partners page describes an affiliate network of 70,000+ partners in 150+ countries, tailored CPA, revenue-share (trade rebates) or hybrid deals, and over $250m paid in commissions. No CPA figure is published there.", sourceUrl: AVATRADE_PARTNERS },
      { topic: "countries", claim: "UK client acceptance is contradicted: comparison sites say AvaTrade no longer accepts UK clients; another source cites an FCA temporary permission for Ava Trade EU Ltd (regulated by the Central Bank of Ireland). " + NC + " on the FCA Register.", sourceUrl: "https://register.fca.org.uk/", verification: "open_question" },
      { topic: "eligibility", claim: "Sources mention an FCA warning about a clone firm using AvaTrade group details; any contact must go through AvaTrade's official channels only.", sourceUrl: "https://register.fca.org.uk/", verification: "open_question" },
    ],
    tasks: STANDARD_TASKS, checklist: STANDARD_CHECKLIST, documents: STANDARD_DOCS,
    terms: [
      { key: "cpa_advertised_max", value: "Up to $800 per qualified client (third-party sites; not on the official page — Needs Confirmation)", currency: "USD", sourceUrl: AVATRADE_PARTNERS, sourceNote: NC + " — official page publishes no figure" },
      { key: "countries_accepted", value: "UK: conflicting (reported closed to UK clients)", sourceNote: NC },
    ],
  },
];

/* Status updates the founder confirmed, applied once per firm at deploy by seedPartners(): each moves the application
   status forward (never back, never over Approved, Declined or On Hold) with an audit row (actor "founder"), a
   correspondence note, the next action and a task. Commercial terms and compliance are left as they are: an approval
   is not confirmed terms, and not permission to promote. Nothing private (references, IDs, contacts) goes here. */
export type FounderUpdate = {
  slug: string; status: "approved" | "application_submitted"; on: string;
  comm: { kind: "email" | "other"; contactName: string; summary: string; questionsOpen: string };
  nextAction: string; task: SeedTask & { dueDays: number };
};
const AGREEMENT = (slug: string): FounderUpdate => ({
  slug, status: "approved", on: "2026-10-24", // D-029
  comm: { kind: "other", contactName: "Kelvin Williams (founder)", summary: "Founder confirmed that Ten Talents has an affiliate agreement with this firm.", questionsOpen: "Signed agreement and approval email to file (references only); affiliate ID and tracking link; commercial terms in writing; which channels may be used." },
  nextAction: "Agreement confirmed by the founder. File the signed agreement and approval email (references only), enter the affiliate ID and tracking link, and record the commercial terms from the agreement as Confirmed with their source.",
  task: { title: "File the signed agreement (reference only), affiliate ID and tracking link; confirm the account and payouts are in TenTalents Ltd's name", priority: "high", dueDays: 7 },
});
export const FOUNDER_UPDATES: FounderUpdate[] = [
  ...["vantage", "axi", "xm", "pepperstone", "exness"].map(AGREEMENT),
  {
    slug: "avatrade", status: "application_submitted", on: "2026-10-25",
    comm: { kind: "email", contactName: "AvaPartner team", summary: "Sign-up confirmation: the application was received; a Partner Manager will be in touch to introduce AvaPartner, understand the business model and suggest suitable options. Affiliate-account access to tools and creatives in the meantime.", questionsOpen: "Does AvaTrade accept UK clients, and through which entity (check the FCA Register first)? Rate card and qualification rules; approved channels; contracting as TenTalents Ltd." },
    nextAction: "Application received by AvaPartner (25 Oct). Before the Partner Manager call: check UK client acceptance on the FCA Register, then prepare questions on rates, qualification rules and approved channels. Use AvaTrade's official channels only.",
    task: { title: "Prepare for the AvaPartner Partner Manager call: UK clients (FCA Register), rate card, qualification rules, approved channels, contracting entity", priority: "high", dueDays: 7 },
  },
];

export const SEED_TERM_KEYS = TERM_KEYS;
export const SEED_CHANNELS = CHANNELS;
export const SEED_OWNER = OWNER;

export const addDays = (iso: string, days: number) => new Date(new Date(iso + "T00:00:00Z").getTime() + days * 864e5).toISOString().slice(0, 10);

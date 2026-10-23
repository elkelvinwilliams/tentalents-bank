import { pgTable, doublePrecision, text, integer, boolean, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";

/* ============================================================
   Ten Talents Academy — schema
   Simulator-proofing: modules.kind is an enum-by-convention text
   ('lessons' today, 'simulator' later); progress and attempts
   reference stable IDs. Adding a simulator = new tables + a new
   kind value. No migration of existing rows will be required.
   ============================================================ */

export const users = pgTable("users", {
  id: text("id").primaryKey(), // nanoid
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  name: text("name").notNull().default(""), // name on certificates
  onboardingAnswers: jsonb("onboarding_answers").$type<Record<string, number>>().notNull().default({}),
  stage: text("stage").notNull().default("onboard"), // onboard | tour | app (gate consent precedes signup)
  consentAt: timestamp("consent_at", { withTimezone: true }), // legal gate consent timestamp
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("users_email_uq").on(t.email)]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // random 256-bit token hash
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

export const emailTokens = pgTable("email_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose").notNull(), // verify | reset
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/* ---------- content ---------- */

export const tracks = pgTable("tracks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  blurb: text("blurb").notNull(),
  position: integer("position").notNull(),
  published: boolean("published").notNull().default(true),
});

export const modules = pgTable("modules", {
  id: text("id").primaryKey(),
  trackId: text("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("lessons"), // 'lessons' | (future) 'simulator'
  position: integer("position").notNull(),
  published: boolean("published").notNull().default(true),
}, (t) => [index("modules_track_idx").on(t.trackId)]);

export const lessons = pgTable("lessons", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  minutes: integer("minutes").notNull().default(0), // 0 = content coming soon
  bodyHtml: text("body_html").notNull().default(""), // sanitised TipTap output
  isFreePreview: boolean("is_free_preview").notNull().default(false),
  position: integer("position").notNull(),
  published: boolean("published").notNull().default(true),
}, (t) => [index("lessons_module_idx").on(t.moduleId)]);

export type QuizQuestion = { q: string; options: string[]; correct: number; why: string };

export const quizzes = pgTable("quizzes", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  passPct: integer("pass_pct").notNull().default(70),
  questions: jsonb("questions").$type<QuizQuestion[]>().notNull().default([]),
  published: boolean("published").notNull().default(true),
}, (t) => [uniqueIndex("quizzes_module_uq").on(t.moduleId)]);

export const glossaryTerms = pgTable("glossary_terms", {
  id: text("id").primaryKey(),
  term: text("term").notNull(),
  definition: text("definition").notNull(),
  position: integer("position").notNull(),
});

/* ---------- learning state ---------- */

export const lessonProgress = pgTable("lesson_progress", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("progress_uq").on(t.userId, t.lessonId)]);

export const quizAttempts = pgTable("quiz_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  scorePct: integer("score_pct").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("attempts_user_quiz_idx").on(t.userId, t.quizId)]);

export const certificates = pgTable("certificates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  trackId: text("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  nameOnCert: text("name_on_cert").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("cert_uq").on(t.userId, t.trackId)]);

/* ---------- billing (Stripe webhooks are the only writer) ---------- */

export const entitlements = pgTable("entitlements", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionId: text("subscription_id"),
  membershipItemId: text("membership_item_id"),
  signalsItemId: text("signals_item_id"),
  // active | trialing | past_due | canceled | none — mirrors Stripe, written by webhooks only
  status: text("status").notNull().default("none"),
  signalsStatus: text("signals_status").notNull().default("none"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- gamification (learning only — never trading) ---------- */

export const userStats = pgTable("user_stats", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastActive: text("last_active"), // YYYY-MM-DD (UTC) of last XP event
  todayXp: integer("today_xp").notNull().default(0),
  todayDate: text("today_date"), // YYYY-MM-DD the todayXp counter belongs to
  badges: jsonb("badges").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const xpEvents = pgTable("xp_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // lesson_done | quiz_pass | assessment | goal_set | goal_add | goal_ms | goal_done | drill | knowledge
  ref: text("ref").notNull().default(""), // stable ref for once-only awards ('' = repeatable)
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("xp_user_idx").on(t.userId), uniqueIndex("xp_once_uq").on(t.userId, t.kind, t.ref)]);

/* ---------- steward: user-entered goals (planning tool, no money held) ---------- */

export const goals = pgTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("target"),
  targetPence: integer("target_pence").notNull(),
  savedPence: integer("saved_pence").notNull().default(0),
  targetMonth: text("target_month"), // YYYY-MM or null
  milestones: jsonb("milestones").$type<number[]>().notNull().default([]), // [25,50,75,100] already awarded
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("goals_user_idx").on(t.userId)]);

/* ---------- trading journal (behaviour, not performance) ---------- */

export const journalEntries = pgTable("journal_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  symbol: text("symbol").notNull(),
  direction: text("direction").notNull().default("Long"),
  pnlPence: integer("pnl_pence").notNull().default(0),
  planned: boolean("planned").notNull().default(true),
  emotionBefore: text("emotion_before").notNull().default(""),
  emotionAfter: text("emotion_after").notNull().default(""),
  reason: text("reason").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("journal_user_idx").on(t.userId)]);

/* ---------- build: wealth, health, reviews, debts, giving, talents (user-entered; never advice) ---------- */

export type WealthAssets = { cash: number; savings: number; investments: number; property: number; business: number; other: number };
export type WealthLiabilities = { mortgage: number; loans: number; credit: number; other: number };

export const wealthSnapshots = pgTable("wealth_snapshots", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assets: jsonb("assets").$type<WealthAssets>().notNull(),          // pence
  liabilities: jsonb("liabilities").$type<WealthLiabilities>().notNull(), // pence
  note: text("note").notNull().default(""),
  takenAt: timestamp("taken_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("wealth_user_idx").on(t.userId)]);

export const healthChecks = pgTable("health_checks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").$type<Record<string, number>>().notNull(), // dimension -> 1..5
  takenAt: timestamp("taken_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("health_user_idx").on(t.userId)]);

export const weeklyReviews = pgTable("weekly_reviews", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  week: text("week").notNull(), // ISO week, YYYY-Www
  answers: jsonb("answers").$type<Record<string, string>>().notNull().default({}),
  skipped: boolean("skipped").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("review_week_uq").on(t.userId, t.week)]);

export const debts = pgTable("debts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  balancePence: integer("balance_pence").notNull(),
  aprBp: integer("apr_bp").notNull().default(0), // basis points, 1999 = 19.99%
  minPaymentPence: integer("min_payment_pence").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("debts_user_idx").on(t.userId)]);

export const givingEntries = pgTable("giving_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // YYYY-MM
  pct: integer("pct").notNull().default(0), // % of income given — amounts never required
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("giving_month_uq").on(t.userId, t.month)]);

export const talents = pgTable("talents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("skill"), // skill | habit | knowledge | relationship
  level: integer("level").notNull().default(1), // 1..5, self-assessed
  note: text("note").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("talents_user_idx").on(t.userId)]);

/* ---------- cohorts: learn together (learning progress only — never money) ---------- */

export const cohorts = pgTable("cohorts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(), // join code
  leaderId: text("leader_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("cohort_code_uq").on(t.code)]);

export const cohortMembers = pgTable("cohort_members", {
  cohortId: text("cohort_id").notNull().references(() => cohorts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("cohort_member_uq").on(t.cohortId, t.userId), index("cohort_member_user_idx").on(t.userId)]);

/* ---------- market data cache + practice portfolio (virtual money only) ---------- */

export const marketCache = pgTable("market_cache", {
  key: text("key").primaryKey(),
  payload: jsonb("payload").$type<unknown>().notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

export const simAccounts = pgTable("sim_accounts", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  cashPence: integer("cash_pence").notNull().default(10000000),
  startPence: integer("start_pence").notNull().default(10000000),
  resets: integer("resets").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const simOrders = pgTable("sim_orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(),                 // buy | sell
  type: text("type").notNull().default("market"), // market | limit | stop
  qty: doublePrecision("qty").notNull(),
  limitPrice: doublePrecision("limit_price"),
  stopLoss: doublePrecision("stop_loss"),
  takeProfit: doublePrecision("take_profit"),
  status: text("status").notNull().default("open"), // pending | open | closed | cancelled
  entryPrice: doublePrecision("entry_price"),
  exitPrice: doublePrecision("exit_price"),
  pnlPence: integer("pnl_pence"),
  reason: text("reason").notNull().default(""),
  exitReason: text("exit_reason").notNull().default(""),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("sim_orders_user_idx").on(t.userId)]);

export const simEquity = pgTable("sim_equity", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  equityPence: integer("equity_pence").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("sim_equity_user_idx").on(t.userId)]);

/* ---------- affiliate partnerships (INTERNAL operations; admin-only; no customer data) ---------- */

export const partnerFirms = pgTable("partner_firms", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  programmeUrl: text("programme_url").notNull().default(""),
  applyUrl: text("apply_url").notNull().default(""),
  requirementsUrl: text("requirements_url").notNull().default(""),
  model: text("model").notNull().default("enquiry_pending"),            // cpa | revenue_share | hybrid | ib | enquiry_pending
  applicationStatus: text("application_status").notNull().default("not_started"),
  termsStatus: text("terms_status").notNull().default("unverified"),
  complianceStatus: text("compliance_status").notNull().default("not_reviewed"),
  countryEligibility: text("country_eligibility").notNull().default("unknown"), // unknown | eligible | conditional | ineligible
  countryNote: text("country_note").notNull().default(""),
  targetCountries: jsonb("target_countries").$type<string[]>().notNull().default([]),
  owner: text("owner").notNull().default(""),
  nextAction: text("next_action").notNull().default(""),
  nextActionDue: text("next_action_due"),      // YYYY-MM-DD
  lastContactAt: text("last_contact_at"),      // YYYY-MM-DD
  lastResearchAt: text("last_research_at"),    // YYYY-MM-DD
  notes: text("notes").notNull().default(""),
  affiliateId: text("affiliate_id"),            // issued by the programme on approval; never a secret
  trackingLink: text("tracking_link"),          // issued on approval
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("partner_firms_slug_uq").on(t.slug)]);

export const partnerResearch = pgTable("partner_research", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => partnerFirms.id, { onDelete: "cascade" }),
  topic: text("topic").notNull().default("other"),
  claim: text("claim").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  verification: text("verification").notNull().default("assumption"), // assumption | verified | open_question
  verifiedAt: text("verified_at"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("partner_research_firm_idx").on(t.firmId)]);

export const partnerContacts = pgTable("partner_contacts", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => partnerFirms.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  isPrimary: boolean("is_primary").notNull().default(false),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("partner_contacts_firm_idx").on(t.firmId)]);

export type ChecklistItem = { label: string; done: boolean };
export type DocRef = { label: string; locationRef: string; done: boolean }; // reference to a secure location, never the document itself

export const partnerApplications = pgTable("partner_applications", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => partnerFirms.id, { onDelete: "cascade" }),
  checklist: jsonb("checklist").$type<ChecklistItem[]>().notNull().default([]),
  documents: jsonb("documents").$type<DocRef[]>().notNull().default([]),
  submittedAt: text("submitted_at"),
  referenceNo: text("reference_no").notNull().default(""),
  contactId: text("contact_id"),
  followUpAt: text("follow_up_at"),
  outcome: text("outcome").notNull().default(""),
  outcomeReason: text("outcome_reason").notNull().default(""),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("partner_applications_firm_uq").on(t.firmId)]);

/* Each commercial value carries its own source and verification status. */
export const partnerTermItems = pgTable("partner_term_items", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => partnerFirms.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull().default(""),
  currency: text("currency").notNull().default(""),
  sourceUrl: text("source_url").notNull().default(""),
  sourceNote: text("source_note").notNull().default(""),
  status: text("status").notNull().default("unverified"), // mirrors TERMS_STATUS per value
  verifiedAt: text("verified_at"),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("partner_term_items_uq").on(t.firmId, t.key)]);

export const partnerCompliance = pgTable("partner_compliance", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => partnerFirms.id, { onDelete: "cascade" }),
  permittedToPromote: text("permitted_to_promote").notNull().default("unknown"), // unknown | yes | no | conditional
  contractingEntity: text("contracting_entity").notNull().default(""),
  restrictions: text("restrictions").notNull().default(""),
  riskWarnings: text("risk_warnings").notNull().default(""),
  disclosureWording: text("disclosure_wording").notNull().default(""),
  openQuestions: text("open_questions").notNull().default(""),
  legalAdviceRequired: boolean("legal_advice_required").notNull().default(false),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("partner_compliance_firm_uq").on(t.firmId)]);

export const partnerChannelApprovals = pgTable("partner_channel_approvals", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => partnerFirms.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(), // website | social | email | paid_ads | webinar_community
  status: text("status").notNull().default("not_reviewed"), // COMPLIANCE_STATUS
  contentRef: text("content_ref").notNull().default(""),
  version: text("version").notNull().default(""),
  approvedAt: text("approved_at"),
  reviewAt: text("review_at"),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("partner_channel_uq").on(t.firmId, t.channel)]);

export const partnerComms = pgTable("partner_comms", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => partnerFirms.id, { onDelete: "cascade" }),
  at: text("at").notNull(),
  kind: text("kind").notNull().default("email"),
  contactName: text("contact_name").notNull().default(""),
  summary: text("summary").notNull().default(""),
  commitments: text("commitments").notNull().default(""),
  questionsOpen: text("questions_open").notNull().default(""),
  nextFollowUp: text("next_follow_up"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("partner_comms_firm_idx").on(t.firmId)]);

export const partnerTasks = pgTable("partner_tasks", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => partnerFirms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  owner: text("owner").notNull().default(""),
  dueAt: text("due_at"),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("open"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [index("partner_tasks_firm_idx").on(t.firmId)]);

/* Aggregate performance per period — manual entry unless an official integration exists. */
export const partnerReports = pgTable("partner_reports", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => partnerFirms.id, { onDelete: "cascade" }),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  impressions: integer("impressions"),
  clicks: integer("clicks"),
  registrations: integer("registrations"),
  verifiedReferrals: integer("verified_referrals"),
  qualifiedReferrals: integer("qualified_referrals"),
  pendingMinor: integer("pending_minor"),
  approvedMinor: integer("approved_minor"),
  reversedMinor: integer("reversed_minor"),
  paidMinor: integer("paid_minor"),
  currency: text("currency").notNull().default("GBP"),
  expectedPaymentAt: text("expected_payment_at"),
  paidAt: text("paid_at"),
  source: text("source").notNull().default("manual"), // manual | export | api
  sourceNote: text("source_note").notNull().default(""),
  enteredBy: text("entered_by").notNull().default(""),
  reconciliationNotes: text("reconciliation_notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("partner_reports_firm_idx").on(t.firmId)]);

export const partnerLedger = pgTable("partner_ledger", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => partnerFirms.id, { onDelete: "cascade" }),
  at: text("at").notNull(),
  kind: text("kind").notNull(), // pending | approved | reversed | paid | adjustment
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("GBP"),
  reference: text("reference").notNull().default(""),
  note: text("note").notNull().default(""),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("partner_ledger_firm_idx").on(t.firmId)]);

export const partnerAudit = pgTable("partner_audit", {
  id: text("id").primaryKey(),
  firmId: text("firm_id").notNull().references(() => partnerFirms.id, { onDelete: "cascade" }),
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull().default(""),
  field: text("field").notNull(),
  oldValue: text("old_value").notNull().default(""),
  newValue: text("new_value").notNull().default(""),
  actor: text("actor").notNull().default("admin"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("partner_audit_firm_idx").on(t.firmId)]);

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(), // Stripe event id — idempotency
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

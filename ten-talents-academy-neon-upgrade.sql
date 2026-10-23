-- Ten Talents Academy — UPGRADE (run only if you already ran ten-talents-academy-neon-setup.sql before 0001)
-- Adds: 0001_steward.sql, 0002_build.sql, 0003_practise.sql, 0004_partners.sql, 0005_partners2.sql. Generated 2026-10-23.

-- migration 0001_steward.sql
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT 'target' NOT NULL,
	"target_pence" integer NOT NULL,
	"saved_pence" integer DEFAULT 0 NOT NULL,
	"target_month" text,
	"milestones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "journal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"symbol" text NOT NULL,
	"direction" text DEFAULT 'Long' NOT NULL,
	"pnl_pence" integer DEFAULT 0 NOT NULL,
	"planned" boolean DEFAULT true NOT NULL,
	"emotion_before" text DEFAULT '' NOT NULL,
	"emotion_after" text DEFAULT '' NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "user_stats" (
	"user_id" text PRIMARY KEY NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"last_active" text,
	"today_xp" integer DEFAULT 0 NOT NULL,
	"today_date" text,
	"badges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "xp_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"ref" text DEFAULT '' NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");

CREATE INDEX "journal_user_idx" ON "journal_entries" USING btree ("user_id");

CREATE INDEX "xp_user_idx" ON "xp_events" USING btree ("user_id");

CREATE UNIQUE INDEX "xp_once_uq" ON "xp_events" USING btree ("user_id","kind","ref");

-- migration 0002_build.sql
CREATE TABLE "cohort_members" (
	"cohort_id" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cohorts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"leader_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "debts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"balance_pence" integer NOT NULL,
	"apr_bp" integer DEFAULT 0 NOT NULL,
	"min_payment_pence" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "giving_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"month" text NOT NULL,
	"pct" integer DEFAULT 0 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "health_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"answers" jsonb NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "talents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'skill' NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "wealth_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"assets" jsonb NOT NULL,
	"liabilities" jsonb NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "weekly_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"week" text NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"skipped" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_leader_id_users_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "debts" ADD CONSTRAINT "debts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "giving_entries" ADD CONSTRAINT "giving_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "health_checks" ADD CONSTRAINT "health_checks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "talents" ADD CONSTRAINT "talents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "wealth_snapshots" ADD CONSTRAINT "wealth_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "cohort_member_uq" ON "cohort_members" USING btree ("cohort_id","user_id");

CREATE INDEX "cohort_member_user_idx" ON "cohort_members" USING btree ("user_id");

CREATE UNIQUE INDEX "cohort_code_uq" ON "cohorts" USING btree ("code");

CREATE INDEX "debts_user_idx" ON "debts" USING btree ("user_id");

CREATE UNIQUE INDEX "giving_month_uq" ON "giving_entries" USING btree ("user_id","month");

CREATE INDEX "health_user_idx" ON "health_checks" USING btree ("user_id");

CREATE INDEX "talents_user_idx" ON "talents" USING btree ("user_id");

CREATE INDEX "wealth_user_idx" ON "wealth_snapshots" USING btree ("user_id");

CREATE UNIQUE INDEX "review_week_uq" ON "weekly_reviews" USING btree ("user_id","week");

-- migration 0003_practise.sql
CREATE TABLE "market_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sim_accounts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"cash_pence" integer DEFAULT 10000000 NOT NULL,
	"start_pence" integer DEFAULT 10000000 NOT NULL,
	"resets" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sim_equity" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"equity_pence" integer NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sim_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"symbol" text NOT NULL,
	"side" text NOT NULL,
	"type" text DEFAULT 'market' NOT NULL,
	"qty" double precision NOT NULL,
	"limit_price" double precision,
	"stop_loss" double precision,
	"take_profit" double precision,
	"status" text DEFAULT 'open' NOT NULL,
	"entry_price" double precision,
	"exit_price" double precision,
	"pnl_pence" integer,
	"reason" text DEFAULT '' NOT NULL,
	"exit_reason" text DEFAULT '' NOT NULL,
	"opened_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "sim_accounts" ADD CONSTRAINT "sim_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "sim_equity" ADD CONSTRAINT "sim_equity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "sim_orders" ADD CONSTRAINT "sim_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "sim_equity_user_idx" ON "sim_equity" USING btree ("user_id");

CREATE INDEX "sim_orders_user_idx" ON "sim_orders" USING btree ("user_id");

-- migration 0004_partners.sql
CREATE TABLE "partner_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" text NOT NULL,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submitted_at" text,
	"reference_no" text DEFAULT '' NOT NULL,
	"contact_id" text,
	"follow_up_at" text,
	"outcome" text DEFAULT '' NOT NULL,
	"outcome_reason" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "partner_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text DEFAULT '' NOT NULL,
	"field" text NOT NULL,
	"old_value" text DEFAULT '' NOT NULL,
	"new_value" text DEFAULT '' NOT NULL,
	"actor" text DEFAULT 'admin' NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "partner_channel_approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" text NOT NULL,
	"channel" text NOT NULL,
	"status" text DEFAULT 'not_reviewed' NOT NULL,
	"content_ref" text DEFAULT '' NOT NULL,
	"version" text DEFAULT '' NOT NULL,
	"approved_at" text,
	"review_at" text,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "partner_comms" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" text NOT NULL,
	"at" text NOT NULL,
	"kind" text DEFAULT 'email' NOT NULL,
	"contact_name" text DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"commitments" text DEFAULT '' NOT NULL,
	"questions_open" text DEFAULT '' NOT NULL,
	"next_follow_up" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "partner_compliance" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" text NOT NULL,
	"permitted_to_promote" text DEFAULT 'unknown' NOT NULL,
	"contracting_entity" text DEFAULT '' NOT NULL,
	"restrictions" text DEFAULT '' NOT NULL,
	"risk_warnings" text DEFAULT '' NOT NULL,
	"disclosure_wording" text DEFAULT '' NOT NULL,
	"open_questions" text DEFAULT '' NOT NULL,
	"legal_advice_required" boolean DEFAULT false NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "partner_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "partner_firms" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"programme_url" text DEFAULT '' NOT NULL,
	"apply_url" text DEFAULT '' NOT NULL,
	"requirements_url" text DEFAULT '' NOT NULL,
	"model" text DEFAULT 'enquiry_pending' NOT NULL,
	"application_status" text DEFAULT 'not_started' NOT NULL,
	"terms_status" text DEFAULT 'unverified' NOT NULL,
	"compliance_status" text DEFAULT 'not_reviewed' NOT NULL,
	"country_eligibility" text DEFAULT 'unknown' NOT NULL,
	"country_note" text DEFAULT '' NOT NULL,
	"target_countries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"next_action" text DEFAULT '' NOT NULL,
	"next_action_due" text,
	"last_contact_at" text,
	"last_research_at" text,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "partner_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" text NOT NULL,
	"at" text NOT NULL,
	"kind" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "partner_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" text NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"impressions" integer,
	"clicks" integer,
	"registrations" integer,
	"verified_referrals" integer,
	"qualified_referrals" integer,
	"pending_minor" integer,
	"approved_minor" integer,
	"reversed_minor" integer,
	"paid_minor" integer,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"expected_payment_at" text,
	"paid_at" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"source_note" text DEFAULT '' NOT NULL,
	"entered_by" text DEFAULT '' NOT NULL,
	"reconciliation_notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "partner_research" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" text NOT NULL,
	"topic" text DEFAULT 'other' NOT NULL,
	"claim" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"verification" text DEFAULT 'assumption' NOT NULL,
	"verified_at" text,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "partner_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" text NOT NULL,
	"title" text NOT NULL,
	"owner" text DEFAULT '' NOT NULL,
	"due_at" text,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);

CREATE TABLE "partner_term_items" (
	"id" text PRIMARY KEY NOT NULL,
	"firm_id" text NOT NULL,
	"key" text NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"currency" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"source_note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'unverified' NOT NULL,
	"verified_at" text,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "partner_audit" ADD CONSTRAINT "partner_audit_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "partner_channel_approvals" ADD CONSTRAINT "partner_channel_approvals_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "partner_comms" ADD CONSTRAINT "partner_comms_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "partner_compliance" ADD CONSTRAINT "partner_compliance_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "partner_contacts" ADD CONSTRAINT "partner_contacts_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "partner_ledger" ADD CONSTRAINT "partner_ledger_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "partner_reports" ADD CONSTRAINT "partner_reports_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "partner_research" ADD CONSTRAINT "partner_research_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "partner_tasks" ADD CONSTRAINT "partner_tasks_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "partner_term_items" ADD CONSTRAINT "partner_term_items_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "partner_applications_firm_uq" ON "partner_applications" USING btree ("firm_id");

CREATE INDEX "partner_audit_firm_idx" ON "partner_audit" USING btree ("firm_id");

CREATE UNIQUE INDEX "partner_channel_uq" ON "partner_channel_approvals" USING btree ("firm_id","channel");

CREATE INDEX "partner_comms_firm_idx" ON "partner_comms" USING btree ("firm_id");

CREATE UNIQUE INDEX "partner_compliance_firm_uq" ON "partner_compliance" USING btree ("firm_id");

CREATE INDEX "partner_contacts_firm_idx" ON "partner_contacts" USING btree ("firm_id");

CREATE UNIQUE INDEX "partner_firms_slug_uq" ON "partner_firms" USING btree ("slug");

CREATE INDEX "partner_ledger_firm_idx" ON "partner_ledger" USING btree ("firm_id");

CREATE INDEX "partner_reports_firm_idx" ON "partner_reports" USING btree ("firm_id");

CREATE INDEX "partner_research_firm_idx" ON "partner_research" USING btree ("firm_id");

CREATE INDEX "partner_tasks_firm_idx" ON "partner_tasks" USING btree ("firm_id");

CREATE UNIQUE INDEX "partner_term_items_uq" ON "partner_term_items" USING btree ("firm_id","key");

-- migration 0005_partners2.sql
ALTER TABLE "partner_firms" ADD COLUMN "affiliate_id" text;

ALTER TABLE "partner_firms" ADD COLUMN "tracking_link" text;

-- Affiliate partnerships: prospects (provisional; nothing submitted, approved or confirmed). Insert-if-missing.
DELETE FROM partner_firms WHERE slug='ig'; -- retired by founder decision; cascades
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,country_note,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_axi','axi','Axi','https://www.axi.com/uk/partnerships/affiliate-program','','https://www.axiaffiliates.com/frequently-asked-questions/','cpa','researching','unverified','not_reviewed','unknown','','["GB"]'::jsonb,'Kelvin Williams','Review the UK programme; request the current rate card; confirm UK audience eligibility, exact client qualification rules and which Ten Talents channels can be approved.','2026-11-04','2026-10-21','Prospect. Public page advertises CPA ''up to'' a stated maximum for qualified clients; the maximum is a ceiling, not a rate.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,country_note,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_pepperstone','pepperstone','Pepperstone','https://partnership.pepperstone.com/en/affiliates-program/','','','enquiry_pending','researching','unverified','not_reviewed','unknown','','["GB"]'::jsonb,'Kelvin Williams','Confirm whether a UK-based Ten Talents affiliate can participate; request current CPA terms and qualification rules; ask separately about IB arrangements; record approved marketing channels.','2026-11-04','2026-10-21','Prospect. Pepperstone distinguishes CPA affiliate arrangements from introducing-broker (IB) arrangements; availability and terms depend on programme and country.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,country_note,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_plus500','plus500','Plus500 / 500Affiliates','https://www.500affiliates.com/','','','enquiry_pending','researching','unverified','not_reviewed','unknown','','["GB"]'::jsonb,'Kelvin Williams','Review the current official programme rules; confirm UK affiliate and UK customer eligibility; request current commission terms, qualification rules, approved traffic sources and compliance requirements.','2026-11-04','2026-10-21','Prospect. Do not assume older help pages represent the current agreement; only the current official programme rules count.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,country_note,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_trading212','trading212','Trading 212','https://helpcentre.trading212.com/hc/en-us/articles/360008095077-How-can-I-become-a-Trading-212-Affiliate','','','enquiry_pending','researching','unverified','not_reviewed','unknown','','["GB"]'::jsonb,'Kelvin Williams','Prepare a professional partnership enquiry (mission, audience, website, education content, proposed channels); ask whether a suitable current programme is available; request eligibility, commission and approval terms in writing.','2026-11-04','2026-10-21','Prospect. Trading 212 invites finance, investing and stock-market publishers to contact its partnerships team. No current CPA rate is assumed and acceptance is not guaranteed.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,country_note,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_xm','xm','XM — XM Partners','https://partners.xm.com/paymentplans','https://partners.xm.com/','','cpa','researching','unverified','not_reviewed','unknown','UK status conflicting: some 2026 sources say UK clients are no longer accepted or are routed offshore; others cite an FCA-licensed entity (Trading Point of Financial Instruments UK Ltd, 705428). Check the FCA Register and XM''s UK terms. Needs Confirmation.','["GB"]'::jsonb,'Kelvin Williams','Confirm whether XM accepts UK publishers and UK referred clients (FCA Register: Trading Point of Financial Instruments UK Ltd, ref 705428), then request the rate card and the written payment schedule (daily vs twice-weekly vs monthly) and minimum withdrawal.','2026-11-06','2026-10-23','Prospect added 2026-10-23 (brief: highest achievable CPA, fastest payouts). Official page advertises CPA up to $1,000 per client paid upfront and daily payouts; third-party guides and XM''s own partner-terms PDF describe other schedules (twice weekly; monthly with balances under $500 carried forward). Every figure here is Needs Confirmation: the official pages could not be fetched from the build environment, so claims come from search results of official and third-party pages.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,country_note,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_exness','exness','Exness — Exness Affiliates','https://www.exnessaffiliates.com/affiliates-commission-plan/','https://www.exnessaffiliates.com/','','cpa','researching','unverified','not_reviewed','unknown','UK retail onboarding reported closed (several sources, Oct 2026); FCA status of Exness (UK) Ltd disputed between sources. Check the FCA Register and ask Exness in writing. Needs Confirmation.','["GB"]'::jsonb,'Kelvin Williams','Confirm in writing whether Exness accepts UK residents as clients. If not, decide whether Ten Talents has a legitimate, compliant non-UK audience before applying; otherwise put On Hold.','2026-11-06','2026-10-23','Prospect added 2026-10-23. Official site lists regional CPA ceilings (MENA up to $1,850; APAC $1,760; SSA $1,080; LATAM $960; CIS $680) with no UK or European figure. Multiple sources state Exness does not onboard UK retail clients. If UK residents cannot open accounts there is nothing to promote to a UK audience; the programme would only make sense for a legitimate non-UK audience. All figures Needs Confirmation.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,country_note,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_primexbt','primexbt','PrimeXBT — PrimeXBT Partners','https://primexbt.partners/','https://primexbt.partners/','','hybrid','researching','unverified','review_required','unknown','Restricted jurisdictions reported: US, Canada, Japan, Israel, New Zealand, Russia (+ Cuba, Iran in some lists). UK: not marketed per PrimeXBT notices; UK retail crypto-derivatives ban. Needs Confirmation with solicitor and PrimeXBT.','["GB"]'::jsonb,'Kelvin Williams','Do not apply yet. Obtain the solicitor''s view on promoting a crypto-derivatives platform to a UK audience (retail ban since Jan 2021; crypto promotions regime since Oct 2023) and confirm PrimeXBT''s own UK stance; then a go / no-go decision.','2026-11-13','2026-10-23','Prospect added 2026-10-23. Crypto-margin / CFD platform. Third-party sources report CPA (figures from up to $450 to up to $2,500 per qualified trader, conflicting) and up to 50% revenue share; payout schedule reported as daily, weekly or monthly; minimum payout reported as none or $100. The official primexbt.partners terms were not surfaced in search. UK: PrimeXBT''s own documents say its rewards terms are not intended for UK/EEA residents and that it does not market in the UK/EU; the FCA has banned the sale of crypto derivatives to UK retail consumers since January 2021 and cryptoasset financial promotions have been restricted since October 2023. Promotion to a UK audience is very likely not permitted. Nothing here is verified.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_axi_1','pf_axi','programme_model','Axi advertises CPA payments ''up to'' a stated maximum for qualified clients.','https://www.axi.com/uk/partnerships/affiliate-program','assumption',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_axi_2','pf_axi','eligibility','Qualification may require account verification, a minimum deposit and trading volume, depending on the agreement.','https://www.axi.com/uk/partnerships/affiliate-program','assumption',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_axi_3','pf_axi','countries','UK audience eligibility and excluded jurisdictions not yet confirmed in writing.','https://www.axi.com/uk/partnerships/affiliate-program','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_axi_4','pf_axi','traffic_sources','Which Ten Talents promotional channels can be approved is unknown.','https://www.axi.com/uk/partnerships/affiliate-program','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_axi_5','pf_axi','programme_model','Axi affiliate pages advertise CPA ''up to'' figures that differ by page and region ($600 to $1,200 per qualified client) plus 10% on sub-affiliate earnings. Steven (Axi, 22 Oct 2026) confirmed a tiered CPA set in the individual agreement. Needs Confirmation for the UK tier.','https://www.axi.com/int/partnerships/affiliate-program','assumption',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_axi_6','pf_axi','tax_payout','Payment schedule conflicts across Axi pages: ''biweekly'' on the affiliate page, ''monthly'' on another version; Axi partner support says commissions become payable once the balance reaches $2,000 and 5 qualified clients, then no minimum per withdrawal, via the Client Portal. Needs Confirmation with the Account Manager.','https://support.axi.com/hc/en-us/articles/49786766640537-How-can-I-withdraw-my-CPA-commission','assumption',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_axi_7','pf_axi','eligibility','One Axi page states commission starts once referred clients reach a 400k standard volume; Steven stated two standard lots + minimum deposit within 60 days + verification. Conflict. Needs Confirmation.','https://www.axiaffiliates.com/frequently-asked-questions/','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_pepperstone_1','pf_pepperstone','programme_model','CPA affiliate and IB arrangements are separate programmes with different terms.','https://partnership.pepperstone.com/en/affiliates-program/','assumption',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_pepperstone_2','pf_pepperstone','countries','Availability and commission terms depend on the applicable programme and country; UK participation not confirmed.','https://partnership.pepperstone.com/en/affiliates-program/','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_pepperstone_3','pf_pepperstone','traffic_sources','Approved marketing channels unknown.','https://partnership.pepperstone.com/en/affiliates-program/','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_plus500_1','pf_plus500','programme_model','Commercial model and current commission terms unknown until the current official rules are reviewed.','https://www.500affiliates.com/','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_plus500_2','pf_plus500','countries','UK affiliate eligibility and UK customer eligibility not confirmed.','https://www.500affiliates.com/','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_plus500_3','pf_plus500','traffic_sources','Approved traffic sources and compliance requirements not confirmed.','https://www.500affiliates.com/','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_trading212_1','pf_trading212','programme_model','Publishers are invited to contact the partnerships team; no public rate card.','https://helpcentre.trading212.com/hc/en-us/articles/360008095077-How-can-I-become-a-Trading-212-Affiliate','assumption',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_trading212_2','pf_trading212','eligibility','Acceptance is at Trading 212''s discretion; eligibility criteria not published.','https://helpcentre.trading212.com/hc/en-us/articles/360008095077-How-can-I-become-a-Trading-212-Affiliate','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_xm_1','pf_xm','programme_model','Official partner page advertises CPA up to $1,000 per client, paid in full upfront; reviews say rates vary by country and are negotiated with a partner manager. Needs Confirmation.','https://partners.xm.com/paymentplans','assumption',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_xm_2','pf_xm','tax_payout','Official page advertises daily payouts and instant withdrawals (bank transfer, Skrill, Neteller, USDT). Third-party guides say twice weekly (Tue/Thu) or weekly; XM''s partner-programme terms PDF describes monthly payment with balances under $500 carried forward. Conflict — Needs Confirmation.','https://partners.xm.com/advantages','open_question',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_xm_3','pf_xm','tax_payout','Minimum withdrawal reported as $5 by most third-party sources (one says none); not stated on the official page in the sources found. Needs Confirmation.','https://www.xm.com/assets/pdf/new/terms/XM-Partner-Program.pdf','open_question',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_xm_4','pf_xm','countries','US and Canada excluded per one review. UK: conflicting sources on whether UK clients are accepted and under which entity. Needs Confirmation via FCA Register and XM.','https://partners.xm.com/','open_question',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_exness_1','pf_exness','programme_model','Official commission-plan page lists CPA ceilings by region: MENA up to $1,850; APAC $1,760; SSA $1,080; LATAM $960; CIS $680. No UK/Europe figure. Needs Confirmation.','https://www.exnessaffiliates.com/affiliates-commission-plan/','assumption',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_exness_2','pf_exness','eligibility','Qualified client (official help centre): first-time deposit (cumulative deposits within 24h of the first) above a region-specific minimum, qualifying trading activity, and a new unique Exness user; exact regional minimums only visible in the Partner Personal Area. Needs Confirmation.','https://get.exness-affiliates.help/hc/en-us/articles/360011039839-The-Cost-Per-Action-CPA-Program','assumption',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_exness_3','pf_exness','tax_payout','Help centre: affiliate reward calculated daily and credited the next day after qualification. Withdrawal schedule, minimum and methods Needs Confirmation.','https://get.exness-affiliates.help/hc/en-us/articles/360016773680-How-to-become-a-Digital-Affiliate-DA','assumption',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_exness_4','pf_exness','countries','Several sources state Exness is not available to UK retail clients (onboarding closed); FCA licence status of Exness (UK) Ltd disputed. Needs Confirmation — FCA Register and Exness in writing.','https://brokerchooser.com/broker-reviews/exness-review/exness-uk','open_question',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_primexbt_1','pf_primexbt','programme_model','Third-party sources report both CPA (up to $450 … up to $2,500 per qualified trader, conflicting) and up to 50% revenue share; official partner terms not found in search. Needs Confirmation.','https://primexbt.partners/','assumption',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_primexbt_2','pf_primexbt','tax_payout','Payout schedule conflicting across sources: daily with no minimum (2026 announcement) vs weekly / monthly / every Monday; minimum payout reported as none or $100. Needs Confirmation.','https://primexbt.partners/','open_question',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_primexbt_3','pf_primexbt','countries','Restricted jurisdictions reported: US, Canada, Japan, Israel, New Zealand, Russia (+ Cuba, Iran in some lists). PrimeXBT''s Rewards terms state they are not intended for UK/EEA residents and a company notice says it does not market in the UK/EU. Needs Confirmation.','https://primexbt.com/company-blog/important-information-for-users-residing-in-the-eu-and-uk/','open_question',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_primexbt_4','pf_primexbt','eligibility','UK regulatory position: FCA ban on sale of crypto derivatives to retail consumers (since 6 Jan 2021) and cryptoasset financial-promotions regime (since 8 Oct 2023). Likely prohibits promoting this platform to UK consumers — qualified legal review required before any step.','https://www.fca.org.uk/','open_question',NULL,'Seeded 2026-10-23; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_axi','pf_axi','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_pepperstone','pf_pepperstone','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_plus500','pf_plus500','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_trading212','pf_trading212','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_xm','pf_xm','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_exness','pf_exness','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_primexbt','pf_primexbt','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,currency,source_url,source_note) VALUES ('pt_axi_cpa_advertised_max','pf_axi','cpa_advertised_max','unverified','Up to $600–$1,200 per qualified client depending on page/region (ceiling); tiered CPA per agreement','USD','https://www.axi.com/int/partnerships/affiliate-program','Needs Confirmation — advertised ceiling, not a rate; UK tier set in the individual agreement (Steven, 22 Oct 2026)') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_cpa_amount','pf_axi','cpa_amount','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_cpa_conditions','pf_axi','cpa_conditions','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_revshare_pct','pf_axi','revshare_pct','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_revshare_basis','pf_axi','revshare_basis','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_hybrid_rules','pf_axi','hybrid_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_ib_terms','pf_axi','ib_terms','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_min_deposit','pf_axi','min_deposit','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_min_trading','pf_axi','min_trading','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_account_verification','pf_axi','account_verification','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_qualification_deadline','pf_axi','qualification_deadline','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_tracking_window','pf_axi','tracking_window','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_axi_payment_frequency','pf_axi','payment_frequency','unverified','Monthly per Steven (22 Oct 2026); Axi pages say biweekly or monthly','https://www.axi.com/int/partnerships/affiliate-program','Received from Axi support; Needs Confirmation in the Affiliate Agreement') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,currency,source_url,source_note) VALUES ('pt_axi_min_payout','pf_axi','min_payout','unverified','$2,000 balance and 5 qualified clients before first payout (partner support article); no minimum thereafter','USD','https://support.axi.com/hc/en-us/articles/49786766640537-How-can-I-withdraw-my-CPA-commission','Needs Confirmation with Account Manager') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_clawback_rules','pf_axi','clawback_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_attribution_rules','pf_axi','attribution_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_permitted_traffic','pf_axi','permitted_traffic','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_country_rates','pf_axi','country_rates','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_contract_start','pf_axi','contract_start','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_contract_end','pf_axi','contract_end','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_terms_confirmed_at','pf_axi','terms_confirmed_at','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_agreement_ref','pf_axi','agreement_ref','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_axi_withdrawal_methods','pf_axi','withdrawal_methods','unverified','Via the Axi Client Portal; client withdrawals free above US$50 (general policy, not affiliate-specific)','https://support.axi.com/hc/en-us/articles/32999103656857-Minimum-withdrawals-and-Withdrawal-fees','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_holding_period','pf_axi','holding_period','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_axi_countries_accepted','pf_axi','countries_accepted','unverified','UK clients via Axi Financial Services (UK) Ltd (Steven, 22 Oct 2026); other countries Needs Confirmation','','Received from Axi support') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_cpa_advertised_max','pf_pepperstone','cpa_advertised_max','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_cpa_amount','pf_pepperstone','cpa_amount','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_cpa_conditions','pf_pepperstone','cpa_conditions','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_revshare_pct','pf_pepperstone','revshare_pct','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_revshare_basis','pf_pepperstone','revshare_basis','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_hybrid_rules','pf_pepperstone','hybrid_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_ib_terms','pf_pepperstone','ib_terms','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_min_deposit','pf_pepperstone','min_deposit','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_min_trading','pf_pepperstone','min_trading','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_account_verification','pf_pepperstone','account_verification','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_qualification_deadline','pf_pepperstone','qualification_deadline','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_tracking_window','pf_pepperstone','tracking_window','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_payment_frequency','pf_pepperstone','payment_frequency','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_min_payout','pf_pepperstone','min_payout','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_clawback_rules','pf_pepperstone','clawback_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_attribution_rules','pf_pepperstone','attribution_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_permitted_traffic','pf_pepperstone','permitted_traffic','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_country_rates','pf_pepperstone','country_rates','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_contract_start','pf_pepperstone','contract_start','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_contract_end','pf_pepperstone','contract_end','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_terms_confirmed_at','pf_pepperstone','terms_confirmed_at','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_agreement_ref','pf_pepperstone','agreement_ref','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_withdrawal_methods','pf_pepperstone','withdrawal_methods','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_holding_period','pf_pepperstone','holding_period','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_pepperstone_countries_accepted','pf_pepperstone','countries_accepted','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_cpa_advertised_max','pf_plus500','cpa_advertised_max','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_cpa_amount','pf_plus500','cpa_amount','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_cpa_conditions','pf_plus500','cpa_conditions','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_revshare_pct','pf_plus500','revshare_pct','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_revshare_basis','pf_plus500','revshare_basis','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_hybrid_rules','pf_plus500','hybrid_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_ib_terms','pf_plus500','ib_terms','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_min_deposit','pf_plus500','min_deposit','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_min_trading','pf_plus500','min_trading','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_account_verification','pf_plus500','account_verification','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_qualification_deadline','pf_plus500','qualification_deadline','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_tracking_window','pf_plus500','tracking_window','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_payment_frequency','pf_plus500','payment_frequency','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_min_payout','pf_plus500','min_payout','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_clawback_rules','pf_plus500','clawback_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_attribution_rules','pf_plus500','attribution_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_permitted_traffic','pf_plus500','permitted_traffic','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_country_rates','pf_plus500','country_rates','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_contract_start','pf_plus500','contract_start','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_contract_end','pf_plus500','contract_end','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_terms_confirmed_at','pf_plus500','terms_confirmed_at','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_agreement_ref','pf_plus500','agreement_ref','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_withdrawal_methods','pf_plus500','withdrawal_methods','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_holding_period','pf_plus500','holding_period','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_plus500_countries_accepted','pf_plus500','countries_accepted','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_cpa_advertised_max','pf_trading212','cpa_advertised_max','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_cpa_amount','pf_trading212','cpa_amount','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_cpa_conditions','pf_trading212','cpa_conditions','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_revshare_pct','pf_trading212','revshare_pct','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_revshare_basis','pf_trading212','revshare_basis','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_hybrid_rules','pf_trading212','hybrid_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_ib_terms','pf_trading212','ib_terms','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_min_deposit','pf_trading212','min_deposit','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_min_trading','pf_trading212','min_trading','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_account_verification','pf_trading212','account_verification','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_qualification_deadline','pf_trading212','qualification_deadline','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_tracking_window','pf_trading212','tracking_window','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_payment_frequency','pf_trading212','payment_frequency','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_min_payout','pf_trading212','min_payout','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_clawback_rules','pf_trading212','clawback_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_attribution_rules','pf_trading212','attribution_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_permitted_traffic','pf_trading212','permitted_traffic','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_country_rates','pf_trading212','country_rates','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_contract_start','pf_trading212','contract_start','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_contract_end','pf_trading212','contract_end','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_terms_confirmed_at','pf_trading212','terms_confirmed_at','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_agreement_ref','pf_trading212','agreement_ref','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_withdrawal_methods','pf_trading212','withdrawal_methods','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_holding_period','pf_trading212','holding_period','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_trading212_countries_accepted','pf_trading212','countries_accepted','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,currency,source_url,source_note) VALUES ('pt_xm_cpa_advertised_max','pf_xm','cpa_advertised_max','unverified','Up to $1,000 per client (advertised ceiling; varies by country)','USD','https://partners.xm.com/paymentplans','Needs Confirmation — advertised, not country-specific') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_cpa_amount','pf_xm','cpa_amount','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_cpa_conditions','pf_xm','cpa_conditions','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_revshare_pct','pf_xm','revshare_pct','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_revshare_basis','pf_xm','revshare_basis','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_hybrid_rules','pf_xm','hybrid_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_ib_terms','pf_xm','ib_terms','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_min_deposit','pf_xm','min_deposit','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_min_trading','pf_xm','min_trading','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_account_verification','pf_xm','account_verification','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_qualification_deadline','pf_xm','qualification_deadline','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_tracking_window','pf_xm','tracking_window','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_xm_payment_frequency','pf_xm','payment_frequency','unverified','Daily (advertised on official page); conflicting: twice weekly / weekly / monthly in other sources','https://partners.xm.com/advantages','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,currency,source_url,source_note) VALUES ('pt_xm_min_payout','pf_xm','min_payout','unverified','$5 (third-party sources; one says none)','USD','','Needs Confirmation — not seen on official page') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_clawback_rules','pf_xm','clawback_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_attribution_rules','pf_xm','attribution_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_permitted_traffic','pf_xm','permitted_traffic','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_country_rates','pf_xm','country_rates','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_contract_start','pf_xm','contract_start','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_contract_end','pf_xm','contract_end','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_terms_confirmed_at','pf_xm','terms_confirmed_at','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_agreement_ref','pf_xm','agreement_ref','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_xm_withdrawal_methods','pf_xm','withdrawal_methods','unverified','Bank transfer, Skrill, Neteller, USDT (advertised); fees Needs Confirmation','https://partners.xm.com/advantages','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_xm_holding_period','pf_xm','holding_period','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_xm_countries_accepted','pf_xm','countries_accepted','unverified','Not US/Canada (third-party); UK Needs Confirmation','','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,currency,source_url,source_note) VALUES ('pt_exness_cpa_advertised_max','pf_exness','cpa_advertised_max','unverified','Up to $1,850 (MENA); $1,760 APAC; $1,080 SSA; $960 LATAM; $680 CIS — regional ceilings; no UK figure','USD','https://www.exnessaffiliates.com/affiliates-commission-plan/','Needs Confirmation — ceilings, not UK-available rates') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_cpa_amount','pf_exness','cpa_amount','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_exness_cpa_conditions','pf_exness','cpa_conditions','unverified','FTD above regional minimum + qualifying trading + new unique user (official help centre); exact minimums in Partner Personal Area','https://get.exness-affiliates.help/hc/en-us/articles/360011039839-The-Cost-Per-Action-CPA-Program','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_revshare_pct','pf_exness','revshare_pct','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_revshare_basis','pf_exness','revshare_basis','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_hybrid_rules','pf_exness','hybrid_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_ib_terms','pf_exness','ib_terms','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_min_deposit','pf_exness','min_deposit','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_min_trading','pf_exness','min_trading','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_account_verification','pf_exness','account_verification','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_qualification_deadline','pf_exness','qualification_deadline','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_tracking_window','pf_exness','tracking_window','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_exness_payment_frequency','pf_exness','payment_frequency','unverified','Reward credited daily (next day after qualification); withdrawal schedule Needs Confirmation','https://get.exness-affiliates.help/hc/en-us/articles/360016773680-How-to-become-a-Digital-Affiliate-DA','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_exness_min_payout','pf_exness','min_payout','unverified','Needs Confirmation','','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_clawback_rules','pf_exness','clawback_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_attribution_rules','pf_exness','attribution_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_permitted_traffic','pf_exness','permitted_traffic','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_country_rates','pf_exness','country_rates','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_contract_start','pf_exness','contract_start','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_contract_end','pf_exness','contract_end','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_terms_confirmed_at','pf_exness','terms_confirmed_at','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_agreement_ref','pf_exness','agreement_ref','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_withdrawal_methods','pf_exness','withdrawal_methods','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_exness_holding_period','pf_exness','holding_period','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_exness_countries_accepted','pf_exness','countries_accepted','unverified','UK retail onboarding reported closed; regional programme (MENA, APAC, SSA, LATAM, CIS)','','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,currency,source_url,source_note) VALUES ('pt_primexbt_cpa_advertised_max','pf_primexbt','cpa_advertised_max','unverified','Reported $450 to $2,500 per qualified trader (third-party, conflicting)','USD','','Needs Confirmation — no official figure found') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_cpa_amount','pf_primexbt','cpa_amount','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_cpa_conditions','pf_primexbt','cpa_conditions','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_primexbt_revshare_pct','pf_primexbt','revshare_pct','unverified','Up to 50% (third-party reports)','','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_revshare_basis','pf_primexbt','revshare_basis','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_hybrid_rules','pf_primexbt','hybrid_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_ib_terms','pf_primexbt','ib_terms','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_min_deposit','pf_primexbt','min_deposit','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_min_trading','pf_primexbt','min_trading','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_account_verification','pf_primexbt','account_verification','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_qualification_deadline','pf_primexbt','qualification_deadline','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_tracking_window','pf_primexbt','tracking_window','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_primexbt_payment_frequency','pf_primexbt','payment_frequency','unverified','Conflicting: daily / weekly / monthly','','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,currency,source_url,source_note) VALUES ('pt_primexbt_min_payout','pf_primexbt','min_payout','unverified','Conflicting: none / $100','USD','','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_clawback_rules','pf_primexbt','clawback_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_attribution_rules','pf_primexbt','attribution_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_permitted_traffic','pf_primexbt','permitted_traffic','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_country_rates','pf_primexbt','country_rates','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_contract_start','pf_primexbt','contract_start','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_contract_end','pf_primexbt','contract_end','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_terms_confirmed_at','pf_primexbt','terms_confirmed_at','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_agreement_ref','pf_primexbt','agreement_ref','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_withdrawal_methods','pf_primexbt','withdrawal_methods','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_primexbt_holding_period','pf_primexbt','holding_period','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status,value,source_url,source_note) VALUES ('pt_primexbt_countries_accepted','pf_primexbt','countries_accepted','unverified','Excludes US, CA, JP, IL, NZ, RU (reported); UK not marketed; UK retail crypto-derivatives ban','','Needs Confirmation') ON CONFLICT DO NOTHING;
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,restrictions,open_questions) VALUES ('pc_axi','pf_axi','unknown',true,'','Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,restrictions,open_questions) VALUES ('pc_pepperstone','pf_pepperstone','unknown',true,'','Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,restrictions,open_questions) VALUES ('pc_plus500','pf_plus500','unknown',true,'','Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,restrictions,open_questions) VALUES ('pc_trading212','pf_trading212','unknown',true,'','Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,restrictions,open_questions) VALUES ('pc_xm','pf_xm','unknown',true,'','Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,restrictions,open_questions) VALUES ('pc_exness','pf_exness','unknown',true,'','Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,restrictions,open_questions) VALUES ('pc_primexbt','pf_primexbt','unknown',true,'FCA ban on the sale of crypto derivatives to UK retail consumers (PS20/10, in force 6 Jan 2021) and the UK cryptoasset financial-promotions regime (from 8 Oct 2023) — likely prohibit promoting this platform to UK consumers. Obtain qualified legal advice before any application or content.','Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_axi_website','pf_axi','website','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_axi_social','pf_axi','social','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_axi_email','pf_axi','email','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_axi_paid_ads','pf_axi','paid_ads','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_axi_webinar_community','pf_axi','webinar_community','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_pepperstone_website','pf_pepperstone','website','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_pepperstone_social','pf_pepperstone','social','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_pepperstone_email','pf_pepperstone','email','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_pepperstone_paid_ads','pf_pepperstone','paid_ads','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_pepperstone_webinar_community','pf_pepperstone','webinar_community','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_plus500_website','pf_plus500','website','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_plus500_social','pf_plus500','social','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_plus500_email','pf_plus500','email','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_plus500_paid_ads','pf_plus500','paid_ads','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_plus500_webinar_community','pf_plus500','webinar_community','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_trading212_website','pf_trading212','website','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_trading212_social','pf_trading212','social','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_trading212_email','pf_trading212','email','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_trading212_paid_ads','pf_trading212','paid_ads','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_trading212_webinar_community','pf_trading212','webinar_community','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_xm_website','pf_xm','website','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_xm_social','pf_xm','social','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_xm_email','pf_xm','email','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_xm_paid_ads','pf_xm','paid_ads','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_xm_webinar_community','pf_xm','webinar_community','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_exness_website','pf_exness','website','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_exness_social','pf_exness','social','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_exness_email','pf_exness','email','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_exness_paid_ads','pf_exness','paid_ads','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_exness_webinar_community','pf_exness','webinar_community','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_primexbt_website','pf_primexbt','website','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_primexbt_social','pf_primexbt','social','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_primexbt_email','pf_primexbt','email','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_primexbt_paid_ads','pf_primexbt','paid_ads','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_primexbt_webinar_community','pf_primexbt','webinar_community','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_axi_1','pf_axi','Review the UK affiliate programme page and record verified facts','Kelvin Williams','high','2026-10-28') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_axi_2','pf_axi','Request the current rate card and qualification rules in writing','Kelvin Williams','high','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_axi_3','pf_axi','Ask which promotional channels can be approved','Kelvin Williams','normal','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_pepperstone_1','pf_pepperstone','Confirm UK affiliate participation in writing','Kelvin Williams','high','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_pepperstone_2','pf_pepperstone','Request current CPA terms and qualification rules','Kelvin Williams','high','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_pepperstone_3','pf_pepperstone','Ask separately about IB terms and requirements','Kelvin Williams','normal','2026-11-11') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_plus500_1','pf_plus500','Review the current official 500Affiliates programme rules','Kelvin Williams','high','2026-10-28') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_plus500_2','pf_plus500','Confirm UK affiliate and UK customer eligibility in writing','Kelvin Williams','high','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_plus500_3','pf_plus500','Request commission terms, qualification rules, traffic sources and compliance requirements','Kelvin Williams','normal','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_trading212_1','pf_trading212','Draft the partnership enquiry (mission, audience, site, content, channels)','Kelvin Williams','high','2026-10-31') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_trading212_2','pf_trading212','Send the enquiry via the official route and log the correspondence','Kelvin Williams','normal','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_xm_1','pf_xm','Confirm UK eligibility (publisher and referred clients) in writing','Kelvin Williams','high','2026-10-30') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_xm_2','pf_xm','Request CPA rate card for Ten Talents'' target countries','Kelvin Williams','high','2026-11-02') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_xm_3','pf_xm','Confirm payment frequency, minimum withdrawal and withdrawal methods/fees','Kelvin Williams','high','2026-11-02') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_xm_4','pf_xm','Apply to programme (only after eligibility and compliance are confirmed)','Kelvin Williams','normal','2026-11-13') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_xm_5','pf_xm','Obtain approved promotional materials and required risk-warning wording','Kelvin Williams','normal','2026-11-22') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_xm_6','pf_xm','Test tracking links before any use','Kelvin Williams','normal',NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_xm_7','pf_xm','Verify first commission payment against the statement','Kelvin Williams','normal',NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_exness_1','pf_exness','Confirm UK eligibility (publisher and referred clients) in writing','Kelvin Williams','high','2026-10-30') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_exness_2','pf_exness','Request CPA rate card for Ten Talents'' target countries','Kelvin Williams','high','2026-11-02') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_exness_3','pf_exness','Confirm payment frequency, minimum withdrawal and withdrawal methods/fees','Kelvin Williams','high','2026-11-02') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_exness_4','pf_exness','Apply to programme (only after eligibility and compliance are confirmed)','Kelvin Williams','normal','2026-11-13') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_exness_5','pf_exness','Obtain approved promotional materials and required risk-warning wording','Kelvin Williams','normal','2026-11-22') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_exness_6','pf_exness','Test tracking links before any use','Kelvin Williams','normal',NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_exness_7','pf_exness','Verify first commission payment against the statement','Kelvin Williams','normal',NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_primexbt_1','pf_primexbt','Legal review: UK crypto-derivatives retail ban and cryptoasset promotions regime — go / no-go','Kelvin Williams','urgent','2026-11-06') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_primexbt_2','pf_primexbt','Confirm UK eligibility (publisher and referred clients) in writing','Kelvin Williams','high','2026-10-30') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_primexbt_3','pf_primexbt','Request CPA rate card for Ten Talents'' target countries','Kelvin Williams','high','2026-11-02') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_primexbt_4','pf_primexbt','Confirm payment frequency, minimum withdrawal and withdrawal methods/fees','Kelvin Williams','high','2026-11-02') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_primexbt_5','pf_primexbt','Apply to programme (only after eligibility and compliance are confirmed)','Kelvin Williams','normal','2026-11-13') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_primexbt_6','pf_primexbt','Obtain approved promotional materials and required risk-warning wording','Kelvin Williams','normal','2026-11-22') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_primexbt_7','pf_primexbt','Test tracking links before any use','Kelvin Williams','normal',NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_primexbt_8','pf_primexbt','Verify first commission payment against the statement','Kelvin Williams','normal',NULL) ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_axi','pf_axi','firm','pf_axi','created','','seeded as prospect (2026-10-21)','seed') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_pepperstone','pf_pepperstone','firm','pf_pepperstone','created','','seeded as prospect (2026-10-21)','seed') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_plus500','pf_plus500','firm','pf_plus500','created','','seeded as prospect (2026-10-21)','seed') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_trading212','pf_trading212','firm','pf_trading212','created','','seeded as prospect (2026-10-21)','seed') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_xm','pf_xm','firm','pf_xm','created','','seeded as prospect (2026-10-23)','seed') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_exness','pf_exness','firm','pf_exness','created','','seeded as prospect (2026-10-23)','seed') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_primexbt','pf_primexbt','firm','pf_primexbt','created','','seeded as prospect (2026-10-23)','seed') ON CONFLICT DO NOTHING;


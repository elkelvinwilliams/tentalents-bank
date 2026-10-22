-- Ten Talents Academy — full database build (schema + seed)
-- Paste this whole file into the Neon SQL editor and press Run.
-- Run once on your new (empty) Neon database. (The content INSERTs are re-runnable;
-- the table creation is not — if you ever need a clean slate, drop the tables first.)
-- Generated 2026-10-22.

-- migration 0000_init.sql
CREATE TABLE "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"track_id" text NOT NULL,
	"name_on_cert" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "email_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"purpose" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE "entitlements" (
	"user_id" text PRIMARY KEY NOT NULL,
	"stripe_customer_id" text,
	"subscription_id" text,
	"membership_item_id" text,
	"signals_item_id" text,
	"status" text DEFAULT 'none' NOT NULL,
	"signals_status" text DEFAULT 'none' NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "glossary_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"term" text NOT NULL,
	"definition" text NOT NULL,
	"position" integer NOT NULL
);

CREATE TABLE "lesson_progress" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"title" text NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"body_html" text DEFAULT '' NOT NULL,
	"is_free_preview" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL,
	"published" boolean DEFAULT true NOT NULL
);

CREATE TABLE "modules" (
	"id" text PRIMARY KEY NOT NULL,
	"track_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'lessons' NOT NULL,
	"position" integer NOT NULL,
	"published" boolean DEFAULT true NOT NULL
);

CREATE TABLE "quiz_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"score_pct" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "quizzes" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"pass_pct" integer DEFAULT 70 NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL
);

CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "tracks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"blurb" text NOT NULL,
	"position" integer NOT NULL,
	"published" boolean DEFAULT true NOT NULL
);

CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"name" text DEFAULT '' NOT NULL,
	"onboarding_answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"stage" text DEFAULT 'onboard' NOT NULL,
	"consent_at" timestamp with time zone,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "certificates" ADD CONSTRAINT "certificates_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "modules" ADD CONSTRAINT "modules_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "cert_uq" ON "certificates" USING btree ("user_id","track_id");

CREATE UNIQUE INDEX "progress_uq" ON "lesson_progress" USING btree ("user_id","lesson_id");

CREATE INDEX "lessons_module_idx" ON "lessons" USING btree ("module_id");

CREATE INDEX "modules_track_idx" ON "modules" USING btree ("track_id");

CREATE INDEX "attempts_user_quiz_idx" ON "quiz_attempts" USING btree ("user_id","quiz_id");

CREATE UNIQUE INDEX "quizzes_module_uq" ON "quizzes" USING btree ("module_id");

CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");

CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");

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

-- ============ seed content (from the prototype) ============

INSERT INTO tracks (id,name,blurb,position,published) VALUES ('t1','Money Foundations','Build a strong financial mindset and understand how money works.',0,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,blurb=EXCLUDED.blurb,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t1-m1','t1','Where money goes','lessons',0,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m1-l1','t1-m1','Income, spending and the gap between them',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m1-l2','t1-m1','Why saving is a rate, not an amount',0,'',false,1,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t1-m2','t1','Debt','lessons',1,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m2-l1','t1-m2','Good debt, bad debt and the honest test',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m2-l2','t1-m2','What interest costs over time',0,'',false,1,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t1-m3','t1','Compounding and inflation','lessons',2,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m3-l1','t1-m3','The arithmetic of patience',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m3-l2','t1-m3','Inflation, the quiet tax',0,'',false,1,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;

INSERT INTO tracks (id,name,blurb,position,published) VALUES ('t2','How Markets Work','Learn the structure, participants and behaviour of global financial markets.',1,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,blurb=EXCLUDED.blurb,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t2-m1','t2','How a price is made','lessons',0,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t2-m1-l1','t2-m1','Bid, ask and the spread',6,'
<p>Every market quotes two prices at once, not one. If you have only ever seen a single number on a news ticker, this is the first thing to unlearn.</p>
<p>Say gold is quoted at <b>2,412.30 / 2,412.60</b>. The lower number is the <b>bid</b>: what you get if you sell right now. The higher number is the <b>ask</b>: what you pay if you buy right now. The gap between them, thirty cents here, is the <b>spread</b>.</p>
<figure>
  <div class="spreadbar"><div class="b">bid<br>2,412.30</div><div class="s">spread<br>0.30</div><div class="a">ask<br>2,412.60</div></div>
  <figcaption>You sell at the left edge and buy at the right edge. You never trade at the middle.</figcaption>
</figure>
<h2>Why this matters on your very first trade</h2>
<p>Buy gold at 2,412.60 and the position is immediately worth 2,412.30, because that is what you would get for selling it back. You are down the spread the instant you open. The price has to move in your favour by thirty cents just to get you level.</p>
<p>That sounds trivial on one trade. Take twenty trades a week and the spread becomes one of the largest, quietest costs in your account. It is also why a strategy that takes small profits repeatedly is far harder to run than it looks on paper: the cost stays the same while the target shrinks.</p>
<h2>What moves the spread</h2>
<p>Spreads are not fixed. They widen when fewer people are willing to trade, which is exactly when most beginners are most active: around major news, at the daily open and close, and on thinly traded instruments. A pair that costs you half a pip at midday in London can cost several pips in the seconds after an interest rate decision.</p>
<p>So the practical habit is simple. Before you take a position, look at the spread as it is right now, not as it usually is. If it has widened, whatever edge you thought you had may already have been spent.</p>
<div class="takeaways"><h3>Take away</h3><ul>
<li>Bid is what you sell at, ask is what you buy at, and the gap is the spread.</li>
<li>You pay the spread on entry, so every position starts slightly negative.</li>
<li>Spreads widen when liquidity thins out, especially around news.</li>
<li>The more often you trade, the more the spread decides your results.</li>
</ul></div>',true,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t2-m1-l2','t2-m1','Who is on the other side of your trade',7,'
<p>A trade needs two sides. When you buy, somebody sells. It is worth knowing who that somebody usually is, because it explains a great deal about why prices behave as they do.</p>
<h2>Four groups, four motives</h2>
<p><b>Hedgers</b> are not trying to profit from the price at all. An airline buying fuel forward and a manufacturer locking in a currency rate both want certainty rather than gain. They will happily accept a worse price for a known outcome, and they trade on a schedule rather than on a chart.</p>
<p><b>Institutions</b> move size that cannot be executed in one go. A fund unwinding a large position will work it over hours or days, which is why strong moves often continue further than seems reasonable, and why prices sometimes grind steadily in one direction with no news attached.</p>
<p><b>Market makers</b> quote both sides continuously and earn the spread. They are not betting on direction; they are managing inventory. They want volume, and they widen their quotes when uncertainty makes holding inventory dangerous.</p>
<p><b>Retail traders</b> are the smallest group by volume and the least coordinated. That is the group you are in.</p>
<h2>What follows from this</h2>
<p>Two things. First, the market is not a single opponent with a plan. It is a crowd with conflicting motives, some of whom are not even trying to win in the way you are. The idea that price is hunting you personally is a story people tell themselves after a loss.</p>
<p>Second, your edge cannot come from size, speed, or information: institutions beat you on all three. If you have an edge at all, it comes from discipline and patience, because you are free to wait and they often are not. That is a real advantage, and it is the only one this course can help you build.</p>
<div class="takeaways"><h3>Take away</h3><ul>
<li>Your counterparty is often a hedger or a market maker with no view on direction.</li>
<li>Large orders get worked over time, which is why trends persist.</li>
<li>You cannot compete on size, speed or information.</li>
<li>Being free to do nothing is the retail trader''s one structural advantage.</li>
</ul></div>',false,1,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO quizzes (id,module_id,pass_pct,questions,published) VALUES ('t2-m1-quiz','t2-m1',70,'[{"q":"Gold is quoted at 2,412.30 / 2,412.60. You want to buy. Which price do you pay?","options":["2,412.30","2,412.60","The midpoint, 2,412.45","Whichever is closer to the last traded price"],"correct":1,"why":"You always buy at the higher price, the ask. The bid is what you would receive if you were selling instead. Nobody trades at the midpoint."},{"q":"You open a position and the price has not moved at all. Why is the position showing a small loss?","options":["A commission has been charged","The broker has repriced the trade","You bought at the ask and it is valued at the bid","Overnight financing has been applied"],"correct":2,"why":"You entered at the ask and the position is marked at the bid, so it starts down by the spread. The price has to move in your favour by that much before you break even."},{"q":"When would you most expect the spread to widen?","options":["Mid-morning in London on a quiet day","Immediately after a central bank rate decision","When a price has been flat for an hour","At the start of a long-term trend"],"correct":1,"why":"Spreads widen when liquidity thins and uncertainty rises. A rate decision does both at once, which is why costs are at their worst in the moments that feel most exciting."},{"q":"Why does taking many small profits make the spread more important?","options":["Brokers charge more on small trades","The cost stays the same while the target shrinks","Small trades are filled more slowly","Spreads are wider on small positions"],"correct":1,"why":"The spread is roughly constant per trade. As your profit target gets smaller, that fixed cost eats a larger share of it, so a high-frequency approach needs a much better strike rate to survive."},{"q":"Which is the retail trader''s genuine structural advantage over an institution?","options":["Faster execution","Better information","Lower costs per trade","No obligation to trade at all"],"correct":3,"why":"Funds often must deploy or unwind capital on a timetable. You can sit out for weeks with no consequence. Patience is the one edge that size cannot take from you."}]'::jsonb,true) ON CONFLICT (module_id) DO UPDATE SET questions=EXCLUDED.questions;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t2-m2','t2','The instruments','lessons',1,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t2-m2-l1','t2-m2','Stocks, bonds and funds',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t2-m2-l2','t2-m2','Currencies and commodities',0,'',false,1,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t2-m3','t2','Sessions and liquidity','lessons',2,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t2-m3-l1','t2-m3','The three trading sessions',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;

INSERT INTO tracks (id,name,blurb,position,published) VALUES ('t3','Understanding Risk','Learn how to protect your capital and make smarter, more confident decisions.',2,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,blurb=EXCLUDED.blurb,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t3-m1','t3','Leverage and margin','lessons',0,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t3-m1-l1','t3-m1','What leverage really borrows',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t3-m1-l2','t3-m1','Margin, and how it gets called',0,'',false,1,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t3-m2','t3','Position sizing','lessons',1,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t3-m2-l1','t3-m2','Sizing from the stop, not the balance',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t3-m3','t3','Being sold to','lessons',2,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t3-m3-l1','t3-m3','Reading a promise for what it is',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;

INSERT INTO tracks (id,name,blurb,position,published) VALUES ('t4','Building Something','Apply what you’ve learned to build wealth, create opportunities and achieve freedom.',3,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,blurb=EXCLUDED.blurb,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t4-m1','t4','Small bets','lessons',0,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t4-m1-l1','t4-m1','Risking time before money',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t4-m2','t4','First customers','lessons',1,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t4-m2-l1','t4-m2','Selling before building',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g0','Ask','The price you pay to buy. Always the higher of the two prices quoted.',0) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g1','Bid','The price you receive when you sell. Always the lower of the two.',1) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g2','Spread','The gap between bid and ask. It is the cost of entering a position, and you pay it the moment you open.',2) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g3','Pip','The standard smallest price move in a currency pair. On most pairs it is the fourth decimal place.',3) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g4','Leverage','Borrowed exposure. It multiplies the size of your position relative to your own money, and multiplies losses just as fast as gains.',4) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g5','Margin','The money set aside to hold a leveraged position open. It is not a fee; it is collateral.',5) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g6','Margin call','A demand for more collateral when losses eat into your margin. Ignore it and positions get closed for you.',6) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g7','Stop loss','An instruction to close a position once it has moved against you by a set amount. It defines your loss before you take the trade.',7) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g8','Take profit','An instruction to close a position once it has moved in your favour by a set amount.',8) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g9','R multiple','A way of measuring a result in units of risk. Risking £100 and making £300 is a 3R win.',9) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g10','Drawdown','The fall from a peak in account value to the following trough, usually stated as a percentage.',10) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g11','Liquidity','How easily something can be bought or sold without moving its price. Thin liquidity means wider spreads and sharper moves.',11) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g12','Slippage','The difference between the price you expected and the price you got. Most common around news and at the open.',12) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g13','Volatility','How much a price moves over a period. High volatility means bigger moves in both directions, not just up.',13) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g14','Support','A price area where buying has previously been strong enough to stop a fall.',14) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g15','Resistance','A price area where selling has previously been strong enough to stop a rise.',15) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g16','Position size','How much you buy or sell. The single biggest lever you have over risk.',16) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g17','Long','A position that gains value if the price rises.',17) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;
INSERT INTO glossary_terms (id,term,definition,position) VALUES ('g18','Short','A position that gains value if the price falls.',18) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;

-- Affiliate partnerships: five prospects (provisional; nothing submitted, approved or confirmed). Insert-if-missing.
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_axi','axi','Axi','https://www.axi.com/uk/partnerships/affiliate-program','','','cpa','researching','unverified','not_reviewed','unknown','["GB"]'::jsonb,'Kelvin Williams','Review the UK programme; request the current rate card; confirm UK audience eligibility, exact client qualification rules and which Ten Talents channels can be approved.','2026-11-04','2026-10-21','Prospect. Public page advertises CPA ''up to'' a stated maximum for qualified clients; the maximum is a ceiling, not a rate.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_ig','ig','IG','https://www.ig.com/uk/marketing-partnership/affiliate-partnerships','','https://www.ig.com/uk/marketing-partnership/affiliate-partnerships/requirements','enquiry_pending','researching','unverified','not_reviewed','unknown','["GB"]'::jsonb,'Kelvin Williams','Review the publisher requirements; audit Ten Talents'' public web presence against them; identify missing original educational content or disclosures; apply only when ready.','2026-11-11','2026-10-21','Prospect. IG reviews publisher content, website ownership, relevance, quality, commission disclosure and compliance before accepting publishers. Apply only when the submission is accurate and ready.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_pepperstone','pepperstone','Pepperstone','https://partnership.pepperstone.com/en/affiliates-program/','','','enquiry_pending','researching','unverified','not_reviewed','unknown','["GB"]'::jsonb,'Kelvin Williams','Confirm whether a UK-based Ten Talents affiliate can participate; request current CPA terms and qualification rules; ask separately about IB arrangements; record approved marketing channels.','2026-11-04','2026-10-21','Prospect. Pepperstone distinguishes CPA affiliate arrangements from introducing-broker (IB) arrangements; availability and terms depend on programme and country.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_plus500','plus500','Plus500 / 500Affiliates','https://www.500affiliates.com/','','','enquiry_pending','researching','unverified','not_reviewed','unknown','["GB"]'::jsonb,'Kelvin Williams','Review the current official programme rules; confirm UK affiliate and UK customer eligibility; request current commission terms, qualification rules, approved traffic sources and compliance requirements.','2026-11-04','2026-10-21','Prospect. Do not assume older help pages represent the current agreement; only the current official programme rules count.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_firms (id,slug,name,programme_url,apply_url,requirements_url,model,application_status,terms_status,compliance_status,country_eligibility,target_countries,owner,next_action,next_action_due,last_research_at,notes) VALUES ('pf_trading212','trading212','Trading 212','https://helpcentre.trading212.com/hc/en-us/articles/360008095077-How-can-I-become-a-Trading-212-Affiliate','','','enquiry_pending','researching','unverified','not_reviewed','unknown','["GB"]'::jsonb,'Kelvin Williams','Prepare a professional partnership enquiry (mission, audience, website, education content, proposed channels); ask whether a suitable current programme is available; request eligibility, commission and approval terms in writing.','2026-11-04','2026-10-21','Prospect. Trading 212 invites finance, investing and stock-market publishers to contact its partnerships team. No current CPA rate is assumed and acceptance is not guaranteed.

Seeded from the partnerships brief on 2026-10-21. Official pages were NOT re-checked from the build environment (outbound access blocked); every claim below is an assumption until a human verifies it against the linked source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_axi_1','pf_axi','programme_model','Axi advertises CPA payments ''up to'' a stated maximum for qualified clients.','https://www.axi.com/uk/partnerships/affiliate-program','assumption',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_axi_2','pf_axi','eligibility','Qualification may require account verification, a minimum deposit and trading volume, depending on the agreement.','https://www.axi.com/uk/partnerships/affiliate-program','assumption',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_axi_3','pf_axi','countries','UK audience eligibility and excluded jurisdictions not yet confirmed in writing.','https://www.axi.com/uk/partnerships/affiliate-program','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_axi_4','pf_axi','traffic_sources','Which Ten Talents promotional channels can be approved is unknown.','https://www.axi.com/uk/partnerships/affiliate-program','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_ig_1','pf_ig','website_audience','IG reviews publisher content, website ownership, relevance, quality, commission disclosure and compliance.','https://www.ig.com/uk/marketing-partnership/affiliate-partnerships/requirements','assumption',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_ig_2','pf_ig','programme_model','Commercial model (CPA / revenue share / hybrid) not yet confirmed for a UK education publisher.','https://www.ig.com/uk/marketing-partnership/affiliate-partnerships','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_ig_3','pf_ig','eligibility','Whether a sole trader (pre-incorporation) can be accepted is unknown.','https://www.ig.com/uk/marketing-partnership/affiliate-partnerships/requirements','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_pepperstone_1','pf_pepperstone','programme_model','CPA affiliate and IB arrangements are separate programmes with different terms.','https://partnership.pepperstone.com/en/affiliates-program/','assumption',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_pepperstone_2','pf_pepperstone','countries','Availability and commission terms depend on the applicable programme and country; UK participation not confirmed.','https://partnership.pepperstone.com/en/affiliates-program/','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_pepperstone_3','pf_pepperstone','traffic_sources','Approved marketing channels unknown.','https://partnership.pepperstone.com/en/affiliates-program/','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_plus500_1','pf_plus500','programme_model','Commercial model and current commission terms unknown until the current official rules are reviewed.','https://www.500affiliates.com/','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_plus500_2','pf_plus500','countries','UK affiliate eligibility and UK customer eligibility not confirmed.','https://www.500affiliates.com/','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_plus500_3','pf_plus500','traffic_sources','Approved traffic sources and compliance requirements not confirmed.','https://www.500affiliates.com/','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_trading212_1','pf_trading212','programme_model','Publishers are invited to contact the partnerships team; no public rate card.','https://helpcentre.trading212.com/hc/en-us/articles/360008095077-How-can-I-become-a-Trading-212-Affiliate','assumption',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_research (id,firm_id,topic,claim,source_url,verification,verified_at,notes) VALUES ('pr_trading212_2','pf_trading212','eligibility','Acceptance is at Trading 212''s discretion; eligibility criteria not published.','https://helpcentre.trading212.com/hc/en-us/articles/360008095077-How-can-I-become-a-Trading-212-Affiliate','open_question',NULL,'Seeded 2026-10-21; not yet verified against the source.') ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_axi','pf_axi','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_ig','pf_ig','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_pepperstone','pf_pepperstone','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_plus500','pf_plus500','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO partner_applications (id,firm_id,checklist,documents) VALUES ('pa_trading212','pf_trading212','[{"label":"Confirm the correct legal entity to contract (sole trader now; company after incorporation)","done":false},{"label":"Website audit against the programme''s publisher requirements","done":false},{"label":"Prepare audience and traffic description (education-first, UK)","done":false},{"label":"Prepare affiliate-disclosure and risk-warning wording","done":false},{"label":"Identify every channel to be approved (website, social, email, paid, community)","done":false},{"label":"Record official contact route and reference","done":false}]'::jsonb,'[{"label":"Proof of identity (reference to secure store only)","locationRef":"","done":false},{"label":"Proof of address (reference to secure store only)","locationRef":"","done":false},{"label":"Company registration certificate (after incorporation)","locationRef":"","done":false},{"label":"Bank / payout details (reference to secure store only)","locationRef":"","done":false},{"label":"Tax form if required (e.g. W-8BEN)","locationRef":"","done":false}]'::jsonb) ON CONFLICT DO NOTHING;
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
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_payment_frequency','pf_axi','payment_frequency','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_min_payout','pf_axi','min_payout','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_clawback_rules','pf_axi','clawback_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_attribution_rules','pf_axi','attribution_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_permitted_traffic','pf_axi','permitted_traffic','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_country_rates','pf_axi','country_rates','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_contract_start','pf_axi','contract_start','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_contract_end','pf_axi','contract_end','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_terms_confirmed_at','pf_axi','terms_confirmed_at','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_axi_agreement_ref','pf_axi','agreement_ref','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_cpa_amount','pf_ig','cpa_amount','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_cpa_conditions','pf_ig','cpa_conditions','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_revshare_pct','pf_ig','revshare_pct','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_revshare_basis','pf_ig','revshare_basis','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_hybrid_rules','pf_ig','hybrid_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_ib_terms','pf_ig','ib_terms','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_min_deposit','pf_ig','min_deposit','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_min_trading','pf_ig','min_trading','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_account_verification','pf_ig','account_verification','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_qualification_deadline','pf_ig','qualification_deadline','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_tracking_window','pf_ig','tracking_window','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_payment_frequency','pf_ig','payment_frequency','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_min_payout','pf_ig','min_payout','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_clawback_rules','pf_ig','clawback_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_attribution_rules','pf_ig','attribution_rules','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_permitted_traffic','pf_ig','permitted_traffic','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_country_rates','pf_ig','country_rates','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_contract_start','pf_ig','contract_start','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_contract_end','pf_ig','contract_end','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_terms_confirmed_at','pf_ig','terms_confirmed_at','unverified') ON CONFLICT DO NOTHING;
INSERT INTO partner_term_items (id,firm_id,key,status) VALUES ('pt_ig_agreement_ref','pf_ig','agreement_ref','unverified') ON CONFLICT DO NOTHING;
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
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,open_questions) VALUES ('pc_axi','pf_axi','unknown',true,'Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,open_questions) VALUES ('pc_ig','pf_ig','unknown',true,'Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,open_questions) VALUES ('pc_pepperstone','pf_pepperstone','unknown',true,'Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,open_questions) VALUES ('pc_plus500','pf_plus500','unknown',true,'Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_compliance (id,firm_id,permitted_to_promote,legal_advice_required,open_questions) VALUES ('pc_trading212','pf_trading212','unknown',true,'Is Ten Talents (not FCA-authorised) permitted to communicate this firm''s financial promotions to a UK audience, and under whose approval? Which risk warnings and disclosure wording are required per channel?') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_axi_website','pf_axi','website','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_axi_social','pf_axi','social','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_axi_email','pf_axi','email','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_axi_paid_ads','pf_axi','paid_ads','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_axi_webinar_community','pf_axi','webinar_community','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_ig_website','pf_ig','website','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_ig_social','pf_ig','social','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_ig_email','pf_ig','email','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_ig_paid_ads','pf_ig','paid_ads','not_reviewed') ON CONFLICT DO NOTHING;
INSERT INTO partner_channel_approvals (id,firm_id,channel,status) VALUES ('pch_ig_webinar_community','pf_ig','webinar_community','not_reviewed') ON CONFLICT DO NOTHING;
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
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_axi_1','pf_axi','Review the UK affiliate programme page and record verified facts','Kelvin Williams','high','2026-10-28') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_axi_2','pf_axi','Request the current rate card and qualification rules in writing','Kelvin Williams','high','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_axi_3','pf_axi','Ask which promotional channels can be approved','Kelvin Williams','normal','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_ig_1','pf_ig','Read the IG publisher requirements page and record each requirement','Kelvin Williams','high','2026-10-28') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_ig_2','pf_ig','Audit the website and app against IG''s requirements; list gaps','Kelvin Williams','high','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_ig_3','pf_ig','Write the affiliate commission disclosure for the site','Kelvin Williams','normal','2026-11-11') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_pepperstone_1','pf_pepperstone','Confirm UK affiliate participation in writing','Kelvin Williams','high','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_pepperstone_2','pf_pepperstone','Request current CPA terms and qualification rules','Kelvin Williams','high','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_pepperstone_3','pf_pepperstone','Ask separately about IB terms and requirements','Kelvin Williams','normal','2026-11-11') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_plus500_1','pf_plus500','Review the current official 500Affiliates programme rules','Kelvin Williams','high','2026-10-28') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_plus500_2','pf_plus500','Confirm UK affiliate and UK customer eligibility in writing','Kelvin Williams','high','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_plus500_3','pf_plus500','Request commission terms, qualification rules, traffic sources and compliance requirements','Kelvin Williams','normal','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_trading212_1','pf_trading212','Draft the partnership enquiry (mission, audience, site, content, channels)','Kelvin Williams','high','2026-10-31') ON CONFLICT DO NOTHING;
INSERT INTO partner_tasks (id,firm_id,title,owner,priority,due_at) VALUES ('pk_trading212_2','pf_trading212','Send the enquiry via the official route and log the correspondence','Kelvin Williams','normal','2026-11-04') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_axi','pf_axi','firm','pf_axi','created','','seeded as prospect (2026-10-21)','seed') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_ig','pf_ig','firm','pf_ig','created','','seeded as prospect (2026-10-21)','seed') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_pepperstone','pf_pepperstone','firm','pf_pepperstone','created','','seeded as prospect (2026-10-21)','seed') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_plus500','pf_plus500','firm','pf_plus500','created','','seeded as prospect (2026-10-21)','seed') ON CONFLICT DO NOTHING;
INSERT INTO partner_audit (id,firm_id,entity,entity_id,field,old_value,new_value,actor) VALUES ('pau_trading212','pf_trading212','firm','pf_trading212','created','','seeded as prospect (2026-10-21)','seed') ON CONFLICT DO NOTHING;

-- Done. To verify, run:  SELECT count(*) FROM lessons;  -- expect 17.  SELECT count(*) FROM partner_firms;  -- expect 5

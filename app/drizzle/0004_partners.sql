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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_audit" ADD CONSTRAINT "partner_audit_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_channel_approvals" ADD CONSTRAINT "partner_channel_approvals_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_comms" ADD CONSTRAINT "partner_comms_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_compliance" ADD CONSTRAINT "partner_compliance_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_contacts" ADD CONSTRAINT "partner_contacts_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_ledger" ADD CONSTRAINT "partner_ledger_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_reports" ADD CONSTRAINT "partner_reports_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_research" ADD CONSTRAINT "partner_research_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_tasks" ADD CONSTRAINT "partner_tasks_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_term_items" ADD CONSTRAINT "partner_term_items_firm_id_partner_firms_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."partner_firms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "partner_applications_firm_uq" ON "partner_applications" USING btree ("firm_id");--> statement-breakpoint
CREATE INDEX "partner_audit_firm_idx" ON "partner_audit" USING btree ("firm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_channel_uq" ON "partner_channel_approvals" USING btree ("firm_id","channel");--> statement-breakpoint
CREATE INDEX "partner_comms_firm_idx" ON "partner_comms" USING btree ("firm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_compliance_firm_uq" ON "partner_compliance" USING btree ("firm_id");--> statement-breakpoint
CREATE INDEX "partner_contacts_firm_idx" ON "partner_contacts" USING btree ("firm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_firms_slug_uq" ON "partner_firms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "partner_ledger_firm_idx" ON "partner_ledger" USING btree ("firm_id");--> statement-breakpoint
CREATE INDEX "partner_reports_firm_idx" ON "partner_reports" USING btree ("firm_id");--> statement-breakpoint
CREATE INDEX "partner_research_firm_idx" ON "partner_research" USING btree ("firm_id");--> statement-breakpoint
CREATE INDEX "partner_tasks_firm_idx" ON "partner_tasks" USING btree ("firm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_term_items_uq" ON "partner_term_items" USING btree ("firm_id","key");
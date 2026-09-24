import { pgTable, text, integer, boolean, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";

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

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(), // Stripe event id — idempotency
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

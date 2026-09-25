-- Ten Talents Academy — full database build (schema + seed)
-- Paste this whole file into the Neon SQL editor and press Run.
-- Run once on your new (empty) Neon database. (The content INSERTs are re-runnable;
-- the table creation is not — if you ever need a clean slate, drop the tables first.)
-- Generated 2026-09-25.

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

-- ============ seed content (from the prototype) ============

INSERT INTO tracks (id,name,blurb,position,published) VALUES ('t1','Money Foundations','Income, spending, saving, debt, compounding, inflation. The machinery underneath everything else.',0,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,blurb=EXCLUDED.blurb,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t1-m1','t1','Where money goes','lessons',0,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m1-l1','t1-m1','Income, spending and the gap between them',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m1-l2','t1-m1','Why saving is a rate, not an amount',0,'',false,1,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t1-m2','t1','Debt','lessons',1,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m2-l1','t1-m2','Good debt, bad debt and the honest test',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m2-l2','t1-m2','What interest costs over time',0,'',false,1,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t1-m3','t1','Compounding and inflation','lessons',2,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m3-l1','t1-m3','The arithmetic of patience',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t1-m3-l2','t1-m3','Inflation, the quiet tax',0,'',false,1,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;

INSERT INTO tracks (id,name,blurb,position,published) VALUES ('t2','How Markets Work','What is actually being bought and sold, who the players are, and why prices move.',1,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,blurb=EXCLUDED.blurb,position=EXCLUDED.position;
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

INSERT INTO tracks (id,name,blurb,position,published) VALUES ('t3','Understanding Risk','Why most short-term traders lose, what leverage really does, and how to recognise when you are being sold to.',2,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,blurb=EXCLUDED.blurb,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t3-m1','t3','Leverage and margin','lessons',0,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t3-m1-l1','t3-m1','What leverage really borrows',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t3-m1-l2','t3-m1','Margin, and how it gets called',0,'',false,1,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t3-m2','t3','Position sizing','lessons',1,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t3-m2-l1','t3-m2','Sizing from the stop, not the balance',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;
INSERT INTO modules (id,track_id,name,kind,position,published) VALUES ('t3-m3','t3','Being sold to','lessons',2,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;
INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES ('t3-m3-l1','t3-m3','Reading a promise for what it is',0,'',false,0,true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;

INSERT INTO tracks (id,name,blurb,position,published) VALUES ('t4','Building Something','Entrepreneurship as a talent developed: skills, small bets, first customers, and the fundamentals that compound.',3,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,blurb=EXCLUDED.blurb,position=EXCLUDED.position;
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

-- Done. To verify, run:  SELECT count(*) FROM lessons;  -- expect 17

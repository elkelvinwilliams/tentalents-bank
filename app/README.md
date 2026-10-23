# Ten Talents Academy — production app

The production version of `/academy/index.html` (the prototype is the UI/copy
contract and stays untouched). Next.js + Postgres + Stripe. The static site at
the repo root is unaffected.

## Run it locally

```bash
cd app
npm install
npm run db:setup      # migrate + seed (4 tracks, lessons, quiz, glossary — from the prototype)
ADMIN_PASSWORD=devadmin npm run dev
```

No env vars needed locally: the database is embedded (PGlite in `.pglite/`),
emails print to the console, Stripe endpoints return a friendly "not
configured" error until keys exist.

**PGlite is single-process.** Stop the dev server before running
`npm run db:setup` or any script in `scripts/` — concurrent access corrupts
the local database (delete `.pglite/` and re-run `db:setup` if that happens).
Production uses `DATABASE_URL` (Neon) where this doesn't apply.

## Ten Talents Academy — the app (Sep 2026)

The app *is* the Academy. It begins with the ten assessment questions, shows a readiness profile and a recommended track, then opens the Academy-first Home.

Phone-first shell with five tabs. Learning is gamified; trading never is. LEARN → PRACTISE → REFLECT → IMPROVE → BUILD → STEWARD.

- **Home** — greeting, readiness → Passport, continue learning, financial goal + today's learning goal, **Your next step** (one calm recommendation), recommended track, simulator status, Wisdom for today, XP, Build tiles
- **Learn** — Courses (four tracks, lessons, server-scored quizzes, certificates) · Wisdom (Biblical Mysteries, Biblical Wealth) · **Tools** (10 calculators: inputs → result → *what this means*; demo figures) · **Safety** (9 scam patterns + 5 Spot-the-Scam scenarios, XP once each) · Glossary
- **Practise** — a per-user practice portfolio: £100,000 virtual, live or illustrative prices (`MARKET_DATA_KEY`, Twelve Data; demo feed without it), candlestick charts (lightweight-charts), market/limit/stop orders, stop-loss and take-profit evaluated server-side, positions, pending orders, history, equity curve, reset. Money-at-risk shown before upside on every ticket. Scenario drills (XP once per drill) and the journal (never XP). No real orders exist anywhere.
- **Build** — Goals (typed: emergency fund, first home, business capital, investment portfolio, giving, custom) · **Wealth** overview (assets − liabilities → net worth, snapshot history) · **Health** check (7 areas → "your next priorities", not a grade) · **Journey** (Earn → Manage → Save → Protect → Invest → Build → Give; lessons, tool and scenario per stage) · **Jubilee** debt-freedom planner (snowball/avalanche, payoff date) · **Giving** tracker (percentages only, no XP) · **Talent Ledger**
- **Profile** — Readiness Passport (6 dimensions, evidence, disclaimers) · Weekly money review (ends in a learning priority) · Cohorts (churches/groups — learning progress only, never money) · membership comparison, badges, account, billing, certificates, appearance
- **Ten Talents AI** (floating button) — rules-based tutor, three modes (Learn / Reflect / Understand), permanent "Educational only — not financial advice" indicator; refuses buy/sell/what/how-much/prediction questions. A live model can replace `src/lib/ai.ts#answer` behind the same boundary later.

**Real user data vs demo:** goals, wealth snapshots, health checks, weekly reviews, debts, giving, talents and cohorts are per-user Postgres rows (marked "Your data" in the UI). Tools and the simulator are illustrative and marked DEMO.

XP is awarded only by the server (`src/lib/gamify.ts`, `xp_events` unique on user+kind+ref so nothing pays twice):
lesson complete +40 · module quiz first pass +100 · readiness assessment +60 · goal set +30 · goal update +10 · 25/50/75 % +25 · goal complete +100 · scenario drill +25 · Spot-the-Scam +25 · journey scenario +25 · weekly review +20 (once per ISO week) · first health check +20 · first wealth snapshot +20 · talent added +10. Nothing pays for trades, deposits, profit, leverage or giving.
Badges: First Steps, 7-Day Streak, Quiz Ace, Steward, Risk Aware, Good Judgement, Sage, Scam Spotter, Reflective, Builder.

Tables: migration `0003_practise` (`market_cache`, `sim_accounts`, `sim_orders`, `sim_equity`), migration `0001_steward` (`user_stats`, `xp_events`, `goals`, `journal_entries`) and `0002_build` (`wealth_snapshots`, `health_checks`, `weekly_reviews`, `debts`, `giving_entries`, `talents`, `cohorts`, `cohort_members`). Existing Neon databases:
run `ten-talents-academy-neon-upgrade.sql` (repo root) once — it contains both. Fresh databases: `ten-talents-academy-neon-setup.sql` includes everything.

## Deploy (Vercel)

1. Vercel project → root directory `app/`. Add env vars from `.env.example`
   (DATABASE_URL from Neon, ADMIN_PASSWORD, APP_URL, Stripe keys, Resend,
   Blob token). Only DATABASE_URL and ADMIN_PASSWORD are needed for a first deploy.
2. Migrations and content seed run automatically during the Vercel build
   (`vercel-build` → `scripts/vercel-build.mjs`) whenever DATABASE_URL is set.
   Manual alternative: `DATABASE_URL=... npm run db:setup`, or run
   `ten-talents-academy-neon-setup.sql` in the Neon SQL editor.
3. Stripe. Fastest route: a **Payment Link** for the £15.99/month membership →
   `STRIPE_PAYMENT_LINK`, plus `STRIPE_SECRET_KEY` and the webhook below
   (`STRIPE_WEBHOOK_SECRET`). Set the link's after-payment redirect to
   `https://<app>/?checkout=success`. The webhook maps the purchase to the signed-in
   user via `client_reference_id`. Full route (test mode first):
   - Product **Academy Membership**, recurring price **£15.99/month GBP** → `STRIPE_PRICE_MEMBERSHIP`
   - Product **Signals Access**, recurring price **£4.99/month GBP** → `STRIPE_PRICE_SIGNALS`
   - Webhook endpoint `https://<app>/api/stripe/webhook` with events:
     `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`,
     `invoice.paid`, `invoice.payment_failed` → `STRIPE_WEBHOOK_SECRET`
   - Billing Portal: enable card update + cancel at period end.

## Guarantees carried over from the spec

- Webhooks are the sole writer of entitlement state; the client only reads.
- Paywall, quiz answers and the signals page are enforced server-side.
- Failed payment → `past_due` grace banner → lock on Stripe giving up.
  Progress rows are never deleted by billing state.
- The Signals product is feature-flagged (`SIGNALS_ENABLED=false` by default)
  and stays dark until the legal sign-off is filed in the ops repo.
- `modules.kind` reserves the simulator: adding it later is additive.
- Admin at `/admin` (password: `ADMIN_PASSWORD`): tracks/modules/lessons
  create/edit/reorder/publish, TipTap editor with image upload + video embed,
  quiz builder, glossary, member list. Lesson HTML is sanitised server-side.

## Affiliate partnerships (internal admin module, Oct 2026)

Internal operations tool at `/admin/partners` (same `ADMIN_PASSWORD` gate as the
rest of admin; every page and API route checks `isAdmin()` server-side and
returns a redirect / `401` otherwise). Nothing in it is customer-facing and it
never moves money. It tracks five **prospective** broker affiliate programmes:
Axi, IG, Pepperstone, Plus500 / 500Affiliates and Trading 212.

- **Three independent status axes** per firm, stored as separate columns and
  validated as separate enums: application status, commercial-terms status,
  compliance status. An approved application never implies confirmed terms or
  compliance approval. Labels are deliberately neutral (no traffic-light colours).
- **Firm workspace** tabs: Overview · Research & eligibility (each claim has a
  source URL + `assumption` / `verified` / `open_question` state) · Application
  (checklist, document *references* only, submission date/reference/outcome,
  contacts) · Commercial terms (21 fixed term keys, each with its own value,
  source, status and verified-on date; `confirmed` requires a source) ·
  Compliance (permitted-to-promote, contracting entity, restrictions, risk
  warnings, disclosure wording, legal-review flag, and one approval record per
  channel: website / social / email / paid ads / webinar-community; `Approved
  for Specified Use` requires a content reference) · Communications & tasks ·
  Performance & payments · Audit trail.
- **Performance & payments is locked** unless `applicationStatus = approved`
  (API returns `409`). Figures are manual aggregates with a mandatory source
  note; the commission ledger is append-only (pence-exact) and shows pending,
  approved, reversed and paid separately. No live tracking is implied.
- **Audit trail**: status, commercial-value, compliance and ledger changes are
  written to `partner_audit` with before/after values and the actor.
- **Rules enforced server-side** (`src/app/api/admin/partners/[id]/route.ts`):
  enum whitelists → `400`; child rows must belong to the firm → `404`;
  firm `termsStatus = confirmed` needs ≥1 confirmed term → `409`; comm entries
  bump `lastContactAt`; firms cannot be created/deleted through the API.
- **Data**: migration `drizzle/0004_partners.sql` adds `partner_firms`,
  `partner_research`, `partner_contacts`, `partner_applications`,
  `partner_term_items`, `partner_compliance`, `partner_channel_approvals`,
  `partner_comms`, `partner_tasks`, `partner_reports`, `partner_ledger`,
  `partner_audit`. `db:setup` (and therefore every Vercel build) applies it and
  seeds the five firms **insert-if-missing** — dashboard edits are never
  overwritten. The Neon SQL files at the repo root carry the same seed.
- **Seed is provisional**: statuses Researching / Unverified / Not Reviewed,
  research claims marked `assumption` dated 2026-10-21 (official pages were not
  re-checked from the build environment), no submissions, no terms, no approvals.
- **Logos** (optional): set `LOGO_DEV_KEY` (a Logo.dev *publishable* key) in
  Vercel and each tile shows the firm's logo derived from its official domain;
  a saved Logo URL on a firm always wins; without the key, initials are shown.
  Logo.dev's free tier requires the "Logos provided by Logo.dev" credit, which
  the admin page prints when the key is set.
- **Boundaries**: no broker integrations, scraping or portal automation; no
  secrets in the repo (logo/programme URLs are public); document fields hold
  references to secure locations, never the documents; the actor is the shared
  admin session (per-user roles are a follow-up).

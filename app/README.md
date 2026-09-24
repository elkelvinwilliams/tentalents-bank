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
- **Practise** — demo simulator (device-local, illustrative prices), scenario drills (server-scored, XP once per drill), trading journal (per user; never earns XP)
- **Build** — Goals (typed: emergency fund, first home, business capital, investment portfolio, giving, custom) · **Wealth** overview (assets − liabilities → net worth, snapshot history) · **Health** check (7 areas → "your next priorities", not a grade) · **Journey** (Earn → Manage → Save → Protect → Invest → Build → Give; lessons, tool and scenario per stage) · **Jubilee** debt-freedom planner (snowball/avalanche, payoff date) · **Giving** tracker (percentages only, no XP) · **Talent Ledger**
- **Profile** — Readiness Passport (6 dimensions, evidence, disclaimers) · Weekly money review (ends in a learning priority) · Cohorts (churches/groups — learning progress only, never money) · membership comparison, badges, account, billing, certificates, appearance
- **Ten Talents AI** (floating button) — rules-based tutor, three modes (Learn / Reflect / Understand), permanent "Educational only — not financial advice" indicator; refuses buy/sell/what/how-much/prediction questions. A live model can replace `src/lib/ai.ts#answer` behind the same boundary later.

**Real user data vs demo:** goals, wealth snapshots, health checks, weekly reviews, debts, giving, talents and cohorts are per-user Postgres rows (marked "Your data" in the UI). Tools and the simulator are illustrative and marked DEMO.

XP is awarded only by the server (`src/lib/gamify.ts`, `xp_events` unique on user+kind+ref so nothing pays twice):
lesson complete +40 · module quiz first pass +100 · readiness assessment +60 · goal set +30 · goal update +10 · 25/50/75 % +25 · goal complete +100 · scenario drill +25 · Spot-the-Scam +25 · journey scenario +25 · weekly review +20 (once per ISO week) · first health check +20 · first wealth snapshot +20 · talent added +10. Nothing pays for trades, deposits, profit, leverage or giving.
Badges: First Steps, 7-Day Streak, Quiz Ace, Steward, Risk Aware, Good Judgement, Sage, Scam Spotter, Reflective, Builder.

Tables: migration `0001_steward` (`user_stats`, `xp_events`, `goals`, `journal_entries`) and `0002_build` (`wealth_snapshots`, `health_checks`, `weekly_reviews`, `debts`, `giving_entries`, `talents`, `cohorts`, `cohort_members`). Existing Neon databases:
run `ten-talents-academy-neon-upgrade.sql` (repo root) once — it contains both. Fresh databases: `ten-talents-academy-neon-setup.sql` includes everything.

## Deploy (Vercel)

1. Vercel project → root directory `app/`. Add env vars from `.env.example`
   (DATABASE_URL from Neon, ADMIN_PASSWORD, APP_URL, Stripe keys, Resend,
   Blob token).
2. Run migrations/seed once against Neon:
   `DATABASE_URL=... npm run db:setup`
3. Stripe (test mode first):
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

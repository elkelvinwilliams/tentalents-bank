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

## The app (Sep 2026) — one product with the vision prototype

Phone-first shell with five tabs. Learning is gamified; trading never is.

- **Home** — greeting, learning streak, level/XP card with daily goal, continue learning, top goal
- **Learn** — Courses (four tracks, lessons, server-scored quizzes, certificates) · Wisdom (Biblical Mysteries, Biblical Wealth) · Glossary
- **Trade** — demo simulator (device-local, illustrative prices), scenario drills (server-scored, XP once per drill), trading journal (per user; never earns XP)
- **Steward** — user-entered savings goals with progress, monthly-needed hint, quick top-ups; milestones pay XP; a planning tool that holds no money
- **Profile** — level, streak, badges, account, billing, certificates, appearance

XP is awarded only by the server (`src/lib/gamify.ts`, `xp_events` unique on user+kind+ref so nothing pays twice):
lesson complete +40 · module quiz first pass +100 · readiness assessment +60 · goal set +30 · goal update +10 · 25/50/75 % +25 · goal complete +100 · scenario drill +25.
Badges: First Steps, 7-Day Streak, Quiz Ace, Steward, Risk Aware, Good Judgement, Sage.

New tables (migration `0001_steward`): `user_stats`, `xp_events`, `goals`, `journal_entries`. Existing Neon databases:
run `ten-talents-academy-neon-upgrade.sql` (repo root) once. Fresh databases: `ten-talents-academy-neon-setup.sql` includes everything.

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

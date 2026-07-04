# The Ten Talents Bank — Website

A multi-page marketing site for a fictional private investment bank.
Dark, gold-accented luxury aesthetic with elegant, performant animations.

## Open it

No build step, no dependencies. Just open `index.html` in any browser.
(For Google Fonts and the demo imagery to load, an internet connection is
needed; everything else works fully offline.)

```
open index.html        # macOS
```

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home — hero, parable, solutions, approach, stats, insights, testimonial, CTA |
| `solutions.html` | The six service lines and who they're for |
| `about.html` | Brand story (Parable of the Talents), principles, leadership |
| `insights.html` | Article grid + featured piece + newsletter sign-up |
| `contact.html` | Enquiry form + office details |
| `portal.html` | Client-login teaser + illustrative dashboard preview |

## Brand voice & assets

- **Taglines** — *"The bank for the future"* (hero) · *"Investment made easy"* (eyebrow/sub-line)
- **Tone** — warm, human, accessible: wealth-building for everyday people, families and founders (premium look, friendly voice)
- **Logo** — your **real artwork** is used site-wide (your supplied files, background color-keyed to transparent):
  - `assets/img/logo-hand-gold.png` — your **hand-and-coin (£€$)** primary mark, recoloured to brand gold → used in every **header/footer** and as the **favicon**
  - `assets/img/logo-ttb-real.png` — your **TTB coin-stack** mark (transparent), alternate
  - `assets/img/logo-ttb-full.png` — full TTB lockup incl. "TTB" wordmark (transparent)
  - Source: `(THE) TEN TALENTS BANK.PNG` (cream original) + `TTB.docx`. SVG files are earlier recreations kept only as fallbacks.
  - The original cream hand-logo uses dark slate line art; for the dark site it's recoloured to gold. For a light section, use the original PNG as-is.

## Structure

```
tentalents-bank/
├── index.html  solutions.html  about.html  insights.html  contact.html
└── assets/
    ├── css/styles.css   # full design system (tokens, components, responsive)
    └── js/main.js       # nav, scroll reveal, counters, parallax, forms
```

## Design system

- **Palette** — `#011936` navy · `#2E2E3A` charcoal · `#4C5B61` slate · `#EFEBCE` ivory · `#EDB671` gold
- **Type** — Playfair Display (headlines) · Inter (body)
- **Tagline** — *Investment made easy*
- **Founding principle** — the Parable of the Talents

## Animations (all GPU-friendly + accessible)

- Scroll-reveal via `IntersectionObserver` (transform/opacity only)
- Animated stat counters
- Pointer parallax on hero orbs (fine-pointer devices only)
- Sticky header transition + scroll progress bar
- **Respects `prefers-reduced-motion`** — all motion disables for users who opt out

## Testing

```
npm install
npm test         # unit tests (Vitest + jsdom) for assets/js/main.js
npm run test:e2e # e2e tests (Playwright) for the contact form
```

## Notes for going live

- Replace Unsplash demo images with licensed brand photography (use `srcset`/WebP).
- Wire the two forms (`data-demo`) to a real backend or service (Formspree, etc.).
- Swap the placeholder SVG mark for the final logo asset.
- Update phone/email/addresses and the regulatory/legal footer text.
- Add a real favicon set and Open Graph/social share images.

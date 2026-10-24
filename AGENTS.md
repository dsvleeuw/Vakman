# AGENTS.md — instructions for the next agent

Read this before changing anything. It captures the project rules,
workflow and gotchas so work stays consistent across sessions.

## What this product is

Klusbaas generates demo marketing websites for Dutch tradespeople
(6 trades × 5 styles = 30 presets). It is a React 19 + TypeScript +
Vite + Tailwind v4 single-page app with **no application backend**:
forms submit through WhatsApp/tel deep links, and the only API
integration is optional Google Calendar/Drive sync via Firebase Auth.
Full context: [docs/architecture.md](./docs/architecture.md).

## Branch and GitHub rules

- Work only on the session branch (`arena/...`). Never create, switch to
  or push another branch.
- Commit in small, focused chunks using Conventional Commits
  (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- Push to the session branch and open/update one PR against `main`.
- Only merge when the user explicitly asks. When you do, use
  `gh pr merge <number> --merge` as the **last** command of the chain,
  with no pipes or redirects, and never pass `--auto`. Do not delete the
  session branch unless asked.
- Never request credentials or tokens; GitHub auth is preconfigured. If
  `git`/`gh` fails with an auth error, tell the user to reconnect GitHub.

## Environment and commands

Use **Bun** (committed `bun.lock`). `npm install` fails on an
esbuild/Vite peer conflict.

```bash
bun install
bun run dev      # dev server on port 3000, bound to 0.0.0.0
bun run lint     # tsc --noEmit — must stay clean
bun test         # node:test unit tests under src/**/*.test.ts
bun run build    # vite build + prerender 36 routes + sitemap/robots
bun run build:spa  # vite build only (no prerender), for debugging
```

All three (`lint`, `test`, `build`) must be green before you finish a
change. The Netlify deploy preview is the only external CI check.

## Code conventions

- **All user-facing copy is Dutch.** Use Dutch euro formatting
  (`€ 1.250`, comma decimals) and state "exclusief btw" on platform
  prices. Keep code identifiers English.
- Keep logic **pure and in `src/utils/`**, with unit tests next to it
  (`*.test.ts`). Components compose results; they do not re-implement
  pricing or message formatting.
- Preset components must read colors, fonts and radii from the
  `ActiveSiteData` palette tokens (`site.accent`, `site.card`,
  `site.radiusLg`, …) so they work in all five styles. Home/marketing
  components use the fixed stone/amber theme.
- Contact actions go through `utils/contact.ts` helpers
  (`buildWhatsAppUrl`, `buildTelUrl`, the message builders) — never hand-
  roll a `wa.me` string. Phone conversion (`06…` → `31…`) is tested there.
- Icons come from `lucide-react`; verify an export exists before using it.
- Tailwind v4 accepts arbitrary numeric spacing such as `h-13`; do not
  add config for it. Shared keyframes live in `src/index.css`.
- Do not commit secrets. The Firebase web key in
  `firebase-applet-config.json` is public by design; real secrets belong
  in environment variables (see `.env.example`).

## Common tasks (full how-tos in `docs/`)

- Add a trade: [docs/adding-a-sector.md](./docs/adding-a-sector.md)
- Add a smart tool: [docs/adding-a-trade-tool.md](./docs/adding-a-trade-tool.md)
- Understand contact flows: [docs/contact-strategy.md](./docs/contact-strategy.md)
- Change prices: [docs/pricing-and-positioning.md](./docs/pricing-and-positioning.md)
  (platform packages live in `src/data/plans.ts`)
- Check current gaps before planning: [docs/known-limitations.md](./docs/known-limitations.md)
- Read the UX/navigation review and open recommendations:
  [docs/ux-review.md](./docs/ux-review.md)
- Longer-term priorities: [ROADMAP.md](./ROADMAP.md)

## Gotchas

- Every view has a real route: `/`, `/voorbeeld/:sector/:stijl`,
  `/start/:stap` (`vak`, `stijl`, `gegevens`, `diensten`, `afspraak`,
  `klaar`), `/componenten/:id`. Route rules live in `src/utils/router.ts`;
  change them there (with tests) rather than branching on state in
  `App.tsx`.
- The pre-router links `?sector=loodgieter&style=2&view=site` and
  `?autostart=1` still work: `routeFromLegacyQuery` rewrites them to the
  new paths. Keep that mapping when you add routes so old links survive.
- Wizard routes carry `?vak=`, `?stijl=` and `?pakket=`; use `RouteLink` for
  internal navigation so hrefs stay real (middle-click, new tab, SEO).
- Phone validation goes through `normalizeDutchPhone()` in
  `utils/contact.ts` (accepts `06…`, `+31 6…`, `0031 (0)6…`); never add a new
  `^0\d{9}$` regex in a component.
- `SiteView`, `WizardView` and `ComponentGallery` are lazy-loaded per route;
  keep new heavy screens behind `lazy()` so the marketing page stays small.
- `npm run build` prerenders every route in `scripts/prerender.ts` and the
  client hydrates it. Anything that reads `window`, `matchMedia` or
  randomness during the first render will break hydration — start from a
  stable fallback and correct it in an effect (`useMediaQuery` is the model).
- Measure conversions with `track()` from `utils/analytics.ts` instead of
  console logs or ad-hoc globals.
- Palette colours must keep their contrast guarantees: change colours in
  `computePalette`/`sector` data and let `withAccessibleContrast` (plus
  `data/paletteContrast.test.ts`) validate them. Never hard-code `#fff` text
  on an accent; use `site.onAccent`.
- The mobile sticky contact bar overlays the bottom of `SiteView`; the
  page root carries `pb-20 sm:pb-0` — preserve that spacing when adding
  full-width sections.
- When smoke-rendering with `renderToStaticMarkup`, assert against
  entity-decoded markup (`&` renders as `&amp;`). Delete any temporary
  render script before committing.
- Every form posts to `POST /api/lead` (Netlify Function `netlify/functions/lead.mts`,
  same handler as the Vite dev middleware in `vite.config.ts`). Validation lives
  in `utils/lead.ts`, quote maths in `utils/quote.ts` (cents, 21 % btw), mails in
  `utils/leadEmail.ts`, PDF/storage/Resend in `src/server/`. Use `useLeadForm()`
  plus `HoneypotField`/`LeadErrorNotice` for new forms; never post elsewhere.
- The wizard channel (WhatsApp / E-mail / Allebei) decides quote delivery via
  `quoteDelivery()`: e-mail sends the PDF to the customer, WhatsApp puts a
  ready wa.me link in the team mail. Klusbaas always gets the mail + PDF.
- Without `RESEND_API_KEY` the API runs in preview mode (mail printed to the
  log). In dev, quotes/leads land in `.data/` (gitignored); in production in
  Netlify Blobs (stores `quotes` and `leads`). Never commit an API key.
- Unsplash ids in each sector's `pool` are rotated by
  `getPhotoSet(sector, styleIndex)`; reuse pool ids rather than adding
  external image hosts.

## Definition of done for any change

1. `bun run lint`, `bun test` and `bun run build` all pass.
2. New pure logic has tests; user-facing strings are Dutch.
3. `CHANGELOG.md` updated under `Unreleased` (or a new dated section at
   release time).
4. Docs touched when behaviour or workflows change; roadmap updated if
   you close or add a gap.
5. Commit history is reviewable (one concern per commit) and the PR
   description explains what changed, why, and how it was verified.

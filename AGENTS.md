# AGENTS.md — instructions for the next agent

Read this before changing anything. It captures the project rules,
workflow and gotchas so work stays consistent across sessions.

## What this product is

Klusbaas generates demo marketing websites for Dutch tradespeople
(7 trades × 5 styles = 35 presets). It is a React 19 + TypeScript +
Vite + Tailwind v4 single-page app with a small server side: Netlify
Functions for leads, quotes, published customer sites and customer
accounts (see [docs/architecture.md](./docs/architecture.md)). The forms
submit through the lead API (with WhatsApp/tel deep links as the fast
path) and Google Calendar/Drive sync via Firebase Auth is optional.

## Branch and GitHub rules

- Work only on the session branch (`arena/...`). Never create, switch to
  or push another branch.
- Commit in small, focused chunks using Conventional Commits
  (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- Push to the session branch and open/update one PR against `main`.
- **You may merge without asking** once the PR is ready: `bun run check`
  is green on the branch, the PR is `MERGEABLE`/`CLEAN` against `main`
  and no GitHub/Netlify check has failed. Read the diff before merging
  someone else's PR. Use `gh pr merge <number> --merge` as the **last**
  command of the chain, with no pipes or redirects, and never pass
  `--auto`. Do not delete the session branch unless asked.
- A PR that conflicts or is stacked on another PR: merge the base PR
  first, rebase the branch onto the new `main` (`git rebase --onto`),
  re-run `bun run check`, retarget it to `main`, then merge.
- Still ask first for anything outside this repo's PRs (force-pushing
  `main`, deleting branches, publishing data such as lead lists).
- Never request credentials or tokens; GitHub auth is preconfigured. If
  `git`/`gh` fails with an auth error, tell the user to reconnect GitHub.

## Environment and commands

Use **Bun** (committed `bun.lock`). `npm install` fails on an
esbuild/Vite peer conflict.

```bash
bun install
bun run dev      # dev server on port 3000, bound to 0.0.0.0
bun run check    # lint + test + build in parallel (~20 s) — use this
bun run lint     # tsc --noEmit — must stay clean
bun run test     # bun test src (unit tests under src/**/*.test.ts)
bun run build    # vite build + prerender routes + sitemap/robots
bun run build:spa  # vite build only (no prerender), for debugging
```

All three (`lint`, `test`, `build`) must be green before you finish a
change; `bun run check` runs them at the same time and prints each
result. The Netlify deploy preview is the only external CI check. If
`bun` is missing, install it with `npm i -g bun`.

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
- Example agent brief with "done when" criteria (mobile/iOS work, shipped
  in PR #6): [docs/mobile-ux-plan.md](./docs/mobile-ux-plan.md)
- Longer-term priorities: [ROADMAP.md](./ROADMAP.md)

## Gotchas

- Every view has a real route: `/`, `/voorbeeld/:sector/:stijl`,
  `/start/:stap` (`vak`, `stijl`, `gegevens`, `diensten`, `afspraak`,
  `klaar`), `/componenten/:id`, `/mijn-site` (the editor), `/site/:slug`
  (a published customer site) and `/mijn-account` (login and the sites of
  the customer). Route rules live in `src/utils/router.ts`;
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
- A published customer site (`/site/<slug>`) shows only what the craftsman
  wrote or confirmed (`utils/publishedContent.ts`). The trade preset is demo
  material: its reviews, rating, Google badge, photos, prices, marks and FAQ
  never end up on his page. When you add content, check it against the
  preset: example text stays in the editor, not on the site (principle 2).
- Photos of the customer go to `POST /api/media` and live in the Blobs store
  `media`; they are served from `GET /api/media?key=…`. The browser scales
  the photo down first (`utils/mediaClient.ts`). Only jpg, png and webp of
  at most 1,5 MB are accepted, and only photo addresses from our own
  server survive in the content (`sanitizePhoto`). The upload has a limit
  of 30 photos per hour per IP (`mediaHandler.ts`); the excess gets a 429.
- The payment details travel with the offer: `GET /api/quote` returns them
  and `renderQuotePdf` writes them into the PDF, so a customer without an
  account can pay too. They come from the environment (`PAYMENT_IBAN`,
  `PAYMENT_NAME`, `PAYMENT_EMAIL`); without an IBAN there are none.
- An offer can also go to someone who only sent a request: the request
  (`leadReference`) is a customer in the form. A request on a published
  customer site belongs to that craftsman and is not Klusbaas' customer.
- The customer accepts the offer himself on the offer page or in his
  account (`POST /api/quote/accept` → `server/acceptQuote.ts`). The token
  from the offer link proves it is his offer; the offer gets the status
  `accepted` and Klusbaas gets a mail. The customer himself gets a
  confirmation mail (`buildAcceptConfirmationEmail`) with the amount and the
  IBAN, because the banner in the browser disappears when he closes the
  window. Accepting is not paying: the money is still transferred by the
  customer and marked as paid by hand.
- Klusbaas follows up on an open offer himself: `remind-quote` in
  `server/remindQuote.ts` sends the customer a mail with the link to the
  offer. An accepted offer that is not paid is chased with `remind-payment`
  in `server/payReminder.ts`: the customer gets the amount and the IBAN
  again. Both are by hand; nothing goes out on its own.
- An offer is valid for thirty days (`isQuoteExpired`). An expired offer is
  marked as such in the overview and on the offer page, cannot be
  accepted, and Klusbaas can extend it with `extend-quote`.
- An offer remembers the request it was written for (`leadReference` on
  the quote record), so the overview can show at a request which offer
  exists.
- The customer can report that he transferred the money
  (`POST /api/quote/payment` → `server/reportPayment.ts`). That sets
  `paymentReportedAt` on the offer and mails Klusbaas; only Klusbaas marks
  an offer as paid, after checking his own bank statement.
- Marking an offer as paid sends the customer an invoice
  (`server/paidNotice.ts` → `server/invoicePdf.ts`). The invoice details of
  Klusbaas come from the environment (`server/invoice.ts`); nothing is
  invented. A failing mail does not undo the payment.
- Klusbaas writes an offer himself in `/klusbaas` (`AdminQuoteForm.tsx` →
  `POST /api/admin` with `action: 'create-quote'` → `server/adminOffer.ts`).
  The offer is a real offer with a number, a PDF and a price, it is linked
  to the customer's account (so he sees it in `/mijn-account`) and it is
  mailed with the PDF attached. An offer for a customer who only made an
  account is the order and the invoice; there is no separate order step.
- The marketing pages are promises: the FAQ, "hoe het werkt" and the
  homepage may only say what the code really does. An own `.nl` domain is
  registered per order, the offers of a craftsman live in his own account
  (not in his Google Drive), and the photos and prices on a customer site
  are his own. `src/components/claims.test.tsx` keeps the old promises out;
  the copy of the pages lives in `src/data/marketing.ts` so a test can read
  it.
- The monthly service is a real order (phase 7.15). The customer switches
  it on in his own account (`POST /api/account` with `action:
  'service-request'`) and stops it himself (`'service-cancel'`); the state
  lives on the account (`Account.service`). Klusbaas sees it in `/klusbaas`
  (`action: 'service-activate'`, `'service-stop'`, `'service-invoice'` →
  `server/adminService.ts`) and sends the monthly invoice with the amount,
  the IBAN and the reference `SERVICE-<slug>`. The price comes from
  `data/plans.ts` (`SERVICE_PRICE`), never from the server, so the pricing
  page, the account, the mail and the invoice cannot drift apart. The
  invoice is sent by hand every month; nothing goes out on its own.
- The customer asks for an offer himself, in his own site editor
  (`POST /api/quote/request` → `server/quoteRequest.ts`, tab "Offerte" in
  `components/editor/OfferteTab.tsx`). He picks the package and the extra
  components himself and sees the price right away; the prices come from
  `data/plans.ts` and `data/addons.ts`, never from the server. The request
  is stored first (so it can never disappear silently) and the offer it
  produces remembers it (`leadReference`), stands in the customer's account
  and is mailed with the PDF. Only a logged-in customer can ask: an offer
  without an account would float.
- The price calculator and the postcode check are tools with numbers, so
  they only go on a published page when the craftsman filled them in:
  `content.services` (his own services with a price, `utils/services.ts`) and
  `content.workArea` (his own postcodes, `utils/postcodes.ts`). Without them
  the blocks stay off the page instead of showing the prices or the area of
  the trade example. The editor's checklist says what is missing.
- Every promise on the pricing page (`data/plans.ts`) is built or removed.
  Do not add a feature line that the code does not deliver; there is a test
  that keeps the old, unbuilt promises out (`data/plans.test.ts`).
- A lead from a published customer site (`/site/<slug>`) belongs to that
  craftsman: it is mailed to the e-mail address he entered, not to Klusbaas.
  The recipient always comes from the stored site, never from the request,
  and the page says the same thing as what happens (`utils/leadCopy.ts`). A
  demo site (and the editor's preview) sends its leads to Klusbaas — say so
  on the page.
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
- The Klusbaas overview (`/klusbaas`, `src/server/adminHandler.ts`) is
  behind `ADMIN_PASSWORD`. There is no default password: without the
  variable the overview is closed. The session is a cookie
  (`klusbaas_admin`, `HttpOnly`, `SameSite=Lax`). Never print the password,
  a session id or a management token in a log line.
- A quote is also the order: it has a status (`open`, `paid`, `cancelled`),
  an `accountId` when the customer was logged in, and lives in the customer's
  account (`POST /api/account` action `quotes`). The customer pays by bank
  transfer to `PAYMENT_IBAN` with the quote number as the description; there
  is no payment provider. The payment details come from the environment
  (`src/server/payment.ts`), never from the request.
- A published site has its own privacy statement (`/site/<slug>/privacy`),
  built in `src/utils/sitePrivacy.ts` from what the craftsman filled in. On
  a customer site the craftsman is the party responsible for the data; the
  link under the form points to that statement, not to Klusbaas' one. Never
  put a KvK number or an address in it that the craftsman did not fill in.
- After the first publish the customer gets a welcome mail (his address,
  what happens with a request and the points of his checklist). It is built
  in `src/utils/accountMail.ts` and sent by `src/server/accountMailer.ts`;
  publishing never depends on it.
- A customer can reset his password himself: `POST /api/account` with the
  actions `reset-request`, `reset`, `verify` and `verify-request`. The reset
  answer is the same for an unknown address, the link works for an hour and
  only once, and the token is compared in constant time. The mails are built
  in `src/utils/accountMail.ts` and sent by `src/server/accountMailer.ts`.
- Customer accounts live on the server: the password is hashed with scrypt
  (`src/utils/password.ts`, `node:crypto`, no dependency) and the session
  id travels in the cookie `klusbaas_session` (`HttpOnly`, `SameSite=Lax`).
  Never put a password, a session id or a management token in
  `localStorage`, in the URL of a public page or in a log line. The token
  of a published site never changes; a token in the request is only a key
  to the door.
- Unsplash ids in each sector's `pool` are rotated by
  `getPhotoSet(sector, styleIndex)`; reuse pool ids rather than adding
  external image hosts.

## Definition of done for any change

1. `bun run check` passes (lint, test and build).
2. New pure logic has tests; user-facing strings are Dutch.
3. `CHANGELOG.md` updated under `Unreleased` (or a new dated section at
   release time).
4. Docs touched when behaviour or workflows change; roadmap updated if
   you close or add a gap.
5. Commit history is reviewable (one concern per commit) and the PR
   description explains what changed, why, and how it was verified.

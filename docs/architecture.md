# Architecture

## High-level overview

Klusbaas is a single-page React application that generates marketing
websites for Dutch tradespeople. Views are driven by a small, dependency-free
client router (`src/utils/router.ts` + `src/hooks/useRouter.ts`) on top of the
History API: **the URL is the source of truth**, so every page, preset and
wizard step can be reloaded, bookmarked, shared and reached with the browser
back/forward buttons.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` (+ `?vak=`) | `App` inline + `Header`, `HeroStrip`, `PresetsSection`, `HowItWorks`, `PricingSection`, `FaqSection` | Klusbaas' own marketing page with the 35 presets and platform pricing |
| `/voorbeeld/:sector/:stijl` | `SiteView` | The generated craftsman website (the product demo) |
| `/start/vak` … `/start/afspraak` | `WizardView` | Five-step onboarding; every step has its own URL |
| `/start/klaar` | `WizardView` | Confirmation screen after requesting an appointment |
| `/mijn-site` (+ `/:slug?token=…`) | `SiteEditor` | The editor where the customer fills in his own site: details, copy and blocks, with a live preview |
| `/mijn-account` | `AccountView` | The customer's own account: his sites, his requests, his offers and his service |
| `/site/:slug` (+ `/privacy`) | `PublishedSiteView` | A site the customer published: rendered on the server, so search engines and link previews see it, with the craftsman's own privacy statement |
| `/offerte/:id?token=…` | `QuoteView` | The offer: the price, the delivery checklist, the way to pay and the acceptance |
| `/klusbaas` | `AdminView` | Klusbaas' own overview: the requests, the offers, the sites and the accounts, behind a password |
| `/kaart` | `ProspectMapView` | The work map with the prospects Klusbaas can approach |
| `/componenten` (+ `/:id`) | `ComponentGallery` | Searchable live catalogue of every component module and ten reusable additions |
| anything else | `NotFoundView` | Branded 404 with links back into the product |

Route shapes, aliases and legacy redirects live in `src/utils/router.ts`:

- `parseRoute(pathname, search)` → typed `Route` union; unknown paths become
  `notFound`, never a blank screen.
- `buildPath(route)` → the canonical URL (also used for `<a href>`).
- `getRouteMeta(route)` → per-page `<title>` and meta description
  (`useRouteMeta`).
- `routeFromLegacyQuery(search)` upgrades the pre-router links
  `?view=site&sector=…&style=2`, `?autostart=1`, `?view=components` and
  `?sector=…` to the new paths with `history.replaceState`.

Wizard URLs carry the selected trade and style as `?vak=loodgieter&stijl=modern`
so a half-finished wizard can be reopened. The wizard keeps its draft in
sessionStorage (`klusbaas_wizard_draft`) and `App` owns the per-sector saved
sites (`klusbaas_custom_sites`, localStorage), so navigating to the preview and
back does not throw away input.

Navigation uses `RouteLink`, which renders a real `<a href>` and intercepts
plain left clicks only — middle-click, ⌘/ctrl-click, "open in new tab" and
copy-link keep working. `navigate()` also scrolls to the top on every route
change (`history.scrollRestoration = 'manual'`) and scrolls to a `#hash`
target when one is given.

`public/_redirects` makes Netlify serve `index.html` for every path so deep
links work in production too; the Vite dev server does this by default.

## Build, prerendering and hydration

`npm run build` = `vite build` + `node --import tsx scripts/prerender.ts`.

1. Vite emits the client bundle and an `index.html` shell.
2. `scripts/prerender.ts` imports `src/entry-server.tsx`, which renders the
   real app for every indexable route (home + 35 presets) with
   `renderToPipeableStream` and waits for `onAllReady()` so the lazy route
   chunks are included.
3. Each route gets its own `dist/**/index.html` with the rendered markup in
   `#root` plus per-route `<title>`, description, canonical and Open
   Graph/Twitter tags (`getRouteMeta`), and the route name in
   `data-route` for the client.
4. It also writes `sitemap.xml` and `robots.txt` (wizard routes disallowed).
   `PRERENDER_SITE_URL` sets the canonical origin (default
   `https://klusbaas.nl`).

On the client, `src/main.tsx` checks whether `#root` already has markup: if
so it preloads the matching lazy chunk and calls `hydrateRoot`, otherwise it
`createRoot`s as usual. `useMediaQuery` starts from its fallback value so the
first client render matches the server markup.

`npm run build:spa` skips the prerender step (useful when debugging the plain
SPA fallback).

## Analytics

`utils/analytics.ts` exposes `track(event, props)`. It pushes to
`window.dataLayer` (GTM) and calls `window.gtag` (GA4) when either exists and
is a silent no-op otherwise — no vendor, no cookies, nothing to configure for
the prototype. Events: `page_view`, `wizard_step_view`,
`wizard_step_complete`, `wizard_validation_error`, `preset_open`,
`plan_select`, `whatsapp_click`, `phone_click`, `appointment_requested`,
`component_view`. To collect them, add a tag manager snippet to `index.html`;
the payloads are already GA4-shaped.

## Accessibility contract

`utils/color.ts` converts OKLCH ⇄ sRGB, computes WCAG contrast and can nudge a
colour's lightness until it passes. `withAccessibleContrast()` in
`data/tradesData.ts` wraps every `computePalette` result so `fg`, `muted`,
`accentText`, `invFg`, `invMuted` reach 4.5:1 on their surfaces and `onAccent`
/ `onHi` stay readable on filled surfaces. `data/paletteContrast.test.ts`
checks all 7 trades × 5 styles, so a new hue or accent cannot silently break
readability.

## Data model

All content is TypeScript data, there is no CMS or database.

- `src/data/tradesData.ts`
  - `ORDER` — the six `SectorId`s in display order.
  - `STYLES` — five style definitions (`Vakwerk`, `Helder`, `Signaal`,
    `Avond`, `Puur`), each mapping to a layout (`split`, `bleed`, `bold`,
    `editorial`, `mosaic`) and display font.
  - `SECTORS` — one `SectorData` object per trade: business details,
    services with prices, quiz flow, reviews, certifications, photo pool,
    hue inputs, optional `beforeAfter` gallery and optional `tool`.
  - `computePalette(sector, style)` — derives a full OKLCH `Palette` from
    the sector's hue values (`hD`, `hB`, `cf`) per style id.
  - `getPhotoSet(sector, styleIndex)` — rotates through the sector's
    Unsplash photo-id pool so different styles show different photos.
  - `buildActiveSite(sectorId, styleIndex, customForm?, disabledServices?)`
    — merges content, palette, photos and the wizard's customised data into
    the `ActiveSiteData` object that `SiteView` renders.
- `src/data/componentCatalog.ts` — component names, Dutch labels,
  descriptions, categories, source paths and preview layouts for the
  interactive library. Preview components are mounted one at a time.
- `src/types.ts` — every shared type, including `TradeToolId` and the
  `tool?` field on `SectorData`.

## Rendering flow

1. `App` computes `activeSite = buildActiveSite(...)` on every render.
2. `SiteView` renders the preset's preview control bar, then the craftsman
   site in this order: header/nav, one of five hero layouts, certification
   ribbon, services, portfolio (with before/after slider), about,
   `PriceCalculator`, `AreaChecker`, the trade-specific `TradeTool`,
   `BookingCalendar`, reviews, FAQ, `ContactSection`, footer, and finally
   the floating/desktop actions and the mobile sticky contact bar.
3. The wizard keeps a live `buildActiveSite` result in a browser-mockup
   panel (sticky on desktop, collapsible on mobile so the page does not
   double in length) so edits update the preview immediately.
4. `ComponentGallery` is lazy-loaded on demand, filters `COMPONENT_ENTRIES`
   and mounts only the selected preview. Large application views use a
   scrollable canvas; reusable trade-site additions live in
   `src/components/extras/`. See [component-library.md](./component-library.md).

## Styling system

- Tailwind CSS v4 (`@tailwindcss/vite`) with utility classes in JSX.
- Brand colors are **not** hard-coded in components: `SiteView` and the
  trade tools apply palette tokens (`site.accent`, `site.card`,
  `site.line`, `site.radiusLg`, …) via inline styles, so every preset keeps
  its own identity. Home-page components use the fixed stone/amber theme.
- Fonts are loaded in `index.html`; the display font per style lives in
  `StyleDef.display`.
- Reusable animations (`animate-marquee`, `pulse-glow`,
  `animate-fade-in`) are defined in `src/index.css`.
- Tailwind v4 generates arbitrary numeric spacing utilities on demand
  (e.g. `h-13`, `h-15`), so these are valid without custom config.

## Contact and messaging

A request that a visitor sends from a site goes to the backend: it is
stored with the site it belongs to and mailed to Klusbaas
(`src/server/leadHandler.ts`, `POST /api/lead`). Nothing is lost when the
mail does not arrive — the request stands in the craftsman's account and
in Klusbaas' overview.

The "call" and "WhatsApp" buttons themselves still open WhatsApp or the
phone app through deep links built by the pure helpers in
`src/utils/contact.ts` (see [contact-strategy.md](./contact-strategy.md)).
The Google Calendar integration in `src/utils/googleWorkspace.ts` needs
Firebase OAuth.

## State and persistence

| Data | Where | Lifetime |
|------|-------|----------|
| Current route (view, sector, style, wizard step, component, package) | The URL (`history.state` keeps the scroll offset) | Bookmarkable |
| Wizard draft (form, services, sector, style) | React state in `App` + `sessionStorage` (`klusbaas_wizard_draft`) | Session |
| Custom business data per sector | `localStorage` key `klusbaas_custom_sites` | Persistent |
| Booking, contact, fault-report and calculator submissions | `leads` in Netlify Blobs, `.data/leads` in dev | Twelve months promised; removed by hand for now |
| Google OAuth token | Module-level cache in `googleWorkspace.ts` | Session |
| Customer account (e-mail, password hash) | `accounts` in Netlify Blobs, `.data/accounts` in dev | Until the account is deleted |
| Session of a logged-in customer | `sessions` in the same store, `.data/sessions` in dev; the id travels in the cookie `klusbaas_session` | 30 days |
| Published site | `sites` in Netlify Blobs, `.data/sites` in dev | Until the site is replaced |
| Offer (offerte) | `quotes` in Netlify Blobs, `.data/quotes` in dev | Until it is deleted by hand; the price is only valid for 30 days |
| Request (aanvraag), including the customer's own offer request | `leads` in Netlify Blobs, `.data/leads` in dev | Until it is deleted by hand |

## Accounts and sessions

A customer can log in at `/mijn-account` and manage his sites from there.
The account replaces the management link as the normal way in; the link
keeps working for sites that were published before accounts existed.

1. `POST /api/account` (`netlify/functions/account.mts`, in dev the same
   handler behind the Vite middleware) takes an `action`: `register`,
   `login`, `logout`, `me`, `sites` or `claim`.
2. The password is hashed with scrypt from `node:crypto`
   (`src/utils/password.ts`); only the hash is stored, with a random salt.
   No new dependency, no plain text password anywhere.
3. A session is a random id in the cookie `klusbaas_session`
   (`HttpOnly`, `SameSite=Lax`, `Secure` in production, 30 days). The browser
   never handles the session id in JavaScript.
4. The account id is a hash of the e-mail address
   (`accountId(email)` in `src/server/storage.ts`), so looking an account up
   is one read and the id itself leaks no address.
5. A site published while logged in gets an `ownerId`. The owner may then
   change the site without a token (`handlePublishSite` with `ownerId`), and
   the token of the site never changes: a link that works keeps working.
6. `claim` links a site that was published with a management link to the
   account: the customer proves ownership with that link.

`src/server/accountHandler.ts` holds the logic, `src/server/storage.ts` the
two storages (Blobs in production, files in dev), `src/utils/accountClient.ts`
the client calls.

## Offers and requests

An offer and a request are two different things, stored in two different
stores, and they are linked to each other.

1. A request (`StoredLead`) is what a visitor or a customer sent: a form on
   a site, or the customer asking for a price himself
   (`POST /api/quote/request` → `src/server/quoteRequest.ts`). It carries
   the reference `L-XXXXXX` and the fields of the form.
2. An offer (`QuoteRecord`) is the order: a number (`KB-<jaar>-<nr>`), a
   price with 21 % VAT, a status (`open`, `accepted`, `paid`, `cancelled`),
   a PDF and the account of the customer. It is built in
   `src/utils/quote.ts` and written by `LeadStorage`.
3. The offer remembers the request it was written for (`leadReference`), so
   the overview can show at a request which offer exists, and Klusbaas does
   not write the same offer twice.
4. The customer sees his offers in `/mijn-account` (`POST /api/account`
   action `quotes`) and on `/offerte/<id>?token=…`. He accepts and reports
   the payment himself there; Klusbaas marks the payment as paid.

## Testing

- Unit tests use the built-in `node:test` runner and are executed with
  `bun test src` (also available as `bun run test`). They cover pure
  utilities, component-catalog integrity and server-rendered smoke tests
  for all ten reusable additions in `components/extras/extras.test.tsx`.
- Type checking: `bun run lint` (`tsc --noEmit`).
- Production build: `bun run build` (Vite + prerender + sitemap).
- For component-level verification without a browser, render components
  with `react-dom/server`'s `renderToStaticMarkup` in a temporary script
  and assert on the markup. HTML-encode expectations (`&` becomes
  `&amp;`); delete the script afterwards so it never lands in the repo.
- Deployment checks are provided by the external Netlify integration;
  the repository itself contains no CI workflow.

## Package manager

Use [Bun](https://bun.sh). A `bun.lock` is committed and `npm install`
fails with an `ERESOLVE` conflict between Vite 8 and the pinned esbuild
version. All scripts (`dev`, `build`, `preview`, `lint`, `test`) work
unchanged under Bun.

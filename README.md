# Klusbaas — Websites voor vakmensen

Klusbaas generates ready-to-publish marketing websites for Dutch trades
(timmerman, hovenier, schilder, loodgieter, elektricien, stukadoor). A
craftsman picks a trade and one of five design styles, fills in their
business details, and gets a complete demo site with services, pricing
calculator, portfolio, reviews, booking and contact flows.

## Features

- **30 presets** — 6 trades × 5 design styles, each with its own palette,
  typography, layout and photo set (`src/data/tradesData.ts`).
- **Interactive price calculator** — a per-trade step quiz that produces a
  live euro estimate (`PriceCalculator`, `utils/pricing.ts`).
- **Smart per-trade conversion tools** (`components/tools/`):
  - `emergency` — 24/7 spoedknop for the plumber, with problem chips that
    prefill a WhatsApp message
  - `fault-report` — structured storingsmelding for the electrician
  - `m2-calculator` — surface/price calculator for the painter
  - `timeline` — project timeline making the two-week delivery promise
    concrete for the carpenter
- **WhatsApp-first contact** — WhatsApp is the primary channel on every demo
  site, with a short contact form as fallback; both compose prefilled
  `wa.me` messages (`ContactSection`, `utils/contact.ts`). A sticky mobile
  bar keeps call and WhatsApp buttons always on screen.
- **Baseline expectations included everywhere** — sticky mobile call button,
  quote form, before/after gallery, certification marks, Google
  Bedrijfsprofiel review badge, local SEO (postcode area checker) and
  two-week delivery messaging.
- **Booking & Google Workspace** — appointment calendar with optional
  Google Calendar sync and Google Drive quote storage
  (`BookingCalendar`, `utils/googleWorkspace.ts`).
- **Platform pricing** — three one-off packages (€ 595 / € 995 / € 1.795,
  excl. btw) plus an optional € 25/month service, with explicit
  "you own the site and code" messaging (`PricingSection`). A package CTA
  carries the choice into the wizard (`/start/vak?pakket=pro`).
- **Interactive component library** — searchable live previews of all 30
  component modules, including ten new reusable trust and conversion
  components. Open **Componenten** in the main navigation or visit
  `/componenten` (`ComponentGallery`, `components/extras/`).
- **Prerendered and hydrating** — the build renders the homepage and all 35
  presets to real HTML with per-page titles, canonical and Open Graph tags,
  then hydrates them in the browser. `sitemap.xml`, `robots.txt` and an
  `og-image.png` are generated too.
- **Measurable funnel** — step views, step completions, plan picks, preset
  opens, WhatsApp/phone clicks and appointment requests are emitted through
  a vendor-free `track()` helper (GTM `dataLayer` / GA4 `gtag`).
- **Accessible palettes** — every generated colour scheme is checked against
  WCAG AA (7 trades × 5 styles) by automatic contrast maths and tests.
- **Real URLs everywhere** — the marketing page, every generated preset
  (`/voorbeeld/loodgieter/krachtig`), every wizard step
  (`/start/gegevens`), the confirmation screen and each library component
  have their own address. Browser back/forward, reloads, bookmarks and
  shared links all work, with per-page titles and a branded 404.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS v4, `lucide-react` icons,
Firebase Auth for the Google integrations. Package manager is
[Bun](https://bun.sh) (a `bun.lock` is committed).

## Getting started

```bash
bun install
bun run dev      # start the dev server
bun run build    # production build + prerender + sitemap to dist/
bun run lint     # tsc --noEmit type check
bun test         # unit tests (node:test runner via bun)
```

## Documentation

- [AGENTS.md](./AGENTS.md) — rules and workflow for agents/contributors
- [CHANGELOG.md](./CHANGELOG.md) — release history
- [ROADMAP.md](./ROADMAP.md) — prioritised future work and decisions
- [docs/architecture.md](./docs/architecture.md) — views, data model, styling, persistence, testing
- [docs/component-library.md](./docs/component-library.md) — gallery access, component inventory and extension guide
- [docs/adding-a-sector.md](./docs/adding-a-sector.md) — how to add a trade
- [docs/adding-a-trade-tool.md](./docs/adding-a-trade-tool.md) — how to add a smart tool
- [docs/contact-strategy.md](./docs/contact-strategy.md) — WhatsApp-first contact design
- [docs/pricing-and-positioning.md](./docs/pricing-and-positioning.md) — market research, price points and where prices live
- [docs/known-limitations.md](./docs/known-limitations.md) — honest gap inventory
- [docs/ux-review.md](./docs/ux-review.md) — navigation/conversion review, fixes and prioritised recommendations

## Project structure

```
src/
├── App.tsx                  # Route switch: home / demo site / wizard / library / 404
├── utils/router.ts          # URL parsing, building, titles and legacy redirects
├── utils/color.ts           # OKLCH↔sRGB and WCAG contrast (palette contract)
├── utils/analytics.ts       # vendor-free funnel events
├── entry-server.tsx         # build-time prerender entry (never shipped)
├── scripts/prerender.ts     # renders routes, writes sitemap.xml/robots.txt
├── hooks/                   # useRouter, useRouteMeta, useMediaQuery
├── data/tradesData.ts       # All sector content, styles, palettes, photos
├── data/plans.ts            # The three one-off platform packages
├── data/componentCatalog.ts # Searchable component inventory and preview metadata
├── types.ts                 # Shared domain types
├── utils/
│   ├── pricing.ts           # Estimates, phone/domain/postcode helpers
│   ├── contact.ts           # wa.me/tel links and message templates
│   ├── surface.ts           # m² calculation helpers
│   └── googleWorkspace.ts   # Calendar/Drive API integration
└── components/
    ├── SiteView.tsx         # The generated craftsman website
    ├── WizardView.tsx       # Onboarding flow (trade → style → publish)
    ├── ComponentGallery.tsx # Searchable live component library
    ├── extras/              # Ten reusable trust and conversion components
    ├── PricingSection.tsx   # Klusbaas platform pricing (home page)
    ├── ContactSection.tsx   # WhatsApp + form contact block
    ├── tools/               # Per-trade smart components + TradeTool switch
    └── ...                  # Calculator, booking, gallery, FAQ, etc.
```

## Adding a trade tool

1. Add the id to the `TradeToolId` union in `src/types.ts`.
2. Build the component in `src/components/tools/` and register it in
   `TradeTool.tsx`.
3. Set `tool: '<id>'` on the relevant sector in `tradesData.ts`.

Pure logic (message templates, price math) lives in `src/utils/` and is
covered by unit tests so behaviour can be verified without a browser.

## Conventions

- All customer-facing copy is Dutch; euro amounts use Dutch formatting and
  platform prices state "exclusief btw" explicitly.
- Keep formatting/contact logic in pure, tested utils rather than inside
  components.
- Commits follow the Conventional Commits style (`feat:`, `fix:`, `docs:`,
  `test:`).

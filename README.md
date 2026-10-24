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
  "you own the site and code" messaging (`PricingSection`).

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS v4, `lucide-react` icons,
Firebase Auth for the Google integrations. Package manager is
[Bun](https://bun.sh) (a `bun.lock` is committed).

## Getting started

```bash
bun install
bun run dev      # start the dev server
bun run build    # production build to dist/
bun run lint     # tsc --noEmit type check
bun test         # unit tests (node:test runner via bun)
```

## Documentation

- [AGENTS.md](./AGENTS.md) — rules and workflow for agents/contributors
- [CHANGELOG.md](./CHANGELOG.md) — release history
- [ROADMAP.md](./ROADMAP.md) — prioritised future work and decisions
- [docs/architecture.md](./docs/architecture.md) — views, data model, styling, persistence, testing
- [docs/adding-a-sector.md](./docs/adding-a-sector.md) — how to add a trade
- [docs/adding-a-trade-tool.md](./docs/adding-a-trade-tool.md) — how to add a smart tool
- [docs/contact-strategy.md](./docs/contact-strategy.md) — WhatsApp-first contact design
- [docs/pricing-and-positioning.md](./docs/pricing-and-positioning.md) — market research, price points and where prices live
- [docs/known-limitations.md](./docs/known-limitations.md) — honest gap inventory

## Project structure

```
src/
├── App.tsx                  # Home / demo site / wizard router
├── data/tradesData.ts       # All sector content, styles, palettes, photos
├── types.ts                 # Shared domain types
├── utils/
│   ├── pricing.ts           # Estimates, phone/domain/postcode helpers
│   ├── contact.ts           # wa.me/tel links and message templates
│   ├── surface.ts           # m² calculation helpers
│   └── googleWorkspace.ts   # Calendar/Drive API integration
└── components/
    ├── SiteView.tsx         # The generated craftsman website
    ├── WizardView.tsx       # Onboarding flow (trade → style → publish)
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

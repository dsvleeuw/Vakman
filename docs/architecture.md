# Architecture

## High-level overview

Klusbaas is a single-page React application that generates marketing
websites for Dutch tradespeople. It has four views, switched by state in
`src/App.tsx` (there is no client-side router):

| View | Component | Purpose |
|------|-----------|---------|
| `home` | `App` inline + `Header`, `HeroStrip`, `PresetsSection`, `HowItWorks`, `PricingSection`, `FaqSection` | Klusbaas' own marketing page with the 30 presets and platform pricing |
| `site` | `SiteView` | The generated craftsman website (the product demo) |
| `start` | `WizardView` | Five-step onboarding that produces a customised site |
| `components` | `ComponentGallery` | Searchable live catalogue of every component module and ten reusable additions |

`App.tsx` holds the selected sector, style index and wizard step, plus the
customised per-sector data. It reads URL search params on load so individual
presets can be linked directly:

| Param | Values | Effect |
|-------|--------|--------|
| `view` | `site` \| `start` \| `components` | Open a specific view |
| `sector` | one of the `SectorId` union | Preselect a trade |
| `style` | `0`–`4` | Preselect a style |
| `autostart` | `1` | Shortcut that opens the site view |

Example: `/?sector=loodgieter&style=2&view=site`.

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
   panel so edits update the preview immediately.
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

There is no backend for leads. All "send" actions open WhatsApp or the
phone app through deep links built by the pure helpers in
`src/utils/contact.ts` (see [contact-strategy.md](./contact-strategy.md)).
The Google Calendar/Drive integration in `src/utils/googleWorkspace.ts`
is the only networked write path and requires Firebase OAuth.

## State and persistence

| Data | Where | Lifetime |
|------|-------|----------|
| Selected sector/style, current view, wizard step | React state in `App` / `WizardView` | Session |
| Custom business data per sector | `localStorage` key `klusbaas_custom_sites` | Persistent |
| Booking, contact, fault-report and calculator submissions | React state only | Lost on refresh |
| Google OAuth token | Module-level cache in `googleWorkspace.ts` | Session |

## Testing

- Unit tests use the built-in `node:test` runner and are executed with
  `bun test src` (also available as `bun run test`). They cover pure
  utilities, component-catalog integrity and server-rendered smoke tests
  for all ten reusable additions in `components/extras/extras.test.tsx`.
- Type checking: `bun run lint` (`tsc --noEmit`).
- Production build: `bun run build` (Vite).
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

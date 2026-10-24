# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Hoofd-CTA is geen "gratis" meer.** De header-knop `Start gratis` is
  vervangen door `Plan een afspraak` (met kalender-icoon). Er is niets
  gratis; de knop start de wizard die eindigt in een afspraak-/offerte-aanvraag.
- **Wizard-stap 5 is nu een afspraak inplannen.** De laatste stap publiceert
  niet langer "direct", maar laat de gebruiker een datum + dagdeel kiezen,
  het gewenste kanaal (WhatsApp / E-mail / Allebei) bevestigen en de
  afspraak aanvragen. Bij inloggen met Google wordt de afspraak in de
  Google Agenda van de gebruiker gezet (optioneel, met lokale fallback).
- **Volledige live render in de wizard.** De rechterkolom toont nu de
  *hele* gegenereerde website live (ingebedde `SiteView`) in een scrollbaar
  kader, in plaats van de mini-mockup. `SiteView` kreeg een `embedded`-modus
  (geen preview-besturing, zwevende knoppen of mobiele balk).

### Added

- **Mobiele hamburgernavigatie.** De homepage en gegenereerde vakmansites
  hebben nu een toegankelijk hamburgermenu onder het desktop-breekpunt, met
  de bestaande navigatielinks en primaire actie. Het menu sluit na een
  keuze, met Escape en bij overstappen naar een desktopweergave.
- **"Overige" vak-optie.** `SectorId` en `SECTORS` kennen nu `overige`: een
  zevende tegel in de Vak-keuze voor vakmensen die niet in de 6 standaard
  vakken vallen. Bevat generieke diensten, FAQ, prijsflow en reviews.
- **`utils/appointments.ts`** met pure helpers (`slotToHours`,
  `buildAppointmentCalendarPayload`, `generateAppointmentId`,
  `saveAppointment`/`loadAppointments`, `buildNextDates`) plus unit-tests
  (`utils/appointments.test.ts`).

## [0.1.0] - 2026-10-24

First tracked release. This entry documents the complete product surface at
the time of release; items marked *(pre-existing)* were already in the
codebase before the 0.1.0 documentation effort.

### Added

#### Contact strategy (WhatsApp-first, option D from the market research)

- `ContactSection` on every demo site: a WhatsApp card as the primary,
  low-threshold channel plus a short contact form as fallback. Both compose
  a prefilled `wa.me` message, so no backend is required and every lead
  lands in one WhatsApp inbox.
- Sticky mobile bottom bar with **Bellen** and **WhatsApp** actions that
  stay on screen while scrolling (the mobile call button is a baseline
  expectation of competitors).
- Desktop floating action stack: WhatsApp button next to the existing
  "offerte in 1 minuut" quote CTA.
- Shared, unit-tested contact utilities in `src/utils/contact.ts`:
  `phoneToWaDigits`, `buildWhatsAppUrl`, `buildTelUrl`,
  `buildContactMessage`, `buildEmergencyMessage`, `buildFaultReportMessage`
  and `buildSurfaceQuoteMessage`.
- Google Bedrijfsprofiel review badge in the reviews section, linking to a
  Google Maps search for the business.

#### Smart, trade-specific conversion tools

- `EmergencyButton` (loodgieter): 24/7 spoedknop with problem chips that
  prefill an emergency WhatsApp message, plus a one-tap call action.
- `FaultReportForm` (elektricien): structured storingsmelding (fault type,
  timing, urgency, address, optional details) with validation and a
  composed WhatsApp notification.
- `SurfaceCalculator` (schilder): interactive m² calculator with per-m²
  service prices, dynamic wall rows and door/window deductions, backed by
  the pure helpers in `src/utils/surface.ts`.
- `ProjectTimeline` (timmerman): four-step timeline making the two-week
  delivery promise concrete.
- `TradeTool` switch component and the `TradeToolId` union / `tool` field
  on `SectorData`, so adding a tool is a data change plus one component.

#### Content

- Before/after project galleries for **all six sectors** (previously only
  the timmerman had one).
- Tool assignments: `timeline` (timmerman), `m2-calculator` (schilder),
  `emergency` (loodgieter), `fault-report` (elektricien).

#### Platform pricing and positioning

- `PricingSection` on the home page with three one-off packages —
  € 595 / € 995 / € 1.795, all explicitly **exclusief btw** — and the
  optional € 25/month service strip (monthly cancellable).
- Ownership banner: the craftsman keeps the website, code, domain and
  photos; no vendor lock-in.
- "Prijzen" navigation link in the home header.
- Expanded platform FAQ with pricing, ownership, two-week delivery and
  cancellation answers.

#### Engineering and documentation

- `test` npm script (`bun test src`) and ten new unit tests covering the
  contact and surface utilities; the suite now contains 17 tests.
- `README.md` with setup, architecture summary and extension instructions.
- `docs/` guides (architecture, adding a sector, adding a trade tool,
  contact strategy, pricing rationale, known limitations), `ROADMAP.md`
  and `AGENTS.md` for the next agent.
- `animate-fade-in` CSS utility used by confirmation states.

### Changed

- Demo-site footer reordered to WhatsApp-first and rebuilt on the shared
  `buildWhatsAppUrl` / `buildTelUrl` helpers instead of inline string
  concatenation.
- The single floating "offerte" badge was replaced by the desktop action
  stack and the mobile sticky contact bar; page root now reserves bottom
  padding on mobile so content is never hidden behind the bar.
- Platform FAQ answer on delivery time now distinguishes the 15-minute
  concept site from the two-week complete delivery.

### Initial platform baseline (pre-existing at first release)

- Six trades × five design styles = 30 presets with per-style OKLCH
  palettes, typography, layouts and Unsplash photo sets.
- Five-step onboarding wizard (`WizardView`) with a live browser mockup,
  service toggling and localStorage persistence of custom business data.
- Interactive per-trade price calculator with animated price tween.
- Postcode service-area checker, appointment booking calendar with
  optional Google Calendar/Google Drive sync (Firebase Auth),
  before/after image slider, reviews and per-sector FAQ accordion.
- Home page with header, hero, marquee strip, preset gallery and
  "how it works" section.

[0.1.0]: https://github.com/dsvleeuw/Vakman/releases
[Unreleased]: https://github.com/dsvleeuw/Vakman/pulls

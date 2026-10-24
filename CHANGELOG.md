# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added


- **Prerendering van alle indexeerbare routes.** `npm run build` rendert nu na
  `vite build` de homepage en alle 35 vakmanssites naar echte HTML
  (`dist/**/index.html`) met per route `<title>`, meta description, canonical
  en Open Graph/Twitter-tags. De client hydrateert die HTML in plaats van
  opnieuw te renderen (`src/entry-server.tsx`, `scripts/prerender.ts`,
  `src/main.tsx`). Daarbij horen `sitemap.xml`, `robots.txt` (met
  `Disallow: /start/`) en een 1200×630 `og-image.png`.
- **Funnelanalytics zonder vendor.** `utils/analytics.ts` stuurt
  `page_view`, `wizard_step_view`, `wizard_step_complete`,
  `wizard_validation_error`, `preset_open`, `plan_select`, `whatsapp_click`,
  `phone_click`, `appointment_requested` en `component_view` naar
  `window.dataLayer`/`window.gtag` zodra er een tag manager staat; zonder
  tag manager gebeurt er niets.
- **Toegankelijkheidscontract voor alle 35 paletten.** `utils/color.ts` rekent
  OKLCH→sRGB en WCAG-contrast; `withAccessibleContrast()` in `tradesData.ts`
  zorgt dat tekst op bg/card, accenttekst, inverted tekst en tekst op
  accent/highlight minimaal AA (4,5:1) halen. `paletteContrast.test.ts`
  controleert alle 7 vakken × 5 stijlen.
- **Scrollpositie per pagina.** Bij terug/vooruit herstelt de router de
  scroll-offset van dat history-item; nieuwe navigatie start bovenaan.
- **Mobiele previewbalk op de voorbeeldpagina** klapt in tot één regel met een
  "Aanpassen"-knop (vak-, stijlkeuze en CTA verschijnen pas op verzoek).
- **Kanaalkeuze werkt nu echt.** Na het aanvragen van een afspraak biedt het
  bevestigingsscherm een kant-en-klaar WhatsApp- of `mailto:`-bericht aan dat
  past bij het gekozen kanaal (WhatsApp / E-mail / Allebei).
- **Google Agenda is opt-in.** Inloggen gebeurt alleen als de bezoeker "zet de
  afspraak in mijn agenda" aanvinkt; de afspraak wordt anders lokaal genoteerd
  zonder popup.
- **Laadfeedback voor afbeeldingen:** placeholders pulseren tot de foto
  geladen is, zodat grids niet verspringen.

### Changed

- **Stap 5 draait om de oplevering, niet om het inplannen.** De primaire actie
  is nu "Bekijk je website" (ook in de actiebalk); de afspraak is een
  duidelijk gemarkeerd optioneel blok eronder.
- **Formulierranden** gebruiken `border-stone-500` in plaats van
  `border-stone-200`, zodat invoervelden 3:1 halen (WCAG 1.4.11).
- **Decoratieve sfeerfoto's** op de gegenereerde sites zijn `alt=""` +
  `aria-hidden` in plaats van een herhaling van de kop.
- **Interne navigatie zijn echte links.** Header, presets, de previewbalk van
  de gegenereerde site en de componentenbibliotheek gebruiken `RouteLink`
  (`<a href>`), zodat middenklik, "openen in nieuw tabblad" en crawlers werken.
- **Hoofd-CTA heet "Start je website"** en opent wizardstap 1, gelijk aan de
  hero. De eerdere "Plan een afspraak"-knop in de header suggereerde een
  andere actie dan hij deed; plannen gebeurt nu aan het einde van de flow.
- **Presetkaarten:** "Bekijk demo" / "Kies deze stijl" met duidelijke
  `aria-label`s in plaats van "Bekijk site" / "Kies deze".
- **Mobiel menu** sluit bij een klik buiten het menu en blokkeert
  achtergrondscrolling.
- **Componentenbibliotheek** heeft een URL per component
  (`/componenten/trust-bar`).
- **Wizard-stap 5 is een afspraak inplannen.** De laatste stap publiceert
  niet langer "direct", maar laat de gebruiker een datum + dagdeel kiezen,
  het gewenste kanaal (WhatsApp / E-mail / Allebei) bevestigen en de
  afspraak aanvragen. Bij inloggen met Google wordt de afspraak in de
  Google Agenda van de gebruiker gezet (optioneel, met lokale fallback).
- **Volledige live render in de wizard.** De rechterkolom toont de *hele*
  gegenereerde website live (ingebedde `SiteView`) in een scrollbaar kader,
  in plaats van de mini-mockup. `SiteView` kreeg een `embedded`-modus
  (geen preview-besturing, zwevende knoppen of mobiele balk).

### Fixed

- `html lang` stond op `en` terwijl alle copy Nederlands is.
- FAQ-kicker "FAQ & HEBDEN" → "Goed om te weten".
- Contactformulierlabels waren niet gekoppeld aan hun inputs; nu wel, met
  foutmeldingen die door schermlezers worden aangekondigd.
- De dubbele marquee-slides werden twee keer voorgelezen; de kopie is nu
  `aria-hidden` en niet tabbaar.
- Ankerlinks op de gegenereerde site (`#prijs`, `#gebied`, `#contact`) werden
  bij terug/vooruit naar boven gereset; scroll-reset gebeurt nu alleen bij een
  echte paginawissel.

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

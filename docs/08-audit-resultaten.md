# Auditresultaten en prioriteiten (24-10-2026)

Samenvatting van de vier Arena-audits uit
[07-arena-audit-plan.md](./07-arena-audit-plan.md) op `main` @ `ace1816`.
Alle punten hieronder met **(✔ gecontroleerd)** zijn door de tech lead zelf in
de code nagekeken.

## Stand

- **Fixlijst (06):** 11 items: 8 gebouwd (A1, A2, B1–B4, C1, C3), 2 deels
  (C2: geen Broadcasts-verzendstroom; D2: losse eindjes), 1 ontbreekt (D1).
- **Roadmap:** 26 items: 4 klaar, 6 deels, 16 open. CI (5.4) en Playwright
  (5.1) gaan naar de hoogste prioriteit, vóór nieuwe vakken.
- **UX-review:** 12 van de 13 ✅'s kloppen; #13 (toegankelijkheid) klopt maar
  deels: het paletcontract is getest, de componenten niet.

## Prioriteiten

### P0: verlies van leads en vertrouwen

1. **Aanvragen gaan stil verloren (✔).** `useLeadForm.ts:42` zet de
   starttijd opnieuw bij `reset()`; binnen 2,5 s (autofill, tweede aanvraag)
   ziet de server spam en antwoordt met een nep-succes. Ook: geen timeout in
   `submitLead`, geen fallback in `LeadErrorNotice` zonder `VITE_DEMO_PHONE`.
2. **Persoonsgegevens in logs (✔).** Previewmodus logt de volledige mailtekst
   (`leadHandler.ts:91`); de nieuwsbrief logt adressen.
3. **Geen CI en geen e2e (✔).** Geen `.github/`, geen Playwright. De
   `text-sm`-regressie op `/kaart` (PR #9) zou dan zijn gevangen.

### P1: toegankelijkheid en conversie

4. **Contrast (✔).** Wit op `#25D366` (1,98:1) op 10 plekken; op de
   7 `donker`-presets hardcoded `text-stone-900/700` op een donkere kaart.
   `:focus-visible` in `index.css` heeft specificiteit 0 en wordt door
   `focus:outline-none` overschreven.
5. **Formulieren.** Labels zonder `htmlFor`/`id` in `FaultReportForm`,
   `SurfaceCalculator`, `BookingCalendar`; randen onder 3:1; geen focustrap in
   `DemoContactNotice`.
6. **Wizard (D2, ✔ deels).** "Volgende" op `/start/vak` gaat stil door met
   `timmerman`; weekenddagen worden aangeboden (`appointments.ts:76`);
   `/start/klaar` laat de pakketregel weg als Pro niet expliciet is gekozen;
   Google Agenda wordt getoond zonder Firebase-configuratie.
7. **SEO/meta (✔).** Dubbele `og:image`/`twitter:image` in elke
   geprerenderde pagina; `robots.txt` mist `/kaart`; client-navigatie werkt
   `canonical`/`robots` niet bij; UI zegt "6 vakken · 30 stijlen" en
   "Alle 30 presets" (er zijn 7 × 5 = 35).

### P2: docs en backlog

8. **Docs lopen achter:** `architecture.md`, `adding-a-trade-tool.md`,
   `contact-strategy.md`, `ux-review.md`, `known-limitations.md`, `ROADMAP.md`,
   `README.md` beschrijven nog "geen backend", 6 vakken, 65 tests of 36 routes.
9. **Backlog (niet in deze ronde):** gedeelde rate limit (Netlify Blobs of
   edge), ondertekende formulier-nonce, offertetoken laten verlopen, fonts
   self-hosten, € 25/maand als één bron in `plans.ts`, tests voor
   `leadEmail.ts`/`newsletterStatus.ts`, dakdekker/aannemer, JSON-LD,
   GTM/GA4, FAQ-dashboardbelofte.

## Bouwbatch (6 taken, disjuncte scopes)

| Taak | Scope | Golf |
|---|---|---|
| `vk-fix-leads` | `useLeadForm`, `lead.ts`, `leadClient.ts`, `LeadStatus`, `leadHandler`, `newsletterHandler` (+ tests) | 1 |
| `vk-ci-e2e` | `.github/`, `e2e/`, `playwright.config.ts`, `package.json`, `bun.lock` | 1 |
| `vk-a11y-contrast` | `index.css`, `ContactSection`, `FaqSection`, `AreaChecker`, `SiteView`, `EmergencyButton` | 1 |
| `vk-a11y-forms` | `FaultReportForm`, `SurfaceCalculator`, `DemoContactNotice`, `HeroStrip` | 1 |
| `vk-wizard-d2` | `WizardView`, `BookingCalendar`, `appointments.ts`, `googleWorkspace.ts` (+ tests) | 1 |
| `vk-seo-meta` | `prerender.ts`, `useRouteMeta`, `useRouter`, `App.tsx`, `Header`, `ImageWithFallback` | 1 |
| `vk-docs-truth` | `docs/`, `ROADMAP.md`, `README.md`, `AGENTS.md` | 2 (na alle) |

Geen taak raakt `CHANGELOG.md`; dat schrijft de land-stap per taak.

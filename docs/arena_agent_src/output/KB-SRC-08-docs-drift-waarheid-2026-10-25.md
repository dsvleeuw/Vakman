# KB-SRC-08 — Documentatie tegen de code

- **Datum:** 2026-10-25 · **Commit:** `7d5ec3d` (+ docs-commit `868e013`)
- **Prompt:** `prompts/src-08-docs-drift-waarheid.prompt.md`
- **Soort:** read-only · **Uitgevoerd met:** claim-voor-claim vergelijking,
  `grep`, `bun run build`, `git ls-files`

## 0. Samenvatting

De documentatie is **uitgebreid maar op belangrijke punten onwaar**: ze
beschrijft een app zonder backend (die er is), met 6 vakken (het zijn er 7),
met 65/125 tests (het zijn er 134) en met 36 routes (het zijn er 39). Ook staan
er **opgeloste problemen nog als open** en wordt een dashboard beloofd dat niet
bestaat. Het probleem is niet de hoeveelheid docs, maar dat **niets de docs aan
de code toetst**. Deze audit levert de tabel; de structurele oplossing is een
`docs:check`-script (KB-SRC-07 P1).

## 1. Claim-tabel (selectie van 34 getoetste claims)

| # | Document:regel | Claim | Werkelijkheid | Status |
|---|---|---|---|---|
| 1 | `AGENTS.md:9-12` | "**no application backend**" | `/api/lead`, `/api/quote`, `/api/newsletter`, Blobs, Resend, PDF | fout |
| 2 | `AGENTS.md:9` | "6 trades × 5 styles = 30 presets" | 7 × 5 = 35 (`tradesData.ts:14-22`) | fout |
| 3 | `AGENTS.md:47` | "prerender 39 routes" | 39 pagina's, 38 sitemap-URL's | deels |
| 4 | `README.md:11` | "35 presets" | correct | klopt |
| 5 | `README.md` features | "tien herbruikbare componenten" | alleen in de galerij (KB-SRC-05 B1) | deels |
| 6 | `README.md` features | "Measurable funnel … track()" | `track()` bestaat, maar er is geen GTM/GA-snippet | deels |
| 7 | `docs/architecture.md:14` | "30 presets" | 35 | fout |
| 8 | `docs/architecture.md:53` | "home + 35 presets" geprerenderd | home, privacy, nieuwsbrief, afmelden + 35 | deels |
| 9 | `docs/architecture.md` (Contact) | "There is no backend for leads" | er is een volledige lead-API | fout |
| 10 | `docs/architecture.md` (Testing) | "the repository contains no CI workflow" | `.github/workflows/check.yml` | fout |
| 11 | `docs/architecture.md` (State) | "Booking … React state only" | `saveAppointment` → `localStorage` | fout |
| 12 | `docs/known-limitations.md` Lead | "rate limiting per function instance" | correct | klopt |
| 13 | `docs/known-limitations.md` Lead | "`PublishedSiteRecord` unused" | correct | klopt |
| 14 | `docs/known-limitations.md` Engineering | "alleen pure utils hebben tests" | ook server/data/componenttests | fout |
| 15 | `docs/known-limitations.md` (1.3) | afspraken niet bewaard | lokaal bewaard | fout |
| 16 | `docs/known-limitations.md` | "appointments state lost on refresh" (architectuurtabel) | idem | fout |
| 17 | `docs/known-limitations.md` Content | "roofer en contractor niet gebouwd" | `overige` bestaat als 7e sector | deels |
| 18 | `docs/known-limitations.md` Customisation | "FAQ verwijst naar dashboard dat niet bestaat" | correct | klopt |
| 19 | `docs/06-app-fixlijst.md` D2 | "Volgende zonder vak gaat stil door" | geblokkeerd (`WizardView.tsx:228-236`) | verouderd |
| 20 | `docs/06-app-fixlijst.md` D2 | "weekenddagen worden aangeboden" | `buildNextDates` slaat weekend over | verouderd |
| 21 | `docs/06-app-fixlijst.md` A1 | demo-nummers vervangen | knoppen veilig, **tekst** nog niet (KB-SRC-04 B1) | deels |
| 22 | `docs/07-arena-audit-plan.md:21` | "125 tests, 39 routes" | 134 tests | verouderd |
| 23 | `docs/08-audit-resultaten.md:18` | "previewmodus logt volledige mailtekst" | gemaskeerd (`leadHandler.ts:92-100`) | opgelost |
| 24 | `docs/08-audit-resultaten.md:19` | "geen timeout in submitLead" | 12 s timeout (`leadClient.ts:25`) | opgelost |
| 25 | `docs/08-audit-resultaten.md:22` | "`robots.txt` mist `/kaart`" | staat erin | opgelost |
| 26 | `docs/08-audit-resultaten.md:45` | "dubbele og:image" | 1 per pagina | opgelost |
| 27 | `docs/08-audit-resultaten.md:30` | "wit op #25D366 op 10 plekken" | sticky bar gebruikt donkere tekst | deels |
| 28 | `docs/ux-review.md:57` | "prerender of 36 routes" | 39 | fout |
| 29 | `docs/ux-review.md:97` | "65 tests, `node --test`" | 134 tests via `bun test` | fout |
| 30 | `ROADMAP.md` 1.1 | "~~kanaalkeuze~~ Done" | correct | klopt |
| 31 | `ROADMAP.md` 5.1 | "Playwright bestaat" | 2 specs + CI | klopt |
| 32 | `ROADMAP.md` 5.4 | "~~CI~~ Done" | workflow bestaat | klopt |
| 33 | `ROADMAP.md` 4.2/4.3 | "state driven by ?sector=" | echte routes bestaan al (`/voorbeeld/:sector/:stijl`) | verouderd |
| 34 | `src/data/README.md:9` | "6 sectoren × 5 stijlen = 30" | 7 × 5 = 35 | fout |

## 2. Bugs en defecten (in de docs)

**D1. De docs beschrijven een oude architectuur.** "Geen backend" staat in
`AGENTS.md`, `docs/architecture.md` (twee keer) en impliciet in de
contactstrategie. Iedere nieuwe agent of developer leest dat als waarheid en
bouwt verkeerd. Dit is de duurste doc-fout in het project.

**D2. Opgeloste problemen staan nog open.** Zes items uit
`docs/08-audit-resultaten.md` en twee uit `docs/06-app-fixlijst.md` zijn
inmiddels opgelost (rijen 19, 20, 23–26). Wie de lijst volgt, doet dubbel werk.

**D3. Cijfers worden niet onderhouden.** 30 vs 35, 36/39 routes, 65/125/134
tests, "6 vakken". Ze staan verspreid over tien bestanden. Zonder automatische
controle (KB-SRC-07 P1) gebeurt dit opnieuw.

**D4. `docs/README.md` was incompleet.** `06`, `07`, `08` en
`docs/bedrijfsinformatie/` stonden niet in de index; inmiddels aangevuld in
`868e013`. Ook `arena_agent_src/` is nu opgenomen.

**D5. Losse documenten in de root.** `02-taken.md`, `arena-plan.md`,
`SKILL.md`, `video-spec.md`, `video-script.json` staan buiten `docs/` en niet in
de index. `SKILL.md` en `arena-plan.md` zijn werktuigen, geen productdocs.

**D6. De "definition of done" wordt niet nageleefd op docs.** `AGENTS.md` eist
"docs touched when behaviour changes" en "CHANGELOG updated"; de afwijkingen
hierboven bewijzen dat dit niet gebeurt (geen poort, geen check).

## 3. Ontbrekende documentatie

| Ontbreekt | Waarom nodig | Omvang |
|---|---|---|
| **API-referentie** (`docs/api.md`) | drie endpoints met velden, statuscodes, env-vars en foutcodes; nu alleen verspreide code | M |
| **Env-referentie** (`docs/environment.md`) | `.env.example` is deels AI-Studio-erfenis; welke variabele is verplicht in productie? | S |
| **Deploy/runbook** | Netlify-instellingen staan nergens in de repo (geen `netlify.toml`), inclusief 404 en headers | S |
| **Datamodel** (`docs/data-model.md`) | `SectorData`/`ActiveSiteData` velden en gebruikers; nu alleen types | M |
| **Teststrategie** | wat testen we wel/niet en waarom; nu impliciet | S |
| **Beslissingen/ADR's** | o.a. WhatsApp-first, geen CMS, prijsmodel; nu verspreid in ROADMAP "Decision log" | M |
| **Incident/rollback** | wat te doen als leadmail of deploy stuk is | S |
| **Releaseproces** | `CHANGELOG.md` bestaat, maar er is geen release-stap of versietag | S |

## 4. Nieuwe feature-ideeën (documentatie)

**F1. `docs:check` in `bun run check` (S).** Zie KB-SRC-07 P1. Dit is de
structurele oplossing voor D3.

**F2. "Docs-truth"-sectie in de PR-template (S).** Drie regels: welke docs
aangepast, welk cijfer veranderd, welke claim vervallen. Dwingt de
definition of done af zonder tooling.

**F3. Eén bron voor cijfers (S).** `docs/cijfers.md` (of een `STATS.json`) dat
`README`, `AGENTS` en `ROADMAP` citeren in plaats van herhalen; het
`docs:check`-script verifieert dat bestand.

**F4. Agent-onboarding in 1 bestand (S).** `docs/onboarding.md` met: stack,
commando's, routekaart, waar de waarheid staat, en de vijf gotchas die echt
fout gaan (hydratie, `?pakket=`, prerender, Blobs, demo-nummer). Nu moet een
agent vijf documenten lezen om hetzelfde te weten.

**F5. Gegenereerde API-docs (M).** Uit de Zod-achtige validatie in
`utils/lead.ts` een markdown-tabel genereren; pas zinvol als de validatie
formeel wordt (nu handmatige checks).

## 5. Beter-kunnen

- **Taal:** docs zijn grotendeels Nederlands, maar `docs/architecture.md`,
  `component-library.md` en `AGENTS.md` zijn Engels. Kies één taal per
  documentsoort en zet dat in `docs/README.md` (nu: "Nederlands voor alle
  documentatie", dus de Engelse bestanden zijn de afwijking).
- **Structuur:** `docs/` heeft 14 losse bestanden zonder nummering; `klantwerving/`
  is wél genummerd. Een `docs/README.md` met een levenscyclus (begrijpen →
  bouwen → runnen → verkopen) zou helpen.
- **Verouderde verwijzingen:** `docs/` verwijst naar `npm run …` terwijl Bun de
  package manager is (`AGENTS.md` zegt dit ook, maar de docs herhalen npm).
- **CHANGELOG:** niet volledig geverifieerd in deze ronde; controleer of
  `Unreleased` de laatste PR's bevat.

## 6. Verouderde of foute documentatie (voorstel, plakbaar)

Vervang in `AGENTS.md` regel 9-12:

> "Klusbaas genereert demo-marketingwebsites voor Nederlandse vakmensen
> (7 sectoren × 5 stijlen = 35 presets). React 19 + TypeScript + Vite +
> Tailwind v4 SPA, met Netlify Functions voor leads, offertes (PDF),
> nieuwsbrief en opslag in Netlify Blobs; WhatsApp blijft het primaire
> contactkanaal."

Vervang in `docs/architecture.md` de contactparagraaf:

> "Alle formulieren posten naar `POST /api/lead`; de handler valideert, slaat op
> (Blobs, lokaal `.data/`), mailt via Resend en genereert een offerte-PDF.
> WhatsApp blijft een deeplink-kanaal voor de bezoeker."

## 7. Top 5

| # | Aanbeveling | Ernst | Effort | Confidence |
|---|---|---|---|---|
| 1 | "Geen backend" overal corrigeren (D1) | P1 | S | hoog |
| 2 | Opgeloste auditpunten als opgelost markeren (D2) | P2 | S | hoog |
| 3 | `docs:check` + één cijferbron (F1/F3) | P2 | S | hoog |
| 4 | API- en env-referentie schrijven (D3) | P2 | M | hoog |
| 5 | Root-documenten ordenen (`02-taken`, `SKILL`, `video-*`) (D5) | P3 | S | hoog |

## 8. Open vragen

1. Willen we docs in het Engels of Nederlands? Nu is het gemengd.
2. Blijft `CHANGELOG.md` de enige release-administratie?
3. Moet de docs-index de rootbestanden meenemen of verhuizen die naar `docs/`?

## 9. Verantwoording

- 34 claims getoetst (tabel hierboven); cijfers gecontroleerd met
  `bun run test` (134), `find dist -name index.html` (39), `grep -c "<url>"`
  (38), `grep` op `ORDER` (7 sectoren).
- Paden/commando's uit `AGENTS.md` en `README.md` gecontroleerd; de dode
  `video:*`-scripts en `clean` staan in KB-SRC-07 B5.
- Niet volledig getoetst: `CHANGELOG.md`, `docs/klantwerving/*`,
  `docs/bedrijfsinformatie/*`, `video-spec.md` (buiten de code-scope).

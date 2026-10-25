# KB-SRC-09 — Synthese: prioriteiten en feature-roadmap

- **Datum:** 2026-10-25 · **Commit:** `7d5ec3d` + docs
- **Invoer:** KB-SRC-01 t/m KB-SRC-08 (alle acht aanwezig en gebruikt)
- **Werkwijze:** dedupliceren → tegenstrijdigheden beslechten → sorteren op
  kans × impact ÷ effort → scheiden in repareren / afmaken / nieuw / opruimen
- **Steekproef:** elke P0 en P1 hieronder is opnieuw op `pad:regel` gecontroleerd

## Deel 0 — Executive summary (2 kantjes)

**De drie dingen die nu geld, leads of vertrouwen kosten**

1. **Een voorbeeldtelefoonnummer staat als tekst op de demosite.**
   "Bel 06 45 67 89 01" (`tradesData.ts:1114`, `ContactSection.tsx:145`), terwijl
   de knoppen veilig naar Klusbaas of de demo-melding wijzen. Bij outreach kan
   een prospect dat nummer bellen — en een echte persoon krijgt de klacht.
   De e2e-suite markeert dit al als bekende fout (`e2e/routes.spec.ts`).
2. **Een lead kan dubbel of niet aankomen.** Een dubbelklik of retry na de 12 s
   timeout maakt een tweede offerte met een tweede nummer (`leadHandler.ts:118`),
   en er is geen alarm als de teammail faalt (`leadHandler.ts:288-296`).
3. **De docs liegen over de architectuur.** "Geen backend", "6 vakken",
   "65 tests" — dat kost elke nieuwe agent of ontwikkelaar een halve dag en
   leidt tot verkeerde beslissingen (`AGENTS.md:9-12`, `docs/ux-review.md:97`).

**De drie dingen die je deze maand bouwt**

1. **Eerlijk demomateriaal**: geen voorbeeldnummer als tekst, geen verzonnen
   KvK, één `WhatsAppButton`-patroon. (S, twee dagen.)
2. **Betrouwbare leadafhandeling**: idempotency-key, tokenverloop,
   foutalarm per mail, body-limiet. (M, drie dagen.)
3. **Toegankelijke formulieren + `strict` + `axe` in CI**: de duurste vorm van
   schuld wegwerken waar een lead binnenkomt (`BookingCalendar`-labels) en de
   CI laten bewaken wat nu al waar is. (M, twee dagen.)

**De drie dingen die je expliciet niet doet**

1. **Geen CMS, geen i18n, geen provider voor betalingen** — eerst het product
   afmaken dat je al verkoopt.
2. **Geen vijf nieuwe tools** — eerst de twee ontbrekende (stukadoor, hovenier)
   die data en rekenkunde al hebben.
3. **Geen grote UI-herontwerpen** — de huisstijl en het paletcontract werken;
   het probleem is gedrag, niet smaak.

**Advies buiten de code**
Verkoop pas demo's met een **domein en een eigen nummer**. Zonder
`VITE_DEMO_PHONE` en zonder geverifieerd Resend-domein is de demo een halffabrikaat:
nummer zichtbaar, klantbevestiging niet aankomend. Dat is één configuratie-avond
en het verandert de indruk van het product volledig.

## Deel 1 — Mastertabel

Alle punten uit de acht onderzoeken, ontdubbeld. Bron = `KB-SRC-0n#nr`.
Soort: **B**ug · be**L**ofte · **F**eature · **O**nderhoud.

| # | Punt | Soort | Bewijs | Ernst | Effort | Conf. | Bron |
|---|---|---|---|---|---|---|---|
| 1 | Voorbeeldnummer als tekst op demo's | B | `tradesData.ts:1114`; e2e-fixme | P0 | S | hoog | 04-B1 |
| 2 | KvK 12345678 hardcoded in footer | B | `SiteView.tsx:1292` | P1 | S | hoog | 04-B2 |
| 3 | Geen idempotentie op offertes | B | `leadHandler.ts:118` | P1 | M | hoog | 02-B1 |
| 4 | Offertetoken verloopt nooit | B | `leadHandler.ts:305-330` | P1 | S | hoog | 02-B3 |
| 5 | Geen alarm bij mislukte mail | B | `leadHandler.ts:288-296` | P1 | S | hoog | 02-B4 |
| 6 | `BookingCalendar`-labels zonder `htmlFor` | B | `BookingCalendar.tsx:295-421` | P1 | S | hoog | 06-B1 |
| 7 | Soft 404 (HTTP 200) | B | `public/_redirects:2` | P1 | S | hoog | 01-B1 |
| 8 | `utm_*` wordt uit de URL gestript | B | `App.tsx:166-180` | P1 | S | hoog | 01-B2 |
| 9 | Geen error boundary | B | `main.tsx:22-33` | P1 | S | hoog | 01-B3 |
| 10 | `strict` niet aan (code is klaar) | O | `tsconfig.json` | P1 | S | hoog | 07-B1 |
| 11 | Geen linter; 3 dode `eslint-disable` | O | `App.tsx:169` e.a. | P2 | S | hoog | 07-B2 |
| 12 | Twee e2e-`fixme`'s = echte bugs | B | `e2e/routes.spec.ts` | P1 | S | hoog | 07-B3 |
| 13 | E2E bouwt de app opnieuw in CI | O | `playwright.config.ts:8-12` | P2 | S | hoog | 07-B4 |
| 14 | Dode scripts (`video:*`, `clean`) | O | `package.json:19-21` | P3 | S | hoog | 07-B5 |
| 15 | Vijf ongebruikte dependencies | O | `package.json` | P2 | S | hoog | 07-B6 |
| 16 | `.claude/` + `.aistudio/` in git | O | 37 + 8 bestanden | P3 | S | hoog | 07-B7 |
| 17 | Geen `netlify.toml` (headers, 404, build) | O | `git ls-files` | P2 | S | hoog | 07-B8 |
| 18 | Geen `packageManager`/`engines` | O | `package.json` | P3 | S | hoog | 07-B9 |
| 19 | Rate limit per instantie | B | `leadHandler.ts:69` | P1 | M | hoog | 02-B7 |
| 20 | Offertenummer + opslag niet atomair | B | `storage.ts:87-100` | P1 | M | midden | 02-B2 |
| 21 | Geen body-limiet op `/api/lead` | B | `lead.mts:8-14` | P2 | S | hoog | 02-B5 |
| 22 | Dev/prod verschillen in IP en headers | B | `vite.config.ts:41` | P2 | S | hoog | 02-B6 |
| 23 | Geen lead-inbox/admin | F | alleen mail + Blobs | P1 | L | hoog | 02-F1 |
| 24 | Offertestatus/akkoord ontbreekt | F | `QuoteRecord` | P2 | M | hoog | 02-F2 |
| 25 | Geen per-site ontvanger | F | `lead.mts:20` | P1 | M | hoog | 02-F3 |
| 26 | Geen monitoring/dagoverzicht | F | nergens | P1 | S | hoog | 02-F4 |
| 27 | Spoedaanvragen niet geregistreerd | B | `EmergencyButton` → deeplink | P1 | S | hoog | 05-B3 |
| 28 | 10 extras alleen in de galerij | L | `grep` → `ComponentGallery` | P2 | M | hoog | 05-B1 |
| 29 | Tools voor 3 van 7 sectoren ontbreken | L | `tradesData.ts:149,388,508,630` | P2 | M | hoog | 03-B3 |
| 30 | `ProjectTimeline` niet data-gedreven | O | `ProjectTimeline.tsx:13-34` | P2 | S | hoog | 05-B2 |
| 31 | Serviceprijzen als vrije tekst | O | `types.ts:44-49` | P2 | M | hoog | 03-B1 |
| 32 | Geen data-invarianten in tests | O | `data/*.test.ts` | P2 | S | hoog | 03-B6 |
| 33 | `overige` is een lege sector | L | `tradesData.ts:21` | P2 | S | midden | 03-B2 |
| 34 | Fotopools herhalen | L | `tradesData.ts:1128-1132` | P2 | M | midden | 03-B4 |
| 35 | Publiceren bestaat niet | F | `PublishedSiteRecord` | P1 | L | midden | 04-F1 |
| 36 | Klantdashboard ontbreekt (FAQ belooft het) | F | `InfoPages.tsx` | P1 | L | midden | 03-§3 |
| 37 | Booking belooft beschikbaarheid | L | `appointments.ts:76-95` | P2 | S | hoog | 04-B4 |
| 38 | AreaChecker belooft 25 km, rekent prefixen | L | `pricing.ts:79-110` | P2 | S | hoog | 04-B6 |
| 39 | Wizard-draft in sessionStorage | B | `App.tsx:60,71` | P2 | S | hoog | 04-F5 |
| 40 | Ongememoïseerde `buildActiveSite` | O | `App.tsx:417`, `WizardView.tsx:397` | P2 | S | hoog | 01-B5 |
| 41 | Geen JSON-LD (local SEO) | F | nergens | P2 | S | hoog | 01-F2 |
| 42 | Geen OG-beeld per preset | F | 1 `og-image.png` | P3 | M | midden | 01-F3 |
| 43 | Geen privacy-attributie (`utm`) | F | idem als 8 | P2 | S | hoog | 01-F4 |
| 44 | Geen per-vak landingspagina's | F | alleen presets | P2 | M | midden | 01-F1 |
| 45 | Meerdere `h1`-blokken per view | B | 5/6/3 in de bron | P2 | S | midden | 06-B2 |
| 46 | Geen `width`/`height` op afbeeldingen | B | `ImageWithFallback.tsx:74-90` | P1 | S | hoog | 06-B3 |
| 47 | Dialoog zonder focustrap | B | `DemoContactNotice` | P2 | S | midden | 06-B4 |
| 48 | `autocomplete`/`inputmode` ontbreken | B | meerdere velden | P2 | S | hoog | 06-B8 |
| 49 | Geen `axe`/a11y-check in CI | O | `e2e/` | P1 | S | hoog | 06-F1 |
| 50 | Analytics verzamelt niets (geen GTM) | B | `index.html` | P1 | S | hoog | 01-B/02 |
| 51 | Docs: "geen backend", 6 vakken, cijfers | O | 34 claims | P1 | S | hoog | 08-D1/D3 |
| 52 | Opgeloste auditpunten staan nog open | O | 8 items | P2 | S | hoog | 08-D2 |
| 53 | Geen API/env/datamodel-docs | O | nergens | P2 | M | hoog | 08-§3 |
| 54 | Rootdocs buiten de index | O | `02-taken`, `SKILL`, `video-*` | P3 | S | hoog | 08-D5 |
| 55 | Geen prerender-/mail-/PDF-tests | O | `find src -name "*.test.*"` | P1 | M | hoog | 07-§1 |
| 56 | Geen retentie/verwijderpad (privacy) | O | `known-limitations` | P1 | M | midden | 02-§3 |
| 57 | `MAIL_TEST_RECIPIENT`/domein blokkeert klantmails | O | `.env.example` | P1 | S | midden | 02-§8 |
| 58 | Demo-telefoon in BookingCalendar-mails | B | `BookingCalendar.tsx:174,190,228` | P1 | S | hoog | 04-B1 |

Totaal: 58 punten — 26 bugs, 13 beloftes, 10 features, 9 onderhoud.
Verdeling ernst: **P0: 1 · P1: 23 · P2: 27 · P3: 7.**

## Deel 2 — Top 20 (in deze volgorde)

| # | Wat | Waarom nu | Klaar als |
|---|---|---|---|
| 1 | Geen voorbeeldnummer als tekst (1, 58) | P0, outreach-risico | `/voorbeeld/*` toont nooit `06 xx xx xx xx`; e2e-fixme weg |
| 2 | KvK uit de demo (2) | vertrouwen/juridisch | geen `12345678` in `dist/`; veld alleen als gevuld |
| 3 | `VITE_DEMO_PHONE` + Resend-domein als deploycheck (57) | anders blijven 1 en 58 terugkomen | build faalt/zegt luid als env ontbreekt in productie |
| 4 | Idempotency-key op offertes (3) | dubbele offertes/mails | tweede POST binnen 10 min geeft hetzelfde nummer + test |
| 5 | Tokenverloop + 410 (4) | blijvend datalek | verlopen token geeft 410, test dekt het |
| 6 | Mailalarm (5) | stille leadderving | mislukte team-/klantmail geeft één alertregel + test |
| 7 | `BookingCalendar`-labels + foutkoppeling (6) | duurste a11y-gat | 7/7 labels geassocieerd, `aria-invalid`, test |
| 8 | `width`/`height` op beeld (46) | CLS in de hero | Lighthouse CLS < 0,1 op 3 presets |
| 9 | `axe` + `strict` in CI (49, 10) | voorkomt terugval | CI faalt bij nieuwe overtreding/typefout |
| 10 | `utm_*` behouden (8) | meten kan niet nu | URL behoudt params, `page_view` bevat `utm_source` |
| 11 | GTM/GA4 plaatsen (50) | funnel is blind | events komen aan in GA4 (debug-view) |
| 12 | Soft 404 + `netlify.toml` (7, 17) | SEO + headers | onbekend pad geeft 404, headers aanwezig |
| 13 | Error boundary (9) | leeg scherm bij deploy | test: kapotte chunk → NL-fallback |
| 14 | Leads-inbox of dagoverzicht (23, 26) | opvolging is handwerk | elke aanvraag zichtbaar buiten de mail |
| 15 | Per-site ontvanger (25) | nodig voor echte klant | lead gaat naar de vakman, Klusbaas in cc |
| 16 | Rate limit delen (19) | misbruik | teller overleeft koude start |
| 17 | Tools voor stukadoor + hovenier (29) | 3 van 7 missen | twee tools live, tests groen |
| 18 | Extras op de demosite (28) | etalage → product | minstens 4 extras per preset via data |
| 19 | Docs waarheid (51, 52, 53) | elke agent verkeerd gestuurd | 34 claims gecorrigeerd, `docs:check` groen |
| 20 | Prerender-/mail-/PDF-tests (55) | ongeteste geldlogica | drie tests, elk met een echte assertie |

## Deel 3 — Feature-roadmap

### Nu (2 weken) — belofte waarmaken

| Feature | Wie | Landt in | Effort | Bewijs |
|---|---|---|---|---|
| Eerlijk demo-materiaal (nummer, KvK, WhatsApp-patroon) | prospect + Klusbaas | `buildActiveSite`, `SiteView`, `SiteFooter` | S | 04-B1, 04-B2, 06-B5 |
| Leadbetrouwbaarheid (idempotentie, token, alarm, limiet) | Klusbaas | `leadHandler`, `storage`, `mailer` | M | 02-B1..B5 |
| Toegankelijke formulieren via één `Field` | bezoeker | nieuw `components/Field.tsx` + 7 formulieren | M | 06-F2 |
| Meetbare funnel (GTM + `utm`) | Klusbaas | `index.html`, `analytics.ts`, `App.tsx` | S | 01-F4, 02-§5 |

### Daarna (1–2 maanden) — productwaardig

| Feature | Waarom | Landt in | Effort |
|---|---|---|---|
| **Publiceren met eigen URL** (`/site/:slug` + `PublishedSiteRecord`) | van demo naar product | `types.ts`, nieuwe opslag, `router.ts`, `prerender.ts` | L |
| **Klantdashboard** (naam, diensten, foto's, openingstijden) | FAQ belooft het | nieuwe route achter Firebase Auth, `storage` | L |
| **Per-site ontvanger** + statusmodel offerte | echte klanten | `leadHandler`, `QuoteRecord` | M |
| **Stukadoor- en hovenier-tool** | 3/7 sectoren missen | `TradeTool`, `SectorData` | M |
| **Extras via `SectorData.blocks`** | 10 componenten staan stil | `SiteView`, `data/tradesData.ts` | M |

### Later (kwartaal) — groei

| Feature | Waarom | Effort |
|---|---|---|
| Per-vak landingspagina's + JSON-LD | organische vindbaarheid | M |
| Reviews met bron en Google-koppeling | roadmap 1.5/4.4 | M |
| i18n (BE) | nieuwe markt | L |
| Eigen agenda/capaciteit per vakman | echte boekingen | L |

## Deel 4 — Grote gokken (3)

**Gok 1 — Publiek publicatieplatform (L).** Elke klant een eigen site op een
subdomein, met dashboard en versies. Logisch: het is de kernbelofte. Risico:
multi-tenant opslag, routing, back-ups en support. Eerste validatie: verkoop 3
klanten een site en lever handmatig — als dat werkt, bouw je `PublishedSiteRecord`
en `/site/:slug`; als het niet werkt, heb je een half platform gebouwd.

**Gok 2 — Leadmarktplaats (L).** Klusbaas ontvangt leads en verdeelt ze. Meer
omzet per lead, maar juridisch (AVG, contracten) en operationeel zwaar. Eerste
validatie: 10 leads doorverkopen aan één bevriende vakman.

**Gok 3 — AI-contentgeneratie (M/L).** Teksten per sector automatisch
variëren. Aantrekkelijk tegen "dunne" demo's, maar de content is nu al
consistenter dan de fotografie; eerst foto's en unieke copy (03-B4), dan pas AI.

## Deel 5 — Expliciet niet doen

1. **CMS invoeren** — de content is nu één bestand van 1166 regels; een CMS kost
   een beheerlaag en lost niets op zolang niemand content redigeert.
2. **Betaalprovider aansluiten** — zonder offertestatus (24) heeft een
   betaallink geen fundament.
3. **Vijf nieuwe tools** — twee ontbrekende tools dekken 5 van de 7 sectoren;
   de rest is pas zinvol na publicatie.
4. **UI-herontwerp of nieuwe stijlen** — het paletcontract en de vijf stijlen
   werken en zijn getest; het probleem is gedrag.
5. **WCAG-certificering** — eerst `axe` en de concrete gaten (6, 45–48); een
   auditcertificaat is een verkoopargument voor overheidsklanten, niet voor
   vakmensen.
6. **Monorepo-splitsing** — de repo is klein genoeg; splitsen kost meer dan het
   oplevert.
7. **Video-implementatie** — de scripts zijn dood en er is geen distributeur;
   verwijderen (14) is goedkoper dan afmaken.

## Deel 6 — Uitvoerplan (4 sprints)

| Sprint | Thema | Punten | Bewijs na afloop |
|---|---|---|---|
| 1 | Eerlijk demo-materiaal | 1, 2, 3, 58, 39 | e2e zonder `fixme`; `dist/` bevat geen voorbeeldnummers |
| 2 | Leadbetrouwbaarheid + meten | 4, 5, 6, 8, 10, 11, 19 | tests voor idempotentie/token/alarm; GA4-debug toont funnel |
| 3 | Toegankelijkheid + CI | 6, 7, 9, 46, 48, 49, 10 | `axe`-run groen, `strict` aan, Lighthouse CLS < 0,1 |
| 4 | Inzicht + waarheid | 14, 15, 20, 51, 52, 53, 55 | inbox/dagmail live; docs-correcties + `docs:check` |

Parallel mogelijk: sprint 1 (UI/data) los van sprint 2 (server) en sprint 4
(docs). Sprint 3 raakt dezelfde bestanden als 1 (formulieren) — doe die na elkaar.

## Deel 7 — Documentatie bijwerken (na de bouw)

1. `AGENTS.md:9-12` — architectuur (zie KB-SRC-08 §6 voor de plakbare tekst).
2. `docs/architecture.md` — backend-paragraaf, state-tabel (afspraken in
   `localStorage`), testparagraaf (CI bestaat), cijfers.
3. `docs/known-limitations.md` — opgeloste punten eruit, nieuwe gaten erin
   (retentie, monitoring, per-site ontvanger).
4. `ROADMAP.md` — 1.1, 1.3, 2.x, 4.2/4.3 en 5.1/5.4 opnieuw waarmerken.
5. `docs/README.md` — index compleet (gedeeltelijk gedaan in `868e013`).
6. Nieuw: `docs/api.md`, `docs/environment.md`, `docs/data-model.md`.
7. `CHANGELOG.md` — deze audit als `docs:`-regel.

## Deel 8 — Open beslissingen voor de eigenaar

| # | Beslissing | Advies | Gevolg van uitstel |
|---|---|---|---|
| 1 | Eigen domein + Resend-verificatie | deze week | klantbevestigingen blijven naar één Gmail gaan |
| 2 | KvK/adres van Klusbaas | voor de eerste factuur | privacytekst en footer blijven onvolledig |
| 3 | Gaat een lead naar de vakman of naar Klusbaas? | per-site ontvanger | elke klantsite levert leads bij jou af |
| 4 | Wordt de demo een product (publiceren)? | ja, klein beginnen | de FAQ-belofte blijft onwaar |
| 5 | Welke prijs hoort bij Premium + € 25/maand? | handhaven, één bron | kortingen lopen uit de pas met `plans.ts` |
| 6 | Blijft `overige` een sector? | nee: fallback | zwakste demo in de outreach |
| 7 | Docs in het Engels of Nederlands? | Nederlands | blijvende mix, langzame onboarding |
| 8 | Wordt `.claude/arena` versiebeheerd? | nee | blijvende ruis in de repo |

## Verantwoording

- Invoer: `KB-SRC-01` … `KB-SRC-08` (alle acht gelezen, met bronverwijzingen in
  Deel 1).
- Tegenstrijdigheden die ik heb beslecht:
  1. **"Geen backend"**: 02 bewijst het tegendeel; 08 documenteert de fout — de
     code wint.
  2. **A11y-focus**: 06 vindt `index.css` goed geregeld, 08 noemt het als open;
     ik volg 06 (code) en houd alleen de concrete gaten over.
  3. **Rate limit**: 02 noemt het per instantie, docs ook; geen conflict, maar
     02 maakt het P1 (misbruik), docs P2 — ik volg 02.
- Steekproef: punten 1, 3, 4, 6, 7, 8, 10, 46 en 58 zijn opnieuw in de code
  gecontroleerd voor deze synthese.
- Niet geverifieerd: productiegedrag van Netlify/Resend (geen toegang).

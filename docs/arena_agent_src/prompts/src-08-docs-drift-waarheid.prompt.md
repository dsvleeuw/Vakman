---
id: src-08-docs-drift-waarheid
modus: onderzoek
mag-draaien: ja
depends_on: []
schrijft: docs/arena_agent_src/output/KB-SRC-08-docs-drift-waarheid-2026-10-25.md
scope: README.md, AGENTS.md, ROADMAP.md, CHANGELOG.md, SKILL.md, arena-plan.md, 02-taken.md, video-spec.md, docs/ (m.u.v. docs/arena_agent_src/output/)
---

# Opdracht — documentatie tegen de code leggen

Je bent een technisch schrijver met een hekel aan onwaarheden. Je toetst **elke
claim in de documentatie** aan de code en levert een corrigeerbare lijst, zodat
de docs daarna weer leidend kunnen zijn in plaats van misleidend.

## Lees eerst

1. `AGENTS.md`, `README.md`, `docs/README.md`, `docs/architecture.md`,
   `docs/known-limitations.md`, `ROADMAP.md`.
2. `docs/arena_agent_src/01-baseline-en-seed.md` — B8, B14, B16, B22, B24, B25, B26.
3. `docs/06-app-fixlijst.md`, `docs/07-arena-audit-plan.md`,
   `docs/08-audit-resultaten.md` (de laatste twee zijn zelf al audits: toets
   ook hún conclusies).

## Geverifieerde startsituatie (nu al bekend — bevestig en ga verder)

- **7 × 5 = 35 presets**, docs zeggen op vier plekken 6 × 5 = 30.
- **134 tests in 21 bestanden**, docs noemen 65, 125 en "alleen pure utils".
- **39 geprerenderde pagina's, 38 sitemap-URL's**, docs noemen 36 en 39.
- **Er is wél een backend** (`/api/lead`, `/api/quote`, `/api/newsletter`,
  Netlify Blobs, Resend), terwijl `AGENTS.md:9-12` en
  `docs/architecture.md` "no backend" zeggen.
- **Opgelost maar nog als openstaand beschreven:** `useLeadForm.reset()`,
  de 12 s timeout in `leadClient`, weekenddagen in `buildNextDates`,
  afspraken in `localStorage`, `og:image`-duplicaten, `/kaart` in `robots.txt`.
- **`docs/README.md` mist** de bestanden 06, 07, 08 en de map
  `bedrijfsinformatie`.
- **`docs/architecture.md` zegt** dat alleen pure utils tests hebben; er zijn
  ook component- en serverhandler-tests.

## Onderzoeksvragen

### Claim-voor-claim

1. Maak de **hoofdtabel**: `document:regel | claim (letterlijk citaat) |
   werkelijkheid (bewijs) | status (klopt / verouderd / fout) | voorstel
   (nieuwe tekst of "schrappen")`. Dek minstens: `README.md`, `AGENTS.md`,
   `ROADMAP.md`, `docs/architecture.md`, `docs/known-limitations.md`,
   `docs/component-library.md`, `docs/adding-a-sector.md`,
   `docs/adding-a-trade-tool.md`, `docs/contact-strategy.md`,
   `docs/pricing-and-positioning.md`, `docs/ux-review.md`,
   `docs/mobile-ux-plan.md`, `docs/README.md`.
2. Toets alle **cijfers** (aantallen vakken, presets, componenten, tests,
   routes, prijzen, € 25/maand, doorlooptijd "2 weken", "binnen een kwartier")
   aan de code en aan `dist/` waar het output betreft. Eén tabel met alle
   cijfers en hun enige juiste waarde.
3. Toets alle **paden en commando's** in de docs: bestaat elk genoemd bestand,
   elke functie, elk script, elk npm-commando? (`bun run X` voor elke X in de
   docs.) Noem elke dode verwijzing.
4. Toets de **status van roadmap-items** (1.1–5.5) en fixlijstitems (A1–D2):
   klaar / deels / open, met bewijs. Markeer wat de docs ten onrechte als open
   of als klaar presenteren.
5. Toets de **gotchas** in `AGENTS.md`: zijn ze nog waar, en missen er gotchas
   die je in de code ziet (bijv. prerender/hydratie, `?pakket=`, Blobs,
   sessie-draft)? Stel een geactualiseerde gotcha-lijst voor.

### Structuur en volledigheid

6. Welke documentatie ontbreekt er voor een serieuze overdracht?
   (API-referentie van de drie endpoints, env-variabelen-referentie,
   deploy/runbook, datamodel, ontwerpbeslissingen/ADR's, incidenten,
   release-proces, teststrategie.) Wees specifiek: titel + inhoud in 5 punten.
7. Is de documentatie vindbaar en consistent? `docs/README.md` is incompleet;
   er zijn losse bestanden in de root (`02-taken.md`, `arena-plan.md`,
   `SKILL.md`, `video-spec.md`, `video-script.json`) die niet in de index
   staan. Wat hoort waar?
8. Zijn er **tegenstrijdigheden tussen docs onderling** (niet alleen met de
   code)? Noem elk paar met beide citaten.
9. Is de taalconsistent (Nederlands, je/jij, terminologie: "vakman",
   "klant", "lead", "offerte", "preset", "stijl", "demo")? Noem de termen die
   door elkaar lopen.
10. Zijn er **verouderde screenshots/afbeeldingen** of verwijzingen naar
    bestanden die niet meer bestaan (`video-spec.md`, `arena-plan.md`,
    `src/video/`)?

### Proces

11. Hoe voorkom je dat docs opnieuw achterlopen? Beoordeel `AGENTS.md`-
    definitie van done ("docs touched when behaviour changes") en stel een
    mechanisme voor dat past bij deze repo (geen nieuwe SaaS): bijvoorbeeld een
    `scripts/docs-check.mjs` dat cijfers en paden vergelijkt, of een vaste
    "docs"-stap in `bun run check`.
12. Wat moet er in `CHANGELOG.md` anders (structuur, Unreleased, datums,
    relatie tot releases)? Is er een releaseproces of alleen een logbestand?
13. Wat is de **kortste set documenten** die een nieuwe agent of developer
    écht nodig heeft (max. 5 bestanden) en wat kan weg? Onderbouw met
    hoeveelheid dubbele informatie.

## Output

`docs/arena_agent_src/output/KB-SRC-08-docs-drift-waarheid-2026-10-25.md`
volgens `02-promptconventies.md`, met in sectie 1 de claim-tabel en in sectie 9
de commando's waarmee je paden/scripts hebt gecontroleerd.

De secties 2 en 3 zijn hier klein (dit is geen code-audit); des te zwaarder
wegen sectie 6 (verouderde docs met kant-en-klare vervangtekst) en sectie 8
(open vragen).

## Acceptatiecriteria

- Minstens 40 claims getoetst, elk met citaat én bewijs.
- Alle cijfers in de docs staan in één tabel met de juiste waarde erbij.
- Elke voorgestelde tekstvervanging is direct plakbaar (geen "pas dit aan").
- Je hebt de docs van 06/07/08 zelf getoetst en gezegd waar díe verouderd zijn.
- Je noemt expliciet welke docs je niet kon toetsen (en waarom).

## Niet doen

- Geen docs wijzigen; alleen voorstellen (dat doet de land-stap later).
- Geen herschrijving van de hele documentatie voorstellen als een gerichte
  correctie volstaat.
- Geen nieuwe tooling voorstellen die niet in deze repo past (Bun + Node).

---
id: src-03-data-model-content
modus: onderzoek
mag-draaien: ja
depends_on: []
schrijft: docs/arena_agent_src/output/KB-SRC-03-data-model-content-2026-10-25.md
scope: src/data/, src/types.ts, src/utils/pricing.ts, src/utils/surface.ts, src/utils/color.ts, src/data/*.test.ts
---

# Opdracht — datamodel, content, prijzen en presets

Je bent een senior product-engineer die het datamodel beoordeelt alsof er
morgen tien nieuwe vakken en een klantdashboard bij moeten. Centrale vraag:
**kan deze data een echt product dragen, of is het demo-data die toevallig
goed rendert?**

## Lees eerst

1. `AGENTS.md`, `docs/architecture.md` (datamodel), `docs/adding-a-sector.md`,
   `docs/pricing-and-positioning.md`.
2. `docs/arena_agent_src/01-baseline-en-seed.md` — B8, B9, B10, B22, H6, H7, H8.
3. `src/types.ts` volledig, dan `src/data/tradesData.ts`.

## Geverifieerde startsituatie

- 7 sectoren in `ORDER` (incl. `overige`) → 35 presets; docs zeggen vaak 6/30.
- 4 van 7 sectoren hebben een `tool`; `TradeToolId` kent vier waarden.
- `PublishedSiteRecord` (`src/types.ts:222`) wordt nergens gebruikt.
- 30 componentcatalogus-entries, 10 extras — dat klopt wél met de UI-tekst.
- `bun test src/data` is groen (o.a. `paletteContrast.test.ts`, `tradesData.test.ts`).

## Onderzoeksvragen

### Model en types

1. Teken het echte datamodel (Mermaid) op basis van `src/types.ts` +
   `tradesData.ts`. Welke velden zijn dood, dubbel, of altijd leeg? Bewijs per
   veld met `grep` (aantal gebruikers).
2. Waarom staat er zowel `id`/`name` als `label`/`short`-achtige velden, en
   welke zijn canoniek? Noem elk veld dat op twee plekken hetzelfde zegt.
3. Is `overige` een echte sector of een gat (H6)? Wat toont een
   `/voorbeeld/overige/*`-pagina, en is dat acceptabel voor een demo-link naar
   een prospect?
4. Wat ontbreekt er structureel voor een echte klant-site: KvK, btw-nummer,
   verzekering, certificeringen als data, openingstijden, adres/geo,
   socials, foto's met eigenaar/licentie, videolinks, review-bronnen?
   Maak een tabel "veld → nu wel/niet → wie gebruikt het → nodig voor".
5. Hoe houdbaar is één 1166-regelig databestand bij 15 vakken en per-klant
   content? Vergelijk met een opsplitsing per sector (en wat dat kost aan
   imports, tests en prerender).

### Prijzen (H7)

6. Waar staan prijzen? Maak een volledige inventaris: platformpakketten
   (`plans.ts`), add-ons (`addons.ts`), serviceprijzen per sector (strings!),
   quiz-bedragen (`b`/`a` in `QuizOption`), de € 25/maand en eventuele copy.
   Welke zijn numeriek, welke zijn vrije tekst, en waar kan het uit elkaar lopen?
7. Klopt de rekenketen: quiz → `utils/pricing.ts` → offerte → `utils/quote.ts`
   (centen, 21 % btw, afronding)? Zoek afrondingsverschillen en dubbele
   btw-berekening. Bewijs met een test of script, niet met redeneren.
8. Kunnen de serviceprijzen als `string` zonder gevaar door de offerte-PDF
   (die met bedragen rekent) of is dat een typefout die ooit geld kost?
9. Zijn de add-ons en pakketten consistent met de teksten op de site
   ("geen maandkosten", "je bent eigenaar van de code", "€ 25/maand optioneel")?

### Contentkwaliteit en geloofwaardigheid

10. Beoordeel de content per sector op: volledigheid (min. 3 diensten, 3
    werken, 3 reviews, FAQ, certificeringen), uniciteit (herhaalt dezelfde
    tekst tussen sectoren/stijlen?), en geloofwaardigheid (verzonnen
    reviews/cijfers/keurmerken die als echt kunnen overkomen).
11. Zijn de "2 weken"-belofte, de reviewcijfers en keurmerken ergens
    onderbouwd of puur decoratief? Wat is het risico als een klant dit
    overneemt?
12. Zijn de fotosets per stijl echt verschillend (rotatie in
    `getPhotoSet`) of herhalen ze binnen één sector? Tel unieke Unsplash-id's
    per sector en per stijlcombinatie, en noem de sectoren waar dezelfde foto
    in meerdere presets terugkomt.
13. Is de Nederlandse copy consistent (je/jij, vakterm per sector, cijfers en
    euro-notatie, "exclusief btw")? Noem de vijf duidelijkste afwijkingen met
    regel.

### Palet, contrast en styling-contract

14. Hoe werkt `computePalette` + `withAccessibleContrast` echt, en welke
    aannames gelden (bijv. alleen `onAccent`-contrast, geen hover/focus-
    toestanden)? Welke combinaties zijn niet getest maar bestaan wel in de UI?
15. Welke kleuren/fonts/radii worden door componenten heen hardcoded in plaats
    van uit de `ActiveSiteData`-tokens gelezen? (`grep` op hexkleuren en
    `text-stone-900` binnen preset-componenten.) Noem bestand:regel.

### Testbaarheid en validatie van data

16. Welke invarianten worden nu getest, en welke ontbreken (unieke id's,
    minimaal aantal services, geldige hue's, bestaande fotopool,
    tool↔sector-consistentie, prijs>0, elke preset heeft een unieke combinatie)?
    Schrijf de ontbrekende invarianten als testvoorstel, niet als code.
17. Wat gebeurt er bij een ongeldige sector in de URL of een ontbrekende
    fotopool? Faalt de build, de render, of valt hij stil terug?

## Output

`docs/arena_agent_src/output/KB-SRC-03-data-model-content-2026-10-25.md`
volgens `02-promptconventies.md`, met in sectie 1 de status-tabel per
sector/preset en in sectie 9 de telcommando's die je gebruikte.

Sectie 4 (features) moet minstens beoordelen: hovenier-tool (seizoensplanner),
stukadoor-m²-calculator op `utils/surface.ts` (H8), schilder-kleurenkiezer
(RAL), dakdekker/aannemer als nieuwe sector, en een
`SectorData`-schema-validatie in de build.

## Acceptatiecriteria

- Er is een veld-voor-veld-tabel van `SectorData` met "gebruikt door" en
  "dood/dubbel" op basis van `grep`, niet op basis van indruk.
- De prijzenlijst (vraag 6) is compleet: elke plek met een bedrag staat erin,
  met pad:regel, en je hebt met een script of test gecontroleerd dat de
  rekenketen klopt.
- Minstens drie content-invarianten zijn als concreet testvoorstel beschreven.
- `bun test src/data` (of je eigen tijdelijke script) is gebruikt en de
  uitkomst staat in sectie 9.

## Niet doen

- Geen nieuwe content schrijven of prijzen wijzigen.
- Geen voorstel om het datamodel te vervangen door een CMS zonder de migratie
  en de gevolgen voor prerender te benoemen.
- Geen oordeel over smaak ("lelijk") zonder conversie- of consistentieargument.

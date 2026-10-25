# KB-SRC-03 — Datamodel, content en prijzen

- **Datum:** 2026-10-25 · **Commit:** `7d5ec3d`
- **Prompt:** `prompts/src-03-data-model-content.prompt.md`
- **Soort:** read-only · **Uitgevoerd met:** codelezen, `grep`-inventarisaties,
  `bun test src/data`

## 0. Samenvatting

Het datamodel is **consistent genoeg om te renderen en te zwak om een product te
dragen**. Prijzen zijn netjes gescheiden: pakketten en add-ons zijn getallen in
`plans.ts`/`addons.ts`, en de offerte rekent daar server-side mee. Maar
**serviceprijzen per sector zijn vrije tekst** (`p: string`, "v.a. € 650"),
de zevende sector (`overige`) is een leeg shell-vak, en er ontbreken velden die
elke echte klantsite nodig heeft (adres, KvK, openingstijden, keurmerken als
data). De grootste structurele schuld is één bestand van 1166 regels waarin alle
zeven sectoren, quizzen, reviews en fotopools zitten.

## 1. Status-tabel

| # | Onderdeel | Belofte | Werkelijkheid | Status | Ernst | Effort |
|---|---|---|---|---|---|---|
| 1 | 35 presets | README | 7 × 5 in `ORDER`/`STYLES` (`tradesData.ts:14-22`) | klaar | — | — |
| 2 | Prijzen één bron | "prijzen alleen uit plans/addons" | `plans.ts:17-70`, `addons.ts`, `quote.ts:51-82` | klaar | — | — |
| 3 | Serviceprijzen | getoond per dienst | `p: string` vrije tekst (`types.ts:44-49`) | deels | P2 | M |
| 4 | Quizprijzen | calculator | `b`/`a` getallen per optie (`tradesData.ts:154-173`) | klaar | — | — |
| 5 | `overige`-sector | 7e vak | eigen data, maar generiek en zonder tool | deels | P2 | S |
| 6 | Slimme tools per sector | "elke sector zijn tool" | 4 van 7 (`tradesData.ts:149,388,508,630`) | ontbreekt | P2 | M |
| 7 | Publicatie-record | roadmap 1.4 | `PublishedSiteRecord` (`types.ts:222`) nergens gebruikt | ontbreekt | P2 | L |
| 8 | Contentkwaliteit | demo's overtuigen | 7 sectoren × 5 stijlen delen dezelfde tekstbasis | deels | P2 | M |
| 9 | Paletcontract | WCAG AA | `paletteContrast.test.ts` dekt 7 × 5 (94 r.) | klaar | — | — |
| 10 | Data-validatie | — | alleen losse tests, geen schema-check bij build | ontbreekt | P2 | S |

## 2. Bugs en defecten

**B1. Prijzen in drie formaten.**
- Pakketten: getal in euro (`plans.ts:24` `price: 595`).
- Add-ons: getal in euro (`addons.ts:28` `price: 49`).
- Services per sector: **string** (`tradesData.ts:154` `p: 'v.a. € 650'`).
- Quiz: getal in euro (`b`/`a`).
`formatPrice` (`pricing.ts:37-39`) rondt af en is alleen voor de calculator;
`formatEuroCents` (`quote.ts:86-92`) rekent in centen voor de offerte. Twee
notaties naast elkaar betekent dat een serviceprijs nooit in een offerte kan
worden opgeteld zonder parse-stap. *Risico:* een verkeerd bedrag op een
offerte-PDF. *Fix (M):* `services[].priceCents?: number` toevoegen, `p` als
weergavetekst houden, en een test die beide in sync houdt.

**B2. `overige` is een sector zonder identiteit.**
De zevende sector heeft dezelfde vorm als de andere, maar een prospect die
`/voorbeeld/overige/klassiek` opent ziet een algemene klus-site zonder
vakidentiteit. Bij outreach is dat de zwakste demo. *Fix (S):* óf een echte
"aannemer/klusbedrijf"-sector maken, óf `overige` uit `ORDER` halen en alleen
als fallback houden.

**B3. Vier van zeven sectoren hebben geen tool.**
Hovenier, stukadoor en overige hebben `tool` niet gezet; `TradeTool` toont dan
niets (`TradeTool.tsx`). De roadmap noemt 2.3/2.4/2.5 als open, maar de UI/README
suggereert dat elke sector een slimme tool heeft. `utils/surface.ts` is al
generiek en getest (`surface.test.ts`), dus de stukadoor-tool is bijna gratis.

**B4. Fotopools herhalen binnen een sector.**
`getPhotoSet` roteert een pool per stijl (`tradesData.ts`), maar de pools zijn
klein: dezelfde Unsplash-id's komen in meerdere presets terug en de portfolio
gebruikt `[a, b, c][idx] || a` (`tradesData.ts:1128-1132`), dus bij minder dan
drie foto's herhaalt de eerste. *Effect:* "premium design" oogt als stock.
*Fix (M):* pools per sector uitbreiden naar ≥ 10 en een test op uniciteit binnen
één preset.

**B5. Verzonnen KvK en reviews als hardcoded content.**
`SiteView.tsx:1292` toont `KvK 12345678` in de footer van elke demosite;
reviews en keurmerken komen uit `SectorData`. Voor een demo is dat verdedigbaar,
maar zodra een klant zijn site overneemt, staat er een onjuist KvK-nummer en
niet-bestaande reviews op een bedrijfssite. *Fix (S):* `kvk?: string` in
`ActiveSiteData`, alleen tonen als gevuld, en in de demo "KvK volgt" of weglaten.

**B6. Geen schema-validatie bij de build.**
`data/*.test.ts` test losse eigenschappen (aantal sectoren, contrast), maar niet
de invarianten die een preset bruikbaar maken: elke sector ≥ 3 services, ≥ 3
werken, ≥ 3 reviews, ≥ 3 FAQ's, unieke id's, bestaande fotopool, tool ↔
`TradeToolId`. Een ontbrekend veld valt nu pas op in de browser.

## 3. Ontbrekende functionaliteit

1. **Velden voor een echte klantsite:** adres/geo, KvK, btw-nummer,
   openingstijden, keurmerken (VCA, garanties) als data, socials, reviewbron.
2. **Publicatie/versie:** `PublishedSiteRecord` bestaat maar wordt nooit
   geschreven (roadmap 1.4/3.3).
3. **Content per klant:** alleen naam/eigenaar/telefoon/stad zijn variabel
   (`WizardFormData`); diensten, foto's en teksten niet.
4. **Schema-check in de build** (B6) en een `docs/data-model.md` dat de velden
   en hun gebruikers beschrijft.
5. **Tool voor hovenier/stukadoor** (B3) en een kleurenkiezer voor de schilder
   (roadmap 2.5).

## 4. Nieuwe feature-ideeën

**F1. Stukadoor-m²-calculator (S).** `SurfaceCalculator` bestaat al en
`utils/surface.ts` is getest; alleen `tool: 'm2-calculator'` toekennen aan
`stukadoor` en de teksten/eenheid (wanden vs. gehele woning) differentiëren.
Hoogste rendement per uur van alle roadmap-items.

**F2. Hovenier-seizoensplanner (M).** Data-gedreven: per maand 3 onderhoudstaken
uit `SectorData.maintenance[12]`, met een "plan mijn onderhoud"-knop die een
lead met gekozen maanden stuurt. Nieuwe tool-id `season-planner` in
`TradeToolId` en een entry in `TradeTool`.

**F3. RAL-kleurenkiezer voor de schilder (M).** Een subset RAL-kleuren als data
(`data/ralColors.ts`), 3–4 adviespakketten met prijsverschil, doorgestuurd in de
WhatsApp-tekst. Sluit aan op `m2-calculator` en `addons.ts`.

**F4. Echte publicatie (L).** `PublishedSiteRecord` vullen bij "publiceren":
sector, stijl, formulier, diensten, slug, timestamp; route `/site/:slug` die uit
de opslag leest. Dat maakt van "demo" een product en is de voorwaarde voor
klantbeheer.

**F5. Data-schema in de build (S).** `data/schema.test.ts` met de invarianten
uit B6. Vangt precies de fouten die nu in de browser opvallen.

**Grote gok: content per sector uit een CMS (L).** Nu is één bestand met 1166
regels de bron. Een CMS (of JSON per sector) maakt redactie mogelijk zonder
deploy, maar kost een beheerlaag, caching en een migratie; alleen doen als
contentredactie een taak wordt.

## 5. Beter-kunnen

- **Bestandsgrootte:** `tradesData.ts` 1166 regels, `SiteView` 1367,
  `WizardView` 1341. Opsplitsen per sector (`data/sectors/loodgieter.ts`)
  verlaagt de kans op merge-conflicten en maakt tests per sector mogelijk.
- **Types:** `SectorData` heeft `name` én `biz`; `ActiveSiteData` extends
  `SectorData` en voegt `accent`, `card`, `radiusLg` … toe — een vlakke
  mengeling van content en presentatie. Een `theme`-subobject zou duidelijker
  zijn.
- **Contrast:** `paletteContrast.test.ts` test tekst op achtergrond, maar niet
  hover/focus/disabled (zie KB-SRC-06).
- **Euro-notatie:** door de drie formaten (B1) is er geen enkele plek die
  verklaart wanneer "v.a." hoort te staan; voeg een richtlijn toe aan
  `docs/pricing-and-positioning.md`.

## 6. Verouderde of foute documentatie

| Document:regel | Citaat | Werkelijkheid | Voorstel |
|---|---|---|---|
| `src/data/README.md:9` | "6 sectoren × 5 stijlen = 30 presets" | 7 × 5 = 35 | "7 sectoren × 5 stijlen = 35 presets" |
| `AGENTS.md:9` | "6 trades × 5 styles = 30 presets" | idem | idem |
| `docs/architecture.md:14` | "30 presets" | idem | idem |
| `docs/known-limitations.md` | "roofer en contractor niet geïmplementeerd" | `overige` bestaat als zevende sector | verduidelijken wat `overige` is |

## 7. Top 5

| # | Aanbeveling | Ernst | Effort | Confidence |
|---|---|---|---|---|
| 1 | Serviceprijzen numeriek maken (B1) | P2 | M | hoog |
| 2 | Stukadoor-tool aanzetten (F1) | P2 | S | hoog |
| 3 | Data-invarianten als test (F5/B6) | P2 | S | hoog |
| 4 | `overige` beslissen: echte sector of fallback (B2) | P2 | S | midden |
| 5 | Publicatiemodel bouwen (F4) | P2 | L | midden |

## 8. Open vragen

1. Blijft `overige` zichtbaar in de presets, of wordt het een verborgen
   fallback?
2. Komen er echte KvK-/adresgegevens per klant (nodig voor footer en JSON-LD)?
3. Wordt content ooit door de klant zelf beheerd (dan nu al velden voorzien)?

## 9. Verantwoording

- `bun test src/data` → groen (o.a. `paletteContrast.test.ts`,
  `tradesData.test.ts`, `componentCatalog.test.ts`).
- Geteld: `grep -c "id: '" src/data/componentCatalog.ts` → 30;
  `ls src/components/extras` → 10 componenten + index + test.
- Niet gedaan: visuele beoordeling van alle 35 presets in de browser.

# KB-SRC-05 — Tools, extras en marketingcomponenten

- **Datum:** 2026-10-25 · **Commit:** `7d5ec3d`
- **Prompt:** `prompts/src-05-tools-extras-componenten.prompt.md`
- **Soort:** read-only · **Uitgevoerd met:** codelezen, `grep`-inventarisatie,
  `bun test src/components`

## 0. Samenvatting

De vier tools zijn **goed gemaakt en goed getest op SSR-niveau**, maar ze dekken
maar 4 van de 7 sectoren. Het grootste probleem is van een andere orde: de tien
"herbruikbare componenten" in `src/components/extras/` worden **uitsluitend door
de componentengalerij gerenderd** — ze staan op géén enkele demosite. Er is dus
een etalage met tien zorgvuldig gebouwde trust- en conversieblokken die het
product niet gebruikt. Verder is `TradeTool` een schone dispatcher, maar
`ProjectTimeline` is hard aan de timmerman vastgeschreven.

## 1. Status-tabel

| # | Tool / component | Sector | Werkt | Lead naar `/api/lead` | Test | Oordeel |
|---|---|---|---|---|---|---|
| 1 | `EmergencyButton` | loodgieter | ja, spoedchips + WhatsApp | nee (WhatsApp-deeplink) | SSR-smoke | goed, maar geen registratie van spoedaanvragen |
| 2 | `FaultReportForm` | elektricien | ja, 6 velden + urgentie + validatie | ja | SSR-smoke + e2e-indirect | sterkste tool |
| 3 | `SurfaceCalculator` | schilder | ja, 5 velden, m² → prijs | ja (offerteaanvraag) | SSR-smoke | generiek herbruikbaar |
| 4 | `ProjectTimeline` | timmerman | ja, 4 vaste stappen (`ProjectTimeline.tsx:13-34`) | nee | SSR-smoke | te specifiek, moet data-gedreven |
| 5 | 10 extras | geen | alleen in galerij | n.v.t. | `extras.test.tsx` | **shelfware** |
| 6 | `TradeTool` | dispatcher | ja, `default: null` (`TradeTool.tsx:30-31`) | — | — | schoon |

## 2. Bugs en defecten

**B1. De tien extras staan op geen enkele demosite.**
`grep -rl "<Naam>" src --include=*.tsx` levert voor alle tien uitsluitend
`src/components/ComponentGallery.tsx` op. De galerij belooft "30 componenten,
inclusief tien nieuwe herbruikbare trust- en conversieblokken" (README), maar
`SiteView` gebruikt ze niet. Dat is geen bug in de componenten, wel een
**gemiste kans en een misleidende indruk** in de demo's.

**B2. `ProjectTimeline` is niet data-gedreven.**
De vier stappen staan als constante in het component (`ProjectTimeline.tsx:13-34`);
de roadmap (2.2/2.6) vraagt om configuratie per sector. Zonder wijziging kan de
aannemer-sector (roadmap 2.2) deze tool niet hergebruiken.

**B3. Spoedaanvragen worden niet geregistreerd.**
`EmergencyButton` maakt alleen een WhatsApp-deeplink
(`buildEmergencyMessage`, `contact.ts:150`). Een loodgieter die geen WhatsApp
gebruikt, ziet niets; Klusbaas ook niet. Voor de duurste leadsoort (spoed) is dat
een gat. *Fix (S):* dezelfde `useLeadForm`-flow als `FaultReportForm`, met
WhatsApp als extra knop.

**B4. `SurfaceCalculator` rekent met invoer die niet gevalideerd wordt tegen
onzin.** Vijf velden (dienst, wanden, lengte, hoogte, aantal) — zie
`SurfaceCalculator.tsx:168-222`. Negatieve of enorme waarden (10.000 m²) geven
een absurde prijs in de WhatsApp-tekst; er is geen bovengrens. *Fix (S):*
`min`/`max` + een `clamp` in `utils/surface.ts` (daar zit de rekenkunde al).

**B5. Extras hebben geen enkele plek in de catalogus-preview-flow buiten de
galerij.** De catalogus (`componentCatalog.ts`, 30 entries) verwijst naar
previews; de "Nieuw"-categorie (regels 104, 113) bevat de extras. Als een extra
ooit op een site moet, ontbreekt de koppeling met `SiteView` (geen prop, geen
`SectorData`-veld).

**B6. `SiteFooter` toont een verzonnen KvK (zie KB-SRC-04 B2)** en de
contactgegevens van Klusbaas, niet van de vakman — logisch voor een demo, maar
het staat ook op `/voorbeeld/...` zonder uitleg.

## 3. Ontbrekende functionaliteit

1. **Tool voor hovenier, stukadoor en overige** (KB-SRC-03 F1/F2).
2. **Extras activeren op de demosite**: minimaal `TrustBar`,
   `OpeningHoursCard`, `ServiceAreaChips`, `ProjectStats` en
   `ContactCtaBanner` hebben data die al in `SectorData`/`ActiveSiteData` zit of
   met één veld toe te voegen is.
3. **Registratie van spoedaanvragen** (B3).
4. **Een `SectorData.extras`-veld** waarmee per sector bepaald wordt welke
   blokken verschijnen — anders blijft het maatwerk in `SiteView`.
5. **Betekenisvolle componenttests**: nu alleen "rendert zonder crash"
   (`extras.test.tsx`, 10 tests).

## 4. Nieuwe feature-ideeën

**F1. Extras aanzetten via data (M).**
`SectorData.blocks?: BlockId[]` met `trustbar|hours|area|stats|cta`; `SiteView`
rendert ze op vaste plekken. Eén wijziging maakt tien componenten productiewaardig
en geeft elke sector een eigen accent. Bewijs dat het kan: alle props zijn al
`site`/`palette`-based (`extras/index.ts`).

**F2. Foto-upload bij storing (M).**
`FaultReportForm` heeft 6 velden maar geen foto; een foto van de groepenkast is
voor een elektricien het verschil tussen wel/niet langskomen. Vereist opslag
(Blobs) en een multipart-endpoint; daarmee wordt `/api/lead` uitgebreid.
Let op: dit is de eerste binary-upload in het project.

**F3. Spoed-triage met terugbelbelofte (S).**
`EmergencyButton` stuurt nu alleen WhatsApp. Voeg "bel mij binnen 15 minuten"
toe met telefoonveld → `POST /api/lead` met `type: 'emergency'`, plus een
zichtbare status. Sluit aan op B3.

**F4. Reviews met bron (S).**
`TestimonialCard` toont nu losse quotes; voeg `source: 'Google'|'Klant'` en een
datum toe, zodat de Google-badge (roadmap 1.5) niet langer een loze belofte is.

**F5. Tool-galerij in de wizard (S).**
Bij stap "diensten" tonen welke tool bij het vak hoort, zodat de vakman snapt
wat hij krijgt (en Klusbaas kan upsellen naar Premium, dat de tool als feature
noemt in `plans.ts:56`).

**Grote gok: generieke tool-engine (L).**
Alle tools als configuratie (velden, opties, berichttemplate) in plaats van
componenten. Aantrekkelijk voor 10+ vakken, maar de vier huidige tools hebben
echt verschillende interactiepatronen (spoed vs. berekening vs. tijdlijn); een
engine zou ze tot hetzelfde middelmatige formulier platslaan.

## 5. Beter-kunnen

- **Contactlaag:** alles loopt via `utils/contact.ts` (11 helpers, één
  `normalizeDutchPhone`), inclusief berichtopbouw per context. Dat is netjes en
  getest (`contact.test.ts`). Controleer bij nieuwe tools of er geen tweede
  berichtopbouw ontstaat.
- **WhatsApp-lengte:** de voorgevulde berichten worden snel lang
  (`buildFaultReportMessage`, `buildSurfaceQuoteMessage`); WhatsApp toont de
  eerste regels. Begin met de kern (naam, dienst, bedrag) en zet details achter.
- **Palette-tokens:** de extras gebruiken `site.*`-tokens; `EmergencyButton`
  heeft een eigen donkere stijl met `text-white`-achtige aannames — controleer
  op de lichte stijlen (KB-SRC-06).
- **Marketingpagina:** `PricingSection` en `plans.ts` moeten één bron blijven;
  nu staan bedragen ook in de features-teksten (bijv. "service t.w.v. € 75").
- **Galerij:** de previews zijn statisch; een "kopieer code"-knop zou de
  bibliotheek echt bruikbaar maken voor doorontwikkeling.

## 6. Verouderde of foute documentatie

| Document:regel | Citaat | Werkelijkheid | Voorstel |
|---|---|---|---|
| `README.md` features | "inclusief tien nieuwe herbruikbare trust- en conversiecomponenten" | ze staan alleen in de galerij | "tien componenten in de bibliotheek (nog niet op de demosites)" |
| `docs/component-library.md` | beschrijft herbruikbaarheid | idem | status toevoegen per component |
| `docs/adding-a-trade-tool.md` | stappen voor een nieuwe tool | `ProjectTimeline` is niet data-gedreven | waarschuwing toevoegen |
| `ROADMAP.md` 2.3–2.6 | open | nog steeds open (bevestigd) | handhaven |

## 7. Top 5

| # | Aanbeveling | Ernst | Effort | Confidence |
|---|---|---|---|---|
| 1 | Extras via `SectorData.blocks` op de demosite (F1) | P2 | M | hoog |
| 2 | Spoedaanvragen registreren (B3/F3) | P1 | S | hoog |
| 3 | `ProjectTimeline` data-gedreven maken (B2) | P2 | S | hoog |
| 4 | Stukadoor/hovenier-tool aanzetten (KB-SRC-03) | P2 | S/M | hoog |
| 5 | Betekenisvolle asserts per extra (testkwaliteit) | P3 | S | hoog |

## 8. Open vragen

1. Mogen de extras standaard aan op elke demosite, of per sector?
2. Is foto-upload bij een storing gewenst (opslag + privacy)?
3. Blijft de galerij een verkoopargument of wordt het interne documentatie?

## 9. Verantwoording

- Gelezen: `TradeTool.tsx`, `EmergencyButton.tsx`, `ProjectTimeline.tsx`
  (kern), `FaultReportForm.tsx` (velden/urgentie), `SurfaceCalculator.tsx`
  (velden), `extras/index.ts`, `data/componentCatalog.ts` (categorieën),
  `utils/contact.ts` (11 exports).
- Geteld: 4 tool-toekenningen (`tradesData.ts:149,388,508,630`);
  `grep`-bewijs dat de 10 extras alleen in `ComponentGallery.tsx` voorkomen.
- `bun test src/components` → groen (o.a. 10 SSR-smoke tests).

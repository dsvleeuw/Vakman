---
id: src-05-tools-extras-componenten
modus: onderzoek
mag-draaien: ja
depends_on: []
schrijft: docs/arena_agent_src/output/KB-SRC-05-tools-extras-componenten-2026-10-25.md
scope: src/components/tools/, src/components/extras/, src/components/ContactSection.tsx, src/components/FaqSection.tsx, src/components/HeroStrip.tsx, src/components/PresetsSection.tsx, src/components/PricingSection.tsx, src/components/HowItWorks.tsx, src/components/NewsletterSignup.tsx, src/components/ImageWithFallback.tsx, src/data/componentCatalog.ts, src/utils/contact.ts
---

# Opdracht — slimme tools, herbruikbare componenten en de marketingpagina

Je bent een senior front-end engineer met een conversie-bril. Je onderzoekt de
bouwstenen waaruit de 35 demosites en de marketingpagina bestaan: werken ze,
worden ze echt gebruikt, en welke ontbreken?

## Lees eerst

1. `AGENTS.md` (conventies, palette-tokens, contact-helpers),
   `docs/component-library.md`, `docs/adding-a-trade-tool.md`,
   `docs/contact-strategy.md`.
2. `docs/arena_agent_src/01-baseline-en-seed.md` — B9, B12, B18, B21, B22, H8, H9.
3. `src/components/tools/TradeTool.tsx` (de dispatcher) en daarna elke tool.

## Geverifieerde startsituatie (belangrijk)

- Er zijn vier tools (`emergency`, `fault-report`, `m2-calculator`, `timeline`)
  en ze zijn aan **4 van de 7** sectoren toegekend (`tradesData.ts:149,388,508,630`).
- De tien componenten in `src/components/extras/` worden **alleen** door
  `ComponentGallery.tsx` gerenderd: geen enkele extras-component staat op een
  echte demosite. Ze zijn dus een etalage, geen onderdeel van het product.
  Controleer dat zelf opnieuw en meld het als het klopt (of niet).
- Alleen `components/extras/extras.test.tsx` test componenten (SSR-smoke).

## Onderzoeksvragen

### Tools

1. Maak per tool een tabel: sector, bron van de inhoud, velden, validatie,
   WhatsApp/mail-payload, leadbron (`source`), succestoestand, faaltoestand,
   mobiel gedrag, testdekking. Bewijs per cel.
2. Is `TradeTool` een schone dispatcher of bevat hij tool-specifieke logica?
   Wat gebeurt er bij een onbekende/ontbrekende `tool`?
3. Zijn de tools generiek te maken (data in `SectorData`) of zijn het
   één-op-één componenten? Beoordeel `ProjectTimeline` (nu met
   timmerman-constanten) en `SurfaceCalculator` (nu schilder-only) als
   kandidaten voor data-gedreven hergebruik (H8, roadmap 2.6).
4. Wat mist er per tool om écht werk uit handen te nemen: foto-upload bij een
   storing, urgentie/dringendheid, adres, beschikbaarheid, prijsindicatie,
   status "wat gebeurt nu"? Wees concreet en code-gebonden.
5. Welke nieuwe tool zou per ontbrekende sector (hovenier, stukadoor, overige)
   het meeste opleveren, gegeven de bestaande utils en het datamodel? Onderbouw
   per sector met één aanbeveling, geen lijstje van vijf.
6. Zijn de tools eerlijk over wat ze doen (verzenden ze echt, of openen ze
   alleen WhatsApp)? Wat ziet de gebruiker bij een storing in de API?

### Componenten en etalage

7. Bewijs de "shelfware"-hypothese: welke componenten worden buiten de galerij
   gebruikt, en welke niet? Wat is de bedoeling geweest (docs, catalogus)?
8. Is de catalogus een betrouwbare inventaris: kloppen `path`, `label`,
   categorie, preview voor alle 30 entries met de werkelijkheid? Noem elke
   afwijking (dood pad, verkeerde preview, ontbrekende entry voor een bestaand
   component).
9. Welke van de tien extras horen op een demosite thuis (trust bar,
   openingstijden, beschikbaarheid, team, review, garanties, actie,
   werkgebied, statistieken, contact-CTA), en welke zijn overbodig? Koppel elke
   aanbeveling aan een sectie in `SiteView` en aan data die er al is.
10. Zijn de component-API's consistent (props, palette-tokens, `site.accent` vs
    hardcoded kleuren, radius, spacing)? Noem elke inbreuk met regel.
11. Wat is de testwaarde van de SSR-smoke tests: vangen ze regressies of alleen
    "rendert niet"? Stel per component één betekenisvolle assertie voor.

### Marketingpagina

12. Loopt de marketingpagina (`HeroStrip`, `PresetsSection`, `HowItWorks`,
    `PricingSection`, `NewsletterSignup`, `ContactSection`, `FaqSection`,
    `SiteFooter`) synchroon met het product: kloppen aantallen (35 presets,
    30 componenten, 6/7 vakken), prijzen (€ 595/€ 995/€ 1.795, € 25/maand,
    excl. btw) en beloftes ("binnen een kwartier", "je bent eigenaar")?
    Maak een claim-tabel met bewijs.
13. Welke CTA's staan waar, en is de route naar de wizard logisch
    (preset bekijken → starten → pakket)? Waar zit wrijving?
14. Hoe presteert de homepage (componentgroottes, aantal requests, externe
    fonts, Unsplash-hotlinks)? Welke drie maatregelen helpen het meest?
15. Is er een plek voor sociale bewijskracht (klantverhalen, echte
    voorbeelden, prijsvoorbeeld) of alleen gegenereerde demo's? Wat is er
    nodig om dat zonder nieuwe fotografie te tonen?

### Contactlaag

16. Zijn alle contactacties gecentraliseerd in `utils/contact.ts`
    (`buildWhatsAppUrl`, `buildTelUrl`, berichtopbouw, telefoonnormalisatie)?
    Zoek elke handgemaakte `wa.me`/`tel:`-string en elke eigen regex.
17. Wordt de WhatsApp-tekst per context correct voorgevuld (dienst, bedrag,
    datum, storing, m²)? Beoordeel de leesbaarheid van de gegenereerde tekst
    in WhatsApp zelf (lengte, emoji, ontbrekende velden).
18. Wat gebeurt er als er geen (demo)telefoonnummer is: welke fallback ziet de
    gebruiker, en is die fallback op elke plek aanwezig?

## Output

`docs/arena_agent_src/output/KB-SRC-05-tools-extras-componenten-2026-10-25.md`
volgens `02-promptconventies.md`.

Sectie 4 (features) bevat max. vijf nieuwe component-/toolideeën, elk met de
sectie in `SiteView` waar hij komt, de data die hij gebruikt en de effort.

## Acceptatiecriteria

- De tool-tabel (vraag 1) is compleet voor alle vier de tools.
- Vraag 7 en 8 zijn bewezen met `grep`-uitkomsten (gebruik buiten de galerij,
  catalogus-pariteit).
- Er is één onderbouwde toolaanbeveling per ontbrekende sector.
- Elke aanbeveling noemt het exacte bestand waar hij landt.

## Niet doen

- Geen componenten verplaatsen of herschrijven.
- Geen nieuwe dependency voorstellen voor iets dat met `lucide-react` en
  Tailwind kan.
- Geen tien ideeën opsommen; liever drie die kloppen.

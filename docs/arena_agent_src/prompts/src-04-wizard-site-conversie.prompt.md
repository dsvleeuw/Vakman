---
id: src-04-wizard-site-conversie
modus: onderzoek
mag-draaien: ja
depends_on: []
schrijft: docs/arena_agent_src/output/KB-SRC-04-wizard-site-conversie-2026-10-25.md
scope: src/components/WizardView.tsx, src/components/SiteView.tsx, src/components/BookingCalendar.tsx, src/components/PriceCalculator.tsx, src/components/AreaChecker.tsx, src/components/InfoPages.tsx, src/components/DemoContactNotice.tsx, src/components/BeforeAfterSlider.tsx, src/utils/appointments.ts, src/utils/googleWorkspace.ts
---

# Opdracht — wizard, demosite en de conversiefunnel

Je bent een senior product-engineer met conversie-ervaring. De belofte is
"jouw vak. jouw website. binnen een kwartier." Jij onderzoekt of de wizard die
belofte waarmaakt, of de demosite een echte klant kan opleveren, en waar
bezoekers of vakmensen afhaken.

## Lees eerst

1. `AGENTS.md`, `docs/architecture.md` (rendering flow, state/persistence),
   `docs/ux-review.md`, `docs/mobile-ux-plan.md`, `docs/06-app-fixlijst.md`
   (D2: losse eindjes).
2. `docs/arena_agent_src/01-baseline-en-seed.md` — B11, B12, B14, H1–H2, H9.
3. `src/components/WizardView.tsx` (1341 regels) en `src/components/SiteView.tsx`
   (1367 regels) helemaal.

## Geverifieerde startsituatie

- Wizardstappen: `/start/vak`, `stijl`, `gegevens`, `diensten`, `afspraak`,
  `klaar`; elke stap heeft een eigen URL (`src/utils/router.ts`).
- Draft in `sessionStorage` (`klusbaas_wizard_draft`), custom gegevens in
  `localStorage` (`klusbaas_custom_sites`).
- Afspraken worden in `localStorage` bewaard (`saveAppointment`), weekenden
  worden overgeslagen (`src/utils/appointments.ts:56,86`).
- `buildActiveSite` draait ongememoïseerd in `App.tsx:417`.

## Onderzoeksvragen

### Wizard: klopt de volgorde en de bewaking? (H1)

1. Kun je `/start/afspraak` of `/start/klaar` openen zonder gegevens, en kun je
   dan alsnog een aanvraag versturen? Bewijs met de condities in
   `WizardView` (welke stap leest welke state, welke validatie blokkeert).
2. Kun je met de browser-terugknop in een ongeldige staat komen (stap 4 zonder
   stap 3)? Wordt de URL dan leidend of de state?
3. Wat gebeurt er bij een refresh midden in de wizard, en bij openen in een
   nieuw tabblad (sessionStorage)? Welke velden zijn dan leeg en hoe erg is dat?
4. Welke validatie staat er per veld, en is die consistent met
   `utils/lead.ts` (client zegt ok, server weigert of omgekeerd)? Noem elk
   verschil, met bewijs.
5. Wordt de gekozen `channel` (WhatsApp/E-mail/Allebei) echt doorgevoerd tot in
   de offerte-aflevering, en is de keuze zichtbaar in de bevestiging?
6. Wordt de pakketkeuze (`?pakket=`) meegedragen door alle stappen en zichtbaar
   in de samenvatting en de offerte? Waar kan hij verdwijnen?
7. Hoe verloopt de personalisatie (`?naam=&plaats=&tel=`)? Worden velden
   voorgevuld, gevalideerd en niet gelogd? Wat gebeurt er met een ongeldig
   telefoonnummer in de link?
8. Is de wizard bruikbaar op 360 px en met toetsenbord (focustrap in de
   mobiele preview, `aria-current` op de stappen, label bij de progressie)?

### Demosite: presentatie of product? (H2)

9. Wat is er echt "van de klant" op een `/voorbeeld/...`-pagina: alleen naam,
   eigenaar, telefoon, plaats en aan/uit-diensten? Bewijs met
   `buildActiveSite` en de `ActiveSiteData`.
10. Waar gaat een lead vanaf een demosite naartoe? (Klusbaas of de vakman, en
    welk nummer/e-mail?) Wat betekent dat voor de belofte "zo komt de klant bij
    jou binnen"?
11. Wat is er nodig om van een demo een gepubliceerde klantsite te maken
    (subdomein/eigen domein, vastleggen van de configuratie, versie, bron)?
    Noem de minimale wijzigingen in route, opslag en UI, en wat vandaag
    ontbreekt (`PublishedSiteRecord` is ongebruikt).
12. Is de volgorde van secties op de demosite conversie-optimaal? Onderbouw met
    wat er in de code staat (welke CTA waar, hoe vaak WhatsApp terugkomt, waar
    de sticky bar overlapt) en met `docs/contact-strategy.md`.
13. Hoeveel distincte CTA's zijn er per pagina, en roepen ze allemaal hetzelfde
    of juist verschillende acties? Tel ze per view (hero, services, calculator,
    tool, booking, reviews, FAQ, contact, footer, sticky bar).

### Boeken en agenda

14. Is de beschikbaarheid echt of verzonnen? Welke dagen/tijden komen uit
    `buildNextDates` en `TIME_SLOTS`, en hoe weet de bezoeker dat?
15. Wat gebeurt er met een boeking: localStorage, mail, Google Calendar, of
    alle drie? Wat is de bron van waarheid, en wat ziet de vakman?
16. Is de Google-koppeling gegate op configuratie (H: `googleWorkspace.ts`)?
    Wat gebeurt er als Firebase niet geconfigureerd is of de popup geblokkeerd
    wordt? Krijgt de gebruiker een eerlijke melding?
17. Is `Google Agenda` een belofte die waargemaakt wordt bij een klant zonder
    Google-account, of alleen bij de eigenaar?

### Calculators en checks

18. Klopt de prijscalculator (quiz → `utils/pricing.ts`) met de getoonde
    bedragen, en is de marge/btw/afronding uitgelegd? Is de uitkomst een
    indicatie of een toezegging, en staat dat er?
19. Wat doet de postcode/gebiedschecker (`AreaChecker`) echt: welke
    postcodegebieden, waar vandaan, wat bij invoer buiten het gebied? Is het
    antwoord eerlijk (binnen/buiten gebied) of altijd "ja"?
20. Is de m²-calculator of `BeforeAfterSlider` bereikbaar/toegankelijk met
    toetsenbord, en werkt hij op mobiel met touch?

### Conversie en gedrag

21. Welke stappen in de funnel zijn meetbaar (events) en welke ontbreken, gezien
    dat er geen tag manager draait? Noem de exacte events die je zou toevoegen
    en waar ze horen.
22. Waar zitten de drie grootste afhaakmomenten volgens de code (lange stappen,
    verplichte velden, onduidelijke CTA, wachten op netwerk)? Onderbouw per punt.
23. Is er een "alles kwijt"-risico (draft verloren, tab gesloten, timeout) en
    hoe wordt dat opgevangen?

## Output

`docs/arena_agent_src/output/KB-SRC-04-wizard-site-conversie-2026-10-25.md`
volgens `02-promptconventies.md`.

Sectie 4 (features) moet minstens beoordelen: stapbewaking ("je mist nog
gegevens"), een echte publicatieflow met eigen URL, een klantdashboard voor
naam/foto's/diensten, een offerte-akkoordknop in de mail, en een
WhatsApp-ontvangstbewijs voor de vakman. Beoordeel elk op haalbaarheid met de
bestaande types en opslag.

## Acceptatiecriteria

- Vraag 1, 2 en 10 zijn aantoonbaar getest (UI doorspelen, script, of
  reproductie via URL), niet beredeneerd.
- Er is een CTA-inventarisatie per view met aantallen en bestand:regel.
- Elk "afhaakmoment" heeft een concreet bewijs en een S/M/L-oplossing.
- Je benoemt expliciet welke beloftes in de UI niet door code worden gedekt.

## Niet doen

- Geen UI-copy herschrijven in de code; citeer en adviseer.
- Geen oordeel over merk of huisstijl.
- Geen implementatie; alleen minimale wijzigingsvoorstellen.

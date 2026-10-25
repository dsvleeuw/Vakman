# KB-SRC-04 — Wizard, demosite en conversie

- **Datum:** 2026-10-25 · **Commit:** `7d5ec3d`
- **Prompt:** `prompts/src-04-wizard-site-conversie.prompt.md`
- **Soort:** read-only · **Uitgevoerd met:** codelezen, `grep`-inventarisatie,
  Playwright-specs gelezen (niet gedraaid)

## 0. Samenvatting

De wizard is **beter bewaakt dan gedacht**: "Volgende" blokkeert zonder vak,
`/start/gegevens` valideert verplichte velden en de offertestap stuurt je terug
naar de gegevens als er iets mist. De grootste problemen zitten in de
**demosite als product**: een bezoeker ziet een voorbeeldtelefoonnummer als
**tekst** ("Bel 06 45 67 89 01") en een verzonnen **KvK 12345678**, terwijl de
knoppen veilig naar Klusbaas of de demo-melding wijzen. Dat is precies het
verkeerde signaal bij outreach. Daarnaast: geen publicatie, geen dashboard, en
de "beschikbaarheid" in de boeking is gesimuleerd.

## 1. Status-tabel

| # | Onderdeel | Belofte | Werkelijkheid | Status | Ernst | Effort |
|---|---|---|---|---|---|---|
| 1 | Wizard met echte URL's | README | 6 stappen, elk een route (`router.ts:35-46`) | klaar | — | — |
| 2 | Stapbewaking | "volgende" zonder vak | `WizardView.tsx:228-236` blokkeert; `:237-251` valideert gegevens | klaar | — | — |
| 3 | Diepe link zonder data | — | `/start/afspraak` opent, maar versturen stuurt terug naar `gegevens` (`WizardView.tsx:267-289`) | deels | P2 | S |
| 4 | Kanaalkeuze | fixlijst B3 | `channel` → `quoteDelivery`, mail/WhatsApp gesplitst (`leadHandler.ts:150-183`) | klaar | — | — |
| 5 | Pakketkeuze | `?pakket=pro` | `effectivePlan` in wizard, `plan` in offerte | klaar | — | — |
| 6 | Personalisatie demo | fixlijst A2 | `?naam=&plaats=&tel=` vult in, link wint per veld (`router.ts:105-118`) | klaar | — | — |
| 7 | Demotelefoon als tekst | "nooit naar echte nummers" | `phone = linkPhone ? … : base.phone` → voorbeeldnummer zichtbaar (`tradesData.ts:1112-1114`) | kapot | P0 | S |
| 8 | KvK op demo | vertrouwen | `KvK 12345678` hardcoded (`SiteView.tsx:1292`) | kapot | P1 | S |
| 9 | Boeking | "plan een afspraak" | validatie + `POST /api/lead` + `saveAppointment` (`BookingCalendar.tsx:93-152`) | klaar | — | — |
| 10 | Beschikbaarheid | "komende 2 weken" | `buildNextDates` genereert werkdagen, geen agenda-backend (`appointments.ts:76-95`) | deels | P2 | M |
| 11 | Google Agenda | Pro/Premium-feature | gegate op `isGoogleConfigured()` (`googleWorkspace.ts:79-82`) | deels | P2 | S |
| 12 | Publicatie | "jouw website" | `PublishedSiteRecord` ongebruikt, alleen demo-URL's | ontbreekt | P1 | L |

## 2. Bugs en defecten

**B1 (P0). Voorbeeldtelefoonnummer staat als tekst op de demosite.**
`buildActiveSite` kiest `linkPhone` veilig (eigen nummer of `VITE_DEMO_PHONE`,
`tradesData.ts:1112-1113`), maar de **weergavetekst** valt terug op
`base.phone` als er geen demo-nummer is (`tradesData.ts:1114`). Gevolg: "Bel
06 45 67 89 01" in de header/contact (`ContactSection.tsx:145`) en in
`BookingCalendar`-mails (`BookingCalendar.tsx:174,190,228`) — een nummer dat van
een echte persoon kan zijn. De e2e-suite heeft dit al gemarkeerd:
`e2e/routes.spec.ts` `test.fixme` met reden "toont nog 06 45 67 89 01".
*Fix (S):* toon "06 00 00 00 00" of "vraag je nummer aan" zodra
`contactPhone === null`; nooit `base.phone` als tekst gebruiken op `/voorbeeld`.

**B2 (P1). Verzonnen KvK-nummer in de footer.**
`SiteView.tsx:1292` toont `KvK 12345678` op elke site. Op een demo is dat een
detail, op een overgenomen klantsite is het onjuist en verwarrend.
*Fix (S):* veld `kvk?` in `ActiveSiteData`, alleen renderen als gevuld; in de
demo weglaten.

**B3. Diepe link naar de offertestap voelt als een fout.**
`/start/afspraak` opent met lege gegevens; pas bij versturen springt de wizard
terug naar `gegevens` (`WizardView.tsx:272-283`) zonder uitleg boven de pagina.
*Fix (S):* bij binnenkomst op stap 4/5 zonder `form.biz` meteen een
informatieve strook tonen ("Vul eerst je gegevens in") en de stap disabled
maken.

**B4. De boeking belooft beschikbaarheid die niet bestaat.**
`buildNextDates(14)` genereert de komende 14 werkdagen en `TIME_SLOTS` drie
dagdelen (`appointments.ts:5-12,76-95`). Er is geen agenda, geen capaciteit en
geen bevestiging dat de vakman kan. De bevestiging ("Je afspraak staat
genoteerd") suggereert meer zekerheid dan er is. *Fix (M):* óf agenda-koppeling
als bron van waarheid, óf de tekst eerlijk maken ("wij nemen contact op om te
bevestigen") — dat laatste is S.

**B5. Google-sync-fout wordt stil een "lokaal genoteerd".**
`WizardView.tsx:381-386` vangt fouten en zet `syncError`; de afspraak is dan
alleen lokaal. Dat is verdedigbaar, maar de gebruiker heeft "Toevoegen aan
Google Agenda" aangevinkt en krijgt geen duidelijke status. *Fix (S):* de
`LeadStatus`-component uitbreiden met "agenda niet gekoppeld".

**B6. AreaChecker belooft 25 km, rekent met postcodecijfers.**
`AreaChecker.tsx:52-56` belooft "straal van ongeveer 25 km rondom
`{site.city}`"; `validatePostalCode` (`pricing.ts:79-110`) vergelijkt alleen de
**eerste twee cijfers** met een lijst (`site.near`). Twee verschillende
postcodegebieden kunnen 40 km uit elkaar liggen. *Fix (S):* tekst
"postcodegebieden in de regio" of echt op PC4/afstand rekenen.

**B7. Wizard-preview bouwt de site bij elke toetsaanslag opnieuw.**
`WizardView.tsx:397` `buildActiveSite(...)` inline; samen met de inline aanroep
in `App.tsx:417` is dat twee ongememoïseerde bouwsels per render.
*Fix (S):* `useMemo` op `[sector, styleIndex, formData, disabledServices]`.

## 3. Ontbrekende functionaliteit

1. **Publiceren** (L): een demo wordt nooit een echte site; er is geen slug,
   geen opslag van de configuratie, geen "deze website is van jou"-stap.
2. **Klantdashboard** (L): FAQ belooft aanpasbare prijzen/foto's (roadmap 1.4),
   maar `localStorage` is de enige opslag (`klusbaas_custom_sites`).
3. **Echte beschikbaarheid** (M) — zie B4.
4. **Voortgang/afhaakmeting**: `wizard_step_view` bestaat, maar er is geen
   tag manager (KB-SRC-02), dus niets wordt verzameld.
5. **E-mailbevestiging van de afspraak aan de klant** zonder `MAIL_TEST_RECIPIENT`
   (afhankelijk van domeinverificatie).

## 4. Nieuwe feature-ideeën

**F1. Publicatiestap "Maak dit mijn website" (L).**
Na `/start/klaar` een knop die de configuratie vastlegt in
`PublishedSiteRecord` en een `/site/:slug`-route oplevert. Hergebruikt
`buildActiveSite`, `getPhotoSet` en de bestaande stijlen; nieuwe opslag in
Blobs. Dit is de ontbrekende schakel tussen demo en product.

**F2. "Wat gebeurt er nu?"-statusblok (S).**
Na een offerte/afspraak drie stappen tonen: ontvangen → binnen 1 werkdag contact
→ site live binnen 2 weken, met de referentie en een WhatsApp-knop. Sluit aan op
`LeadStatus` en verlaagt de onzekerheid die nu ontstaat na `/start/klaar`.

**F3. Eerlijke beschikbaarheidsbelofte (S).**
"Kies een dagdeel, wij bevestigen per WhatsApp" + de gekozen dagdelen in de
mail naar beide kanten. Nul backend, direct eerlijker (B4).

**F4. Postcode → plaats-terugkoppeling (S).**
`validatePostalCode` heeft de prefix al; toon bij een bekende prefix de
regionaam in plaats van alleen "ja". Maakt de checker geloofwaardiger (B6).

**F5. Wizard-draft in `localStorage` (S).**
Nu `sessionStorage` (`App.tsx:60,71`): een gesloten tab verliest alles. Met
`localStorage` + "verder waar je was" heropt de funnel (roadmap 1.3).

**Grote gok: eigen agenda/capaciteit per vakman (L).**
Echte slots vergen een agenda per klant, tijdzones, blokkades en
bevestigingsmails. Alleen doen na publicatie (F1), anders beheer je agenda's
voor sites die niet bestaan.

## 5. Beter-kunnen

- **CTA-dichtheid:** op één demosite staan CTA's in hero, header, services,
  calculator, tool, boeking, reviews, FAQ, contact, footer, floating stack en
  sticky bar (`SiteView.tsx:449-1360`). Alles naar dezelfde twee acties is
  consistent, maar de pagina is lang; een "één primaire actie per schermhoogte"-
  regel zou helpen.
- **Mobiel:** sticky bar `h-12` (48 px) is goed; de pagina houdt met `pb-20`
  ruimte vrij (`SiteView`-root). Controleer of de floating desktop-stack
  (`SiteView.tsx:1299`) de FAQ/contact niet overlapt.
- **Toegankelijkheid:** BookingCalendar-labels missen `htmlFor` (KB-SRC-06).
- **Copy:** "binnen een kwartier" (README) tegenover "oplevering binnen 2 weken"
  (`plans.ts:30`) is geen tegenspraak, maar wel verwarrend zonder uitleg.

## 6. Verouderde of foute documentatie

| Document:regel | Citaat | Werkelijkheid | Voorstel |
|---|---|---|---|
| `docs/06-app-fixlijst.md` D2 | "Volgende zonder gekozen vak gaat stil door" | inmiddels geblokkeerd (`WizardView.tsx:228-236`) | als opgelost markeren |
| `docs/known-limitations.md` | "appointments in-memory only" | `localStorage` via `saveAppointment` (`appointments.ts:56-64`) | corrigeren |
| `ROADMAP.md` 1.3 | "persist appointments" | deels gedaan (lokaal), server nog niet | "deels" |
| `API`-documentatie | — | er is geen endpointreferentie voor `/api/lead` | toevoegen (KB-SRC-08) |

## 7. Top 5

| # | Aanbeveling | Ernst | Effort | Confidence |
|---|---|---|---|---|
| 1 | Nooit voorbeeldnummers als tekst tonen (B1) | P0 | S | hoog |
| 2 | KvK uit de demo halen (B2) | P1 | S | hoog |
| 3 | Publicatiestap met echte URL (F1) | P1 | L | midden |
| 4 | Eerlijke beschikbaarheidstekst (B4/F3) | P2 | S | hoog |
| 5 | Draft in `localStorage` + memoïsatie (F5/B7) | P2 | S | hoog |

## 8. Open vragen

1. Is `VITE_DEMO_PHONE` in productie gezet? Zo nee, dan is B1 nu live.
2. Moet de boeking een echte agenda worden, of is "wij bellen je" het model?
3. Wie is de ontvanger van een lead op een klantsite (nu Klusbaas)?

## 9. Verantwoording

- Gelezen: `WizardView.tsx` (1341 r., kernregels 227-400), `SiteView.tsx`
  (structuur + 1140-1360), `BookingCalendar.tsx` (93-230), `AreaChecker.tsx`,
  `appointments.ts`, `googleWorkspace.ts`, `pricing.ts`.
- `e2e/routes.spec.ts` en `e2e/wizard.spec.ts` gelezen als bewijs van bekende
  gebreken (twee `test.fixme`).
- Niet gedraaid: Playwright (browsers niet geïnstalleerd).

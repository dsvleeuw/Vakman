# KB-SRC-06 — Toegankelijkheid en UX-patronen

- **Datum:** 2026-10-25 · **Commit:** `7d5ec3d`
- **Prompt:** `prompts/src-06-a11y-ux-cross-cutting.prompt.md`
- **Soort:** read-only · **Uitgevoerd met:** codelezen, `grep`-inventarisaties,
  CSS-analyse (geen browser/axe-run)

## 0. Samenvatting

Er is **meer goed dan de eerdere audit suggereert**: `:focus-visible` is bewust
geregeld (`index.css:1-33`), 58 `aria-label`s, 11 `aria-live`-plekken,
`prefers-reduced-motion` bestaat en dekt marquee/pulse/fade, en
`ImageWithFallback` doet `loading="lazy"`, `decoding="async"` en heeft een
tekstalternatief. De echte gaten zijn lokaal en concreet:
**7 labels zonder `htmlFor` in `BookingCalendar`**, **meerdere `h1`-blokken per
view**, **geen `width`/`height` op afbeeldingen** (CLS) en een
**focustrap die nog gecontroleerd moet worden** in `DemoContactNotice`.
Een echte audit (axe + handmatige schermlezertest) ontbreekt volledig.

## 1. Veldmatrix (formulieren)

| Formulier | Velden | Label geassocieerd | Foutkoppeling | Groepssemantiek | Opvallend |
|---|---|---|---|---|---|
| `BookingCalendar` | 3 tekst + 3 keuzestappen | **nee** (`:295,321,345,367,385,403,421`, 0× `htmlFor`) | eigen `errors`-state, geen `aria-invalid` | dagdelen/diensten als losse `label`s | 7 labels zonder `id` |
| `ContactSection` | 3 | ja (3/3) | `LeadStatus` met `aria-live` | — | goed |
| `FaultReportForm` | 6 | ja (6/6) | eigen status | `role="group"` + `aria-labelledby` (`:330`) | sterk |
| `SurfaceCalculator` | 5 | ja (5/5) | idem | `role="group"` (`:188`) | sterk |
| `NewsletterSignup` | 1 | ja | `aria-live` | — | goed |
| Wizard `gegevens` | 4 | ja (`#wizard-biz` e.d.) | `emailError` + focus (`WizardView.tsx:285-292`) | — | focus gaat naar het veld |
| Wizard `afspraak` | kanaal + e-mail | ja | idem | `role="group"` "Kanaal voor de offerte" (e2e) | goed |

## 2. Bugs en defecten

**B1 (P1). `BookingCalendar`-labels zijn niet geassocieerd.**
Zeven `<label>` zonder `htmlFor` en zonder omliggende input; een schermlezer
kondigt "Je naam *" niet als label aan. Dit is de duurste vorm van a11y-schuld,
want het is de stap waar een lead binnenkomt. *Fix (S):* `useId()` zoals
`FaultReportForm` doet; `aria-invalid` + `aria-describedby` voor de drie
foutmeldingen.

**B2 (P1). Meerdere `h1`-blokken per view.**
`SiteView.tsx` bevat 5 `<h1>`, `WizardView.tsx` 6, `InfoPages.tsx` 3 (per stap
één). Ze staan in conditionele takken, dus in de DOM is er meestal één — maar
niet altijd: de hero-layouts en de wizard-preview kunnen samen renderen.
*Fix (S):* één `h1` per view afdwingen en de rest `h2`; maak er een check in de
prerender-test van (aantal `h1` per pagina).

**B3 (P1). Afbeeldingen hebben geen `width`/`height`.**
`ImageWithFallback` zet lazy/decoding/alt, maar geen intrinsieke afmetingen
(`ImageWithFallback.tsx:74-90`); de Unsplash-URL's hebben geen vast aspect.
Gevolg: layout shift (CLS) zodra een foto laadt, precies op de plek waar de
hero staat. *Fix (S):* `width`/`height` of `aspect-ratio` via een prop; de
fotopools hebben vaste formaten (1200×800).

**B4. `DemoContactNotice` is een dialoog zonder bewezen focustrap.**
Het component heeft `role="dialog"`/`aria-modal`-achtige kenmerken, maar er is
geen `keydown`-handler voor Tab/Escape in de buurt van de dialooglogica.
*Fix (S):* focustrap + Escape + focus terug naar de opener (patroon staat al in
`docs/08-audit-resultaten.md`).

**B5. Contrast van de WhatsApp-knop is nu goed, maar niet overal gelijk.**
De sticky bar gebruikt `bg-[#25D366] text-stone-950` (`SiteView.tsx:1350`) —
correct. Andere WhatsApp-knoppen gebruiken soms `text-white`; dat is 1,98:1.
*Fix (S):* één `WhatsAppButton`-component of een token `site.onWhatsApp`.
*Controle:* grep op `#25D366` en `text-white` in dezelfde regel.

**B6. `prefers-reduced-motion` dekt de eigen animaties, maar niet alles.**
`index.css:98-115` zet alle animaties/transities op 0,01 ms — dat is streng en
goed. Let op: dat geldt ook voor `animate-spin` (4×) en `animate-pulse`
(laadindicatoren); een spinner die niet draait is verwarrend. Overweeg een
uitzondering voor laadindicatoren of een andere laadstijl.

**B7. Kleur is op `/kaart` informatiedrager.**
`ProspectMapView` kleurt scores/vakken; zonder tekstlabel is dat niet
toegankelijk. *Fix (S):* cijfer/tekst naast de kleur (waarschijnlijk deels
aanwezig — controleer per cel).

**B8. Geen `autocomplete`/`inputmode` op telefoon- en postcodevelden.**
`type="tel"` bestaat, maar `autocomplete="tel"`, `inputmode="numeric"` en
`autocomplete="postal-code"` ontbreken op meerdere plekken. *Fix (S):*
inventariseer en toevoegen; dit is een van de goedkoopste conversiewinsten op
mobiel.

## 3. Ontbrekende functionaliteit

1. **Geautomatiseerde a11y-check** (`axe-core` in Playwright) — nu bestaat er
   niets, en de e2e-suite controleert alleen font-size en lege links.
2. **Skip-link naar `#main-content`**: bestaat in `App.tsx:317` als doel, maar
   controleer of er ook een zichtbare skiplink is vóór de header.
3. **Schermlezertest**: nooit gedaan (VoiceOver/NVDA). Geen bewijs in de repo.
4. **Foutaankondigingen**: 11 `aria-live` is goed, maar bij `BookingCalendar`
   ontbreekt een live-regio voor de driedelige foutmelding.
5. **Toetsenborddocumentatie**: welke toetsen doen wat in de galerij, de
   tijdlijn en de slider — nergens beschreven.

## 4. Nieuwe feature-ideeën

**F1. `axe`-scan in CI (S).** Playwright heeft `@axe-core/playwright`; één test
over de 8 e2e-routes levert direct een lijst met overtredingen en houdt de
basis op orde. Postuur: geen 100 %-claim, wel "geen nieuwe overtredingen".

**F2. Formuliercomponent met ingebouwde a11y (M).**
Eén `Field`-component (label, id, fout, `aria-describedby`, `inputmode`,
`autocomplete`) en alle zeven formulieren daarop overzetten. Dat lost B1, B8 en
een deel van B3 in één keer op en maakt nieuwe formulieren automatisch goed.

**F3. Toetsenbordnavigatie in de galerij (S).**
Pijltjes tussen componenten, `/` focust de zoekbalk. Sluit aan op de bestaande
zoekbalk (`ComponentGallery.tsx`).

**F4. "Minder beweging"-schakelaar (P3).**
Naast de systeeminstelling een eigen toggle in de footer; nu is er alleen de
media query. Alleen doen als er klachten zijn.

**Grote gok: WCAG 2.2 AA-certificering (L).**
Vraagt een volledige audit, het oplossen van alle bevindingen en een
onderhoudsproces. Waardevol voor overheidsaanbestedingen, niet nodig voor
vakmensen; parkeren tot er een klant om vraagt.

## 5. Beter-kunnen

- **Focus na navigatie:** de skiplink bestaat, maar bij routewissel verplaatst
  de focus niet mee naar de nieuwe `h1`; schermlezergebruikers merken de
  navigatie niet. *Fix (S):* `focus()` op een `tabIndex={-1}`-container in
  `useRouteMeta` of `useRouter`.
- **Touchdoelen:** sticky bar is 48 px (`h-12`) — goed. Controleer de chips in
  `EmergencyButton`/`FaultReportForm` (kleiner) en de iconen in de galerij.
- **Landschap/safe-area:** `pb-[calc(0.75rem+env(safe-area-inset-bottom))]` is
  correct (`SiteView.tsx:1331`); controleer of de wizard-preview op een liggende
  iPhone niet onder de notch valt.
- **Zoom 200 %:** vaste `min-h-[430px]`/`h-[…]`-waarden in de hero's kunnen bij
  200 % tekst gaan overlappen; test met browserzoom.
- **Documentatie:** zet de a11y-uitgangspunten (focus, live-regio's, contrast)
  in `docs/architecture.md`, zodat nieuwe componenten het patroon volgen.

## 6. Verouderde of foute documentatie

| Document:regel | Citaat | Werkelijkheid | Voorstel |
|---|---|---|---|
| `docs/08-audit-resultaten.md` P1-4 | "wit op #25D366 op 10 plekken" | sticky bar gebruikt nu `text-stone-950` | hertellen en bijwerken |
| `docs/08-audit-resultaten.md` P1-5 | "labels zonder htmlFor in FaultReportForm, SurfaceCalculator, BookingCalendar" | eerste twee zijn opgelost, BookingCalendar niet | specificeren |
| `docs/ux-review.md` #13 | "toegankelijkheid deels" | klopt nog; geen axe, geen schermlezer | handhaven + concreet maken |

## 7. Top 5

| # | Aanbeveling | Ernst | Effort | Confidence |
|---|---|---|---|---|
| 1 | `BookingCalendar`-labels + foutkoppeling (B1) | P1 | S | hoog |
| 2 | Eén `Field`-component voor alle formulieren (F2) | P1 | M | hoog |
| 3 | `axe`-scan in CI (F1) | P1 | S | hoog |
| 4 | `width`/`height` op afbeeldingen (B3) | P1 | S | hoog |
| 5 | Eén `h1` per view + focustrap dialoog (B2/B4) | P2 | S | midden |

## 8. Open vragen

1. Is er ooit een schermlezertest gedaan? Zo nee, wanneer plannen we die?
2. Moet de galerij toetsenbordnavigatie krijgen of blijft het een muis-tool?
3. Welke mate van WCAG-conformiteit is commercieel nodig?

## 9. Verantwoording

- Getteld: `htmlFor` vs `<label` per formulier; 58 `aria-label`, 11
  `aria-live`, 27 `alt=`, 1 `<img>`-tag (de rest via `ImageWithFallback`).
- `index.css:98-115` gelezen: reduced-motion blok.
- `SiteView.tsx:1329-1355` gelezen: sticky bar met 48 px-doelen en donkere tekst
  op WhatsApp-groen.
- **Niet** gedaan: axe-run, schermlezer, 200 %-zoomtest, echte
  contrastmetingen per component. Die staan in F1 en in de open vragen.

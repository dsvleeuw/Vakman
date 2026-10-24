# Opdracht: mobiele UX & iOS-fixes (agent-brief)

> **Status:** uitgevoerd. Batch 1–3 zitten in PR #6; de font-regressie op de
> homepage die daaruit volgde is gerepareerd in PR #7. Dit document blijft als
> referentie voor hoe een agent-opdracht met "klaar als"-criteria eruitziet.

Uitvoerbaar plan voor een AI-agent. Komt voort uit een UI/UX-review van
24-10-2026 op Android (360px), tablet (768px) en desktop (1440px). Lees eerst
[AGENTS.md](../AGENTS.md) — die regels (Bun, Nederlandse copy, palette-tokens,
`utils/contact.ts`) gelden hier onverkort.

## Werkwijze (laag verbruik)

- **Werk zelf, geen subagents of parallelle agents.** De batches raken
  dezelfde bestanden (`SiteView.tsx`, `WizardView.tsx`); parallel werken geeft
  conflicten en dubbele context.
- **Eén batch per sessie.** Na elke batch: lint/test/build groen, committen,
  en de gebruiker vragen `/compact` te draaien vóór de volgende batch.
- **Lees gericht.** `SiteView.tsx` (1235 regels) en `WizardView.tsx` (1054)
  niet in hun geheel inlezen; gebruik `grep -n` en lees alleen de regels rond
  de genoemde locaties.
- **Verifieer met een DOM-script, niet met veel screenshots.** Eén
  screenshot per scherm op `scale: 0.5` is genoeg; meet de rest met
  JavaScript (zie *Verificatie*).
- Regelnummers hieronder kloppen op commit `51a62bf`; zoek op de
  genoemde tekst als ze verschoven zijn.

## Batch 1 — mobiel & iOS quick wins (hoogste prioriteit)

### 1.1 iOS zoomt in op formuliervelden
Safari zoomt automatisch in op `input/select/textarea` met font-size < 16px.
Gemeten: 8 velden op 14px op de demosite.

- [`ContactSection.tsx:65`](../src/components/ContactSection.tsx) — gedeelde
  inputklasse `text-sm` → `text-base`.
- [`tools/FaultReportForm.tsx:74`](../src/components/tools/FaultReportForm.tsx) — idem.
- [`BookingCalendar.tsx`](../src/components/BookingCalendar.tsx) regels ~311,
  335, 353, 371 en de textarea ~384 — idem.
- Check ook `SurfaceCalculator.tsx` en `AreaChecker.tsx`.

**Klaar als:** het verificatiescript `inputsUnder16: []` geeft op
`/voorbeeld/loodgieter/krachtig`, `/voorbeeld/elektricien/<stijl>` en
`/voorbeeld/schilder/<stijl>`.

### 1.2 Safe area voor iPhone (notch / home-indicator)
Vaste balken hebben 12px onderpadding en geen safe-area; knoppen botsen met
de home-indicator.

- [`index.html`](../index.html): viewport-meta →
  `width=device-width, initial-scale=1.0, viewport-fit=cover`.
- [`SiteView.tsx:1204`](../src/components/SiteView.tsx) (mobiele
  Bellen/WhatsApp-balk): onderpadding
  `pb-[calc(0.75rem+env(safe-area-inset-bottom))]`.
- [`WizardView.tsx:1003`](../src/components/WizardView.tsx) (sticky
  actiebalk): idem.
- Zorg dat de pagina-inhoud onder die balken niet wegvalt: de bestaande
  bottom-spacer/padding van de pagina ook met `env(safe-area-inset-bottom)`
  ophogen.
- Sticky headers bovenaan: `pt-[env(safe-area-inset-top)]` alleen als ze
  tegen de bovenrand staan.

**Klaar als:** de klassen aanwezig zijn en er niets verschuift in Chrome
(waar de inset 0 is). Melden dat dit op een echte iPhone nog getest moet
worden.

### 1.3 Wizard niet vooraf invullen met nepgegevens
Stap 3 (`/start/gegevens`) heeft échte waarden "Houtwerk De Vries / Jan de
Vries / 06 12 34 56 78 / Utrecht". Een gebruiker kan doorklikken zonder iets
in te vullen.

- [`WizardView.tsx:84-92`](../src/components/WizardView.tsx): beginwaarde
  van `formData` → lege strings. De placeholders (`bijv. …`) blijven.
- [`WizardView.tsx:157-170`](../src/components/WizardView.tsx)
  `handleSelectSector`: **wist nu de ingevulde gegevens** bij wisselen van
  vak. Behoud wat de gebruiker heeft getypt; alleen `disabledServices`
  resetten.
- De live preview moet op lege velden terugvallen op de sector-defaults.
  `quoteMessage` doet dat al (`formData.biz || baseSector.biz`, regel ~293);
  controleer of `buildActiveSite` (in `utils/`) dat ook doet, en voeg het
  daar toe met een unit-test als het ontbreekt.
- `validateWizardForm` (`utils/pricing.ts`) moet lege velden afkeuren;
  bestaande tests in `pricing.test.ts` aanvullen.
- Let op de opgeslagen draft (`initialForm`): oude drafts met demodata
  mogen blijven werken.

**Klaar als:** `/start/gegevens` in een nieuwe sessie lege velden toont, de
preview toch gevuld is, "Volgende stap" met lege velden een foutmelding geeft,
en terug naar stap 1 → ander vak → stap 3 de getypte gegevens behoudt.

### 1.4 Copy klopt niet op mobiel
[`WizardView.tsx:514`](../src/components/WizardView.tsx): "werkt het live
voorbeeld rechts meteen bij" — op mobiel/tablet staat de preview niet rechts.
Vervang door neutrale tekst, bv. "Zodra je typt, werkt je live voorbeeld
meteen bij."

### 1.5 Stappenindicator en tikvlakken
- [`WizardView.tsx:353`](../src/components/WizardView.tsx): stap-labels zijn
  `hidden sm:inline`; op mobiel zie je alleen 1–5. Toon onder de pills op
  mobiel de naam van de huidige stap (bv. "Gegevens"), of maak de
  bestaande "STAP 3 VAN 5"-regel "STAP 3 VAN 5 · GEGEVENS".
- [`SiteView.tsx:~75` en `~89`](../src/components/SiteView.tsx): "← Alle
  presets" en "Aanpassen" zijn 32px hoog → minimaal `h-11` (44px)
  tikvlak (mag visueel klein blijven met padding/`::before`).
- Timmerman is op stap 1 standaard geselecteerd (`DEFAULT_SECTOR`,
  `utils/router.ts:37`). Laat de standaard staan voor de routing, maar
  toon geen geselecteerde staat zolang de gebruiker op `/start/vak` nog
  niets heeft gekozen (tenzij er een `?vak=`/draft is).

## Batch 2 — lengte & hiërarchie (eerst schets aan gebruiker tonen)

Dit zijn ontwerpkeuzes. **Lever eerst een korte schets/voorstel (tekst of
één screenshot) en wacht op akkoord** voordat je bouwt.

- **2.1 Demosite is 14.057px hoog op 360px (~18 schermen); home 9.699px.**
  Voorstel: op `< sm` secties zoals portfolio, reviews, FAQ en
  team inklappen tot een kop + "Toon meer", of beperken tot 3 items met
  "Bekijk alles". Doel: demosite < 8.000px op 360px.
- **2.2 Dubbele kopbalk op de demosite.** De previewbalk ("← Alle presets /
  Aanpassen") staat boven de site-header; samen met de onderbalk blijft
  ~70% van het scherm over. Voorstel: previewbalk op mobiel laten
  wegschuiven bij scrollen naar beneden en terugkomen bij omhoog scrollen.
- **2.3 Dubbele bel-CTA.** De hero-knop "Bel 06 …" ([`SiteView.tsx:~365`],
  `sm:hidden`) dupliceert "Bellen" in de vaste onderbalk. Op mobiel
  verwijderen; de primaire hero-CTA krijgt de ruimte.
- **2.4 Hero-kop loopt 5 regels op 360px.** Kleinere font-size op `< sm`
  of `text-balance` + kortere maximale lengte, zodat beide CTA's boven de
  vouw staan.

## Batch 3 — tablet & performance

- **3.1 Tablet (768–1023px) gedraagt zich als telefoon.** De wizard
  schakelt pas bij `lg` naar twee kolommen
  ([`WizardView.tsx:368, 1029`](../src/components/WizardView.tsx)) en
  `isDesktop` verbergt de preview. Maak `md` twee kolommen (formulier
  smal, preview geschaald) of beperk de formulierbreedte tot `max-w-xl`
  gecentreerd.
- **3.2 Tekst kleiner dan 12px.** `text-[10px]`/`text-[11px]` in o.a.
  `SiteView.tsx:79, 172, 189`, `ContactSection.tsx:262`,
  `AreaChecker.tsx:110`, `BookingCalendar.tsx:265-267`,
  `WizardView.tsx:717, 748-750, 802`, `extras/ContactCtaBanner.tsx:66`,
  `PresetsSection.tsx:135, 179`. Minimaal `text-xs` (12px) voor leesbare
  tekst; datumtegels mogen klein blijven als ze niet de enige bron van
  informatie zijn. `ComponentGallery.tsx` (intern) is lage prioriteit.
- **3.3 Zes Google-fonts bij eerste paint** ([`index.html`](../index.html)).
  Laad op `/` alleen Archivo + JetBrains Mono; laad de stijlfonts pas bij
  de demosite/wizard (bv. een `<link>` injecteren per stijl), of host ze
  zelf in `public/fonts` met `font-display: swap`. Prerender
  (`scripts/prerender.ts`) moet blijven werken.

## Verificatie

Na elke batch:

```bash
bun run lint
bun test
bun run build
```

Gebruik **Bun**, niet npm (`npm install` faalt op een peer-conflict; met
`--legacy-peer-deps` ontstaat een `package-lock.json` die niet gecommit mag
worden).

Start `bun run dev` en meet in de browser op 360×780, 390×844 en 768×1024
met dit script (één `javascript_exec` per pagina):

```js
const vw = document.documentElement.clientWidth;
({
  vw,
  docW: document.documentElement.scrollWidth,          // moet === vw
  height: document.documentElement.scrollHeight,
  inputsUnder16: [...document.querySelectorAll('input,select,textarea')]
    .filter(e => parseFloat(getComputedStyle(e).fontSize) < 16)
    .map(e => e.id || e.type),                          // moet []
  smallTargets: [...document.querySelectorAll('a,button,input,select')]
    .filter(e => { const r = e.getBoundingClientRect();
      return r.width > 1 && (r.height < 40 || r.width < 40); })
    .map(e => (e.innerText || e.getAttribute('aria-label') || e.tagName)
      .trim().slice(0, 25)),
  fixedBottomPadding: [...document.querySelectorAll('body *')]
    .filter(e => ['fixed', 'sticky'].includes(getComputedStyle(e).position)
      && getComputedStyle(e).bottom === '0px')
    .map(e => getComputedStyle(e).paddingBottom),
})
```

Pagina's: `/`, `/start/vak`, `/start/gegevens`, `/start/afspraak`,
`/voorbeeld/loodgieter/krachtig`, en één demosite per stijl.

Uitgangswaarden (vóór de fixes, 360px): home `height` 9.699; demosite
loodgieter `height` 14.057, `inputsUnder16` 8 velden, `smallTargets`
"← Alle presets 103x32" en "Aanpassen 86x32".

## Afronden

- Commits per onderdeel, Conventional Commits (`fix(mobile): …`,
  `fix(wizard): …`), in de huidige branch.
- Werk [docs/ux-review.md](./ux-review.md) bij met een korte sectie
  "Part 4 — mobiel & iOS" (wat gedaan is, met de gemeten voor/na-waarden).
- Meld expliciet wat **niet** getest is: echte iPhone/Safari (safe area,
  zoom) en echte Android-Chrome. Chromium-emulatie dekt dat niet.
- Niet pushen of mergen zonder akkoord van de gebruiker.

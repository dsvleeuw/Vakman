---
id: src-06-a11y-ux-cross-cutting
modus: onderzoek
mag-draaien: ja
depends_on: []
schrijft: docs/arena_agent_src/output/KB-SRC-06-a11y-ux-cross-cutting-2026-10-25.md
scope: src/index.css, src/components/ (lezen), src/hooks/useMediaQuery.ts, e2e/ (lezen), src/data/paletteContrast.test.ts (lezen)
---

# Opdracht — toegankelijkheid, UX-patronen en mobiel gedrag over de hele app

Je bent een accessibility- en UX-specialist. Je beoordeelt de app als geheel op
patronen die per component terugkomen: formulieren, focus, contrast, beweging,
toetsenbord, schermlezer en mobiel. Je herhaalt niet wat `src-05` al zegt over
individuele tools; jij bent eigenaar van het **patroon**.

## Lees eerst

1. `docs/08-audit-resultaten.md` (P1-items over contrast, formulieren, focus),
   `docs/ux-review.md`, `docs/mobile-ux-plan.md`.
2. `docs/arena_agent_src/01-baseline-en-seed.md` — B17, B18, B19, B21, H10, H11.
3. `src/index.css` volledig, daarna `src/components/BookingCalendar.tsx`,
   `src/components/ContactSection.tsx`, `src/components/DemoContactNotice.tsx`.

## Geverifieerde startsituatie

- `BookingCalendar.tsx` heeft 7 `<label>` en 0 `htmlFor`
  (regels 295, 321, 345, 367, 385, 403, 421); de inputs zijn siblings.
- `FaultReportForm` (6/6), `SurfaceCalculator` (5/5) en `ContactSection` (3/3)
  koppelen labels wél.
- `src/index.css:1-33` regelt `:focus-visible` voor a/button/input/select/
  textarea/[tabindex]; er zijn 11 `aria-live`-plekken.
- Er is geen axe- of pa11y-test in de repo; e2e controleert alleen op
  font-size ≥ 16 px en lege links.

## Onderzoeksvragen

### Formulieren (patroon)

1. Maak een matrix van **elk** formulierveld in de app: bestand:regel, label
   (echt geassocieerd?), `id`/`name`, `type`, `autocomplete`, `inputmode`,
   `required`, foutkoppeling (`aria-describedby`/`aria-invalid`),
   `fieldset`/`legend` bij groepen, en of de fout via `aria-live` wordt gemeld.
2. Welke formulieren verliezen gegevens bij een fout (state gereset, waarden
   weg)? Bewijs per formulier.
3. Werkt de honeypot/`startedAt`-logica niet in de weg voor toetsenbord- en
   schermlezergebruikers (onzichtbare velden, focusvolgorde)?
4. Worden fouten en successen aangekondigd? Krijgt de melding focus? Blijft de
   knop in `sending`-staat hangen bij een timeout?

### Focus, toetsenbord en dialogen

5. Is er een skip-link en werkt hij? Krijgt `#main-content` echt focus na
   navigatie, of verspringt alleen de scroll?
6. `DemoContactNotice` is een dialoog: is er een focustrap, Escape, focus
   terug, `aria-modal`, `inert`/`aria-hidden` op de achtergrond? Test met
   toetsenbord.
7. Zijn alle interactieve elementen echte `button`/`a` (geen clickbare `div`)?
   Noem elke uitzondering met regel.
8. Is er een zichtbare focusstijl op élk element, inclusief donkere presets
   (waar `focus:outline-none` de globale regel kan overrulen)? Bewijs met de
   CSS-specificiteit en een screenshot of berekende stijl als dat kan.
9. Hoe gedragen de custom controls zich met toetsenbord: `BeforeAfterSlider`,
   de datum-/dagdeelchips in `BookingCalendar`, de quiz-opties in
   `PriceCalculator` (radiogroep? pijltjestoetsen?), de tabellen op `/kaart`.

### Contrast en kleur

10. Controleer de contrastgaranties uit `paletteContrast.test.ts`: welke
    combinaties worden getest en welke niet (hover, disabled, focusring,
    placeholder, border, tekst op `cardMuted`, tekst op WhatsApp-groen)?
    Bereken de ontbrekende combinaties zelf (bijv. met `utils/color.ts`) en
    noem elke die onder 4,5:1 (tekst) of 3:1 (UI-rand) zit.
11. Zijn er hardcoded kleuren in componenten die het palette-contract breken
    (`text-stone-900`, `#fff`, `#25D366`)? Noem bestand:regel en het juiste
    token.
12. Is kleur de enige informatiedrager ergens (status, filters, scores op
    `/kaart`)? Noem de plekken.

### Beweging, media en mobiel

13. Respecteert de app `prefers-reduced-motion`? Welke keyframes/transities
    draaien altijd (`src/index.css`, marquee, pulse, `motion`-imports)? (H11)
14. Zijn afbeeldingen voorzien van `alt`, `loading="lazy"`, `decoding`,
    `width`/`height` of aspect-ratio (CLS)? (H10) Noem per `<img>` de
    ontbrekende attributen, of een samenvatting per bestand.
15. Werkt de app op 320 px zonder horizontale scroll, en in landschap op een
    kleine iPhone (safe-area, sticky bar, wizard-preview)? Waar overlapt de
    mobiele contactbalk inhoud?
16. Zijn touch targets ≥ 44 px (chips, iconen, sluitknoppen, sticky bar)?
    Noem de kleinste gevallen met regel.
17. Is er reflow/zoom-problematiek (100 % zoom, 200 % tekst)? Welke vaste
    hoogtes of `overflow-hidden` blokkeren dat?

### Semantiek en schermlezer

18. Kloppen de heading-niveaus per view (h1 aanwezig, geen sprongen, geen
    dubbele h1)? Maak een tabel per route.
19. Zijn landmarks (`header`, `nav`, `main`, `footer`) correct en uniek? Zijn
    `aria-label`s aanwezig op meerdere navs?
20. Is de leesvolgorde in `SiteView` logisch (DOM-volgorde vs. visuele
    volgorde bij de vijf hero-layouts)? Noem de layouts waar het misgaat.
21. Is er een taalaanduiding per pagina (`lang="nl"`) en kloppen `title`s bij
    client-side navigatie voor schermlezers?

## Output

`docs/arena_agent_src/output/KB-SRC-06-a11y-ux-cross-cutting-2026-10-25.md`
volgens `02-promptconventies.md`, met in sectie 1 een **veldmatrix** en een
**contrasttabel**.

Sectie 5 moet een concreet, klein a11y-plan bevatten: wat fix je in één dag
(P0/P1) en wat is een aparte audit (WCAG 2.2 AA). Sectie 4 max. vijf
UX-ideeën (bijv. reductie van formuliervelden, inline validatie,
voortgangsindicatie), elk code-gebonden.

## Acceptatiecriteria

- De veldmatrix dekt alle formulieren (minstens: contact, storing, m²,
  boeking, nieuwsbrief, wizard-gegevens, wizard-afspraak).
- Contrast: je hebt zelf gerekend of `utils/color.ts` gebruikt; geen
  "ziet er donker uit".
- Vraag 13 en 14 zijn beantwoord met een complete lijst per bestand, niet met
  voorbeelden.
- Je hebt minstens één echt toetsenbordprobleem gereproduceerd (dialog,
  slider, wizard) en beschreven hoe je het testte.

## Niet doen

- Geen stijlwijzigingen voorstellen die de huisstijl aantasten zonder
  alternatief dat wél binnen het palet past.
- Geen WCAG-claim "voldoet aan AA" — alleen bevindingen en wat er nodig is.
- Geen dubbele bevindingen met `src-05`; verwijs ernaar.

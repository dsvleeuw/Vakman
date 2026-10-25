---
id: src-01-app-router-seo
modus: onderzoek
mag-draaien: ja
depends_on: []
schrijft: docs/arena_agent_src/output/KB-SRC-01-app-router-seo-2026-10-25.md
scope: src/App.tsx, src/main.tsx, src/entry-server.tsx, src/hooks/, src/utils/router.ts, src/utils/fonts.ts, src/components/RouteLink.tsx, src/components/NotFoundView.tsx, src/components/Header.tsx, src/components/SiteFooter.tsx, scripts/prerender.ts, index.html, public/_redirects, public/site.webmanifest
---

# Opdracht — App, router, SEO, prerender en hydratie

Je bent een senior front-end architect. Je onderzoekt **hoe de app zijn schermen
aan elkaar knoopt en hoe crawlers/deep links dat ervaren**, en je levert
bewijs, bugs, gaten en verbeteringen. Je wijzigt geen code.

## Lees eerst (in deze volgorde)

1. `AGENTS.md` (regels en gotchas).
2. `docs/architecture.md` (route-tabel, prerender, hydratie).
3. `docs/arena_agent_src/01-baseline-en-seed.md` — vooral B11, B14, B16, B24.
4. `docs/08-audit-resultaten.md` — eerdere bevindingen over meta/SEO; ga na wat
   daarvan inmiddels is opgelost (B14 zegt: enkele zijn opgelost).

## Geverifieerde startsituatie (niet opnieuw uitzoeken)

- 39 geprerenderde `index.html`-pagina's, sitemap met 38 URL's, `dist/` 4,6 MB.
- `robots.txt` sluit `/start/`, `/offerte/` en `/kaart` uit.
- Eén `og:image` en één `canonical` per geprerenderde pagina (geen duplicaten).
- `buildActiveSite(...)` staat inline in JSX (`src/App.tsx:417`), zonder `useMemo`.
- `scripts/prerender.ts:35-47` prerendert home, privacy, nieuwsbrief, afmelden
  en de 35 presets.

## Onderzoeksvragen (beantwoord ze allemaal, met bewijs)

### Routing en waarheid van de URL

1. Is `parseRoute`/`buildPath` een echte bijectie? Zoek routes die je kunt
   parsen maar niet bouwen (en omgekeerd), en aliassen die na normalisatie
   blijven afwijken. Test met een tijdelijk script of `bun test src/utils/router.test.ts`.
2. Welke interne links gaan **niet** via `RouteLink` (dus welk verkeer verliest
   middle-click, nieuw tabblad en SEO)? Geef per bestand de regels.
3. Wat gebeurt er met onbekende paden? Controleer of Netlify/`_redirects` een
   **soft 404** serveert (HTTP 200 met 404-inhoud) en wat dat betekent voor
   indexering. Is er een `404.html` of statusconfiguratie?
4. Werkt de legacy-mapping (`?view=site`, `?autostart=1`, `?sector=`) nog voor
   álle oude links, inclusief combinaties met `?stijl=` en `?pakket=`? Waar
   staat die mapping, en welke varianten vallen er buiten?
5. Wordt de URL bij elke stap van de wizard bijgewerkt (ook terug/volgende), of
   kan de URL achterlopen op de UI? Bewijs met de handlers in `App.tsx`.

### Meta, canonical en structured data

6. Per route: welke `title`, `description`, `canonical`, `robots` ontstaan er
   (server-side én na client-navigatie)? Vergelijk `getRouteMeta` met wat er
   werkelijk in `dist/**/index.html` staat. Noem elke afwijking.
7. Klopt `canonical` na client-side navigatie? Wordt `<link rel=canonical>`
   bijgewerkt of blijft de oude staan? (Hydratie + `useRouteMeta`.)
8. Is er `LocalBusiness`/`Service`/`FAQPage`/`BreadcrumbList` JSON-LD? Zo nee:
   welke data ligt al klaar in `SectorData` om het zonder nieuwe content te
   genereren, en welke velden ontbreken (adres, KvK, openingstijden, geo)?
9. Wat is de SEO-status van persoonlijke demo-links (`?naam=&plaats=&tel=`)?
   Kunnen die geïndexeerd worden, en zo ja: is dat een privacylek? Is er een
   `noindex`-pad voor die variant?
10. Is `/kaart` echt onbereikbaar voor crawlers (robots + geen sitemap + geen
    navigatielink), of lekt hij via een andere route?

### Prerender en hydratie

11. Bewijs dat de client-hydratie niet afwijkt van de server-markup. Waar leest
    de eerste render `window`, `localStorage`, `Date.now()`, `Math.random()` of
    `matchMedia`? Noem elke plek die een hydration-mismatch kan geven.
12. Is er een **error boundary**? Wat ziet een gebruiker als een lazy chunk
    faalt (offline, oude deploy, CSP)? Test dit desnoods door een chunknaam in
    `dist/` te hersnoeien in een tijdelijke kopie.
13. Hoe gedragen Suspense-fallbacks zich bij een koude load van de wizard of de
    bibliotheek? Is er een spinner-flits, en hoe lang duurt die met de
    chunkgroottes uit B20?
14. Wordt `scrollRestoration` correct gecombineerd met `#hash`-links en met
    focusbeheer? Krijgt de nieuwe pagina focus (screenreader) of blijft de
    focus op de oude link staan?

### Laadtijd en robuustheid

15. Wat is de kritieke laadtijd van de homepage: externe Google Fonts (render
    blocking?), 74 kB CSS, 227 kB JS. Welke concrete maatregelen zijn er zonder
    het ontwerp te veranderen (font self-hosting, `font-display`, preload,
    `useMemo` op `buildActiveSite`, chunk splitsen)?
16. Is `buildActiveSite` puur en goedkoop genoeg? Meet desnoods met een script
    hoe vaak hij per navigatie draait en hoe duur één aanroep is.
17. Zijn er ongebruikte routes of componenten in de router (dode `Route`-variaties,
    ongebruikte `getRouteMeta`-takken)? Bewijs met `grep` op de route-union.
18. Wat gebeurt er als `PRERENDER_SITE_URL` niet is gezet? Staan er dan
    verkeerde hosts in canonical/sitemap/OG? Is dat een stille productiefout?

## Output

Schrijf `docs/arena_agent_src/output/KB-SRC-01-app-router-seo-2026-10-25.md`
volgens het contract in `docs/arena_agent_src/02-promptconventies.md`
(negen secties, status-tabel, bewijs per regel).

Neem in sectie 4 minstens deze kandidaten mee en beoordeel ze op haalbaarheid
met de bestaande code: per-vak landingspagina's (`/vak/:sector`), JSON-LD per
preset, OG-image per preset, een echte 404-status, prefetch van de
volgende route, een error boundary met WhatsApp-fallback, en een
`?pakket=`-bewuste CTA op de homepage.

## Acceptatiecriteria

- Elke bevinding noemt `pad:regel`; elke status is gemotiveerd.
- De vragen 1, 6, 7, 11 en 16 zijn aantoonbaar getest (commando of script in
  sectie 9), niet alleen beredeneerd.
- Minstens drie concrete verbeteringen zijn direct uitvoerbaar (S) zonder
  nieuwe dependency.
- Je hebt expliciet gemeld welke eerdere auditpunten (docs/08) inmiddels zijn
  opgelost — en welke claim daarvan dus verouderd is.

## Niet doen

- Geen code, docs of config wijzigen; alleen je resultaatbestand schrijven.
- Geen voorstellen die het ontwerp of de huisstijl veranderen.
- Geen SEO-advies dat nieuwe content vereist zonder dat te benoemen.

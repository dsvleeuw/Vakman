# KB-SRC-01 — App, router, SEO, prerender en hydratie

- **Datum:** 2026-10-25 · **Commit:** `7d5ec3d` (+ documentatie-commit `868e013`)
- **Prompt:** `prompts/src-01-app-router-seo.prompt.md`
- **Soort:** read-only onderzoek · **Uitgevoerd met:** codelezen, `bun run build`, `dist/`-inspectie
- **Bewijs:** elke regel met `pad:regel` is zelf nagekeken

## 0. Samenvatting

Routing en prerender zijn beter dan de docs suggereren: 39 pagina's, correcte
canonical, één `og:image`, geen dubbele meta, echte 404-view en nette
`robots`-sturing per route. De zwakke plekken zitten ergens anders:
**(1)** de SPA serveert een **soft 404** (HTTP 200) op onbekende paden,
**(2)** query-parameters die de router niet kent — inclusief `utm_*` — worden bij
de eerste render **uit de URL gestript**, waardoor campagnemeting onmogelijk is,
**(3)** er is geen error boundary, dus een mislukte chunk of render geeft een
leeg scherm, en **(4)** `buildActiveSite` draait ongememoïseerd bij elke render.
Alles is met kleine ingrepen op te lossen; niets vraagt een herontwerp.

## 1. Status-tabel

| # | Onderdeel | Belofte | Werkelijkheid | Status | Ernst | Effort |
|---|---|---|---|---|---|---|
| 1 | Echte URL per scherm | README, `docs/architecture.md` | `parseRoute`/`buildPath` dekken 10 routevormen (`src/utils/router.ts:110-290`) | klaar | — | — |
| 2 | Prerender + hydratie | "prerendered and hydrating" | 39 `index.html`, `main.tsx:14-33` preloadt chunk vóór `hydrateRoot` | klaar | — | — |
| 3 | Meta per route | canonical/OG correct | `useRouteMeta.ts:76-86` zet title, description, og, canonical, robots | klaar | — | — |
| 4 | Noindex voor wizard/offerte/kaart | `robots.txt` | `useRouteMeta.ts:15-24` + `dist/robots.txt` | klaar | — | — |
| 5 | 404-status | "branded 404" | view bestaat, maar Netlify serveert `200` via `public/_redirects:2` | deels | P1 | S |
| 6 | Deep links met campagne-params | niet beloofd | `App.tsx:166-180` herschrijft URL naar `buildPath()`, `utm_*` verdwijnt | kapot | P1 | S |
| 7 | Foutopvang | niet beloofd | geen error boundary; `main.tsx:22-24` slikt preload-fouten | ontbreekt | P1 | S |
| 8 | Persoonlijke demo-links | A2 uit fixlijst | werkt, maar dezelfde `?naam=`-URL is indexeerbaar (canonical wijst naar de preset) | deels | P2 | S |
| 9 | Structured data | roadmap 4.1 | geen JSON-LD in `index.html` of prerender | ontbreekt | P2 | S |
| 10 | Renderkosten | niet beloofd | `buildActiveSite` inline in JSX (`App.tsx:417`), geen `useMemo` | deels | P2 | S |

## 2. Bugs en defecten

**B1. Soft 404: elke onbekende URL geeft HTTP 200.**
`public/_redirects` bevat `/* /index.html 200`, dus `/deze-route-bestaat-niet`
levert een 200 met de 404-view. Crawlers zien een geldige pagina; Search Console
meldt "soft 404" en linkrot blijft onzichtbaar.
*Bewijs:* `public/_redirects:2`, `src/components/NotFoundView.tsx`,
`src/utils/router.ts:242` (`notFound`). *Fix (S):* Netlify `404.html` + status
404, of een redirect-regel met status 404 voor onbekende paden via
`netlify.toml`.

**B2. Campagne- en trackingparameters verdwijnen bij de eerste render.**
`App.tsx:166-180` vergelijkt `buildPath(route)` met `pathname+search` en doet
`replaceState` bij verschil. `parseRoute` bewaart alleen `vak`, `stijl`,
`pakket`, `naam`, `plaats`, `tel`, `token`, `status` (`router.ts:190-260`).
`?utm_source=linkedin` valt dus buiten de vergelijking en wordt **vóór** de
eerste `page_view` (`App.tsx:121-123`) uit de URL gehaald.
*Gevolg:* geen attribution, geen campagnemeting, en gedeelde links verliezen
hun parameters. *Fix (S):* alleen normaliseren als het pad afwijkt, of
onbekende params expliciet behouden.

**B3. Geen error boundary: één fout = leeg scherm.**
`main.tsx` rendert `<App />` zonder boundary; `SiteView`, `WizardView` en
`ComponentGallery` zijn lazy (`App.tsx:31-58`). Een gewijzigde chunk-hash na een
nieuwe deploy of een exception in een view geeft een wit scherm zonder uitleg.
*Bewijs:* `src/main.tsx:22-33`, geen `componentDidCatch`/`ErrorBoundary` in
`src/` (`grep -rn "componentDidCatch\|ErrorBoundary" src` → leeg).
*Fix (S):* grens per route met Nederlandse fallback + WhatsApp-link.

**B4. `canonical` vlakt bewust personalisatie af — maar `noindex` ontbreekt.**
`useRouteMeta.ts:33-38` maakt canonical zonder querystring. Dat is correct voor
duplicaten, maar de `?naam=&plaats=&tel=`-variant blijft `index, follow`
(`useRouteMeta.ts:15-24` noemt `site` niet). Een prospectlink met een
bedrijfsnaam kan dus gewoon in Google belanden.
*Fix (S):* `noindex` wanneer `route.personal` gezet is.

**B5. `buildActiveSite` draait per render.**
`App.tsx:417` roept de functie inline aan; die doet paletberekening
(`computePalette`), fotoset-rotatie en een merge (`tradesData.ts:1095-1140`).
Bij elke state-update (scroll-state `App.tsx:143-150`, draft, custom data)
opnieuw. *Fix (S):* `useMemo` op `[sector, styleId, customData, personal]`.
*Effect:* minder werk per interactie; meetbaar met een profiler, niet met een
test.

**B6. Onbekende pad-segmenten op `/voorbeeld` worden stil 404.**
`/voorbeeld/loodgieter` is geldig (default stijl, `router.ts:215-222`), maar
`/voorbeeld/loodgieter/krachtig/extra` geeft `notFound` zonder uitleg of
redirect naar de geldige pagina. *Fix (S):* canonical-redirect in plaats van 404.

## 3. Ontbrekende functionaliteit

1. **Echte 404-status** (B1) — nodig voor SEO-hygiëne en linkbeheer.
2. **Error boundary + chunk-retry** (B3) — nu is elke deploy een klein risico
   voor open tabbladen.
3. **JSON-LD** (`LocalBusiness`, `Service`, `FAQPage`, `BreadcrumbList`): alle
   data ligt klaar in `SectorData` (naam, stad, telefoon, diensten, FAQ), maar
   `prijs`, `adres`, `geo`, `openingstijden` en `KvK` ontbreken als veld.
4. **`robots`/`canonical` in de client-rendered routes** (`/kaart`,
   `/offerte/…`): deze zijn niet geprerenderd (`scripts/prerender.ts:35-47`),
   dus de eerste HTML heeft de shell-titel tot de JS draait. Voor
   `/offerte` is dat gevaarlijk (titel "Klusbaas" bij een privé-offerte).
5. **`hreflang`/i18n** — bewust niet nu (Nederlands-only), maar de meta-laag
   gaat uit van één taal.
6. **Prefetch van de volgende route** (bijv. bij hover op een preset): de
   chunks zijn 201 kB (`SiteView`) en 169 kB (`ProspectMapView`), dus prefetch
   levert merkbaar snellere navigatie.

## 4. Nieuwe feature-ideeën

**F1. Per-vak landingspagina's `/vak/:sector` (M).**
Er zijn nu 35 preset-URL's maar geen inhoudelijke landingspagina per vak
(roadmap 4.2/4.3). Data ligt klaar (`SECTORS`), route moet bij in
`router.ts` + `prerender.ts`, en de sitemap groeit met 7 URL's. Levert
organische vindbaarheid op "loodgieter Haarlem"-achtige zoektermen zonder
nieuwe content.

**F2. JSON-LD-generator (S).**
Eén pure functie `buildLocalBusinessJsonLd(site)` in `utils/`, geïnjecteerd in
`scripts/prerender.ts` (zelfde plek als de meta-tags). Vereist dat
`ActiveSiteData` een `address`/`geo`/`openingHours` krijgt (nu niet aanwezig);
telefoon en diensten zijn er wel.

**F3. OG-afbeelding per preset (M).**
Nu één `public/og-image.png` voor alle 39 pagina's. Een build-stap die per
preset een kaart rendert (naam, vak, stad, accentkleur) maakt gedeelde links
herkenbaar. Technisch: een `scripts/og/[sector]-[stijl].png`-generator; zonder
nieuwe dependency kan dat met de bestaande headless-Chrome-stap uit de
README-huisstijlsectie.

**F4. Campagne-attributie (S).**
`utm_*` bewaren (B2), bij de eerste `page_view` meesturen en in
`track()`-props zetten. Sluit aan op het bestaande `analytics.ts` en maakt de
demo-outreach meetbaar.

**F5. "Deel deze demo"-link (S).**
`navigator.share`/kopieer-knop die de huidige preset-URL met
`?naam=&plaats=` deelt. Sluit exact aan op de bestaande personalisatie en de
verkoopworkflow (persoonlijke demo-link).

**Grote gok: stijlen als echte varianten (L).**
Nu is een stijl een index in `STYLES` met een layoutnaam; een klant kan niet
mengen (bijv. "Signaal"-hero met "Puur"-diensten). Dat is een datamodel- en
renderwijziging (`ActiveSiteData` moet per sectie een stijl kunnen dragen).
Alleen doen als klanten erom vragen; het verdubbelt de testmatrix.

## 5. Beter-kunnen

- **Performance:** `dist/` is 4,6 MB; main-chunk 227 kB, CSS 74 kB, `SiteView`
  201 kB. Google Fonts worden render-blocking geladen (`index.html:24-26`);
  self-hosten of `font-display: swap` met preload is de grootste winst.
- **`useMediaQuery`:** start met een fallback en corrigeert in een effect
  (`src/hooks/useMediaQuery.ts`) — correct voor hydratie, maar veroorzaakt een
  layout-flits op mobiel; meet met CLS in Lighthouse.
- **Scrollherstel:** `useRouter.ts:44-64` wacht maximaal 1 s op de lazy chunk;
  bij trage verbindingen landt de gebruiker op de verkeerde plek. Acceptabel,
  maar benoem het.
- **Hydratie-bewaking:** er is geen test die server- en clientmarkup vergelijkt.
  Een klein prerender-testje (titels, canonical, `#root` niet leeg) vangt
  regressies die nu pas in productie opvallen.
- **`lang`-attribuut:** `index.html:2` zet `lang="nl"`; client-navigatie wijzigt
  dat nooit — correct, maar bij i18n (roadmap 5.5) moet dit dynamisch worden.
- **Router-tests:** 285 regels (`router.test.ts`) dekken parsering netjes; er
  ontbreekt een test voor de `App.tsx`-normalisatie (B2), want die zit in een
  component, niet in de pure router.

## 6. Verouderde of foute documentatie

| Document:regel | Citaat | Werkelijkheid | Voorstel |
|---|---|---|---|
| `docs/architecture.md:53` | "home + 35 presets" | ook privacy, nieuwsbrief, afmelden (`prerender.ts:35-47`) | "home, privacy, nieuwsbrief, afmelden en de 35 presets (39 pagina's)" |
| `docs/architecture.md:14` | "marketing page with the 30 presets" | 7 × 5 = 35 | "35 presets" |
| `docs/known-limitations.md` (routing) | "wizard, library en 404 client-rendered; koude load toont spinner" | klopt nog, maar `privacy`/`nieuwsbrief` zijn wél geprerenderd | aanvullen |
| `AGENTS.md:47` | "prerender 39 routes" | 39 pagina's, 38 sitemap-URL's | "39 pagina's / 38 sitemap-URL's" |

## 7. Top 5 aanbevelingen

| # | Aanbeveling | Ernst | Effort | Confidence |
|---|---|---|---|---|
| 1 | Behoud onbekende query-params bij URL-normalisatie (B2) | P1 | S | hoog |
| 2 | Nette 404-status plus `netlify.toml` (B1) | P1 | S | hoog |
| 3 | Error boundary per route met WhatsApp-fallback (B3) | P1 | S | hoog |
| 4 | `noindex` op gepersonaliseerde demo-links (B4) | P2 | S | hoog |
| 5 | `useMemo` om `buildActiveSite` + JSON-LD-generator (B5/F2) | P2 | S | midden |

## 8. Open vragen voor de tech lead

1. Is `VITE_DEMO_PHONE` in productie gezet? Zo nee, dan staan op demo's
   voorbeeldnummers als tekst (zie KB-SRC-04).
2. Mag `/kaart` volledig uit de productiebundel (aparte build of auth)?
3. Willen we per-vak landingspagina's vóór of na het klantdashboard?

## 9. Verantwoording

- `bun run build` → 39 `index.html`, `dist/` 4,6 MB, sitemap 38 URL's,
  `robots.txt` met `/start/`, `/offerte/`, `/kaart`.
- `grep -c 'property="og:image"' dist/voorbeeld/loodgieter/krachtig/index.html`
  → 1; `rel="canonical"` → 1 (geen duplicaten).
- Code gelezen: `router.ts` (398 r.), `useRouter.ts`, `useRouteMeta.ts`,
  `main.tsx`, `entry-server.tsx`, `prerender.ts`, `App.tsx` (485 r.).
- Niet geverifieerd: gedrag in de Netlify-productie (404-configuratie,
  headers) — daarvoor is `netlify.toml` of dashboardtoegang nodig.

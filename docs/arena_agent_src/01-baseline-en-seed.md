# 01 — Baseline en seed-bevindingen

Opgesteld 2026-10-25 op branch `arena/3f301fb7-vakman` (basis `7d5ec3d`).
Alles hieronder is **door mij in de code nagekeken of uitgevoerd**, niet uit de
docs overgenomen. Deze lijst is de grond onder de prompts: elke agent hoeft dit
niet opnieuw te doen en mag ertegenin gaan als hij het tegendeel bewijst.

## A. Baseline (uitgevoerd in deze checkout)

| Commando | Uitkomst |
|---|---|
| `bun install` | 518 packages, ok |
| `bun run check` | **groen** — lint 1,7 s · test 0,9 s · build 3,5 s |
| `bun run test` | **134 tests in 21 bestanden, 0 fail** |
| `bunx tsc --noEmit --strict` | **0 errors** (strict is dus veilig in te schakelen, zie B1) |
| `bun run build` | 39 geprerenderde `index.html`-pagina's, `dist/` = 4,6 MB |
| `bun run e2e` | **niet gedraaid** (Playwright-browsers niet geïnstalleerd) |

Belangrijk: de code is dus niet stuk. Alles wat hieronder staat is
**onwaarheid in docs, ontbrekende functionaliteit, of dingen die beter kunnen** —
geen brand. Dat is precies waarom de prompts op zoek gaan naar bewijs per claim.

## B. Geverifieerde bevindingen (met bewijs)

### Tooling en repo-hygiëne

**B1. `strict` staat niet aan.** `tsconfig.json` heeft geen `strict`,
`noUncheckedIndexedAccess` of `exactOptionalPropertyTypes`; de compiler-opties
stoppen bij `noEmit`. Toch slaagt `tsc --noEmit --strict` met 0 fouten, dus
aanzetten is een nul-risico verbetering die de CI vanaf nu beschermt.
*Bewijs:* `tsconfig.json` (geen `strict`), commando hierboven.

**B2. Er is geen linter en geen formatter.** Geen `.eslintrc*`, geen
`eslint.config.*`, geen `.prettierrc*`, geen `eslint`/`prettier` in
`package.json`. Wel staan er **3 `eslint-disable`-commentaren** in `src/` die dus
niets doen (o.a. `src/App.tsx:176`, `react-hooks/exhaustive-deps`).
*Bewijs:* `grep -rn "eslint-disable" src | wc -l` → 3; `ls -a | grep eslint` → leeg.

**B3. Dode npm-scripts.** `video:render`, `video:still` en `video:preview`
verwijzen naar `src/video/index.ts`, dat **niet bestaat**; `src/video/` bevat
alleen `README.md` en een lege `scenes/`.
*Bewijs:* `package.json:19-21`, `ls src/video/index.ts` → No such file.

**B4. Vijf ongebruikte runtime-dependencies.** `@google/genai`, `motion`,
`@remotion/player`, `express` en `dotenv` worden nergens in `src/`, `netlify/`
of `scripts/` geïmporteerd. `@netlify/blobs` wordt dynamisch geïmporteerd en is
wél in gebruik; `leaflet`, `pdf-lib` en `firebase` zijn terecht.
*Bewijs:* `grep -rl "from '<pkg>'" src netlify scripts` per package.

**B5. `.env.example` is deels AI-Studio-erfenis.** De eerste regels gaan over
`GEMINI_API_KEY` en `APP_URL` ("AI Studio injects this at runtime"), terwijl er
geen Gemini-code in de repo zit.
*Bewijs:* `.env.example:1-9`.

**B6. Werkbestanden staan in git.** 37 bestanden onder `.claude/arena/`
(inclusief `*.result.json` met Windows-paden `C:\Users\ReMarkt\…` en
`run-task.mjs`) en 8 bestanden onder `.aistudio/artifacts/…` (PNG's +
implementatieplan) zijn gecommit.
*Bewijs:* `git ls-files .claude | wc -l` → 37; `git ls-files .aistudio | wc -l` → 8.

**B7. Geen `netlify.toml`.** Er is geen build-config, geen publish-dir en geen
security-/cacheheaders in de repo; alleen `public/_redirects` met
`/* /index.html 200`. De drie functions leunen op `export const config = { path }`.
*Bewijs:* `git ls-files | grep netlify.toml` → leeg; `netlify/functions/lead.mts:34`.

### Type- en architectuurlaag

**B8. Zeven sectoren, niet zes.** `ORDER` bevat `'timmerman', 'hovenier',
'schilder', 'loodgieter', 'elektricien', 'stukadoor', 'overige'` → 7 × 5 = 35
presets. Docs zeggen op meerdere plekken 6 × 5 = 30.
*Bewijs:* `src/data/tradesData.ts:14-22` vs `AGENTS.md:9`,
`docs/architecture.md:14`, `src/data/README.md:9`; `README.md:11` zegt wél 35.

**B9. Slimme tools dekken 4 van de 7 sectoren.** Alleen `timeline` (timmerman),
`m2-calculator` (schilder), `emergency` (loodgieter) en `fault-report`
(elektricien) zijn toegekend. Hovenier, stukadoor en overige hebben geen tool,
terwijl roadmap 2.3/2.4/2.5 ze als openstaand noemt.
*Bewijs:* `src/data/tradesData.ts:149,388,508,630`; `TradeToolId` in
`src/types.ts:13-17` kent ook maar vier waarden.

**B10. `PublishedSiteRecord` is dood hout.** Het type staat in `src/types.ts:222`
en heeft nul verwijzingen elders — publicatie wordt nergens vastgelegd.

**B11. `buildActiveSite` draait ongememoïseerd in de render.** In `App.tsx`
wordt hij inline in JSX aangeroepen, dus bij elke render van de app opnieuw
(palet + fotoset + merge); er is geen `useMemo`.
*Bewijs:* `src/App.tsx:417`, `grep -n "useMemo" src/App.tsx` → leeg.

**B12. Twee monolithische views.** `SiteView.tsx` = 1367 regels,
`WizardView.tsx` = 1341 regels, `tradesData.ts` = 1166 regels. Beide views zijn
nauwelijks unit-testbaar; er bestaan alleen server-render-smoke tests voor
`components/extras/`.
*Bewijs:* `wc -l src/components/SiteView.tsx src/components/WizardView.tsx`.

### Server, leadflow en privacy

**B13. Rate limit is per functie-instantie.** `createRateLimiter({ limit: 20,
windowMs: 10 * 60 * 1000 })` wordt op moduleniveau aangemaakt, dus elke koude
Netlify-instantie heeft zijn eigen teller.
*Bewijs:* `src/server/leadHandler.ts:69`; ook al genoemd in
`docs/known-limitations.md`.

**B14. Twee eerdere P0's zijn inmiddels wél opgelost** (docs lopen achter):
- `useLeadForm.reset()` zet `startedAt` **niet** meer opnieuw →
  `src/hooks/useLeadForm.ts:42-46`.
- `submitLead` heeft een timeout van 12 s met Nederlandse foutmelding →
  `src/utils/leadClient.ts:25,40`.
- `buildNextDates` slaat weekenden over → `src/utils/appointments.ts:86`.
- Afspraken worden in `localStorage` bewaard (`saveAppointment`,
  `loadAppointments`) → `src/utils/appointments.ts:56,66`.
- `robots.txt` sluit `/kaart` uit en er staat één `og:image` per pagina
  (geen duplicaten) → `dist/robots.txt`, `dist/voorbeeld/loodgieter/krachtig/index.html`.
Dit is direct bewijs dat `docs/08-audit-resultaten.md` op die punten
achterloopt.

**B15. Analytics wordt nergens verzameld.** `track()` pusht naar
`window.dataLayer`/`gtag`, maar er staat geen GTM- of GA-snippet in
`index.html` of `dist/index.html`. Alle 15 `track()`-aanroepen zijn dus
no-ops in productie.
*Bewijs:* `src/utils/analytics.ts`; `grep -n "googletagmanager\|gtag" index.html dist/index.html` → leeg.

**B16. Prerender dekt 4 + 35 routes.** `routesToPrerender()` doet home,
privacy, nieuwsbrief, afmelden en alle 35 presets; build schrijft 39
`index.html`-bestanden en een sitemap met 38 URL's. `docs/architecture.md:53`
noemt alleen "home + 35 presets".
*Bewijs:* `scripts/prerender.ts:35-47`, `find dist -name index.html | wc -l` → 39,
`grep -c "<url>" dist/sitemap.xml` → 38.

### Formulieren en toegankelijkheid

**B17. `BookingCalendar` heeft 7 labels zonder associatie.** Zeven
`<label>`-elementen, nul `htmlFor`, en de inputs staan als siblings (geen
impliciete labeling): naam, telefoon, adres en de drie keuzestappen.
*Bewijs:* `src/components/BookingCalendar.tsx:295,321,345,367,385,403,421`,
`grep -c htmlFor` → 0.

**B18. Elders is het wél goed gedaan.** `FaultReportForm` (6/6),
`SurfaceCalculator` (5/5) en `ContactSection` (3/3) koppelen elk label aan een
input. Het probleem is dus lokaal, niet systematisch.
*Bewijs:* `grep -c '<label'` vs `grep -c htmlFor` per bestand.

**B19. Focusringen zijn bewust opgelost.** `src/index.css:1-33` zet
`a:focus-visible, button:focus-visible, …` met uitleg over specificiteit; het
`aria-live`-gebruik is 11 plekken. A11y is dus deels gedaan — de vraag is waar
het nog ontbreekt, niet of het ontbreekt.

### Performance en bundel

**B20. Bundelgrootte na build.** `dist/` = 4,6 MB. Grootste chunks:
`SiteView` 201 kB, `ProspectMapView` 169 kB (+15 kB CSS, Leaflet), main
`index` 227 kB, `ComponentGallery` 42 kB, `WizardView` 38 kB, CSS 74 kB.
Route-splitting werkt, maar de main-chunk en de kaart zijn zwaar voor wat ze
doen.
*Bewijs:* `du -sh dist`, `ls -la dist/assets`.

**B21. Alle beeld is hot-linked Unsplash.** Geen lokale optimalisatie, geen
`srcset`, geen eigengemaakte fotografie (roadmap 5.3).
*Bewijs:* `getPhotoSet` in `src/data/tradesData.ts`, `ImageWithFallback.tsx`.

### Content en data

**B22. Componentcatalogus is compleet en consistent.** 30 entries in
`src/data/componentCatalog.ts`, 10 herbruikbare extras in
`components/extras/`, en de UI-tekst "30 componenten" klopt daarmee
(`ComponentGallery.test.tsx:24`). Dit cijfer is dus géén doc-drift, in
tegenstelling tot de "30 presets"-claim.

**B23. Privacy-tekst is nog niet af.** `docs/known-limitations.md` meldt dat
KvK-nummer en vestigingsadres ontbreken en dat het contactadres een
Gmail-adres is. Dat staat in `src/components/InfoPages.tsx`.

### Docs

**B24. Docs spreken elkaar en de code tegen.** Voorbeelden:
`docs/ux-review.md:57,97-98` zegt "36 routes" en "65 tests";
`docs/07-arena-audit-plan.md:21` zegt 125 tests; `AGENTS.md:47` zegt 39 routes;
de werkelijkheid is 134 tests en 39 geprerenderde pagina's.
`docs/known-limitations.md` zegt "alleen pure utils hebben tests" terwijl er
ook component- en serverhandler-tests zijn (`src/components/*.test.tsx`,
`src/server/*.test.ts`).

**B25. De documentatie-index is incompleet.** `docs/README.md` noemt
`06-app-fixlijst.md`, `07-arena-audit-plan.md` en `08-audit-resultaten.md` niet,
en `docs/bedrijfsinformatie/` ontbreekt in de submappenlijst.

**B26. `AGENTS.md` is inhoudelijk verouderd op twee kernpunten.** Het zegt
"no application backend" en "(6 trades × 5 styles = 30 presets)", terwijl er
een lead-API met opslag, mail en PDF is en er 35 presets zijn.
*Bewijs:* `AGENTS.md:9-12`.

## C. Hypotheses die de prompts moeten bevestigen of weerleggen

Deze heb ik **niet** hard gemaakt — ze zijn te groot of te verspreid voor een
grep. Elke hypotheses heeft een eigenaar-prompt.

| # | Hypothese | Prompt |
|---|---|---|
| H1 | De wizard heeft geen echte step-guard: je kunt `/start/afspraak` openen zonder gegevens en alsnog een offerte aanvragen. | 04 |
| H2 | De demo-site is presentatie, geen product: er is geen publicatie-, versie- of per-klant-configuratiepad, dus "jouw website" is niet echt te leveren. | 04, 09 |
| H3 | De server valideert niet alles wat de client stuurt (bedragen, pakket-id's, add-ons) en herberekent de offerte mogelijk niet zelf. | 02 |
| H4 | Offertetokens verlopen niet en zijn niet aan een e-mailadres gebonden. | 02 |
| H5 | De preview-modus logt persoonsgegevens (mailtekst of adressen) in de serverlog. | 02 |
| H6 | `overige` is een sector zonder eigen content/identiteit en gedraagt zich als een gat in het datamodel. | 03 |
| H7 | Prijzen staan op meer dan één plek (plans, add-ons, sector-services, € 25/maand) en kunnen uit elkaar lopen. | 03 |
| H8 | De m²-calculator en `utils/surface.ts` zijn generiek genoeg voor stukadoor/hovenier, maar worden maar door één sector gebruikt. | 03, 05 |
| H9 | `SiteView` en `WizardView` bevatten duplicatie (hero's, CTA's, formulierstatus) die in `components/` hoort. | 04, 05 |
| H10 | Er zijn geen afbeelding-`srcset`/`loading`-attributen, dus LCP en dataverbruik op mobiel zijn onnodig slecht. | 06 |
| H11 | Reduced-motion wordt niet (overal) gerespecteerd; `src/index.css` definieert keyframes zonder media query. | 06 |
| H12 | De e2e-suite dekt alleen route-rooktests en één wizardpad; geen offerteflow, geen nieuwsbrief, geen a11y-assertions. | 07 |
| H13 | De Playwright-config draait tegen `vite preview` van een volledige build, wat CI traag en kwetsbaar maakt. | 07 |
| H14 | `npm`-gebruik is nog steeds mogelijk en breekt (ESLINT/ERESOLVE), terwijl docs Bun voorschrijven — er is geen guard (engines/`packageManager`). | 07 |
| H15 | Docs bevatten meer verouderde claims dan B24 laat zien; een gestructureerde claim-voor-claim vergelijking ontbreekt. | 08 |
| H16 | Er is geen enkele vorm van monitoring/alerting; een falende lead-mail valt alleen op in de Netlify-log. | 02, 09 |
| H17 | Analytics-events zijn niet compleet voor de funnel (geen offerte-view, geen PDF-download, geen nieuwsbrief-confirm). | 02, 06 |
| H18 | De nieuwsbrief is alleen inschrijven/bevestigen/afmelden; er is geen verzend- of campagneflow (docs zeggen dit ook). | 02 |
| H19 | De kaart (`/kaart`) is een intern hulpmiddel in de productiebundel en lekt mogelijk leadgegevens via `public/kaart/leads.json`. | 02, 07 |
| H20 | Er is geen enkele test voor de PDF-generatie, de mailtemplate of de prerender-output; regressies daar vallen pas in productie op. | 02, 07 |

## D. Wat dit betekent voor de prompts

1. De prompts **herhalen B1–B26 niet**, ze bouwen erop voort en moeten
   expliciet melden als iets uit deze lijst inmiddels anders is.
2. Elke prompt krijgt een eigen **bewijsdichtheid**: geen suggestie zonder
   `pad:regel`.
3. De synthese-prompt (`src-09`) mag alleen putten uit golf 1 en moet
   tegenstrijdigheden tussen prompt-resultaten expliciet oplossen.

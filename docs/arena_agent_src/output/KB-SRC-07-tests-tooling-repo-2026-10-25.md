# KB-SRC-07 — Tests, tooling, CI en repo-hygiëne

- **Datum:** 2026-10-25 · **Commit:** `7d5ec3d`
- **Prompt:** `prompts/src-07-tests-tooling-repo.prompt.md`
- **Soort:** read-only · **Uitgevoerd met:** `bun run check`, `bunx tsc`,
  `git ls-files`, `grep`-inventarisaties

## 0. Samenvatting

De basis is gezond (134 tests, groene check, CI die lint+test+build én
Playwright draait), maar het **testoppervlak is smal en de typeveiligheid is
niet afgedwongen**: `strict` staat niet aan (de code is er wél klaar voor),
er is geen linter, 15 modules en 41 componenten hebben geen test, en de
belangrijkste geldlogica (PDF, mailtemplate, offertetoken, prerender-output)
is ongetest. De repo draagt daarnaast **werkmateriaal** mee: 37 bestanden in
`.claude/arena/` (met Windows-paden) en 8 AI-Studio-artefacten.

## 1. Dekkingskaart

| Map | Niet-test bestanden | Met test | Wat de tests bewijzen |
|---|---|---|---|
| `utils/` | 20 | 13 | pure logica: prijzen, offerte, contact, router, kleur, afspraken, analytics, fonts |
| `data/` | 6 | 2 (`paletteContrast`, `tradesData`, `componentCatalog`) | contrastcontract, sectorintegriteit, catalogus |
| `server/` | 6 | 2 (`leadHandler`, `newsletterHandler`) | API-gedrag met mocks; **niet**: mailer, PDF, storage, newsletterStorage |
| `hooks/` | 4 | 0 | — |
| `components/` | 41 | 2 (`ComponentGallery`, `extras`) | SSR-smoke; geen interactie, geen a11y |
| `e2e/` | 2 specs | — | rooktest 8 routes + 1 wizardpad |

**Zonder test (15 modules):** `utils/leadEmail.ts`, `utils/newsletterStatus.ts`,
`server/mailer.ts`, `server/newsletterStorage.ts`, `server/quotePdf.ts`,
`server/storage.ts`, `data/addons.ts`, `data/plans.ts`, `data/brandMark.ts`,
`data/platform.ts`, `data/prospects.ts`, `hooks/useLeadForm.ts`,
`hooks/useMediaQuery.ts`, `hooks/useRouteMeta.ts`, `hooks/useRouter.ts`.

## 2. Bugs en defecten

**B1. `strict` staat niet aan.**
`tsconfig.json` heeft geen `strict`, geen `noUncheckedIndexedAccess`, geen
`exactOptionalPropertyTypes`. `bunx tsc --noEmit --strict` geeft **0 fouten**,
dus de code is er klaar voor; de CI beschermt die eigenschap nu niet.
*Fix (S):* `"strict": true` in `tsconfig.json`.

**B2. Geen linter, wel dode `eslint-disable`-regels.**
Geen ESLint/Prettier-config, geen dependency; 3 `eslint-disable`-commentaren
doen niets (`App.tsx:169`, `WizardView.tsx:136,168`). Daarmee blijven
`exhaustive-deps`-fouten, ongebruikte imports en `no-floating-promises`
ongezien. *Fix (S/M):* minimale `eslint` + `typescript-eslint` + react-hooks;
of, goedkoper, `oxlint`. *Nadeel:* nieuwe dependency en configuratie.

**B3. Twee e2e-tests zijn `test.fixme` — dat zijn echte bugs.**
`e2e/routes.spec.ts` markeert (a) een 14 px zoekveld in de galerij en (b) het
voorbeeldnummer `06 45 67 89 01` op het loodgieter-voorbeeld. Beide zijn
**applicatiefouten die alleen gedocumenteerd zijn**. Vooral (b) is een
vertrouwensrisico (KB-SRC-04 B1). *Fix:* bug oplossen, `fixme` verwijderen; tot
die tijd horen ze in `docs/known-limitations.md`.

**B4. De e2e-run bouwt de app opnieuw.**
`playwright.config.ts:8-12` start `bun run build && vite preview` als
`webServer`. In CI betekent dat: `bun run check` bouwt, daarna bouwt Playwright
nóg eens (build 3-4 s lokaal, maar met prerender van 39 pagina's op een koude
CI-run minuten). *Fix (S):* in CI `dist` uit de vorige stap hergebruiken met
`vite preview` zonder build; `reuseExistingServer` staat al goed.

**B5. Dode en misleidende scripts.**
`video:render|still|preview` wijzen naar `src/video/index.ts`, dat niet bestaat;
`clean` verwijdert `server.js` (bestaat niet); `lh:scan` is nooit gedraaid
volgens `02-taken.md`. *Fix (S):* verwijderen of implementeren — een script dat
zeker faalt is erger dan geen script.

**B6. Vijf ongebruikte dependencies.**
`@google/genai`, `motion`, `@remotion/player`, `express`, `dotenv` worden
nergens geïmporteerd (`grep -rl "from '<pkg>'" src netlify scripts`).
`@remotion/cli`, `@remotion/renderer` en `remotion` staan er ook, maar zonder
video-implementatie. Samen een fors `node_modules`- en audit-oppervlak.
*Fix (S):* verwijderen; `@netlify/blobs` (dynamisch) en `leaflet`/`pdf-lib`/
`firebase` blijven.

**B7. Werkmateriaal in git.**
37 bestanden onder `.claude/arena/` (inclusief `*.result.json` met
`C:\Users\ReMarkt\…`) en 8 onder `.aistudio/artifacts/…` (PNG's,
implementatieplan) zijn gecommit. Dat is geen securityprobleem, wel ruis en een
verkeerd signaal naar buiten. *Fix (S):* verplaatsen naar een lokaal/gitignored
pad; `.claude/arena/*.result.json` in ieder geval uitsluiten.

**B8. Geen `netlify.toml`.**
Build-commando, publish-dir en headers leven alleen in het Netlify-dashboard.
Daarmee zijn er geen securityheaders (CSP, HSTS, `X-Content-Type-Options`), geen
cacheregels en geen 404-status (KB-SRC-01 B1). *Fix (S).*

**B9. `npm` blijft een voetangel.**
Geen `packageManager`- of `engines`-veld; `package.json` heet `react-example`
(versie 0.1.0). Wie `npm install` doet, krijgt de gedocumenteerde `ERESOLVE`.
*Fix (S):* `"packageManager": "bun@1.4.x"`, `"engines": { "node": ">=20" }`,
naam `klusbaas`.

## 3. Ontbrekende functionaliteit (proces)

1. **Prerender-contracttest**: geen test die `dist/**/index.html` controleert op
   `<title>`, canonical, `#root`-inhoud, aantal `h1` en sitemap-lidmaatschap.
   Regressies hier vallen nu pas in productie op.
2. **Mail/PDF-tests** (B: `leadEmail`, `quotePdf`): twee van de drie
   klantcontactmomenten zijn ongetest.
3. **Bundle-budget** in CI (main-chunk 227 kB, `SiteView` 201 kB).
4. **Lighthouse-budget** — er is een script (`scripts/lighthouse-scan.mjs`) maar
   geen CI-stap en geen drempel.
5. **`docs:check`**: een script dat de cijfers in docs (tests, routes, presets)
   tegen de code controleert; nu lopen ze structureel achter (KB-SRC-08).
6. **Dependency-audit / Dependabot** en **release/CHANGELOG-check**.

## 4. Nieuwe feature-ideeën (proces)

**P1. `scripts/docs-check.mjs` (S).** Leest `package.json`, telt tests via
`bun test --reporter`, telt `dist/**/index.html` en `sitemap.xml`, en faalt als
de getallen in `README.md`/`AGENTS.md` afwijken. Lost een structureel probleem
op met ~60 regels.

**P2. Prerender-assertions in e2e (S).** In `e2e/routes.spec.ts`: per route
`title !== 'Klusbaas'`, canonical aanwezig, `h1`-aantal = 1. Vangt B2 uit
KB-SRC-06 en meta-regressies.

**P3. `bun test --coverage` in CI als rapport (S).** Geen drempel, wel
zichtbaarheid per map; de dekkingskaart hierboven is nu handwerk.

**P4. Playwright-trace + screenshot bij falen (S).** `trace: 'on-first-retry'`,
`video`/`screenshot` in de config; nu is een CI-fout nauwelijks te debuggen.

**P5. Repo-hygiëne-script (S).** `scripts/repo-check.mjs` dat faalt op
`.claude/**`, `.aistudio/**`, grote bestanden en `.env`-lekken; draait in CI.

**Grote gok: monorepo-splitsing (L).** `scripts/prerender.ts` importeert uit
`src/`, `netlify/functions` importeert uit `src/server/`, en de video-tooling
hangt aan dezelfde `package.json`. Bij groei (video + app + functies) is een
workspace-splitsing logisch, maar nu onnodige complexiteit.

## 5. Beter-kunnen

- **Testkwaliteit:** de SSR-smoke tests bewijzen "rendert", niet "doet het
  juiste". Per component één assertie op inhoud/gedrag (bijv. `TrustBar` toont
  de vier keurmerken, `OpeningHoursCard` toont "Gesloten" op zondag).
- **Determinisme:** `appointments.test.ts` en `quote.test.ts` gebruiken datums;
  controleer of ze timezone-onafhankelijk zijn (`localIsoDate` bestaat al
  vanwege de NL-verschuiving).
- **CI-snelheid:** `bun run check` (3,5 s lokaal) is prima; de e2e-stap domineert.
  Cache Bun (`~/.bun/install/cache`) en Playwright-browsers.
- **Typecheck-scope:** `tsconfig.json` sluit alleen `dist` uit, dus `e2e/` en
  `scripts/` worden meegetypecheckt — goed, houd dat zo.
- **Naamgeving:** `package.json` heet `react-example`; dat is een restje uit de
  AI-Studio-template en komt terug in logs en npm-scripts.

## 6. Verouderde of foute documentatie

| Document:regel | Citaat | Werkelijkheid | Voorstel |
|---|---|---|---|
| `docs/known-limitations.md` (Engineering) | "alleen pure utils hebben unit tests" | ook `server/`-handlers, `data/`-tests en 2 componenttests | herschrijven met de dekkingskaart |
| `docs/architecture.md` (Testing) | "the repository itself contains no CI workflow" | `.github/workflows/check.yml` bestaat | schrappen |
| `AGENTS.md:47` | "prerender 39 routes" | 39 pagina's, 38 sitemap-URL's | verduidelijken |
| `docs/07-arena-audit-plan.md:21` | "125 tests, 39 routes" | 134 tests | cijfer vervangen of `docs:check` gebruiken |

## 7. Top 5

| # | Aanbeveling | Ernst | Effort | Confidence |
|---|---|---|---|---|
| 1 | `strict: true` aanzetten (B1) | P1 | S | hoog |
| 2 | De twee `test.fixme`-bugs oplossen (B3) | P1 | S | hoog |
| 3 | Prerender- en mail/PDF-tests toevoegen | P1 | M | hoog |
| 4 | Repo opschonen: dode scripts, ongebruikte deps, `.claude`/`.aistudio` (B5/B6/B7) | P2 | S | hoog |
| 5 | `netlify.toml` met headers + 404 (B8) | P2 | S | hoog |

## 8. Open vragen

1. Blijft de video-tooling in de repo (dan implementeren) of gaat hij eruit?
2. Mag `.claude/arena` uit git, of is dat bewust onderdeel van de workflow?
3. Welke minimale dekkingsdrempel vinden we verantwoord?

## 9. Verantwoording

- `bun run check` → lint 1,7 s / test 0,9 s / build 3,5 s, alles groen.
- `bunx tsc --noEmit --strict` → 0 fouten.
- Geteld met `find`/`grep`: 81 bronbestanden, 21 testbestanden, 134 tests,
  15 modules zonder test, 41 componenten zonder test.
- `git ls-files` → 234 bestanden; 37 onder `.claude/`, 8 onder `.aistudio/`.
- Niet gedraaid: Playwright (browsers niet geïnstalleerd), Lighthouse-scan.

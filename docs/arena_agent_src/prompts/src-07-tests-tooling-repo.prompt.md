---
id: src-07-tests-tooling-repo
modus: onderzoek
mag-draaien: ja
depends_on: []
schrijft: docs/arena_agent_src/output/KB-SRC-07-tests-tooling-repo-2026-10-25.md
scope: e2e/, playwright.config.ts, .github/, scripts/, package.json, tsconfig.json, .gitignore, netlify/, .claude/, .aistudio/, bun.lock (lezen), src/**/*.test.ts(x) (lezen)
---

# Opdracht — tests, tooling, CI en repo-hygiëne

Je bent een senior platform engineer. Je beoordeelt of dit project **veilig kan
blijven veranderen**: wat vangt regressies, wat niet, en welke rommel maakt het
duurder dan nodig.

## Lees eerst

1. `AGENTS.md` (definition of done, commando's), `.github/workflows/check.yml`,
   `scripts/check.mjs`, `package.json`.
2. `docs/arena_agent_src/01-baseline-en-seed.md` — B1–B7, B20, B24, H12–H14.
3. `docs/08-audit-resultaten.md` (P0-item 3: "geen CI en geen e2e" — dat is
   inmiddels deels opgelost).

## Geverifieerde startsituatie

- `bun run check` = lint + test + build parallel; **groen** (134 tests,
  21 testbestanden, 39 geprerenderde pagina's).
- `bunx tsc --noEmit --strict` geeft **0 fouten**, maar `tsconfig.json` zet
  `strict` niet aan en heeft alleen `"exclude": ["dist"]`.
- Geen ESLint/Prettier; 3 `eslint-disable`-commentaren doen niets.
- 81 niet-test `.ts`/`.tsx`-bestanden in `src/`; 21 testbestanden.
- **15 modules zonder sibling-test:** `utils/leadEmail.ts`,
  `utils/newsletterStatus.ts`, `server/mailer.ts`, `server/newsletterStorage.ts`,
  `server/quotePdf.ts`, `server/storage.ts`, `data/addons.ts`, `data/plans.ts`,
  `data/brandMark.ts`, `data/platform.ts`, `data/prospects.ts`, en de vier hooks.
- **41 componenten zonder test** (alleen `extras/extras.test.tsx` en
  `ComponentGallery.test.tsx` bestaan).
- Playwright: 2 specs (`routes.spec.ts`, `wizard.spec.ts`), 2 viewports, en
  `webServer` draait `bun run build && vite preview` — dus élke e2e-run bouwt
  opnieuw.
- `video:render|still|preview` wijzen naar een niet-bestaand
  `src/video/index.ts`; vijf dependencies zijn ongebruikt; `.claude/` (37 files)
  en `.aistudio/` (8 files) staan in git; er is geen `netlify.toml`.

## Onderzoeksvragen

### Dekking en kwaliteit van tests

1. Maak een dekkingskaart: per map (`utils`, `data`, `server`, `hooks`,
   `components`) hoeveel bestanden, hoeveel getest, en **wat** ze bewijzen.
   Onderscheid: pure logica, contract, SSR-smoke, integratie.
2. Welke tests zijn "assert niets"-tests (renderen zonder crash, snapshot van
   één string)? Noem ze en stel per test één betekenisvollere assertie voor.
3. Welke kritieke logica is ongetest en het meest riskant: kies de top 8 op
   basis van geld/vertrouwen (denk: offertebedragen, PDF, mailtemplate,
   offertetoken, prerender-output, sitemap, pakketprijzen, afspraken).
4. Is er een test voor de prerender-output (titel, canonical, inhoud in
   `dist/**/index.html`) of voor `sitemap.xml`/`robots.txt`? Zo nee: welke
   regressie kan dat opleveren die nu niemand ziet?
5. Worden tests deterministisch uitgevoerd (datum/tijd, `Date.now`,
   `Math.random`, timezone, `localStorage`)? Noem elke test die in december of
   op zondag kan falen.
6. Wat is de testtijd (0,9 s voor 134 tests) — zit daar verborgen netwerk- of
   IO in, of is het echt allemaal puur? Bewijs met `bun test --timeout` of een
   run per bestand.

### E2E en CI

7. Wat dekt `e2e/routes.spec.ts` en `e2e/wizard.spec.ts` echt? Maak een
   tabel: route, assertie, viewport, wat níet gedekt is (offerteflow, PDF,
   nieuwsbrief, afmelden, kaart, 404-status, contactformulier, storing).
8. Is `webServer: bun run build` in `playwright.config.ts` verstandig in CI
   (dubbele build, 240 s timeout, `reuseExistingServer`)? Wat is het risico op
   flakes, en wat is het alternatief (build artefact uit de vorige stap)?
9. Draait CI ook e2e op beide viewports, met artifacts (trace/screenshot bij
   falen), en faalt de job echt bij een flaky test? Bewijs uit
   `.github/workflows/check.yml`.
10. Ontbreekt er CI-bewaking die je voor dit product zou willen: typecheck
    met `strict`, lint, bundle-size budget, Lighthouse-budget, `axe`-scan,
    dependency-audit, linkcheck, spellingscheck op Nederlandse copy,
    `bun.lock`-integriteit (`--frozen-lockfile` staat er al)?
11. Is er caching van Bun/Playwright in CI? Hoe lang duurt een run nu
    (schatting met bewijs) en wat levert caching op?

### Tooling en repo

12. `strict` aanzetten: is dat veilig (0 fouten) en wat wint de CI daarmee?
    Noem de tweede stap (`noUncheckedIndexedAccess`) en of die haalbaar is —
    test het desnoods met `bunx tsc --noEmit --noUncheckedIndexedAccess`.
13. Wat is de minimale ESLint/Prettier-setup die bij deze stack past (React 19,
    TS 7, Vite 8, Bun) en welke regels vangen de fouten die nu sluipen
    (ongebruikte imports, `exhaustive-deps`, `no-floating-promises`)?
14. Is `packageManager`/`engines` gezet? Kan iemand met `npm install` de repo
    slopen (docs zeggen dat het faalt)? Bewijs met `bun.lock` + `package.json`.
15. Repo-hygiëne: welke bestanden horen niet in git (`.claude/arena/*`,
    `.aistudio/`, `out/`, `leads/lh-scores.json`, `firebase-applet-config.json`)?
    Motiveer per bestand: nodig voor de app, nodig voor de workflow, of rommel.
    Let op persoonsgegevens en Windows-paden in gecommitte bestanden.
16. `.gitignore`-gaten: wat kan er per ongeluk in komen (`.data/`, `test-results/`,
    `dist/`, `public/kaart/leads.json` staan er al; wat niet)? En het
    omgekeerde: staat er iets in git dat door `.gitignore` had gemoeten?
17. Ontbrekende projectbestanden: `netlify.toml` (build/headers/redirects),
    `LICENSE`, `CONTRIBUTING`, issue-templates, `CODEOWNERS`, `dependabot`,
    `.editorconfig`, `.nvmrc`/`.bun-version`. Wat is voor dit project echt nodig?
18. Scripts: welke zijn dood of gevaarlijk (`clean` verwijdert `server.js` dat
    niet bestaat, `video:*`, `lh:scan` nooit gedraaid)? Welke ontbreken
    (`typecheck`, `format`, `test:watch`, `test:coverage`, `docs:check`)?
19. Is de `bun.lock` (170 kB) in lijn met `package.json`? Zijn er
    versieconflicten (TypeScript 7, Vite 8, React 19) die over een half jaar
    pijn doen?

## Output

`docs/arena_agent_src/output/KB-SRC-07-tests-tooling-repo-2026-10-25.md`
volgens `02-promptconventies.md`.

Sectie 4 (features) gaat hier over **procesfeatures**: coverage-rapportage,
een `docs:check` die docs-cijfers tegen de code controleert, een
bundle-budget, een a11y-scan in CI, en een release/CHANGELOG-check.

## Acceptatiecriteria

- De dekkingskaart is feitelijk: aantallen bestanden, tests en wát ze bewijzen.
- Vraag 12 en 13 zijn getest (commando-uitkomst), niet aangenomen.
- Elke hygiënebevinding zegt expliciet of verwijderen veilig is (en wat er
  breekt als je het laat staan).
- Je noemt minstens drie checks die nu ontbreken en die een echte regressie uit
  dit project zouden hebben gevangen (met voorbeeld).

## Niet doen

- Geen bestanden verwijderen, geen dependencies installeren/verwijderen, geen
  CI wijzigen. Alleen lezen en adviseren.
- Geen "voeg 100 % coverage toe"-advies; wees selectief en onderbouw per module.

# 03 — Uitvoerplan, golven en parallellisme

## Golven

| Golf | Prompts | Karakter | Levert |
|---|---|---|---|
| 1 | `src-01` … `src-08` | acht onafhankelijke onderzoeken, disjuncte scopes | acht resultaatbestanden met bewijs |
| 2 | `src-09` | synthese, `depends_on: [01…08]` | één prioriteitenlijst + feature-roadmap |
| 3 | `src-10` | bouwvoorbereiding, `depends_on: [09]` | kant-en-klare bouwprompts per top-5 |

Golf 1 mag volledig parallel: geen prompt leest of schrijft een bestand van een
andere prompt, en alle acht schrijven naar een eigen `output/`-bestand.

## Scopes (disjunct, gecontroleerd)

| Prompt | Scope |
|---|---|
| `src-01` app/router/SEO | `src/App.tsx`, `src/main.tsx`, `src/entry-server.tsx`, `src/hooks/**`, `src/utils/router.ts`, `src/utils/fonts.ts`, `src/components/{RouteLink,NotFoundView,Header,SiteFooter}.tsx`, `scripts/prerender.ts`, `index.html`, `public/_redirects`, `public/site.webmanifest` |
| `src-02` server/API/security | `src/server/**`, `netlify/functions/**`, `vite.config.ts`, `src/utils/{lead,leadClient,leadEmail,quote,newsletter,newsletterClient,newsletterStatus}.ts`, `src/hooks/useLeadForm.ts`, `src/components/{LeadStatus,QuoteView,QuoteSummary}.tsx` |
| `src-03` data/content/pricing | `src/data/**`, `src/types.ts`, `src/utils/{pricing,surface,color}.ts` |
| `src-04` wizard/site/conversie | `src/components/{WizardView,SiteView,BookingCalendar,PriceCalculator,AreaChecker,InfoPages,DemoContactNotice,BeforeAfterSlider}.tsx`, `src/utils/{appointments,googleWorkspace}.ts` |
| `src-05` tools/extras | `src/components/tools/**`, `src/components/extras/**`, `src/components/{ContactSection,FaqSection,HeroStrip,PresetsSection,PricingSection,HowItWorks,NewsletterSignup,TrustBar,ImageWithFallback}.tsx`, `src/utils/contact.ts` |
| `src-06` a11y/UX cross-cutting | `src/index.css`, alle `src/components/**/*.tsx` (lezen) + `e2e/**` (lezen), `src/hooks/useMediaQuery.ts` |
| `src-07` tests/tooling/repo | `e2e/**`, `playwright.config.ts`, `.github/**`, `scripts/**`, `package.json`, `tsconfig.json`, `.gitignore`, `netlify/**`, `.claude/**`, `.aistudio/**`, `bun.lock` (alleen lezen) |
| `src-08` docs-drift | `README.md`, `AGENTS.md`, `ROADMAP.md`, `CHANGELOG.md`, `SKILL.md`, `arena-plan.md`, `02-taken.md`, `docs/**` (m.u.v. `docs/arena_agent_src/output/`) |

`src-06` en `src-01`/`src-05` raken dezelfde bestanden, maar alleen **lezen**:
geen conflict, want niemand schrijft ze. De afbakening is inhoudelijk:

- `src-01` = routing, meta, prerender, hydratie, laadtijd.
- `src-05` = gedrag en conversie per component/tool.
- `src-06` = toegankelijkheid en UX-patronen over álle componenten.

Als `src-06` iets vindt dat in `src-05` thuishoort, noteert hij het kort en
verwijst hij ernaar; hij herhaalt het niet.

## Verwachte omvang en tijd

| Prompt | Verwacht resultaat | Doorlooptijd (ik, in deze sessie) |
|---|---|---|
| elk van `src-01` … `src-08` | 150–350 regels | 10–20 min per prompt |
| `src-09` | 250–400 regels + executive summary | 20–30 min |
| `src-10` | 5–10 bouwprompts | 10–15 min |
| totaal | ± 2.000–2.800 regels documentatie | 2,5–4 uur werk in deze sessie |

Via de Arena bridge is het goedkoper maar trager (wachtrij, 90 s tussen prompts)
en zonder commando's; reken op een halve dag.

## Volgorde die ik aanraad

1. **Eerst `src-07` en `src-08`.** Die leveren de feitelijke basis (wat is er
   echt getest, welke docs liegen) en zijn het snelst klaar.
2. **Dan `src-02` en `src-04`.** Dat zijn de duurste risico's: leadverlies,
   privacy, en de wizard die de belofte "binnen een kwartier" draagt.
3. **Daarna `src-01`, `src-03`, `src-05`, `src-06`.** Belangrijk, maar minder
   urgent; ze profiteren van de context die 07/08 al hebben opgeleverd.
4. **`src-09`** als alles klaar is. Niet eerder: de synthese moet kunnen
   schrappen, en dat kan alleen met alle acht resultaten.
5. **`src-10`** alleen als je daarna echt wilt bouwen.

## Risico's en tegenmaatregelen

| Risico | Tegenmaatregel |
|---|---|
| Acht resultaten die elkaar tegenspreken | `src-09` krijgt expliciet de opdracht tegenstrijdigheden te benoemen en te beslechten met eigen codecheck |
| Veel regels, niemand leest het | executive summary van max. 2 kantjes + top-20 tabel met ernst/effort |
| "Advies zonder bewijs" | bewijsplicht per bevinding; zonder `pad:regel` → open vraag |
| Scope-creep naar bouwen | golf 1 en 2 zijn read-only; alleen `src-10` schrijft voorstellen, geen code |
| Dubbele bevindingen (a11y komt overal terug) | `src-06` is eigenaar van a11y; andere prompts verwijzen |
| Docs worden weer leidend | `src-08` toetst elke doc-claim aan de code, niet omgekeerd |

## Definition of done per golf

- Golf 1: acht bestanden in `output/`, elk met de negen verplichte secties, elk
  met minstens één `pad:regel` per bevinding, en een statusregel in
  `output/README.md`.
- Golf 2: één synthesebestand met een top-20 die volledig herleidbaar is naar
  golf 1 (`KB-SRC-0n#nr`), plus een expliciete "niet doen"-lijst.
- Golf 3: bouwprompts die voldoen aan de `AGENTS.md`-regels (scope, acceptatie,
  non-goals, `bun run check` als eindcheck) en die zonder extra uitleg door een
  agent uitvoerbaar zijn.

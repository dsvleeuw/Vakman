# Arena agent — src-audit & feature-ideeën

Dit is het werkpakket voor een **ultra diepe, code-gedreven audit van `src/`**
plus de algemene documentatie. Doel is niet "nog een audit", maar een
prioriteitenlijst die je kunt uitvoeren: **wat werkt niet, wat ontbreekt, wat
kan beter, en welke nieuwe features passen echt bij deze code.**

Elke prompt is losstaand uitvoerbaar, heeft een eigen scope, schrijft één
resultaatbestand en levert bewijs in de vorm van `bestand:regel`. Geen
algemeenheden, geen aannames: alles moet terug te vinden zijn in de code.

## Waarom prompts en geen eindrapport

De diepte die je wilt (19.000 regels in `src/`, 21 testbestanden, 6 docs met
eigen claims, server-code, wizard, 35 presets) past niet in één antwoord zonder
dat het vaag wordt. Daarom is het opgeknipt in **8 parallelle onderzoeksprompts
met disjuncte scopes**, daarna **1 synthese-prompt** en **1 prompt die de
bouwopdrachten schrijft**. Zo blijft elke conclusie herleidbaar en kun je
tussentijds bijsturen.

```
docs/arena_agent_src/
├── README.md                        ← dit bestand (start hier)
├── 00-bevestigen.md                 ← wat ik van jou nodig heb vóór ik draai
├── 01-baseline-en-seed.md           ← door mij geverifieerde feiten + hypotheses
├── 02-promptconventies.md           ← het contract dat elke prompt volgt
├── 03-uitvoerplan-en-golven.md      ← golven, parallellisme, depends_on, planning
├── batch.json                       ← klaar voor de Arena bridge (.claude/arena)
├── prompts/
│   ├── src-01-app-router-seo.prompt.md
│   ├── src-02-server-api-security.prompt.md
│   ├── src-03-data-model-content.prompt.md
│   ├── src-04-wizard-site-conversie.prompt.md
│   ├── src-05-tools-extras-componenten.prompt.md
│   ├── src-06-a11y-ux-cross-cutting.prompt.md
│   ├── src-07-tests-tooling-repo.prompt.md
│   ├── src-08-docs-drift-waarheid.prompt.md
│   ├── src-09-synthese-roadmap.prompt.md
│   └── src-10-bouwprompts-generator.prompt.md
└── output/
    ├── README.md                    ← naamgeving en status van de resultaten
    └── (resultaten komen hier)
```

Daarnaast: `sjablonen/resultaat-template.md` (het verplichte resultaatformat)
en `sjablonen/google-docs-naamgeving.md` (naamgeving voor de Docs-spiegel).

## Drie manieren om dit te draaien

1. **In deze sessie (aanbevolen om te starten).** Zeg "start golf 1" en ik voer
   de prompts één voor één uit op deze branch, schrijf de resultaten in
   `output/` en commit per prompt. Ik kan hier `bun run check`,
   `bunx tsc --noEmit --strict` en de build draaien, dus ik kan claims
   *bewijzen* in plaats van alleen beredeneren.
2. **Via de Arena bridge** (`.claude/arena/`, `build.json`-formaat). Gebruik
   `batch.json`; de `message` verwijst naar het promptbestand, dus er is één
   bron van waarheid. `run-task.mjs` leest `.claude/arena/build.json`, dus
   voeg de taken daar samen met je bestaande taken toe (niet overschrijven),
   zet `run` op `true` en start bijvoorbeeld
   `node .claude/arena/queue.mjs --parallel 2 vk-src-01 vk-src-02`.
   De taken staan op `mode: "research"`: de bridge fact-checkt en levert het
   resultaat in de chat; ik schrijf het daarna alsnog naar `output/` met de
   juiste naam. Wil je dat de agent zelf het bestand schrijft, zet `mode` dan
   op `repo` (dan maakt hij een branch + PR) of laat mij het in deze sessie
   doen.
3. **Handmatig.** Kopieer een promptbestand in een nieuwe chat met de repo
   attached. Elke prompt is self-contained (geen verwijzingen naar "de vorige
   prompt" als vereiste context).

## Werkafspraken

- **Read-only onderzoek.** Golf 1 en 2 wijzigen geen applicatiecode. De enige
  schrijfactie is het eigen resultaatbestand in `output/`.
- **Bewijsplicht.** Elke bewering krijgt `pad:regel` of een commando met
  uitkomst. Geen bewijs = geen bewering; zet het dan onder "open vragen".
- **Nederlands** voor alle tekst, Engels voor identifiers en paden (zoals
  `AGENTS.md` voorschrijft).
- **Feiten vs. ideeën gescheiden.** Een bug is geen feature-idee en een
  doc-correctie is geen bug. Elk resultaat heeft aparte secties.
- **Niet stapelen.** Een prompt die iets niet kan verifiëren, meldt dat; hij
  gaat niet gokken en niet "vast" een oplossing bouwen.

## Naamgeving (repo én Google Docs)

- **Prefix:** `KB-SRC` (Klusbaas — Source audit).
- **Daarna de naam:** `nn-onderwerp`, met hetzelfde nummer als de prompt.
- **Datum-suffix:** `JJJJ-MM-DD` (vandaag: `2026-10-25`).

| In de repo | In Google Docs |
|---|---|
| `prompts/src-01-app-router-seo.prompt.md` | `KB-SRC-01-app-router-seo-2026-10-25` |
| `output/KB-SRC-01-app-router-seo-2026-10-25.md` | idem |
| `01-baseline-en-seed.md` | `KB-SRC-BASELINE-seed-bevindingen-2026-10-25` |

De promptbestanden in de repo houden een stabiele naam (zonder datum) zodat
git-historie leesbaar blijft; **elk resultaat** en **elk Google Doc** krijgt
wél prefix + naam + datum.

## Google Docs

Dezelfde set staat in Drive, in de map **Arena Agent — KB-SRC 2026-10-25**
(15 docs, dezelfde namen als hierboven):
<https://drive.google.com/drive/folders/1hpOOHlo0XXWah0kCuC4XiHxry5J_tHWZ>

De resultaatdocs (`KB-SRC-01` … `KB-SRC-10`) komen daar bij zodra een prompt
gedraaid is. Zie [sjablonen/google-docs-naamgeving.md](./sjablonen/google-docs-naamgeving.md).

## Status

| Prompt | Golf | Status |
|---|---|---|
| src-01 app/router/SEO | 1 | klaar |
| src-02 server/API/security | 1 | klaar |
| src-03 data/content/pricing | 1 | klaar |
| src-04 wizard/site/conversie | 1 | klaar |
| src-05 tools/extras/componenten | 1 | klaar |
| src-06 a11y/UX cross-cutting | 1 | klaar |
| src-07 tests/tooling/repo | 1 | klaar |
| src-08 docs-drift | 1 | klaar |
| src-09 synthese | 2 | klaar |
| src-10 bouwprompts | 3 | klaar — wacht op jouw start |

Volgende stap: de audit is gedraaid. Lees
[output/KB-SRC-09-synthese-2026-10-25.md](./output/KB-SRC-09-synthese-2026-10-25.md)
(executive summary + top 20) en daarna
[output/KB-SRC-10-bouwprompts-2026-10-25.md](./output/KB-SRC-10-bouwprompts-2026-10-25.md)
voor de vijf klaargezette bouwprompts (`run: false`).

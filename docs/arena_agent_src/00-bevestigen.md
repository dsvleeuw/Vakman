# 00 — Bevestigen vóór ik draai

Alles hieronder staat klaar. Ik draai niets tot jij het zegt. Dit veld is er om
in één keer de goede dingen te onderzoeken in plaats van achteraf te horen
"dit had ik niet nodig".

## Wat er nu ligt

| Bestand | Wat het is |
|---|---|
| `01-baseline-en-seed.md` | 26 feiten die ik **nu al in de code heb gecontroleerd**, met `pad:regel`. Dit is de grond onder de prompts: agents hoeven die niet opnieuw uit te zoeken. |
| `prompts/src-01` … `src-08` | Acht onafhankelijke onderzoeksprompts met disjuncte scopes. |
| `prompts/src-09` | Synthese: één prioriteitenlijst + feature-roadmap uit de acht resultaten. |
| `prompts/src-10` | Zet de top-5 om in bouwprompts (code-mode, met acceptatiecriteria). |
| `03-uitvoerplan-en-golven.md` | Volgorde, paralleliteit, verwachte doorlooptijd. |
| `batch.json` | Zelfde set voor de Arena bridge. |

## De zes besluiten

### 1. Scope van golf 1 — alles of een subset?

- **A (aanbevolen): alle acht.** Ze zijn disjunct en samen dekken ze `src/`
  volledig plus de docs. Kosten: acht resultaatbestanden, één synthese.
- **B: alleen de vier zwaarste** (`02` server, `04` wizard/site, `07` tooling,
  `08` docs). Sneller, maar je mist data/pricing, tools/componenten en a11y.
- **C: alleen "wat werkt niet"** (`02`, `04`, `07`) en feature-ideeën later.

### 2. Wie draait ze?

- **A (aanbevolen): ik, in deze sessie.** Ik kan `bun run check`,
  `bunx tsc --noEmit --strict`, de build en `dist/` inspecteren, dus ik kan
  beweringen bewijzen. Nadeel: het kost meer van deze sessie.
- **B: de Arena bridge** (`batch.json`, `run: true`). Goedkoper, maar de
  bridge-agents mogen daar niets installeren of draaien (zoals in je eerdere
  `.claude/arena`-taken), dus zij leveren statisch bewijs.
- **C: ik doe golf 1, bridge doet golf 2/3.**

### 3. Diepte versus leesbaarheid van het eindresultaat

- **A (aanbevolen):** elk onderzoeksresultaat mag lang zijn (200–400 regels),
  maar `09` levert daarbovenop een **executive summary van max. 2 kantjes**
  met alleen de beslissingen.
- **B: alles kort.** Max. 80 regels per resultaat; details vervallen.
- **C: alleen de synthese bewaren,** de ruwe resultaten zijn werkmateriaal.

### 4. Feature-ideeën: hoeveel en hoe wild?

- **A (aanbevolen):** per prompt max. 5 ideeën, elk gegrond in bestaande
  types/data, met effort S/M/L en "wat het raakt". Plus één aparte sectie
  "grote gokken" (dashboard, publicatie, betaalfunctie) met een eerlijke
  inschatting.
- **B: alleen quick wins** (≤ 1 dag, geen nieuwe infra).
- **C: ook grote nieuwe productlijnen** (marketing-automatisering, AI-content,
  multi-tenant publicatie) uitwerken tot op API-niveau.

### 5. Google Docs

- **A (aanbevolen):** map `Arena Agent — KB-SRC 2026-10-25` met per prompt één
  doc, naam `KB-SRC-nn-onderwerp-2026-10-25`. Resultaten worden na elk golf-1
  resultaat toegevoegd; de synthese komt als `KB-SRC-09-synthese-2026-10-25`.
- **B: één verzameldoc** met alle resultaten als hoofdstukken.
- **C: alleen de synthese in Docs,** de rest blijft in de repo.

### 6. Wat mag ik daarna bouwen?

- **A (aanbevolen):** niets zonder jouw expliciete "ja" per item; `src-10`
  levert alleen bouwprompts.
- **B: ik mag de P0-fixes die uit de audit komen meteen op deze branch zetten**
  (checks groen, één commit per fix, PR open).
- **C: ik mag alles met effort S uitvoeren.**

## Wat ik na jouw "ja" doe

1. Golf 1 draaien (acht prompts, in twee batches van vier).
2. Per prompt: resultaat schrijven als
   `output/KB-SRC-nn-<naam>-2026-10-25.md`, committen met `docs(audit): …`.
3. Golf 2: `src-09` synthese → `KB-SRC-09-synthese-2026-10-25.md`.
4. Golf 3 (optioneel): `src-10` bouwprompts.
5. Google Docs-map vullen met dezelfde bestanden en namen.
6. Eén PR tegen `main` met alleen documentatie, en een korte samenvatting hier
   in de chat met de top-10 en mijn eigen oordeel.

## Antwoordtemplate

Je kunt gewoon zeggen:

> " defaults, golf 1 nu, docs erbij "

of per punt afwijken:

> " 1A, 2A, 3A, 4C, 5A, 6A "

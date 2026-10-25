# KB-SRC-0n — <titel>

- **Datum:** 2026-10-25
- **Commit:** `<git rev-parse --short HEAD>`
- **Prompt:** `prompts/src-0n-<slug>.prompt.md`
- **Soort:** read-only onderzoek (geen code of docs gewijzigd)
- **Uitgevoerd met:** `bun run check` / `bunx tsc --noEmit --strict` / alleen statisch
- **Bewijsdichtheid:** elke bevinding heeft `pad:regel` tenzij expliciet als
  hypothese gemarkeerd

## 0. Samenvatting (max. 10 regels)

Drie zinnen over wat er echt aan de hand is, plus het belangrijkste advies.

## 1. Status-tabel

| # | Onderdeel | Belofte (doc/UI) | Werkelijkheid (code) | Status | Ernst | Effort |
|---|---|---|---|---|---|---|
| 1 | … | … | `pad:regel` | klaar/deels/ontbreekt/kapot/onduidelijk | P0–P3 | S/M/L |

## 2. Bugs en defecten

Per bug: titel, reproductie, bewijs (`pad:regel`), effect, ernst, minimaal
fixvoorstel.

## 3. Ontbrekende functionaliteit

Per gat: wat er beloofd/verwacht wordt, waar het bewijs staat, wat er precies
mist, en wat het kost om het te dichten.

## 4. Nieuwe feature-ideeën (max. 5 + grote gokken)

Per idee: wie wordt er beter van · waar landt het (bestanden, types, route) ·
waarom nu (bewijs) · effort · wat er kan breken.

## 5. Beter-kunnen: performance, a11y, security, onderhoud

Gegroepeerd per thema, met per punt een meetbare verbetering en de kosten.

## 6. Verouderde of foute documentatie

| Document:regel | Citaat | Werkelijkheid | Voorstel (plakbaar) |
|---|---|---|---|

## 7. Top 5 aanbevelingen

| # | Aanbeveling | Ernst | Effort | Confidence | Bewijs |
|---|---|---|---|---|---|

## 8. Open vragen voor de tech lead

Vragen die je niet zelf kunt beantwoorden, met wat je nodig hebt om ze te
sluiten (toegang, beslissing, meting).

## 9. Verantwoording

- Uitgevoerde commando's + uitkomst.
- Wat je niet kon verifiëren en waarom.
- Waar je afwijkt van `01-baseline-en-seed.md` (met bewijs).

# Google Docs — naamgeving en spiegeling

De resultaten worden gespiegeld naar Google Drive, in één map:

```
Arena Agent — KB-SRC 2026-10-25
```

## Patroon

```
<PREFIX>-<NUMMER>-<NAAM>-<DATUM>
```

| Deel | Regel | Voorbeeld |
|---|---|---|
| PREFIX | `KB-SRC` (Klusbaas · Source audit). Nooit wijzigen binnen één audit. | `KB-SRC` |
| NUMMER | twee cijfers, gelijk aan de prompt (`01`…`10`); `BASELINE` voor de seed | `04` |
| NAAM | korte slug in kleine letters met koppelstreepjes, gelijk aan het promptbestand | `wizard-site-conversie` |
| DATUM | `JJJJ-MM-DD`, de dag van uitvoeren (niet van schrijven van de prompt) | `2026-10-25` |

Voorbeelden:

```
KB-SRC-BASELINE-seed-bevindingen-2026-10-25
KB-SRC-01-app-router-seo-2026-10-25
KB-SRC-02-server-api-security-2026-10-25
KB-SRC-03-data-model-content-2026-10-25
KB-SRC-04-wizard-site-conversie-2026-10-25
KB-SRC-05-tools-extras-componenten-2026-10-25
KB-SRC-06-a11y-ux-cross-cutting-2026-10-25
KB-SRC-07-tests-tooling-repo-2026-10-25
KB-SRC-08-docs-drift-waarheid-2026-10-25
KB-SRC-09-synthese-2026-10-25
KB-SRC-10-bouwprompts-2026-10-25
```

## Wat er nu in de map staat (spiegel van het promptpakket)

| Doc | Bron in de repo |
|---|---|
| `KB-SRC-00-index-en-werkwijze-2026-10-25` | `README.md` |
| `KB-SRC-00-bevestigen-2026-10-25` | `00-bevestigen.md` |
| `KB-SRC-BASELINE-seed-bevindingen-2026-10-25` | `01-baseline-en-seed.md` |
| `KB-SRC-CONVENTIES-promptregels-2026-10-25` | `02-promptconventies.md` |
| `KB-SRC-PLAN-golven-en-uitvoering-2026-10-25` | `03-uitvoerplan-en-golven.md` |
| `KB-SRC-01-app-router-seo-2026-10-25` | `prompts/src-01-…` |
| `KB-SRC-02-server-api-security-2026-10-25` | `prompts/src-02-…` |
| `KB-SRC-03-data-model-content-2026-10-25` | `prompts/src-03-…` |
| `KB-SRC-04-wizard-site-conversie-2026-10-25` | `prompts/src-04-…` |
| `KB-SRC-05-tools-extras-componenten-2026-10-25` | `prompts/src-05-…` |
| `KB-SRC-06-a11y-ux-cross-cutting-2026-10-25` | `prompts/src-06-…` |
| `KB-SRC-07-tests-tooling-repo-2026-10-25` | `prompts/src-07-…` |
| `KB-SRC-08-docs-drift-waarheid-2026-10-25` | `prompts/src-08-…` |
| `KB-SRC-09-synthese-roadmap-2026-10-25` | `prompts/src-09-…` |
| `KB-SRC-10-bouwprompts-generator-2026-10-25` | `prompts/src-10-…` |

Map: `Arena Agent — KB-SRC 2026-10-25`
(<https://drive.google.com/drive/folders/1hpOOHlo0XXWah0kCuC4XiHxry5J_tHWZ>).

Zodra een prompt gedraaid is, wordt het bijbehorende doc **vervangen door het
resultaat** (zelfde naam, zelfde datum) of komt er een nieuw doc met de
uitvoerdatum bij. De prompt zelf blijft in de repo staan als geschiedenis.

## Resultaatdocs (na uitvoering)

Een resultaat krijgt dezelfde prefix en datum, met `-resultaten` vóór de datum,
zodat het naast de opdracht kan staan zonder dezelfde naam:

```
KB-SRC-01-app-router-seo-resultaten-2026-10-25
...
KB-SRC-10-bouwprompts-resultaten-2026-10-25
```

In de map staan nu:

| Opdracht-doc (promptpakket) | Resultaat-doc | Status |
|---|---|---|
| `KB-SRC-00-…` t/m `KB-SRC-10-…` (15 stuks) | — | geüpload |
| — | `KB-SRC-01` … `KB-SRC-10-resultaten` | geüpload (25 docs totaal) |

## Regels

- **Eén doc per resultaat.** Geen losse notities in dezelfde map.
- **Bovenaan elk doc** dezelfde kop als het markdownbestand: datum, commit,
  prompt, "read-only onderzoek".
- **Geen persoonsgegevens** in Docs (net zo streng als in de repo): maskeer
  e-mailadressen en telefoonnummers.
- **Nieuwe run = nieuwe datum.** Het oude doc blijft staan; er komt een nieuw
  bestand met de nieuwe datum. Niet overschrijven, zodat je voortgang ziet.
- **De repo is de bron.** Wijkt een Doc af van het markdownbestand, dan is het
  Doc verouderd; de repo wint.
- **Delen:** de map is voor de eigenaar en de tech lead; geen publieke links
  naar docs met commerciële prijsstrategie of leadinformatie.

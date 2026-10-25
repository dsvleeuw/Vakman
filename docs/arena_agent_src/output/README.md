# output — resultaten van de src-audit

Hier landt één bestand per prompt. Naamgeving: **prefix + naam + datum-suffix**,
zodat repo en Google Docs hetzelfde heten.

```
KB-SRC-01-app-router-seo-2026-10-25.md
KB-SRC-02-server-api-security-2026-10-25.md
KB-SRC-03-data-model-content-2026-10-25.md
KB-SRC-04-wizard-site-conversie-2026-10-25.md
KB-SRC-05-tools-extras-componenten-2026-10-25.md
KB-SRC-06-a11y-ux-cross-cutting-2026-10-25.md
KB-SRC-07-tests-tooling-repo-2026-10-25.md
KB-SRC-08-docs-drift-waarheid-2026-10-25.md
KB-SRC-09-synthese-2026-10-25.md
KB-SRC-10-bouwprompts-2026-10-25.md
```

Vuistregels:

- Eén bestand per prompt; geen "v2" in dezelfde map — een nieuwe run krijgt een
  nieuwe datum (bijv. `…-2026-11-02.md`) en de oude blijft staan als historie.
- Elk bestand begint met de titel, de datum, de commit waarop het is gebaseerd
  (`git rev-parse --short HEAD`) en de regel "read-only onderzoek".
- De negen secties uit `../02-promptconventies.md` zijn verplicht en in volgorde.
- Geen ruwe data met persoonsgegevens (mailadressen, telefoonnummers, leadvelden)
  in een resultaat; maskeer als `j***@domein` of `06…`.
- Een resultaat dat niets nieuws bevat is ook een resultaat: schrijf op wat je
  hebt gecontroleerd en dat het klopt.

## Status

| Bestand | Status | Kernbevinding |
|---|---|---|
| KB-SRC-01 app-router-seo | klaar | soft 404, `utm_*` wordt gestript, geen error boundary |
| KB-SRC-02 server-api-security | klaar | geen idempotentie, token verloopt nooit, geen mailalarm |
| KB-SRC-03 data-model-content | klaar | serviceprijzen als tekst, `overige` leeg, 4/7 tools |
| KB-SRC-04 wizard-site-conversie | klaar | voorbeeldnummer als tekst (P0), KvK 12345678 |
| KB-SRC-05 tools-extras | klaar | 10 extras alleen in de galerij (shelfware) |
| KB-SRC-06 a11y-ux | klaar | 7 labels zonder `htmlFor`, geen `width/height`, geen axe |
| KB-SRC-07 tests-tooling | klaar | `strict` uit, 15 modules ongetest, dode scripts/deps |
| KB-SRC-08 docs-drift | klaar | 34 claims getoetst; "geen backend" en cijfers fout |
| KB-SRC-09 synthese | klaar | 58 punten, top 20, vier sprints, 3 grote gokken |
| KB-SRC-10 bouwprompts | klaar | 5 prompts, golf 1 parallel, `run: false` |

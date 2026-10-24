# 02 — Taken en logboek

Werkbestand voor de klantwerving in Noord-Holland (zie
[01-roadmap.md](./docs/klantwerving/01-roadmap.md)). Elke dag één regel in het
logboek; taken die af zijn gaan naar *Gedaan* met de datum erbij.

## Taken

| # | Taak | Prioriteit | Status |
|---|------|-----------|--------|
| 3 | Persoonlijke demo-link (`/voorbeeld/:vak/:stijl?naam=&plaats=&tel=`) | P0 | Klaar — zie CHANGELOG |
| — | 113 leads verzamelen in Haarlemmermeer (6 vakken) | P0 | Klaar — Google Sheet, zie docs/klantwerving/README.md |
| — | Leadlijst uitbreiden naar regio Noord-Holland | P0 | Klaar — 229 bedrijven, 8 regio's, Google Sheet + `.csv`/`.xlsx` |
| — | Eigen websites van bedrijven bezoeken en verrijken | P0 | Deels klaar — 35 van 229 bezocht, rest open |
| — | Ontbrekende e-mailadressen aanvullen (53 regels) | P1 | Open |
| — | `controle nodig`-regels verifiëren via KvK (25 regels) | P1 | Open |
| — | Restant websites bezoeken (`site_bezocht = nee`, 194 regels) | P1 | Open |
| — | Mobiele Lighthouse-scan van alle bedrijfssites | P0 | Klaar — 134 van 185 scores, zie docs/klantwerving/website-analyse.md |
| — | 51 sites opnieuw meten die time-out/blokkade gaven | P2 | Open |
| — | Volledige CLI-scan (LCP + alle audits) lokaal draaien met `npm run lh:scan` | P2 | Script klaar, nog niet gedraaid |
| — | Werkkaart `/kaart` met bedrijfsinfo en site-scores | P1 | Klaar — 10 bedrijven, uitbreiden naar 229 |
| — | Coördinaten van alle 229 bedrijven geocoderen en in de CSV zetten | P1 | Open |
| — | Beltijden 07:30–08:30 en 12:00–13:00 reserveren | P1 | Open |
| — | 20 brieven/kaarten met QR naar persoonlijke demo (week 2) | P2 | Open |

## Logboek

| Datum | Wat gedaan | Resultaat |
|-------|-----------|-----------|
| 2026-10-24 | Leadlijst Haarlemmermeer eerste opzet | 113 bedrijven, 73 e-mailadressen, 92 telefoonnummers, 47 KvK-nummers |
| 2026-10-24 | Uitbreiding naar regio Noord-Holland + websitebezoek | 229 bedrijven over 8 regio's, 176 e-mail, 205 telefoon, 71 KvK, 35 eigen websites bezocht en verrijkt, demo-link per regel |
| 2026-10-24 | Lighthouse-scan van alle 185 bedrijfssites (mobiel) | 130 sites met score: gemiddeld 60,5 performance, 46 onder de 50, 17 boven de 90; kolommen `lh_*` in de leadlijst, samenvatting in website-analyse.md |
| 2026-10-24 | Werkkaart `/kaart` gebouwd | 10 bedrijven met contact, diensten, reviews, notitie en vier site-scores; filter op vak en op site < 50, demoknop per bedrijf |

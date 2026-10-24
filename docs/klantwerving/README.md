# Klantwerving Noord-Holland

Werkdocumenten voor het werven van de eerste betalende klanten onder
vakmensen in Noord-Holland; de eerste inventarisatie was Haarlemmermeer,
de leadlijst is inmiddels provinciedekkend. Dit is een commercieel spoor
naast de productroadmap in [ROADMAP.md](../../ROADMAP.md); de twee
verwijzen naar elkaar waar ze overlappen.

| Bestand | Inhoud |
|---------|--------|
| [01-roadmap.md](./01-roadmap.md) | Doelgroep, leadbronnen, kanalen, dagritme, bezwaren |
| `02-taken.md` (repo-root) | Taken en dagelijks logboek |
| [website-analyse.md](./website-analyse.md) | Lighthouse-meting per bedrijfssite: wie heeft een zwakke site |
| `leads/leads-haarlemmermeer.example.csv` (repo-root) | Kolomdefinitie voor de leadlijst |
| `leads/leads-noord-holland.csv` / `.xlsx` (repo-root, niet in git) | Volledige leadlijst met verrijking en demo-links |

## Leadlijst

De actuele inventarisatie staat als Google Sheet in Drive:
[Vakmensen Noord-Holland — leadlijst (229 bedrijven, met website-analyse)](https://docs.google.com/spreadsheets/d/1rpdi8YC0m9FIcUxu4MdyUig_n3mHJ4TC2S-CN4XeV_Q/edit).
229 bedrijven over zes vakken, met adres, telefoon, e-mail, website,
KvK-nummer, diensten, oprichtingsjaar, reviews, een bron-URL en een
kant-en-klare persoonlijke demo-link per regel.

Werkbestanden in de repo (niet versiebeheerd, bevatten persoonsgegevens):
`leads/leads-noord-holland.csv` en `leads/leads-noord-holland.xlsx`.
Het oudere bestand `leads-haarlemmermeer.csv` is de voorloper; de
Haarlemmermeer-regels zitten ook in de nieuwe lijst.

| Vak | Aantal |
|-----|--------|
| schilder | 53 |
| elektricien | 46 |
| loodgieter | 44 |
| hovenier | 33 |
| timmerman | 32 |
| stukadoor | 21 |

| Regio | Aantal |
|-------|--------|
| Haarlemmermeer | 112 |
| Haarlem | 45 |
| Alkmaar | 24 |
| Waterland / Purmerend | 22 |
| Overig Noord-Holland (regiobreed) | 10 |
| Zaanstreek | 6 |
| West-Friesland (Hoorn e.o.) | 5 |
| Kop van Noord-Holland | 3 |
| Kennemerland (Bloemendaal, Santpoort) | 2 |

Dekking: 176 regels met e-mail, 205 met telefoon, 71 met KvK-nummer,
119 met een omschrijving van de diensten. Van de 185 bedrijven met een eigen
website is bij 130 de mobiele Lighthouse-score gemeten (performance, SEO,
toegankelijkheid, best practices); de uitkomsten staan in
[website-analyse.md](./website-analyse.md) en in de kolommen `lh_*`.
35 bedrijven zijn daadwerkelijk op hun eigen website bezocht; die regels
hebben `site_bezocht = ja` en
zijn aangevuld met oprichtingsjaar, diensten, keurmerken, eigenaar/team,
werkgebied en reviews.

### Wat de lijst wel en niet is

- **Wel:** een startpunt van openbaar vermelde gegevens, genoeg om te bellen
  en de persoonlijke demo-link te sturen. De demo-link is per regel
  vooraf ingevuld (`/voorbeeld/<vak>/<stijl>?naam=&plaats=&tel=`).
- **Niet:** uitputtend of volledig geverifieerd. Per kern en per vak zijn er
  meer bedrijven dan hier staan; de lijst is gevuld vanuit eigen websites,
  KvK-vermeldingen, branche- en keurmerksites en bedrijvengidsen.
- De kolom `soort` markeert twijfelgevallen: `controle nodig` (25 regels)
  betekent dat het adres, de vestigingsplaats of het KvK-nummer niet op de
  bron staat, of dat meerdere bedrijven hetzelfde telefoonnummer of
  verzameladres delen (lokale-SEO-netwerken). `buiten gemeente` (2) en
  `landelijk` (1) zijn gevestigd buiten de kern waarin ze adverteren.
- 53 regels hebben nog geen e-mailadres en 24 geen telefoonnummer; die zijn
  alleen via de website of een gids te bereiken. Gidsen verbergen
  e-mailadressen achter spamprotectie, dus dit zijn echte gaten.
- De niet-mailingindicator is **niet** gecontroleerd; dat vereist een
  KvK-export per bedrijf. Bellen is het primaire kanaal (zie 01-roadmap.md);
  verstuur geen koude e-mail zonder die check.

### Volgende stappen voor de lijst

1. `site_bezocht = nee`-regels alsnog langsgaan op de eigen website en
   verrijken (op dit moment 194 van de 229).
2. De 25 `controle nodig`-regels bellen en uitvragen: zelfstandig bedrijf,
   eigen werkplaats, KvK-nummer.
3. Ontbrekende e-mailadressen aanvullen via de eigen site of een KvK-export.
4. Per provincieregio de tellingen aanvullen tot een werkbare bel-lijst per
   week (zie dagritme in 01-roadmap.md).

Nog niet aangeleverd: `03-…` (demo-link / verkoopgesprek) en `05-…`
(juridische onderbouwing rond koude acquisitie, waarnaar 01 verwijst).

## Wat de code al ondersteunt

De persoonlijke demo-link bestaat: `/voorbeeld/:vak/:stijl?naam=&plaats=&tel=`
vult bedrijfsnaam, plaats en telefoonnummer in en toont de knop "Maak dit
mijn website". Het telefoonnummer wordt gevalideerd en de queryparameters
gaan niet mee in de analytics. Voorbeeld uit 01-roadmap.md, gecontroleerd
tegen `src/data/tradesData.ts`:

```
/voorbeeld/schilder/modern?naam=Schildersbedrijf%20Jansen&plaats=Hoofddorp
```

## Privacy

De leadlijst bevat persoonsgegevens (namen en zakelijke telefoonnummers).
Houd hem lokaal, commit geen echte leads naar de repository en respecteer de
niet-mailingindicator. `leads/*.csv` staat daarom in `.gitignore`; alleen het
sjabloon met de kolomkoppen is versiebeheerd. Kopieer dat sjabloon naar
`leads/leads-haarlemmermeer.csv` en werk daarin.

# Klantwerving Haarlemmermeer

Werkdocumenten voor het werven van de eerste betalende klanten onder
vakmensen in Haarlemmermeer. Dit is een commercieel spoor naast de
productroadmap in [ROADMAP.md](../../ROADMAP.md); de twee verwijzen naar
elkaar waar ze overlappen.

| Bestand | Inhoud |
|---------|--------|
| [01-roadmap.md](./01-roadmap.md) | Doelgroep, leadbronnen, kanalen, dagritme, bezwaren |
| `02-taken.md` (repo-root) | Taken en dagelijks logboek |
| `leads/leads-haarlemmermeer.example.csv` (repo-root) | Kolomdefinitie voor de leadlijst |

## Leadlijst

De eerste inventarisatie staat als Google Sheet in Drive:
[Vakmensen Haarlemmermeer — leadlijst (concept)](https://docs.google.com/spreadsheets/d/1CN0IYNICj7rMVA707rg7q25Lb2X7GiVq9ZbQLw8u1gw/edit).
113 bedrijven over zes vakken, met adres, telefoon, e-mail, website, KvK-nummer
en een bron-URL per regel.

| Vak | Aantal |
|-----|--------|
| timmerman | 26 |
| loodgieter | 21 |
| schilder | 19 |
| hovenier | 19 |
| elektricien | 17 |
| stukadoor | 11 |

Kernen: Hoofddorp 48, Nieuw-Vennep 25, Badhoevedorp 9, Zwanenburg 9,
Rijsenhout 8, Vijfhuizen 2, Zwaanshoek 2, plus Lijnden, Cruquius,
Leimuiderbrug en één bedrijf net over de grens in Hillegom.

### Wat de lijst wel en niet is

- **Wel:** een startpunt van openbaar vermelde gegevens, genoeg om te bellen
  en de persoonlijke demo-link te sturen.
- **Niet:** uitputtend of geverifieerd. Google Maps levert per kern meer
  bedrijven op dan hier staan; de lijst is gevuld vanuit eigen websites,
  KvK-gidsen en telefoongidsen. 73 van de 113 regels hebben een e-mailadres,
  40 (nog) niet.
- De kolom `soort` markeert twijfelgevallen: `controle nodig` betekent dat het
  adres, de vestigingsplaats of het KvK-nummer niet op de bron staat (soms is
  het een lokale-SEO-site zonder eigen werkplaats), `buiten gemeente` betekent
  gevestigd buiten Haarlemmermeer maar werkzaam in de polder.
- De niet-mailingindicator is **niet** gecontroleerd; dat vereist een KvK-export
  per bedrijf. Doe dat voor je post verstuurt of langsgaat.

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

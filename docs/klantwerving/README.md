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

# Werkkaart — bedrijven op de kaart

Interne pagina op **`/kaart`** waarop de bedrijven uit de leadlijst Noord-Holland op
een kaart staan. Per bedrijf zie je contact, diensten, reviews, notities en hoe de
eigen website scoort, met één knop naar de persoonlijke demo.

De pagina staat bewust **niet** in de navigatie, niet in de sitemap, wordt niet
geprerenderd en krijgt `noindex, nofollow`.

## Stand van zaken

Er staan nu **10 bedrijven** in, verdeeld over de zes vakken en vier regio's
(Haarlemmermeer, Haarlem, Alkmaar, Kop van Noord-Holland), elk met een echte
Lighthouse-meting. Daarna is het een kwestie van bijvullen, niet van opnieuw bouwen.

| # | Bedrijf | Vak | Plaats | Performance |
|---|---------|-----|--------|------------:|
| 2 | BVK Installatie- & Loodgietersbedrijf | loodgieter | Hoofddorp | 91 |
| 9 | Maliepaard Loodgieters | loodgieter | Zwanenburg | 76 |
| 26 | M Kwint Techniek | elektricien | Hoofddorp | 85 |
| 30 | De Wolf Elektra | elektricien | Heerhugowaard | 45 |
| 39 | Schildersbedrijf Beuving | schilder | Hoofddorp | 48 |
| 141 | Hofschilders | schilder | Haarlem | 40 |
| 143 | Hoveniersbedrijf Aarts | hovenier | Haarlem | 28 |
| 158 | Verheggen Hoveniers | hovenier | Alkmaar | 39 |
| 225 | De Ruig Stucadoors | stukadoor | Hoofddorp | 32 |
| 229 | Haarlemse Timmerwerken (HTW) | timmerman | Haarlem | 28 |

Gemiddelde performance van deze tien: **51**. Zeven van de tien scoren onder de 50 —
goede gesprekskandidaten.

## Waar de gegevens staan

| Bestand | In git? | Wat |
|---------|---------|-----|
| `public/kaart/leads.json` | **nee** (gitignore) | Het werkbestand met de echte bedrijven |
| `public/kaart/leads.example.json` | ja | Voorbeeld met verzonnen bedrijven, tevens het formaat |

Ontbreekt het werkbestand — verse checkout, publieke deploy — dan valt de kaart
terug op het voorbeeld en zegt dat er zichtbaar bij. Er lekt dus nooit klantdata
mee naar een publieke omgeving. De repo `dsvleeuw/Vakman` is openbaar, dus dit is
geen luxe.

## Formaat

```json
{
  "bijgewerkt": "2026-10-24",
  "bron": "leads/leads-noord-holland.csv",
  "bedrijven": [
    {
      "id": "2",
      "naam": "BVK Installatie- & Loodgietersbedrijf B.V.",
      "vak": "loodgieter",
      "plaats": "Hoofddorp",
      "regio": "Haarlemmermeer",
      "adres": "Willem Brocadesdreef 166",
      "postcode": "2132 PV",
      "lat": 52.3052,
      "lng": 4.6752,
      "locatiePrecisie": "plaats",
      "telefoon": "023-5639530",
      "email": "info@bvkbv.nl",
      "website": "https://www.bvkbv.nl/",
      "kvk": "34249506",
      "sinds": "1989",
      "reviews": "5,0 · 74 Google-reviews",
      "diensten": ["loodgieterswerk", "cv-installaties"],
      "openingstijden": "ma–vr 07:00–17:00",
      "werkgebied": "Haarlemmermeer en omstreken",
      "notitie": "Korte aantekening voor het gesprek.",
      "bron": "https://www.bvkbv.nl/",
      "lighthouse": {
        "performance": 91,
        "seo": 91,
        "toegankelijkheid": 85,
        "best_practices": 88
      }
    }
  ]
}
```

- `id` = rijnummer uit `leads-noord-holland.csv`, zodat kaart en lijst niet uit
  elkaar lopen.
- `vak` moet een van de zes zijn: `loodgieter`, `elektricien`, `schilder`,
  `hovenier`, `timmerman`, `stukadoor`.
- `lat`/`lng` zijn verplicht; records zonder coördinaten worden overgeslagen in
  plaats van op 0,0 te belanden.
- `locatiePrecisie` is `adres` als de pin op het huisadres staat en `plaats` als
  hij op de kern is gezet. Bij deze tien is het `plaats`: de coördinaten zijn
  benaderd op postcode-/kernniveau, niet gegeocodeerd op huisnummer.
- `lighthouse` mag ontbreken of `null` per categorie; de kaart toont dan "–".

## Wat de pagina doet

- Pinnen per vak in een eigen kleur; klik op een pin of een rij voor het detailpaneel.
- Zoeken op naam, plaats of dienst.
- Filteren op vak (met aantallen) en op **site scoort < 50**.
- Detailpaneel met bel-, mail- en demoknop, alle bekende velden, en balkjes voor
  performance, SEO, toegankelijkheid en best practices (rood < 50, oranje < 90,
  groen daarboven).
- De demoknop bouwt de link ter plaatse op uit vak, naam, plaats en telefoon, met
  de stijl die bij het vak hoort. Relatief pad, dus hij werkt op elke host.

## Bijvullen

1. Haal de rij uit de leadlijst (of uit de Google Sheet).
2. Zoek de coördinaten van het adres of de kern.
3. Kopieer het record en vul het aan; zet `id` op het rijnummer.
4. Ververs `/kaart` — de kaart leest het bestand bij elke load opnieuw.

Voor de volgende tranche loont het om de coördinaten één keer te geocoderen en in
de CSV te bewaren, zodat de kaart en de leadlijst uit dezelfde bron komen. Dat is
de logische volgende stap; de tien hierboven zijn met de hand op plaatsniveau gezet.

## Techniek

- Leaflet 1.9 met CARTO-light-tegels (OpenStreetMap-data), geen API-key nodig.
- Route `/kaart` in `src/utils/router.ts`, component
  `src/components/ProspectMapView.tsx`, datalaag `src/data/prospects.ts`.
- De pagina wordt lazy geladen, dus de rest van de site blijft even snel.

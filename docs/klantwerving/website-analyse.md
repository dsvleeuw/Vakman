# Website-analyse leadlijst Noord-Holland

Mobiele Lighthouse-meting per bedrijfssite uit de leadlijst, bedoeld om te bepalen
welke bedrijven een zwakke site hebben en dus een sterk gesprek ingaan met de
persoonlijke demo van Klusbaas.

## Hoe gemeten

- **Lighthouse 13.5.0, mobiel profiel** (Moto G Power-emulatie, 4G-throttling),
  vier categorieën: performance, SEO, toegankelijkheid en best practices.
- Uitgevoerd via de Microlink-API (`insights.lighthouse`), omdat in deze omgeving
  geen Chrome/Chromium beschikbaar is en alleen verkeer naar een vaste lijst hosts
  is toegestaan. PageSpeed Insights zelf weigerde wegens ontbrekende API-key.
- Gemeten op 24 oktober 2026, één meting per site. Lighthouse-scores schommelen per
  run met enkele punten; gebruik ze als signaal, niet als jurering.
- Bronbestand: `leads/leads-noord-holland.csv` (kolommen `lh_performance`,
  `lh_seo`, `lh_toegankelijkheid`, `lh_best_practices`, `lh_meting`).

## Dekking

| | Aantal |
|---|---|
| Bedrijven in de leadlijst | 229 |
| Met eigen website | 185 |
| Lighthouse-meting gelukt | 147 |
| Daarvan met een performance-score | 130 |
| Geen score (time-out, blokkade of lege respons) | 55 |

Van de 130 gemeten sites scoort **44 onder de 50** op mobiele
performance, 69 tussen 50 en 89 en 17 op 90 of hoger.
Gemiddelde performance: **60.8** (mediaan 58).

## Uitslag per vak

| Vak | Gemeten | Gemiddelde performance |
|-----|---------|------------------------|
| hovenier | 21 | 49.7 |
| timmerman | 12 | 51.4 |
| stukadoor | 17 | 59.3 |
| schilder | 31 | 60.5 |
| elektricien | 24 | 64.1 |
| loodgieter | 25 | 72.8 |

## Uitslag per regio

| Regio | Gemeten | Gemiddelde performance |
|-------|---------|------------------------|
| West-Friesland | 3 | 74.0 |
| Waterland | 12 | 73.9 |
| Overig NH | 6 | 63.7 |
| Haarlemmermeer | 59 | 61.3 |
| Zaanstreek | 3 | 58.7 |
| Haarlem | 29 | 56.6 |
| Kennemerland | 1 | 55.0 |
| Alkmaar | 14 | 54.6 |
| Kop van Noord-Holland | 3 | 53.3 |

## Zwakste 25 sites — hier eerst bellen

De site laadt traag op mobiel, en vaak ontbreekt ook de SEO-basis. Precies waar
de demo van Klusbaas het verschil laat zien.

| Bedrijf | Vak | Kern | Performance | SEO | Toegankelijkheid | Best practices |
|---------|-----|------|------------:|-----|------------------|----------------|
| Hoveniersbedrijf Jouw Tuin | hovenier | Zwanenburg | **18** | 100 | 89 | 73 |
| Haarlemse Timmerwerken BV | timmerman | Haarlem | **28** | – | – | – |
| Hoveniersbedrijf Aarts | hovenier | Haarlem | **28** | – | – | – |
| Nederveen Tuinen | hovenier | Loenen a/d Vecht | **28** | – | – | – |
| VT Schilders | schilder | Haarlem | **28** | 92 | 83 | – |
| Joost van den Heuvel Hovenier | hovenier | Hoofddorp | **29** | – | 87 | – |
| Van den Heuvel Hoveniers B.V. | hovenier | Hoofddorp | **29** | – | 87 | – |
| Ed van Dijk Elektrotechniek | elektricien | Haarlem | **30** | – | 83 | – |
| Hut & Iz Schilderwerken | schilder | Alkmaar | **31** | – | – | – |
| De Ruig Stucadoors | stukadoor | Hoofddorp | **32** | – | – | – |
| Stukadoorsbedrijf Hoog | stukadoor | Haarlemmermeer | **32** | – | – | – |
| E&B Loodgieters | loodgieter | Hillegom | **33** | 92 | 73 | 65 |
| JTV Schilders | schilder | Regio | **33** | – | – | – |
| Nick Vester Tuinen | hovenier | Zwaanshoek | **33** | – | 79 | – |
| SVDK Schilders | schilder | Alkmaar | **33** | – | – | – |
| Cees Boer B.V. Elektrotechnisch Installatiebedrijf | elektricien | Nieuw-Vennep | **36** | – | – | – |
| DV Bouwbedrijf | timmerman | Haarlemmermeer | **39** | – | 90 | – |
| Grau Schilders & Stucadoors | stukadoor | Haarlem | **39** | – | – | – |
| Stukadoorsbedrijf van Es | stukadoor | Hoofddorp | **39** | 100 | 97 | – |
| Verheggen Hoveniers | hovenier | Alkmaar | **39** | – | – | – |
| Hofschilders B.V. | schilder | Haarlem | **40** | – | 84 | – |
| Home4All Klussenbedrijf | timmerman | Badhoevedorp | **42** | – | 82 | – |
| Rob Blom Tuinen | hovenier | Leimuiderbrug | **42** | – | 85 | – |
| Schildersbedrijf J. Schipper (Meester Schilders) | schilder | Alkmaar | **42** | – | – | – |
| Stukadoors Plein | stukadoor | Haarlemmermeer | **42** | – | – | – |

## Sterkste 12 sites — niet op site-kwaliteit aanspreken

Hier is de site in orde; het gesprek moet over bereik, reviews verzamelen of
administratie gaan, niet over "uw site is traag".

| Bedrijf | Vak | Kern | Performance | SEO | Toegankelijkheid | Best practices |
|---------|-----|------|------------:|-----|------------------|----------------|
| Stukadoor Service (Bouwsector Nederland) | stukadoor | Regio | **100** | 100 | 96 | 100 |
| Stucadoors- en Schildersbedrijf KOBE | schilder | Regio | **100** | 80 | 50 | 92 |
| Loodgieter Badhoevedorp | loodgieter | Badhoevedorp | **100** | 100 | 100 | – |
| ECT Purmerend | elektricien | Purmerend | **100** | 80 | 50 | 92 |
| Stuc-Company | stukadoor | Haarlem | **99** | 90 | 73 | 92 |
| Stukadoor Hoofddorp (Taurusavenue) | stukadoor | Hoofddorp | **98** | 100 | 88 | – |
| Loodgieter Hoofddorp (Antareslaan) | loodgieter | Hoofddorp | **98** | 100 | 100 | 100 |
| Eric Mudde Dakbedekking / Zink- en Loodgieterswerken | loodgieter | Vijfhuizen | **98** | 100 | 83 | 88 |
| Rob Blom Elektrotechniek | elektricien | Haarlem | **97** | 100 | 93 | 100 |
| Loodgieter Zwanenburg | loodgieter | Zwanenburg | **97** | – | – | – |
| Schildersbedrijf M.J. Kramer | schilder | Purmerend | **95** | 100 | 87 | 96 |
| Loodgieter Hoofddorp (Kruisweg) | loodgieter | Hoofddorp | **94** | – | 96 | – |

## Wat je hiermee doet in het gesprek

1. **Open met de meting, niet met een oordeel.** "Ik heb uw site door Google
   Lighthouse gehaald: die scoort 18 op mobiel. Bezoekers vanaf hun
   telefoon kijken daardoor seconden naar een leeg scherm." Noem het cijfer,
   niet "slecht".
2. **Laat meteen de demo zien** via de kant-en-klare link in de leadlijst
   (`/voorbeeld/<vak>/<stijl>?naam=&plaats=&tel=`), gevuld met hun eigen naam,
   plaats en telefoonnummer. Zo ziet de vakman het verschil in plaats van het te horen.
3. **Koppel het aan gemiste opdrachten**, niet aan techniek: sneller laden levert
   meer aanvragen op, en een mobiele pagina met direct bellen of WhatsApp al helemaal.
4. **Gebruik de SEO-score voor vindbaarheid.** Scoort SEO laag, dan mist het bedrijf
   de basis (titel, omschrijving, koppenstructuur) en is het op "loodgieter <plaats>"
   nauwelijks te vinden.

## Kanttekeningen

- **Geen score is niet hetzelfde als een kapotte site.** 55 sites gaven een
  time-out, blokkade (403/429) of lege respons. Sommige werken gewoon in een browser;
  meet die opnieuw voordat je er iets over zegt.
- Een aantal sites levert een **lege of placeholder-pagina** (enkele tientallen bytes)
  of stuurt door naar de `login.php` van het CMS. Dat is wél een hard signaal: de site
  is feitelijk offline of stuk. Zulke gevallen staan in de kolom `opmerking`.
- SEO, toegankelijkheid en best practices ontbreken bij een deel van de metingen
  (lege cel); performance is bij vrijwel elke geslaagde meting gevuld.
- De demo-link is een persoonlijke voorbeeldpagina van Klusbaas, geen kopie van de
  site van het bedrijf. Zeg dat ook zo.
- Blijft gelden: bellen is het kanaal, en check de niet-mailingindicator voordat je mailt.

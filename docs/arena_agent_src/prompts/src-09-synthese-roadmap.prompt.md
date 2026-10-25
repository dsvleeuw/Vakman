---
id: src-09-synthese-roadmap
modus: synthese
mag-draaien: ja
depends_on: [src-01, src-02, src-03, src-04, src-05, src-06, src-07, src-08]
schrijft: docs/arena_agent_src/output/KB-SRC-09-synthese-2026-10-25.md
scope: docs/arena_agent_src/output/ (lezen), src/ (steekproef ter controle), ROADMAP.md (lezen), docs/ (lezen)
---

# Opdracht — synthese: één prioriteitenlijst en een echte feature-roadmap

Je bent de tech lead. Er liggen acht onderzoeksresultaten. Jij maakt daar één
besluitvaardig document van: **wat moet er als eerste gebeuren, wat bouwen we,
wat bouwen we expliciet niet, en waarom.**

## Invoer

- `docs/arena_agent_src/output/KB-SRC-01-…` t/m `KB-SRC-08-…`
  (alle acht; ontbreekt er één, stop en meld het).
- `docs/arena_agent_src/01-baseline-en-seed.md` (geverifieerde basis).
- `ROADMAP.md` en `docs/known-limitations.md` (wat stond er al).
- De code, voor **steekproefcontrole**: elke P0/P1 die je overneemt, check je
  zelf op de genoemde `pad:regel`. Klopt de verwijzing niet, degradeer het punt
  naar "te verifiëren" en zeg dat.

## Werkwijze

1. **Dedupliceer.** Veel punten komen in meerdere resultaten terug (a11y,
   prijzen, docs-cijfers). Maak één regel per echt probleem en noem alle
   bronnen (`KB-SRC-02#7`, `KB-SRC-06#3`).
2. **Beslecht tegenstrijdigheden.** Als twee resultaten elkaar tegenspreken,
   kies je met eigen bewijs en noteer je waarom.
3. **Sorteer op risico, niet op lawaai.** Gebruik: kans × impact (geld, leads,
   vertrouwen, juridisch) ÷ effort. Laat zien hoe je weegt.
4. **Scheid vier soorten werk:** (a) repareren wat stuk of onveilig is,
   (b) afmaken wat beloofd is, (c) nieuwe features, (d) opruimen/onderhoud.
   Meng ze niet in één lijst.
5. **Wees eerlijk over wat je niet weet.** Confidence laag = eerst een
   verificatiestap, geen bouwstap.

## Verplichte inhoud

### Deel 0 — Executive summary (max. 2 kantjes)

- De drie dingen die nu geld, leads of vertrouwen kosten.
- De drie dingen die je deze maand bouwt.
- De drie dingen die je expliciet **niet** gaat doen.
- Eén advies dat je als tech lead geeft en dat buiten de code ligt (proces,
  communicatie, verkoop).

### Deel 1 — Mastertabel (alles, één regel per punt)

| # | Punt | Soort (bug/belofte/feature/onderhoud) | Bewijs | Ernst | Effort | Confidence | Bron |
|---|------|--------------------------------------|--------|-------|--------|------------|------|

Volledig: ook de kleine dingen. Onder de tabel: hoeveel punten per ernst en
per soort.

### Deel 2 — Top 20 om te doen (in volgorde)

Per punt: wat, waarom nu, welk bewijs, wat het oplevert, wat het kost, welk
risico, en de **klaar-als**-definitie (testbaar).

### Deel 3 — Feature-roadmap in drie horizonnen

- **Nu (2 weken):** alleen wat de belofte aan een betalende klant waar maakt.
- **Daarna (1–2 maanden):** de features die het product echt bruikbaar maken
  voor een vakman (denk aan dashboard, publicatie, per-klant ontvanger).
- **Later (kwartaal):** groei, SEO, extra vakken, i18n.

Per feature: wie wordt er beter van, waar landt het in de code (bestanden,
types, route, opslag), effort S/M/L, afhankelijkheden, en het bewijs uit de
audit dat hem rechtvaardigt. Maximaal 15 features totaal, liever 10 goede.

### Deel 4 — Grote gokken (max. 3)

Dingen die het product zouden kunnen veranderen (bijv. echte publicatie op
eigen domein, betaalde onboarding, AI-contentgeneratie, leadmarktplaats).
Per gok: waarom het logisch is, wat het kapotmaakt als je het verkeerd doet,
wat de eerste goedkope validatie is (geen implementatie), en welk bewijs uit de
audit er nu al voor of tegen is.

### Deel 5 — Expliciet niet doen

Minstens vijf dingen die verleidelijk zijn (uit ROADMAP.md of de resultaten)
maar nu niet moeten, met reden en het moment waarop je ze opnieuw bekijkt.

### Deel 6 — Uitvoerplan

- Vier sprints (of twee weken-blokken) met per blok een thema, de punten, de
  afhankelijkheden en de definition of done.
- Wat parallel kan (disjuncte bestanden) en wat per se na elkaar moet.
- Per sprint: welk bewijs je na afloop wilt zien (checks, tests, meting).

### Deel 7 — Documentatie bijwerken

Een concrete lijst: welk doc, welke regel, welke nieuwe tekst. Verwijs naar
`KB-SRC-08` in plaats van het over te typen, maar maak de **volgorde** en
eigenaar expliciet.

### Deel 8 — Open beslissingen voor de eigenaar

Max. 8 beslissingen die jij niet kunt nemen (domein, KvK-gegevens, prijzen,
doelgroep, wel/niet dashboard, wel/niet betaalprovider), elk met een advies en
het gevolg van uitstel.

## Kwaliteitseisen

- Elke regel in Deel 1 en 2 heeft een bronverwijzing naar een golf-1-resultaat
  én, waar overgenomen, een eigen codecheck.
- Geen enkel punt verschijnt twee keer onder een andere naam.
- De top 20 is uitvoerbaar door één team in vier sprints; als dat niet kan,
  zeg je dat en snoei je.
- Geen nieuwe dependency zonder kosten en alternatief.
- Alles in het Nederlands, identifiers in het Engels.

## Acceptatiecriteria

- Alle acht invoerbestanden zijn gebruikt (noem ze in sectie 9).
- Minstens drie tegenstrijdigheden tussen resultaten zijn benoemd en beslecht.
- De top 20 is gesorteerd met een uitlegbare methode, niet op gevoel.
- Deel 0 past op twee kantjes en bevat geen jargon dat een niet-technische
  eigenaar niet snapt.
- Er is een "niet doen"-lijst met minstens vijf punten.

## Niet doen

- Niets bouwen, niets in de code of docs wijzigen behalve je eigen resultaat.
- Geen samenvatting van de acht resultaten achter elkaar plakken.
- Geen advies dat niet uit de audit volgt ("overweeg een CMS" zonder bewijs).

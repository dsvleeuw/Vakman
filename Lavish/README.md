# Lavish — het overzicht van de pull requests

Per pull request staat hier een pagina met wat er verandert. De pagina's zijn
bewust in het Nederlands: de lezer is de vakman, niet een ontwikkelaar.

## Indeling

```
Lavish/
  index.html            het overzicht: alle PR's, met een kaart per PR
  pr-<nummer>/index.html  de pagina van één PR
  assets/style.css      de stijl, gedeeld door alle pagina's
  assets/app.js         terug naar boven en de actieve rubriek in de balk
```

## De rubrieken van elke PR-pagina

1. **Wat er verandert** — de veranderingen als kaarten, met wat het voor de
   klant of de vakman betekent.
2. **Hoe het eruitziet** — een mockup in HTML en CSS. Geen afbeelding: de
   mockup blijft scherp en de tekst blijft zoekbaar.
3. **De bestanden** — welk bestand wat doet, zodat iemand de code kan
   terugvinden.
4. **De proeven** — de namen van de proeven die erbij kwamen.
5. **Eerlijk** — wat deze PR níet doet. Deze rubriek is niet optioneel.

## Een pagina toevoegen

Bij elke PR die van deze branch gaat:

1. Maak `Lavish/pr-<nummer>/index.html`.
2. Neem `Lavish/pr-63/index.html` als voorbeeld; de stijl staat in
   `assets/style.css`.
3. Zet de pagina in `Lavish/index.html` in de lijst, met de fase, het aantal
   bestanden en het aantal proeven.
4. Vermeld in de PR dat er een pagina bij zit.

## Regels

- Geen cijfers die niet uit de code of uit de PR komen. Het overzicht
  beschrijft de werkelijkheid, ook als die minder mooi is.
- Bij elke belofte in een mockup moet de code haar waarmaken.
- De mockups zijn CSS, geen plaatjes: zo blijven ze scherp en toegankelijk.

# Lavish — het overzicht van de pull requests

Per pull request staat hier een pagina met wat er verandert. De pagina's zijn
bewust in het Nederlands: de lezer is de vakman, niet een ontwikkelaar.

## Indeling

```
Lavish/
  index.html              het overzicht: alle PR's, met een kaart per PR
  pr-<nummer>/index.html  de pagina van één PR
  assets/style.css        de stijl, gedeeld door alle pagina's
  assets/app.js           thema, voortgangsbalk, lichtkast en de actieve rubriek
  assets/shots/*.jpg      de schermafbeeldingen van de gebouwde site
```

## De rubrieken van elke PR-pagina

1. **Wat er verandert** — de veranderingen als kaarten, met wat het voor de
   klant of de vakman betekent.
2. **Hoe het eruitziet** — hoe de verandering er in de praktijk uitziet: een
   schermafbeelding van de gebouwde site, of een mockup in HTML en CSS.
3. **De site in beeld** — de schermafbeelding(en) van het onderdeel dat deze
   PR toevoegt of verandert.
4. **De bestanden** — welk bestand wat doet, zodat iemand de code kan
   terugvinden.
5. **De proeven** — de namen van de proeven die erbij kwamen.
6. **Eerlijk** — wat deze PR níet doet. Deze rubriek is niet optioneel.

## Schermafbeeldingen

De showcase mag bestaan uit plaatjes. De regel "de mockups zijn CSS, geen
plaatjes" geldt sinds PR #67 alleen nog voor de mockups: die blijven CSS, en
daarnaast staat per PR-pagina een echte schermafbeelding van de gebouwde site.

Een schermaftelling staat in `assets/shots/` en komt als JPEG van maximaal
1400 pixels breed. De pagina verwijst ernaar met een `data-shot`-figuur:

```html
<figure class="shot shot--wide" data-shot>
  <div class="shot__frame">
    <div class="shot__bar">
      <span class="shot__dot"></span><span class="shot__dot"></span><span class="shot__dot"></span>
      <span class="shot__url">/voorbeeld/aannemer/klassiek</span>
    </div>
    <img class="shot__img" src="../assets/shots/aannemer-desktop.jpg" alt="..." width="1400" height="875" />
  </div>
  <figcaption class="shot__cap"><b>De bovenkant.</b> Wat de bezoeker ziet.</figcaption>
</figure>
```

`data-shot` zet de figuur in de lichtkast: klikken vergroot, de pijltjestoets
wisselt, Escape sluit. `shot--phone` zet de foto in een telefoonframe.

### De foto's zelf

De foto's in de schermafbeeldingen zijn lokale plaatshouders. De site laadt
zijn foto's van Unsplash, en die dienst is in de omgeving waarin de foto's
gemaakt zijn niet bereikbaar. Wat echt is: de opmaak, de teksten, de
opbouw. Wat niet echt is: de foto's in de beeldvulling.

### Een proef die het controleert

`scripts/check-lavish.mjs` (oftewel `bun run lavish`) faalt zodra:

- een pagina verwijst naar een bestand dat niet bestaat;
- een PR-pagina geen schermafbeelding heeft;
- een PR-map niet in het overzicht staat.

De proef draait mee in `bun run check`.

## Een pagina toevoegen

Bij elke PR die van deze branch gaat:

1. Maak `Lavish/pr-<nummer>/index.html`.
2. Neem `Lavish/pr-67/index.html` als voorbeeld; de stijl staat in
   `assets/style.css`.
3. Zet de pagina in `Lavish/index.html` in de lijst, met de fase, het aantal
   bestanden en het aantal proeven.
4. Vermeld in de PR dat er een pagina bij zit.

## Regels

- Geen cijfers die niet uit de code of uit de PR komen. Het overzicht
  beschrijft de werkelijkheid, ook als die minder mooi is.
- Bij elke belofte in een mockup moet de code haar waarmaken.
- De mockups blijven CSS; de schermafbeeldingen daarnaast zijn echt.
- Een schermaftelling krijgt altijd een bijschrift dat zegt wat je ziet.

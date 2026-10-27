# Bestandenoverzicht

[Open het bestandenoverzicht](./bestandenoverzicht.csv). Dit is een CSV-spreadsheet
met **één regel per bestand per branch**. Filter bijvoorbeeld op `Branch`, `Type`
of `Pad` om snel te zien waar een bestand bestaat. De CSV is tekst, zodat hij
in Git zichtbaar en doorzoekbaar blijft.

## Kolommen

| Kolom | Betekenis |
|-------|-----------|
| Bestand | Bestandsnaam zonder mappen |
| Pad | Pad vanaf de root van de repository |
| Type | Leesbaar bestandstype; symbolische links en submodules zijn apart aangeduid |
| Extensie | Bestandsextensie, indien aanwezig |
| Branch | Branch waarin dit pad voorkomt; niet noodzakelijk de branch waarop het bestand is aangemaakt |
| Eerste commit (UTC) | Oudste commit in de gevolgde Git-geschiedenis van dit bestand |
| Laatste wijziging (UTC) | Meest recente commit in die geschiedenis |

De datums zijn **Git-commitdatums in UTC**, geen lokale aanmaak- of
wijzigingsdatums. Git volgt waar mogelijk hernoemingen (`git log --follow`).
Een nieuw toegevoegd bestand heeft nog geen commitdatum; bij een gewijzigde
maar nog niet gecommitte versie blijft de laatste *commit*datum zichtbaar.
Bij de gegenereerde CSV zelf blijft `Laatste wijziging` leeg: anders zou iedere
automatische overzichtscommit weer een nieuwe wijziging veroorzaken.

Het overzicht bevat de opgehaalde `origin`-branches en de huidige lokale
branch. Bij de huidige branch telt ook wat al met `git add` in de index staat.
Bestanden die alleen lokaal bestaan en nog niet zijn toegevoegd, staan er
standaard niet in. Genegeerde bestanden en `.gitignore`-bestanden zelf worden
uitgesloten; de ignore-regels van de huidige checkout gelden voor alle branches,
ook wanneer een genegeerd bestand ooit geforceerd is toegevoegd. De inhoud van
bestanden wordt nooit in de CSV gezet.

Het overzicht is een momentopname, geen archief van verwijderingen: nieuwe
paden komen erbij, en een pad verdwijnt uit een branch wanneer het daar is
verwijderd. Het blijft zichtbaar bij andere branches die het nog bevatten.

## Openen als spreadsheet

- **Google Sheets:** maak een spreadsheet en kies **Bestand → Importeren →
  Uploaden**. Upload de CSV en kies zo nodig UTF-8 en een komma als scheiding.
- **Excel:** gebruik **Gegevens → Uit tekst/CSV**, met UTF-8 en komma als
  scheidingsteken. De UTF-8-BOM zorgt dat Nederlandse tekst goed wordt gelezen.

Een geïmporteerde Google Sheet of Excel-kopie is een **aparte kopie** en wordt
niet automatisch gesynchroniseerd. Het automatisch bijgewerkte bronbestand
blijft de CSV in deze repository; importeer opnieuw om zo'n kopie te verversen.
Bij namen die als spreadsheetformule kunnen worden gelezen, staat een apostrof
voor de celinhoud om formules niet per ongeluk uit te voeren.

## Automatisch bijwerken

Zodra `.github/workflows/file-inventory.yml` op de **standaardbranch** staat,
werkt GitHub Actions de centrale CSV op die branch bij:

- na een push naar een branch die de workflow bevat;
- bij het aanmaken of verwijderen van een branch; en
- volgens een schema van iedere 15 minuten, zodat ook oudere branches zonder
  de workflow en wijzigingen door andere bots uiteindelijk worden meegenomen.
  GitHub kan geplande runs vertragen of in een inactieve publieke repository
  uitschakelen; controleer het tabblad **Actions** als updates uitblijven.

De workflow haalt alle `origin`-branches en de volledige geschiedenis op,
vervangt de gegenereerde CSV indien nodig en commit alleen die CSV als
`chore: update file inventory`. Parallelle runs worden geserialiseerd; bij een
gelijktijdige push wordt opnieuw opgehaald en zonder force-push opnieuw
geprobeerd. Handmatige wijzigingen in de CSV worden overschreven.

Hiervoor moeten GitHub Actions ingeschakeld zijn en moet de workflow
`contents: write` hebben. Branchbeveiliging of repository-/organisatiebeleid
moet de GitHub Actions-bot toestaan rechtstreeks naar de standaardbranch te
pushen. Als dat niet mag, faalt de workflow zichtbaar in **Actions** en is een
beleidswijziging of handmatige update nodig; de CSV wordt dan niet vanzelf
bijgewerkt.

GitHub ziet een lokale `git add` pas na een push. Voor een directe lokale
update kun je de generator zelf draaien; er wordt geen Git-hook geïnstalleerd.

## Lokaal verversen en testen

```bash
# Haal álle remote branches op, ook als de clone normaal alleen main volgt.
git fetch --prune origin '+refs/heads/*:refs/remotes/origin/*'
bun run inventory

# Voeg het resultaat desgewenst toe aan je commit.
git add docs/bestandenoverzicht.csv

# Controleer zonder te schrijven, of voer de automatische tests uit.
bun run inventory:check
bun run inventory:test
```

Bij een shallow clone eerst `git fetch --unshallow origin` uitvoeren: zonder
volledige geschiedenis weigert de generator te draaien, omdat de eerste
commitdatum anders onbetrouwbaar is. Draai vanuit de repository; bij een
`detached HEAD` is `node scripts/file-inventory.mjs --branch NAAM` nodig.
`node scripts/file-inventory.mjs --include-untracked` toont optioneel ook
niet-genegeerde, nog niet toegevoegde lokale bestanden. Gebruik die optie
alleen als je die bestandsnamen bewust in het overzicht wilt opnemen.

De publicatiestap `scripts/publish-file-inventory.sh` is uitsluitend bedoeld
voor een schone, tijdelijke Actions-checkout; draai hem niet in een gewone
lokale checkout. `bun run check` voert ook de inventarisatietests uit.

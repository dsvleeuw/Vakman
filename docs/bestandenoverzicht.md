# Bestandenoverzicht en wijzigingsgeschiedenis

[Open het bestandenoverzicht](./bestandenoverzicht.csv). Dit is een
CSV-spreadsheet met **één regel per bestandswijziging per commit**, niet één
regel per dagelijkse scan. Bij een nieuwe commit komen alleen regels erbij voor
bestanden die echt zijn toegevoegd, gewijzigd, hernoemd, verwijderd of waarvan
het type/de Git-bestandsmodus is gewijzigd. Bestaande regels blijven behouden;
hun actuele vlag en branchlijsten kunnen veranderen. Hetzelfde commit wordt
niet opnieuw als aparte regel opgenomen wanneer een andere branch die
geschiedenis ook bevat.

## De actuele versie vinden

- `Is actueel` is `TRUE` als de regel de actuele versie van dat pad op **ten
  minste één** opgehaalde branch beschrijft. `FALSE` betekent een oudere versie
  of een verwijdering.
- `Actueel op branches` geeft de specifieke branchnamen als JSON-lijst, bijv.
  `["main","feature/voorbeeld"]`. Filter hier op `main` als je de actuele
  versie op de standaardbranch zoekt. Een oude versie kan nog `TRUE` zijn als
  die op een andere branch actueel is.
- `Branches (commit in geschiedenis)` zijn branches die het commit in hun
  geschiedenis hebben; dat betekent **niet** dat die versie op al die branches
  nog actueel is. `Eerder gezien op branches` bewaart ook verwijderde branches.

Voor de huidige lokale branch tellen staged wijzigingen mee. Zo'n tijdelijke
regel heeft `Bron = Git-index`, geen commitgegevens en wordt na de commit
vervangen door de definitieve commitregel. Een staged verwijdering is niet
actueel. Met `--include-untracked` kun je optioneel ook niet-toegevoegde
bestanden zien; die zijn nog niet actueel op een Git-branch.

## Welke informatie staat op een regel?

Het overzicht bevat onder meer bestandsnaam, pad, type, extensie, wijzigings-
type, eventueel vorig pad en hernoemingspercentage; de actuele vlag en
branchlijsten; volledige en korte commit-ID, oudercommits, commit- en
auteurdatum in UTC, auteur en committer met hun e-mailadressen, onderwerp en
volledig commitbericht; toegevoegde/verwijderde regels of de aanduiding
binair; oude en nieuwe Git-object-ID, grootte in bytes en bestandsmodus; en
links naar het commit en de betreffende bestandsversie op GitHub. Bij een
verwijdering wijst de versielink naar het bestand vóór de verwijdering.
Symbolische links en submodules hebben een eigen bestandstype. `Padcode` en
`Gebeurtenis-ID` zijn stabiele technische sleutels, zodat ook bijzondere
bestandsnamen veilig en zonder dubbele regels kunnen worden bijgehouden.

Commit- en auteurdatums komen uit Git, niet uit lokale bestandstijden.
`Voor het eerst gezien (UTC)` is het moment waarop de wijziging voor het eerst
in dit overzicht werd opgenomen; voor oudere commits is dat **niet** de
datum waarop het bestand werd aangemaakt. Git registreert geen betrouwbare
lokale aanmaakdatum. Het overzicht bevat alleen metadata en links, nooit de
inhoud van bestanden. Lokaal gemaakte commitlinks werken pas nadat de commit
naar GitHub is gepusht.

Een merge krijgt alleen regels voor paden die ten opzichte van de **eerste
ouder** van die merge veranderden. De individuele commits van de andere
branch staan ook in de geschiedenis. De actuele vlag op een branch volgt
de laatste wijziging op die eerste-ouderlijn; zo kan dezelfde inhoud op
verschillende branches door verschillende commits actueel zijn.

## Bewaren en privacy

Het overzicht leest de volledige bereikbare geschiedenis van alle opgehaalde
`origin`-branches en de huidige lokale branch. Eerder vastgelegde commitregels
blijven ook staan als een branch wordt verwijderd of de geschiedenis wordt
herschreven; ze zijn dan niet meer actueel op die branch. Dit is bewust een
historisch overzicht. Als een commitbericht of e-mailadres om privacyredenen
uit de Git-geschiedenis is verwijderd, kan het daardoor **nog in de CSV staan**.
Gebruik `node scripts/file-inventory.mjs --rebuild` om alleen de dan nog
bereikbare geschiedenis opnieuw op te bouwen; controleer daarna de diff voordat
je hem deelt. Tijdelijke index-/niet-gevolgde regels worden niet bewaard.

Genegeerde paden en `.gitignore`-bestanden zelf worden uitgesloten, ook als
een genegeerd bestand ooit geforceerd is toegevoegd. De ignore-regels van de
huidige checkout gelden voor alle branches en ook voor bewaarde oude regels.
Een nieuw ignore-patroon kan daarom oudere regels uit de CSV verwijderen; een
genegeerd oud pad wordt ook uit een hernoemingsregel weggelaten.

De gegenereerde CSV zelf is bewust niet opgenomen: iedere automatische
CSV-commit zou anders opnieuw een wijzigingsregel opleveren, waardoor een
oneindige reeks botcommits ontstaat. Bekijk voor die ene file de Git-geschiedenis
van `docs/bestandenoverzicht.csv` zelf.

## Openen als spreadsheet

- **Google Sheets:** maak een spreadsheet en kies **Bestand → Importeren →
  Uploaden**. Upload de CSV en kies zo nodig UTF-8 en een komma als scheiding.
- **Excel:** gebruik **Gegevens → Uit tekst/CSV**, met UTF-8 en komma als
  scheidingsteken. De UTF-8-BOM zorgt dat Nederlandse tekst goed wordt gelezen.

Een geïmporteerde Google Sheet of Excel-kopie is een **aparte kopie** en wordt
niet automatisch gesynchroniseerd. De automatisch bijgewerkte bron blijft de
CSV in deze repository; importeer opnieuw om zo'n kopie te verversen. Cellen
die als spreadsheetformule kunnen worden geïnterpreteerd, krijgen een apostrof
voor de inhoud om onbedoelde formule-uitvoering te voorkomen.

## Automatisch bijwerken

Zodra `.github/workflows/file-inventory.yml` op de **standaardbranch** staat,
werkt GitHub Actions de centrale CSV op die branch bij na pushes naar branches
met de workflow, bij het aanmaken/verwijderen van branches, en volgens een
schema van iedere 15 minuten. De periodieke run pakt ook oudere branches zonder
de workflow en wijzigingen door andere bots op. GitHub kan geplande runs
vertragen of in een inactieve publieke repository uitschakelen.

De workflow haalt alle `origin`-branches en de volledige geschiedenis op en
commit alleen een werkelijk gewijzigde CSV. Herhaald uitvoeren zonder relevante
wijziging levert geen nieuwe regels of commits op. Parallelle runs worden
geserialiseerd; bij een gelijktijdige push wordt zonder force-push opnieuw
opgehaald en geprobeerd. Pas de gegenereerde CSV niet handmatig aan.

GitHub Actions moet ingeschakeld zijn en `contents: write` hebben. Branch-
beveiliging of repository-/organisatiebeleid moet de Actions-bot toestaan
rechtstreeks naar de standaardbranch te pushen. Als dat niet mag, faalt de
workflow zichtbaar in **Actions** en is een beleidswijziging of handmatige
update nodig. GitHub ziet lokale `git add` pas na een push; voor een directe
lokale update kun je de generator draaien. Er wordt geen Git-hook geïnstalleerd.

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

# Optioneel: alleen de op dit moment bereikbare historie opnieuw opbouwen.
node scripts/file-inventory.mjs --rebuild
```

Bij een shallow clone eerst `git fetch --unshallow origin` uitvoeren: zonder
volledige geschiedenis weigert de generator te draaien. Draai vanuit de
repository; bij een `detached HEAD` is `node scripts/file-inventory.mjs
--branch NAAM` nodig. `node scripts/file-inventory.mjs --include-untracked`
toont optioneel ook niet-genegeerde, nog niet toegevoegde lokale bestanden.
Gebruik die optie alleen als je die bestandsnamen bewust wilt opnemen.

De publicatiestap `scripts/publish-file-inventory.sh` is uitsluitend bedoeld
voor een schone, tijdelijke Actions-checkout; draai hem niet in een gewone
lokale checkout. `bun run check` voert ook de inventarisatietests uit.

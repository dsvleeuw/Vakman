# De Kun-tools tegen dit repo getoetst

Zes tools uit Kun's `TOOLS.md`, allemaal opgehaald en gelezen op 29-10-2026
(`no-mistakes` @ `3bf6783`, `gh-axi` @ `3098da7`, `backpass` @ `a2d710b`,
`lavish-axi` @ `4236ad6`, `vision` @ `7a20c38`, `treehouse` @ `a2651e7`).

Maatstaf: past het in een repo zonder runtime-dependencies, en lost het een
probleem op dat dit repo nu echt heeft? Een tool die alleen een andere manier
is om hetzelfde te doen is geen winst.

## Overzicht

| Tool | Wat het is | Bruikbaar hier | Oordeel |
|------|-----------|----------------|---------|
| [gh-axi](https://github.com/kunchenguid/gh-axi) | AXI-wrapper om `gh` | ja, `npx -y gh-axi` werkt | **ja, als skill** |
| [lavish-axi](https://github.com/kunchenguid/lavish-axi) | HTML-artifacten visueel laten nakijken | CLI ja, de mens moet een browser hebben | **ja, voor de UI-review** |
| [vision](https://github.com/kunchenguid/vision) | VISION.md uit de echte PR-historie | ja, via `gh` (git-historie is gesquasht) | **ja, meteen** |
| [no-mistakes](https://github.com/kunchenguid/no-mistakes) | git-proxy met AI-gate vóór de PR | nee: er is geen tweede agent-CLI | **nee, niet nu** |
| [backpass](https://github.com/kunchenguid/backpass) | AGENTS.md verbeteren uit agent-sessies | nee: deze harness bewaart geen transcripten | **voor de eigenaar, niet hier** |
| [treehouse](https://github.com/kunchenguid/treehouse) | pool van herbruikbare worktrees | niet: de sandbox reset de werkboom | **voor de eigenaar** |

Alle zes zijn dev-time gereedschap: geen van de zes komt in `package.json` van
de app terecht. Dat is de enige eis die ze allemaal meteen halen.

## Wat ik daadwerkelijk heb geprobeerd

**gh-axi** — draait hier direct:

```sh
npx -y gh-axi pr list -R dsvleeuw/Vakman --limit 3
# count: 2
# pull_requests[2]{number,title,state,author,draft,review}:
#   22,"feat: brand, privacy, newsletter pages (C1-C3)",open,dsvleeuw,no,none
#   21,"fix: wizard D2 losse eindjes …",open,dsvleeuw,no,none
```

De uitvoer is TOON in plaats van JSON: kleiner, en met een
"wat nu"-regel erboven. Kun's eigen benchmark zet gh-axi tegen de kale `gh` op
100% tegenover 86% taakafgerond, met 7% lagere kosten. Voor dit repo is het
verschil klein — `gh` wordt hier vooral voor `pr list`, `pr view` en `pr merge`
gebruikt — maar het is gratis: een skill, geen dependency.

**lavish-axi** — de CLI draait (`npx -y lavish-axi --help`), inclusief
`export` (één portable HTML-bestand) en `poll` (feedback terug van de mens).
Het gemak: het opent een lokale express-server en laat de mens elementen
aanwijzen. Precies het gat dat in deze sessie openstond: de editor kon ik
niet zien, alleen via server-side HTML-asserts controleren.

**vision** — leest de echte merge-historie. Dit repo heeft een gesquashte
git-historie (één commit), maar de PR-historie staat op GitHub en is rijk:
30 PR's, 27 gemerged. Dat is voldoende bewijs voor een VISION.md. Het
resultaat staat in [VISION.md](../VISION.md).

## Waarom de andere drie hier niet passen

**no-mistakes** zet een git-proxy vóór de remote: je pusht naar `no-mistakes`,
het maakt een tijdelijke worktree, draait een AI-pipeline (review, test, docs,
lint) en passt de branch pas door als alles groen is. Dat is precies de
discipline die `AGENTS.md` hier al beschrijft — alleen dan automatisch. Het
blokkerende punt: elke gate heeft een **runnable pipeline-agent** nodig
(claude, codex, grok, …). In deze sandbox is er geen tweede agent-CLI, dus de
gate kan niet draaien. En de bestaande CI (`bun run check` in GitHub Actions)
dekkt lint, tests, inventory en build al. De winst zou de AI-reviewlaag zijn,
niet de testlaag. Voor de eigenaar met een agent-CLI is het een overweging
waard; hier niet.

**backpass** leest de transcript-stores van zeven harnesses (Claude Code,
Codex, …) rechtstreeks van schijf en doet "gradient descent" op AGENTS.md:
elke voorgestelde wijziging moet door twee sessies worden gedragen. Die
transcripten bestaan hier niet — deze arena-harness bewaart ze niet op de
plek die backpass leest, en modelcalls lopen via acpx naar een harness. Het
idee past wel goed bij dit repo (AGENTS.md is het geheugen van de volgende
agent), maar het is hier niet uitvoerbaar.

**treehouse** is voor de eigenaar die met meerdere agents tegelijk aan één
repo werkt: een pool van worktrees met dependencies en build-cache, zodat een
nieuwe sessie niet opnieuw `bun install` hoeft te doen. In deze sandbox is dat
nutteloos: de omgeving reset de werkboom sowieso. Het is wel precies de pijn
die ik in deze sessie voelde — na de reset moest ik `bun` opnieuw installeren
en 518 packages terugzetten.

## Wat hiermee doen we

1. **`VISION.md`**: staat er nu (uit de PR-historie). Dit is het stuur dat
   voorkomt dat de volgende agent een dashboard, CMS of i18n gaat bouwen.
2. **`gh-axi` en `lavish` als skills**: installeren in `.claude/skills/`,
   zodat een volgende sessie ze vindt. Geen dependency, geen runtime.
3. **De rest laten liggen** tot er een tweede agent-CLI of een
   transcript-store is. Ze zijn niet vervangen, ze zijn later bruikbaar.

## Bronnen

- Kun `TOOLS.md` (de zes tools, met de eigen omschrijvingen)
- De zes repositories zelf, opgehaald op 29-10-2026 (commit-hashes hierboven)
- `docs/kun-repo-study.md` — de studie waar deze review bij aansluit

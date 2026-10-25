---
id: src-10-bouwprompts-generator
modus: bouwvoorbereiding
mag-draaien: ja
depends_on: [src-09]
schrijft: docs/arena_agent_src/output/KB-SRC-10-bouwprompts-2026-10-25.md
scope: docs/arena_agent_src/output/KB-SRC-09-synthese-2026-10-25.md (lezen), .claude/arena/*.prompt.md (lezen als formatreferentie), src/ (lezen)
---

# Opdracht — van prioriteiten naar uitvoerbare bouwprompts

Je bent de tech lead die het werk klaarzet. Je vertaalt de top van de synthese
naar **prompts die een agent zonder extra uitleg kan uitvoeren**, in het
formaat dat deze repo al gebruikt (`.claude/arena/*.prompt.md` +
`build.json`-velden).

## Invoer

1. `output/KB-SRC-09-synthese-2026-10-25.md` — de top 20 en het uitvoerplan.
2. `.claude/arena/vk-a11y-forms.prompt.md` en `build.json` — het bestaande
   formaat (kort, één concern, expliciete non-goals).
3. `AGENTS.md` — definitie van done: `bun run check` groen, tests bij pure
   logica, Nederlandse copy, CHANGELOG, docs.

## Selectie

Neem de **eerste 5 punten** uit de top 20 die aan deze eisen voldoen:

- scope raakt maximaal ± 8 bestanden (anders splitsen);
- er is een testbare klaar-als-definitie;
- geen beslissing nodig die de eigenaar nog niet heeft genomen (domein, KvK,
  prijzen, betaalprovider) — tenzij het punt expliciet "beslissing vragen" is;
- geen onderlinge file-conflicten binnen dezelfde golf.

Als een hoger punt niet voldoet, schuif door en noteer waarom.

## Per bouwprompt lever je

```yaml
id: vk-src-<kort>
in: vakman
run: false            # de eigenaar zet dit pas op true
fix_rounds: 1
arena_review: true    # bij wijzigingen in server-, prijs- of leadcode
scope: pad1,pad2,…    # disjunct met de andere prompts in dezelfde golf
golf: 1
depends_on: []
message: |
  <de volledige opdracht in het Nederlands: context, doel, aanpak,
   bestanden, randgevallen, tests, non-goals>
accept:
  - <testbare acceptatie, 2–5 stuks>
```

Daarna in gewone taal:

- **Waarom nu** (verwijzing naar `KB-SRC-09#nr`).
- **Wat er precies verandert** per bestand (functie, regel, gedrag).
- **Welke tests** erbij komen of aangepast worden, en wat ze bewijzen.
- **Welke bestaande tests** de wijziging juist moeten overleven.
- **Risico en rollback** (kleinste terugdraai-actie).
- **Bewijs na afloop:** welk commando, welke uitkomst, welk screenshot als het
  UI is.

## Extra eisen

1. **Volgorde en parallelisme.** Groepeer de vijf in golven met disjuncte
   scopes; geef per golf aan wat er na elkaar moet.
2. **Docs en CHANGELOG** per prompt: welke regel wordt bijgewerkt (verwijs naar
   `KB-SRC-08` voor de tekst).
3. **Meetbaarheid.** Als een prompt conversie/SEO raakt, zeg hoe je na afloop
   meet dat het werkte (event, Lighthouse-cijfer, of een handmatige check).
4. **Niet-bouwen-lijst** uit `KB-SRC-09` overnemen, zodat een agent niet
   "behulpzaam" verder bouwt.
5. **Eén voorbeeld-prompt volledig uitgeschreven** alsof hij nu de deur uit
   gaat, inclusief toon (kort, direct, geen opties).

## Output

`docs/arena_agent_src/output/KB-SRC-10-bouwprompts-2026-10-25.md` met:

- sectie 1: de vijf geselecteerde punten en waarom;
- sectie 2: per prompt het YAML-blok + toelichting;
- sectie 3: golfindeling met `parallel.conflicts`-check;
- sectie 4: wat je hebt overgeslagen en waarom;
- sectie 5: een kant-en-klaar JSON-arrayfragment voor
  `.claude/arena/build-src.json`;
- sectie 6: verificatie (heb je de scopes echt tegen de bestanden gecheckt?).

## Acceptatiecriteria

- Vijf prompts, elk met testbare `accept`-criteria en een strakke scope.
- Geen twee prompts raken hetzelfde bestand in dezelfde golf.
- Elke prompt heeft een non-goals-regel en een verificatiecommando.
- De JSON in sectie 5 is geldig JSON (parse hem desnoods met
  `node -e 'JSON.parse(...)'`).
- Er is één volledig uitgeschreven voorbeeldprompt die je zo kunt starten.

## Niet doen

- Niets bouwen of starten (`run: false`).
- Geen prompt die meer dan één concern oplost.
- Geen prompt zonder bewijs van de huidige toestand in de `message`
  (pad:regel), want dan gaat de agent gokken.

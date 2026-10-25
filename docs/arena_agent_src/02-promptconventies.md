# 02 — Promptconventies

Elke prompt in `prompts/` volgt hetzelfde contract. Dit bestand is de
referentie: als een prompt iets anders lijkt te vragen, geldt dit document.

## Kop van een prompt

```yaml
---
id: src-0n-slug            # zelfde als bestandsnaam en als batch.json-id (vk-src-0n)
modus: onderzoek           # onderzoek | synthese | bouwvoorbereiding
mag-draaien: ja            # ja = bun/tsc/build toegestaan; nee = alleen lezen
scope:                     # exacte bestanden/mappen; buiten scope niet aanraken
depends_on: []             # alleen bij golf 2 en 3
schrijft: docs/arena_agent_src/output/KB-SRC-0n-slug-2026-10-25.md
---
```

`mag-draaien: ja` geldt in deze sandbox. Draait dezelfde prompt via de Arena
bridge (waar installeren niet mag), lees dan `mag-draaien` als **nee** en
beperk je tot statisch bewijs — zonder daarover te klagen in het resultaat.

## Bewijsregels

1. **Elke** uitspraak over de code heeft `pad:regel` of een commando + uitkomst.
2. Een uitspraak zonder bewijs is een **hypothese**, en die hoort in de sectie
   "Open vragen", niet in de bevindingen.
3. Verwijzen naar een doc alleen is géén bewijs. Docs zijn juist verdacht.
4. Bij twijfel: `grep`, `sed -n`, `bun test <bestand>` of een tijdelijk script
   (verwijder het daarna; niets extra's committen).
5. Als `01-baseline-en-seed.md` iets zegt dat jij anders ziet: **meld het
   expliciet** met "seed Bx klopt niet meer, want …". Dat is waardevol, geen fout.
6. Geen verzinsels over externe diensten (Resend, Netlify, Google). Wat je niet
   kunt zien, noem je een aanname.

## Ernst- en effortschalen

| Ernst | Betekenis |
|---|---|
| **P0** | Kost geld, leads of vertrouwen. Vandaag oplossen. |
| **P1** | Zichtbaar kapot of onveilig voor een echte klant; deze week. |
| **P2** | Remt groei of onderhoud; binnen een maand. |
| **P3** | Nice-to-have, polish, ooit. |

| Effort | Betekenis |
|---|---|
| **S** | < 1 dag, één bestand of twee, geen nieuwe dependency |
| **M** | 1–3 dagen, meerdere bestanden, tests erbij |
| **L** | > 3 dagen, raakt datamodel, server of meerdere schermen |

**Confidence:** `hoog` = zelf in code gezien en (waar kon) gedraaid;
`midden` = code gezien, gedrag beredeneerd; `laag` = vermoeden, moet nog
getest worden.

## Verplichte outputsecties

Elk onderzoeksresultaat heeft precies deze kop en volgorde:

```markdown
# KB-SRC-0n — <titel>

## 0. Samenvatting (max. 10 regels)
## 1. Status-tabel
| # | Onderdeel | Belofte (doc/UI) | Werkelijkheid (code) | Status | Ernst | Effort |
## 2. Bugs en defecten
## 3. Ontbrekende functionaliteit
## 4. Nieuwe feature-ideeën (max. 5 + "grote gokken")
## 5. Beter-kunnen: performance, a11y, security, onderhoud
## 6. Verouderde of foute documentatie (quote → voorstel)
## 7. Top 5 aanbevelingen (met ernst, effort, confidence)
## 8. Open vragen voor de tech lead
## 9. Verantwoording (commando's, wat ik niet kon verifiëren)
```

Status is altijd één van: `klaar`, `deels`, `ontbreekt`, `kapot`, `onduidelijk`.

## Kwaliteitslat voor feature-ideeën

Een feature-idee is pas een idee als het deze vier vragen beantwoordt:

1. **Wie** wordt er beter van (vakman, bezoeker, of Klusbaas zelf)?
2. **Waar** landt het in deze code (bestanden, types, route, data)?
3. **Waarom nu** — welk bewijs uit deze audit maakt het urgent?
4. **Wat kost het** (S/M/L) en **wat breekt** er als we het doen?

Ideeën die alleen "AI" of "dashboard" roepen zonder punt 2 zijn verboden.
Ideeën die een nieuwe SaaS of betaalprovider vereisen, horen onder
"grote gokken" met een eerlijke prijs.

## Verboden in resultaten

- Vage adviezen ("verbeter de UX", "maak het schaalbaar") zonder bestand.
- Het herschrijven van docs of code. Je schrijft **alleen** je resultaatbestand.
- Nieuwe dependencies voorstellen zonder te zeggen wat het kost en waarom de
  bestaande stack het niet kan.
- Beweringen over productie (Netlify-dashboard, Resend-instellingen) alsof je
  ze hebt gezien.
- Cijfers uit de docs napraten zonder ze te controleren (134 tests, 39 routes,
  35 presets, € 595/€ 995/€ 1.795).

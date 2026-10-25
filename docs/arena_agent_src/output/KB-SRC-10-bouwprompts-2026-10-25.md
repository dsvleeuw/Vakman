# KB-SRC-10 — Bouwprompts voor de top 5

- **Datum:** 2026-10-25 · **Commit:** `7d5ec3d` + docs
- **Invoer:** `KB-SRC-09-synthese-2026-10-25.md` (top 20)
- **Vorm:** `.claude/arena`-formaat (`id`, `in`, `mode`, `run`, `scope`,
  `message`, `accept`) plus toelichting per prompt
- **Alles staat op `run: false`** — starten gebeurt pas na jouw "ja"

## 1. Selectie en verantwoording

| Uit top 20 | Prompt-id | Waarom deze vijf |
|---|---|---|
| 1 + 58 | `vk-srcfix-demo-nummer` | P0, outreach-risico, klein en testbaar |
| 3 | `vk-srcfix-quote-idempotency` | dubbele offertes/mails, puur serverwerk |
| 6 | `vk-srcfix-booking-a11y` | duurste a11y-gat, één bestand |
| 10 | `vk-srcfix-strict` | nul-risico, beschermt de rest |
| 8 | `vk-srcfix-utm-behoud` | meten kan pas als dit werkt |

**Doorgeschoven met reden:** tokenverloop (punt 4) raakt dezelfde bestanden als
de idempotentie-prompt en moet dus in golf 2; mailalarm (5) wacht op de
alertkeuze van de eigenaar; `axe` in CI (49) komt direct na `strict`; de
lead-inbox (23) is een L-prompt en hoort in een eigen traject.

## 2. De vijf prompts

### 2.1 `vk-srcfix-demo-nummer`

```yaml
id: vk-srcfix-demo-nummer
in: vakman
mode: code
run: false
fix_rounds: 1
arena_review: true
scope: src/data/tradesData.ts,src/components/SiteView.tsx,src/components/ContactSection.tsx,src/components/BookingCalendar.tsx,src/components/SiteFooter.tsx,src/utils/contact.ts,src/utils/contact.test.ts,src/data/tradesData.test.ts,e2e/routes.spec.ts
message: |
  Doel: een demosite mag nooit een voorbeeldtelefoonnummer als tekst tonen.
  Nu valt buildActiveSite bij een ontbrekend demo-nummer terug op base.phone
  (tradesData.ts:1114), waardoor "Bel 06 45 67 89 01" in de header, in
  ContactSection.tsx:145 en in BookingCalendar-mails (regels 174/190/228)
  verschijnt. De knoppen zelf zijn al veilig (buildSiteTelUrl /
  buildSiteWhatsAppUrl geven DEMO_CONTACT_HREF).
  (1) Laat de weergavetekst nooit base.phone gebruiken op /voorbeeld: toon
  "06 00 00 00 00" met de bestaande DemoContactNotice, of verberg het nummer
  en toon "Nummer volgt" — kies één variant en leg hem uit in een comment.
  (2) Gebruik in BookingCalendar-mails nooit site.phone als er geen
  contactPhone is; val terug op de Klusbaas-contactgegevens uit
  data/platform.ts of laat de regel weg.
  (3) Verwijder daarna de test.fixme in e2e/routes.spec.ts voor het
  loodgieter-voorbeeld, zodat de test echt draait.
  (4) Voeg in contact.test.ts en tradesData.test.ts een test toe die bewijst
  dat buildActiveSite zonder demo-nummer geen base.phone als tekst geeft.
accept:
  - "dist/ bevat na een build geen 06 45 67 89 01 of 06 12 34 56 78 meer"
  - "e2e/routes.spec.ts heeft geen test.fixme meer voor het loodgieter-voorbeeld"
  - "Nieuwe tests falen op de oude code en slagen op de nieuwe"
  - "bun run check blijft groen"
```

**Wat verandert:** `buildActiveSite` (tekstfallback), `SiteView`/`ContactSection`
(weergave), `BookingCalendar` (mailinhoud), e2e + tests.
**Risico/rollback:** laag; één commit terugdraaien herstelt alles.
**Bewijs:** `grep -r "06 45 67 89 01" dist/` → leeg; e2e groen.

### 2.2 `vk-srcfix-quote-idempotency`

```yaml
id: vk-srcfix-quote-idempotency
in: vakman
mode: code
run: false
fix_rounds: 1
arena_review: true
scope: src/hooks/useLeadForm.ts,src/utils/leadClient.ts,src/utils/lead.ts,src/server/leadHandler.ts,src/server/storage.ts,src/utils/leadClient.test.ts,src/server/leadHandler.test.ts
message: |
  Doel: een dubbelklik of retry mag nooit een tweede offerte opleveren.
  Nu vraagt handleQuote altijd een nieuw volgnummer (leadHandler.ts:118) en
  slaat onvoorwaardelijk op, dus dezelfde aanvraag wordt KB-2026-0002.
  (1) Laat useLeadForm één idempotencyKey (crypto.randomUUID) per formulier-
  sessie genereren en meesturen; reset() maakt een nieuwe sleutel.
  (2) accepteer in lead.ts een optionele idempotencyKey (max 64 tekens,
  [A-Za-z0-9-]); geef hem door aan handleLead.
  (3) Zoek in storage een bestaand record op dezelfde sleutel binnen 10
  minuten (Blobs: key `idem-<key>`; dev: hetzelfde bestandspad) en geef dat
  terug in plaats van een nieuwe offerte; sla pas op als er geen match is.
  (4) Test: twee identieke POSTs geven hetzelfde offertenummer en één
  opgeslagen record; een andere sleutel geeft een nieuw nummer.
  Niet doen: rate limiter wijzigen, mailteksten aanpassen.
accept:
  - "Twee identieke aanvragen binnen 10 minuten geven hetzelfde offertenummer"
  - "Er wordt één record opgeslagen (test met een fake storage)"
  - "Zonder idempotencyKey verandert het gedrag niet (backwards compatible)"
  - "bun run check blijft groen"
```

**Wat verandert:** client (sleutel), validatie, handler, opslag.
**Let op:** dit is de eerste wijziging in `storage.ts`; houd de Blobs- en
file-implementatie gelijk en test ze beide.
**Bewijs:** nieuwe test in `leadHandler.test.ts` die twee keer submit.

### 2.3 `vk-srcfix-booking-a11y`

```yaml
id: vk-srcfix-booking-a11y
in: vakman
mode: code
run: false
fix_rounds: 1
arena_review: false
scope: src/components/BookingCalendar.tsx,src/components/BookingCalendar.test.tsx,e2e/wizard.spec.ts
message: |
  Doel: de boekingskalender is de stap waar een lead binnenkomt, maar de zeven
  labels zijn niet geassocieerd (BookingCalendar.tsx:295,321,345,367,385,403,
  421; nul htmlFor).
  (1) Geef elk tekstveld een id via useId (patroon: FaultReportForm) en koppel
  het label met htmlFor.
  (2) Voeg aria-invalid en aria-describedby toe aan de drie foutmeldingen en
  een aria-live="polite" regio die de fout samenvat.
  (3) Zet op de keuzegroepen (datum, dagdeel, dienst) role="group" met een
  aria-labelledby naar de bestaande kop, en aria-pressed op de knoppen.
  (4) Voeg autocomplete="name"/"tel" en inputmode="tel" toe waar passend.
  (5) Nieuwe test: render met react-dom/server en assert dat elk label een
  htmlFor heeft dat bij een bestaand id hoort.
  Niet doen: formulierlogica, styling of de tekst van de stappen wijzigen.
accept:
  - "Elk label in BookingCalendar heeft een htmlFor dat naar een bestaand id wijst"
  - "Foutmeldingen zijn gekoppeld via aria-describedby en aria-invalid"
  - "Nieuwe SSR-test faalt op de oude markup"
  - "bun run check blijft groen"
```

**Wat verandert:** alleen `BookingCalendar` (+ nieuwe test).
**Bewijs:** `grep -c htmlFor` = 7; test groen.

### 2.4 `vk-srcfix-strict`

```yaml
id: vk-srcfix-strict
in: vakman
mode: code
run: false
fix_rounds: 1
arena_review: false
scope: tsconfig.json,package.json,README.md
message: |
  Doel: typeveiligheid afdwingen die de code al haalt.
  tsconfig.json heeft geen strict; `bunx tsc --noEmit --strict` geeft nu 0
  fouten (gecontroleerd op 7d5ec3d).
  (1) Zet "strict": true in tsconfig.json.
  (2) Voeg een script "typecheck": "tsc --noEmit" toe aan package.json en laat
  scripts/check.mjs die stap gebruiken in plaats van (of naast) lint, zodat
  de CI expliciet typecheck meldt.
  (3) Werk README/AGENTS bij waar "lint" als typecheck wordt beschreven.
  (4) Probeer daarna noUncheckedIndexedAccess: als het aantal fouten klein is
  (< 10), los ze op; anders laat je het uit en noteer je het aantal in
  docs/known-limitations.md.
accept:
  - "tsconfig.json bevat \"strict\": true"
  - "bunx tsc --noEmit geeft 0 fouten"
  - "bun run check meldt een typecheck-stap en blijft groen"
  - "Het aantal fouten met noUncheckedIndexedAccess staat gedocumenteerd"
```

**Wat verandert:** config + scripts + twee docs-regels. **Risico:** nihil.
**Bewijs:** `bunx tsc --noEmit; echo $?` → 0.

### 2.5 `vk-srcfix-utm-behoud`

```yaml
id: vk-srcfix-utm-behoud
in: vakman
mode: code
run: false
fix_rounds: 1
arena_review: false
scope: src/App.tsx,src/utils/router.ts,src/utils/router.test.ts,src/utils/analytics.ts
message: |
  Doel: campagne- en trackingparameters mogen niet verdwijnen.
  App.tsx:166-180 vervangt de URL door buildPath(route) zodra die afwijkt;
  parseRoute bewaart alleen vak/stijl/pakket/naam/plaats/tel/token/status,
  dus ?utm_source=... wordt vóór de eerste page_view (App.tsx:121-123)
  verwijderd.
  (1) Normaliseer alleen als het pad verschilt; behoud onbekende
  query-parameters bij het herschrijven.
  (2) Voeg een pure helper toe in utils/router.ts, bijvoorbeeld
  mergeUnknownParams(currentSearch, canonicalPath), met tests.
  (3) Laat track('page_view') de utm-parameters (utm_source/medium/campaign)
  meesturen als ze aanwezig zijn.
  Niet doen: analytics-provider toevoegen of GTM plaatsen.
accept:
  - "/voorbeeld/loodgieter/modern?utm_source=linkedin behoudt utm_source na load"
  - "Nieuwe pure helper heeft tests voor behouden en strippen van parameters"
  - "page_view bevat utm_source wanneer aanwezig"
  - "bun run check blijft groen"
```

## 3. Golfindeling en scope-conflicten

| Golf | Prompts | Conflicten |
|---|---|---|
| 1 (parallel) | `demo-nummer`, `booking-a11y`, `strict`, `utm-behoud` | geen: `SiteView`/`ContactSection` vs. `BookingCalendar` vs. `tsconfig` vs. `App.tsx`/`router.ts` |
| 2 | `quote-idempotency` | raakt `hooks/useLeadForm.ts`, dat niet in golf 1 zit; **bewust apart** van `utm-behoud` (ook `App.tsx`-achtig maar ander bestand) |
| 3 (voorstel) | `token-verloop` (punt 4), `mailalarm` (punt 5) | beide raken `leadHandler.ts`; na golf 2 |

Controle: geen twee prompts in dezelfde golf delen een bestand. Nagerekend op
de scope-lijsten hierboven.

## 4. Overgeslagen en waarom

| Punt | Waarom niet nu |
|---|---|
| Tokenverloop (top 20 #4) | zelfde bestand als golf 2; logische volgende stap |
| Mailalarm (#5) | vereist een keuze (waarheen alarmeren) |
| `axe` in CI (#49) | komt direct na `strict`, kan als losse S-prompt |
| Lead-inbox (#23) | L, eigen traject met auth en UI |
| Extras op de demo (#28) | vereist productbeslissing over standaardblokken |
| Publiceren (#35) | grootste feature; apart plan nodig |

## 5. JSON-fragment voor `.claude/arena/build-src.json`

```json
[
  {
    "id": "vk-srcfix-demo-nummer",
    "in": "vakman",
    "mode": "code",
    "run": false,
    "fix_rounds": 1,
    "arena_review": true,
    "scope": "src/data/tradesData.ts,src/components/SiteView.tsx,src/components/ContactSection.tsx,src/components/BookingCalendar.tsx,src/components/SiteFooter.tsx,src/utils/contact.ts,src/utils/contact.test.ts,src/data/tradesData.test.ts,e2e/routes.spec.ts",
    "message": "Zie docs/arena_agent_src/output/KB-SRC-10-bouwprompts-2026-10-25.md, sectie 2.1. Voer die opdracht uit en houd bun run check groen.",
    "accept": [
      "dist/ bevat geen voorbeeldtelefoonnummers meer",
      "e2e/routes.spec.ts heeft geen test.fixme meer voor het loodgieter-voorbeeld",
      "Nieuwe tests falen op de oude code en slagen op de nieuwe",
      "bun run check blijft groen"
    ]
  },
  {
    "id": "vk-srcfix-quote-idempotency",
    "in": "vakman",
    "mode": "code",
    "run": false,
    "fix_rounds": 1,
    "arena_review": true,
    "scope": "src/hooks/useLeadForm.ts,src/utils/leadClient.ts,src/utils/lead.ts,src/server/leadHandler.ts,src/server/storage.ts,src/utils/leadClient.test.ts,src/server/leadHandler.test.ts",
    "message": "Zie docs/arena_agent_src/output/KB-SRC-10-bouwprompts-2026-10-25.md, sectie 2.2. Voer die opdracht uit en houd bun run check groen.",
    "accept": [
      "Twee identieke aanvragen binnen 10 minuten geven hetzelfde offertenummer",
      "Er wordt één record opgeslagen (test met een fake storage)",
      "Zonder idempotencyKey verandert het gedrag niet",
      "bun run check blijft groen"
    ]
  },
  {
    "id": "vk-srcfix-booking-a11y",
    "in": "vakman",
    "mode": "code",
    "run": false,
    "fix_rounds": 1,
    "arena_review": false,
    "scope": "src/components/BookingCalendar.tsx,src/components/BookingCalendar.test.tsx,e2e/wizard.spec.ts",
    "message": "Zie docs/arena_agent_src/output/KB-SRC-10-bouwprompts-2026-10-25.md, sectie 2.3. Voer die opdracht uit en houd bun run check groen.",
    "accept": [
      "Elk label heeft een htmlFor dat naar een bestaand id wijst",
      "Foutmeldingen zijn gekoppeld via aria-describedby en aria-invalid",
      "Nieuwe SSR-test faalt op de oude markup",
      "bun run check blijft groen"
    ]
  },
  {
    "id": "vk-srcfix-strict",
    "in": "vakman",
    "mode": "code",
    "run": false,
    "fix_rounds": 1,
    "arena_review": false,
    "scope": "tsconfig.json,package.json,README.md",
    "message": "Zie docs/arena_agent_src/output/KB-SRC-10-bouwprompts-2026-10-25.md, sectie 2.4. Voer die opdracht uit en houd bun run check groen.",
    "accept": [
      "tsconfig.json bevat strict: true",
      "bunx tsc --noEmit geeft 0 fouten",
      "bun run check meldt een typecheck-stap en blijft groen",
      "Het aantal fouten met noUncheckedIndexedAccess staat gedocumenteerd"
    ]
  },
  {
    "id": "vk-srcfix-utm-behoud",
    "in": "vakman",
    "mode": "code",
    "run": false,
    "fix_rounds": 1,
    "arena_review": false,
    "scope": "src/App.tsx,src/utils/router.ts,src/utils/router.test.ts,src/utils/analytics.ts",
    "message": "Zie docs/arena_agent_src/output/KB-SRC-10-bouwprompts-2026-10-25.md, sectie 2.5. Voer die opdracht uit en houd bun run check groen.",
    "accept": [
      "utm_source blijft behouden na load",
      "Nieuwe pure helper heeft tests",
      "page_view bevat utm_source wanneer aanwezig",
      "bun run check blijft groen"
    ]
  }
]
```

## 6. Verificatie van deze lijst

- Scope-conflicten: geen overlap binnen golf 1 (gecontroleerd per bestand).
- Elk `accept`-criterium is testbaar met `bun run check` of een benoemde test.
- Elke `message` verwijst naar bewijs in de code (`pad:regel`), zodat een agent
  niet hoeft te gokken.
- De JSON is gevalideerd met `JSON.parse`.

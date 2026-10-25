---
id: src-02-server-api-security
modus: onderzoek
mag-draaien: ja
depends_on: []
schrijft: docs/arena_agent_src/output/KB-SRC-02-server-api-security-2026-10-25.md
scope: src/server/, netlify/functions/, vite.config.ts, src/utils/lead.ts, src/utils/leadClient.ts, src/utils/leadEmail.ts, src/utils/quote.ts, src/utils/newsletter.ts, src/utils/newsletterClient.ts, src/utils/newsletterStatus.ts, src/hooks/useLeadForm.ts, src/components/LeadStatus.tsx, src/components/QuoteView.tsx, src/components/QuoteSummary.tsx, src/data/plans.ts, src/data/addons.ts
---

# Opdracht — server, lead-API, offertes, nieuwsbrief en security

Je bent een senior backend- en security-engineer. De app heeft een echte
API (`POST /api/lead`, `GET /api/quote`, `POST /api/newsletter`) met opslag,
mail en PDF-generatie. Jij bepaalt **wat daar mis kan gaan, wat niet klopt met
de belofte en wat er ontbreekt**, en je onderbouwt dat met code.

## Lees eerst

1. `AGENTS.md` — vooral de gotchas over `/api/lead`, preview-modus, Blobs.
2. `docs/architecture.md` en `docs/known-limitations.md` (lead/offersecties).
3. `docs/arena_agent_src/01-baseline-en-seed.md` — B13, B14, B15, H3–H5, H16–H20.
4. `netlify/functions/*.mts`, `src/server/*.ts`, `src/utils/lead*.ts`.

## Geverifieerde startsituatie

- `createRateLimiter({ limit: 20, windowMs: 10 * 60_000 })` op moduleniveau
  (`src/server/leadHandler.ts:69`) → per Netlify-instantie.
- `submitLead` heeft een 12 s timeout en Nederlandse foutmeldingen
  (`src/utils/leadClient.ts:25,40`).
- `useLeadForm.reset()` zet `startedAt` niet meer opnieuw (B14).
- Er is **geen** `netlify.toml`; functions leunen op `export const config = { path }`.
- Er bestaat geen `src/utils/leadEmail.test.ts` en geen test voor `src/server/quotePdf.ts`.

## Onderzoeksvragen

### Vertrouwen en validatie (H3)

1. Wat vertrouwt de server van de client? Loop `parseLead` en de handlers na:
   worden **bedragen, pakket-id, add-on-ids, btw en totalen** opnieuw berekend
   uit `src/data/plans.ts` + `addons.ts` + `utils/quote.ts`, of overgenomen?
   Geef per veld: bron van waarheid en risico op manipulatie.
2. Wordt het offertenummer geraden of gegenereerd? Hoe werkt de teller, en wat
   gebeurt er bij twee gelijktijdige aanvragen (race)? Bewijs met de
   `nextQuoteSequence`-implementatie.
3. Is er idempotentie? Wat gebeurt er bij een dubbelklik of een retry na
   timeout — twee offertes, twee mails, twee leadregels?
4. Wordt de body-grootte begrensd? Wat gebeurt er bij 10 MB JSON of een
   array in plaats van een object? Geldt dat ook in de dev-middleware?
5. Worden onbekende velden gestript of doorgegeven aan opslag/mail? Kan een
   aanvaller extra velden in de mail of PDF krijgen?

### Tokens, autorisatie en privacy (H4, H5)

6. Hoe wordt het offertetoken gemaakt (lengte, bron, entropie)? Verloopt het?
   Is het aan een ontvanger gebonden? Zijn offertes met alleen een nummer
   op te halen? Test `GET /api/quote` zonder en met een fout token.
7. Wordt het token gelogd (serverlog, mail, referrer)? Lek het via `?token=`
   naar externe bronnen (Unsplash, Google Fonts) via de Referer-header?
8. Wat staat er in de preview-modus in de log? Volledige mailtekst, adressen,
   telefoonnummers? Bewijs met de exacte regel en de omstandigheid.
9. Voldoet de opslag aan de eigen privacytekst: welke persoonsgegevens, waar,
   hoe lang, en is er een verwijderpad? Is er een retentie- of
   verwijderfunctie (of alleen handwerk in Blobs)?

### Spam, misbruik en beschikbaarheid

10. Beoordeel de spamheuristieken (honeypot, `MIN_FILL_MS`, rate limit) op
    effectiviteit én op false positives. Kan een echte gebruiker met autofill of
    een tweede aanvraag als bot worden gezien? Welke drempels gelden exact?
11. Wat is het effect van de rate limit per instantie? Bereken een realistisch
    scenario (koude starts) en geef alternatieven met voor- en nadelen
    (Blobs-teller, edge middleware, Netlify rate limiting).
12. Is er bescherming tegen e-mail bombing (veel aanvragen met andermans
    adres)? Tegen header-injectie in `onderwerp`/`from`? Tegen enorme bijlagen?
13. Wat gebeurt er als Resend of Blobs traag of stuk is? Faalt de aanvraag, of
    is er een fallback? Wordt de gebruiker iets zinvols beloofd?

### Mail, PDF en nieuwsbrief

14. Wordt alle gebruikersinvoer in HTML-mails geëscaped? Zoek naar
    `escapeHtml`-gebruik per veld en noem elk veld zonder escaping.
15. Wat staat er in de mails: is de Klusbaas-notificatie compleet genoeg om
    zonder dashboard te werken (bron, kanaal, bedrag, contact, offertelink)?
    Wat mist er om een lead te kunnen opvolgen?
16. Hoe robuust is de PDF (`src/server/quotePdf.ts`): fonts, lange namen,
    onbreekbare strings, bedragen, meerdere pagina's, logo-resolutie? Is er een
    test? Genereer desnoods een PDF met een 200-tekens bedrijfsnaam en een
    bedrag van € 1.234.567 en beoordeel het resultaat.
17. Nieuwsbrief: hoe werkt dubbele opt-in, tokenverloop, dubbele aanmelding,
    afmelden, en de Resend-Audience-sync bij fouten? Kan iemand een ander
    afmelden of bevestigen? Wat gebeurt er zonder `RESEND_AUDIENCE_ID`?
18. Is de dev-middleware in `vite.config.ts` functioneel gelijk aan de Netlify
    functions? Noem elk verschil (headers, IP-bepaling, foutafhandeling,
    storage) en het risico dat "lokaal groen, productie stuk" oplevert.

### Operations

19. Welke signalen heb je als een leadmail niet aankomt? Is er logging,
    retry, alerting, een healthcheck? Wat is het eerste dat je zou toevoegen?
20. Zijn er securityheaders (CSP, HSTS, X-Frame-Options) of cacheheaders op
    `/api/quote` (privé-data)? Waar zou dat moeten staan zonder `netlify.toml`?
21. Lekken er gegevens via `public/`: staat `public/kaart/leads.json` in de
    build als hij lokaal bestaat, en is dat bestand dan publiek op te halen?
    Bewijs met `ls dist/kaart` na een build met een testbestand (ruim op!).

## Output

`docs/arena_agent_src/output/KB-SRC-02-server-api-security-2026-10-25.md`
volgens `02-promptconventies.md`.

Sectie 4 (features) moet minstens beoordelen: een admin/lead-inbox,
per-site ontvanger, offerteversie/status (concept/verzonden/geaccepteerd),
betaallink of akkoordknop, gedeelde rate limit, en monitoring met een
dagelijkse samenvatting.

## Acceptatiecriteria

- Vraag 1 is beantwoord met een **veld-voor-veld-tabel** (client → server →
  bron van waarheid).
- Vraag 6 en 10 zijn aantoonbaar getest (commando, curl of unit test).
- Elke P0/P1 heeft een concreet, minimaal fixvoorstel (geen herontwerp).
- Je noemt expliciet welke risico's je **niet** kon verifiëren (Netlify-dashboard,
  Resend-instellingen) en wat je daarvoor nodig hebt.

## Niet doen

- Geen productie-aanroepen met echte persoonsgegevens; gebruik testadressen.
- Geen `.data/`- of Blob-inhoud met echte gegevens in je resultaat citeren.
- Geen codewijzigingen.

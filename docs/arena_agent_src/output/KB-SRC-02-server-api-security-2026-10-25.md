# KB-SRC-02 — Server, lead-API, offertes en security

- **Datum:** 2026-10-25 · **Commit:** `7d5ec3d`
- **Prompt:** `prompts/src-02-server-api-security.prompt.md`
- **Soort:** read-only onderzoek · **Uitgevoerd met:** codelezen, `bun test src`,
  `dist/`-inspectie (geen productie-aanroepen)

## 0. Samenvatting

De server is **volwassener dan de documentatie doet vermoeden**: prijzen worden
server-side herberekend uit `plans.ts`/`addons.ts`, add-ons worden
gesaneerd, het offertetoken is 24 random bytes met `timingSafeEqual`, previewlogs
zijn ge-maskeerd en `/api/quote` stuurt `no-store` + `X-Robots-Tag: noindex`.
De echte risico's zijn operationeel: **rate limiting per instantie**,
**geen idempotentie** (dubbelklik = dubbele offerte), **tokens verlopen niet**,
**geen body-limiet**, **geen signalering als een leadmail faalt** en **geen
manier om leads te bekijken**. Dat laatste is het grootste productgat: de
belofte "elke aanvraag komt bij ons binnen" is technisch waar, maar
onbeheersbaar zonder inbox.

## 1. Status-tabel

| # | Onderdeel | Belofte | Werkelijkheid | Status | Ernst | Effort |
|---|---|---|---|---|---|---|
| 1 | Eén lead-endpoint | fixlijst B2 | `handleLead` dekt quote + 4 site-leads (`leadHandler.ts:258-297`) | klaar | — | — |
| 2 | Prijzen server-side | "prijzen alleen uit plans/addons" | `calculateQuote` in `utils/quote.ts:51-82`; clientbedragen worden niet gebruikt | klaar | — | — |
| 3 | Add-on-sanitisatie | — | `sanitizeAddonIds` (`quote.ts:36-40`) filtert onbekende id's | klaar | — | — |
| 4 | Offertetoken | onraadbaar | `randomBytes(24).toString('base64url')` + `timingSafeEqual` (`leadHandler.ts:71-81`) | klaar | — | — |
| 5 | Tokenverloop | eigen wens (docs/08 backlog) | token heeft geen expiry; `validUntil` (30 d) geldt alleen op de PDF | deels | P2 | S |
| 6 | PII in logs | audit P0 | previewlog: tag, domeindelen, gemaskeerd onderwerp; fouten via `maskEmails` (`leadHandler.ts:84-106`) | klaar | — | — |
| 7 | Rate limit | 20/10 min | `createRateLimiter` op moduleniveau (`leadHandler.ts:69`) → per instantie | deels | P1 | M |
| 8 | Idempotentie | — | geen dedupe; elke POST maakt een nieuw offertenummer | ontbreekt | P1 | M |
| 9 | Body-limiet | — | Netlify: `req.json()` onbeperkt (`netlify/functions/lead.mts:8-14`); dev: `raw += chunk` (`vite.config.ts:30-34`) | ontbreekt | P2 | S |
| 10 | Foutopvang bij mail | "aanvraag komt binnen" | `ok: team.status !== 'failed'`; bij Blobs-fout → 500, niets opgeslagen (`leadHandler.ts:288-296`) | deels | P1 | M |
| 11 | Leads bekijken | niet beloofd | alleen mail + Blobs/`.data`; geen UI | ontbreekt | P1 | L |
| 12 | Securityheaders | — | geen `netlify.toml`, dus geen CSP/HSTS/X-Frame-Options | ontbreekt | P2 | S |

## 2. Bugs en defecten

**B1. Dubbele aanvraag = dubbele offerte en dubbele mail.**
`handleQuote` vraagt altijd een nieuw volgnummer (`leadHandler.ts:118`) en slaat
onvoorwaardelijk op. Een dubbelklik, een retry na de 12 s timeout
(`leadClient.ts:40`) of een refresh op `/start/afspraak` levert een tweede
offerte `KB-2026-0002` op met dezelfde inhoud en een tweede mail.
*Fix (M):* idempotency-key meenemen (client genereert een UUID per
formuliersessie) en binnen 10 minuten hetzelfde record teruggeven.

**B2. Volgnummer en opslag zijn niet atomair.**
`nextQuoteSequence(year)` (`storage.ts:79-104`) en `saveQuote` zijn twee
losse Blob-acties. Twee gelijktijdige aanvragen kunnen hetzelfde nummer
krijgen; de tweede overschrijft de eerste (`quotes/${record.id}`).
*Bewijs:* `storage.ts:87-100` (key = `quotes/<id>`). *Fix (S/M):* nummer
reserveren en opslaan in één gecontroleerde stap, of `id` inclusief random
suffix.

**B3. Offertetoken is niet aan de ontvanger gebonden en verloopt nooit.**
Iedereen met de link kan de offerte (en de PDF) voor altijd inzien; `validUntil`
staat in het record maar wordt nergens gecontroleerd (`handleGetQuote`,
`leadHandler.ts:305-330`). Bij doorgestuurde of geïnde mail is dat een blijvend
lek van bedrijfsgegevens en prijzen. *Fix (S):* `validUntil` afdwingen (410) en
optioneel een tweede factor (e-mailadres in de link).

**B4. Preview-modus en foutpaden kunnen zwijgen over mislukking.**
Zonder `RESEND_API_KEY` retourneert de API `ok: true, mode: 'preview'`; de
gebruiker ziet "gelukt" terwijl er niets is verzonden en niets is opgeslagen als
Blobs niet bestaan (dev: `.data/`, prod: Blobs). In productie met Blobs-fout
krijgt de gebruiker een 500 met WhatsApp-fallback (`leadHandler.ts:288-296`) —
dat is goed — maar de **eigenaar** merkt niets als alleen de *klantmail* faalt:
`ok` hangt aan `team`, `delivery.customer` kan `failed` zijn zonder alarm.
*Fix (S):* één regel naar een alertkanaal (of een samenvattingsmail per dag).

**B5. Geen some-limiet op de aanvraag.**
`netlify/functions/lead.mts:8-14` parseert de body zonder groottecontrole;
`vite.config.ts:30-34` verzamelt chunks zonder maximum. Een 10 MB-body of een
grote `services`-array wordt geaccepteerd voordat `parseLead` iets afkapt
(`lead.ts:180-182` knipt wél per string op 120 tekens, maximaal 30 stuks).
*Fix (S):* `Content-Length`/byte-teller met 100 kB-grens en 413 terug.

**B6. Dev en productie verschillen op IP en headers.**
Dev gebruikt `req.socket.remoteAddress` (`vite.config.ts:41`), Netlify
`x-nf-client-connection-ip` of `context.ip` (`lead.mts:15`). Achter een proxy
kunnen alle dev-aanvragen hetzelfde IP hebben → één rate-limit-emmer. Ook mist
dev de Netlify-headers (`Cache-Control`) op `/api/quote`.
*Fix (S):* één `clientKey`-helper in `src/server/` voor beide paden.

**B7. `/api/newsletter` heeft geen `Retry-After` en geen idempotentie.**
Twee keer op "Aanmelden" stuurt twee bevestigingsmails; de handler logt
gemaskeerd, maar de Resend-Audience-sync kan bij een tweede aanmelding een
bestaande contactpersoon overschrijven (`newsletterHandler.ts`).
*Fix (S):* bestaande status opzoeken en alleen bij `pending` opnieuw mailen.

## 3. Ontbrekende functionaliteit

1. **Lead-inbox / admin** (L): zonder dashboard is opvolging handwerk in
   Netlify Blobs. Dit is de grootste ontbrekende schakel tussen "aanvraag
   komt binnen" en "klant wordt geholpen" (roadmap 3.3).
2. **Per-site ontvanger** (M): `QUOTE_NOTIFY_EMAIL` is globaal
   (`lead.mts:20`). Zodra een klant een eigen site heeft, moet de lead naar
   *die* vakman, met Klusbaas in cc.
3. **Idempotentie** (B1) en **statusmodel** per offerte
   (concept/verzonden/geaccepteerd/afgewezen) — nu is een offerte een
   onveranderlijk record.
4. **Monitoring**: geen healthcheck, geen foutalarm, geen dagelijkse
   samenvatting. `docs/known-limitations.md` noemt dit niet eens als gat.
5. **Retentie/verwijdering** (M): de privacytekst belooft bewaartermijnen,
   maar er is geen taak die oude leads/quotes opruimt
   (`docs/known-limitations.md`, sectie Privacy).
6. **Gedeelde rate limit** (M): Blobs-teller of edge-middleware in plaats van
   geheugen per instantie.

## 4. Nieuwe feature-ideeën

**F1. Lead-inbox met status (L).**
Route `/admin` achter Firebase Auth (bestaat al voor Google-sync,
`utils/googleWorkspace.ts`), lijst uit de `leads`-store, status
nieuw/gebeld/offerte/gewonnen, en een "bel"- en "app"-knop per regel. Dit maakt
de bestaande opslag eindelijk bruikbaar en is de basis voor roadmap 3.3.

**F2. Offertestatus + akkoordknop (M).**
`QuoteRecord` uitbreiden met `status`, `acceptedAt`; in de klantmail een
"Offerte akkoord"-knop die `POST /api/quote/accept?id&token` doet. Sluit direct
aan op `handleGetQuote` en de bestaande tokens.

**F3. Per-site ontvanger en afzender (M).**
`QUOTE_NOTIFY_EMAIL` per site laten meelopen in de wizard/opslag; in
`buildQuoteEmail` de vakman als primaire ontvanger, Klusbaas in cc. Nodig voor
elke echte klantsite.

**F4. Dagelijkse samenvatting (S).**
Een Netlify scheduled function die per dag telt: aanvragen, offertes,
mislukte mails, rate-limit-afwijzingen, en dat naar `QUOTE_NOTIFY_EMAIL`
mailt. Vervangt het ontbreken van monitoring met 40 regels code.

**F5. Offerte-PDF als "versie" (S).**
Sla bij elke wijziging (bijv. korting) een nieuwe PDF op met suffix
`-v2`; nu overschrijft een nieuwe render de bestaande PDF.

**Grote gok: betaallink (L).**
Mollie/Stripe-koppeling in de offerte. Vereist een providerkeuze, een
webhook-endpoint en een statusmodel; pas zinvol als F2 bestaat. Buiten scope
tot de eigenaar een provider kiest.

## 5. Beter-kunnen

- **Validatie:** `parseLead` knipt strings en saneert add-ons, maar `services`
  zijn vrije tekst (`lead.ts:180-182`) en belanden in mail én PDF. Dat is
  acceptabel, maar de PDF moet langere strings aankunnen (zie KB-SRC-07-tests:
  geen test voor `quotePdf`).
- **E-mailopmaak:** alle gebruikersvelden lijken via `escapeHtml`
  (`leadEmail.ts:23-102`) te gaan; één gerichte test die probeert een
  `<script>` in de bedrijfsnaam te zetten zou dat moeten borgen.
- **Headers:** `/api/quote` is goed (`no-store`, `noindex`), maar `/api/lead`
  heeft geen `Cache-Control` en geen `X-Content-Type-Options`.
- **Logging:** voeg een correlatie-id toe per aanvraag (reference bestaat al) en
  log alleen statusovergangen, geen inhoud.
- **Tests:** `leadHandler.test.ts` (236 r.) dekt veel; `leadEmail`,
  `quotePdf`, `storage` en `newsletterStorage` hebben géén test
  (KB-SRC-07 §1).
- **Afhankelijkheid:** `@netlify/blobs` wordt dynamisch geïmporteerd
  (`storage.ts:76`) — netjes, maar betekent dat een typefout pas bij de
  eerste aanvraag opvalt in plaats van bij de build.

## 6. Verouderde of foute documentatie

| Document:regel | Citaat | Werkelijkheid | Voorstel |
|---|---|---|---|
| `AGENTS.md:9-12` | "no application backend" | er is een volledige API met opslag, mail en PDF | schrappen; verwijs naar `netlify/functions/` |
| `docs/known-limitations.md` (Lead) | "zonder domein … klantbevestigingen worden geweigerd" | klopt, maar `MAIL_TEST_RECIPIENT` bestrijkt dat nu netjes | nuanceer |
| `docs/known-limitations.md` (Lead) | "rate limiting per functie-instantie" | klopt nog steeds (B7 in baseline) | handhaven, prioriteit P1 |
| `docs/08-audit-resultaten.md:18-20` | "previewmodus logt de volledige mailtekst" | inmiddels gemaskeerd (`leadHandler.ts:92-100`) | als opgelost markeren |

## 7. Top 5 aanbevelingen

| # | Aanbeveling | Ernst | Effort | Confidence |
|---|---|---|---|---|
| 1 | Idempotency-key op offerte-aanvragen (B1) | P1 | M | hoog |
| 2 | Tokenverloop afdwingen + statusmodel (B3/F2) | P1 | S | hoog |
| 3 | Alarm bij mislukte team- of klantmail (B4) | P1 | S | hoog |
| 4 | Lead-inbox achter auth (F1) | P1 | L | midden |
| 5 | Body-limiet + `netlify.toml` met headers (B5/B12) | P2 | S | hoog |

## 8. Open vragen

1. Is er een Resend-domein geverifieerd? Zo nee, dan gaan klantbevestigingen
   alleen naar `MAIL_TEST_RECIPIENT`.
2. Mag een klant later zijn eigen ontvanger instellen (F3), of blijft alles naar
   `QUOTE_NOTIFY_EMAIL`?
3. Is er een wettelijke bewaartermijn afgesproken? Nu niet vastgelegd.

## 9. Verantwoording

- Gelezen: `leadHandler.ts` (330 r.), `storage.ts`, `mailer.ts`,
  `quotePdf.ts` (225 r.), `lead.ts`, `quote.ts`, `leadEmail.ts`,
  `newsletterHandler.ts`, `vite.config.ts`, `netlify/functions/*.mts`.
- Gedraaid: `bun test src` (134 tests groen).
- Niet gedaan: echte POST naar productie, Blobs-inspectie, Resend-dashboard.

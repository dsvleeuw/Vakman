# src/server — Server-side Handlers (Netlify Functions)

Alle backend logica draait als Netlify Functions (of Vite dev middleware). Geen aparte backend server.

## Handlers

| Bestand | Doel |
|---------|------|
| `leadHandler.ts` | `POST /api/lead` — Ontvangt leads van demo sites & wizard, valideert, stuurt mails, slaat op in Blobs/.data |
| `adminHandler.ts` | `POST /api/admin` — Het Klusbaas-overzicht: inloggen, aanvragen, offertes, sites, en zelf een offerte maken |
| `adminOffer.ts` | Een offerte die Klusbaas zelf schrijft: offerte-record met PDF, gekoppeld aan het account van de klant en per mail verstuurd |
| `accountHandler.ts` | `POST /api/account` — Registreren, inloggen, account, sites, aanvragen, offertes, koppelen |
| `siteHandler.ts` | `POST /api/site` — Publiceren en lezen van een klantsite |
| `mediaHandler.ts` | `POST/GET /api/media` — Foto's van de vakman opslaan en serveren (max. 1,5 MB, 30 uploads per uur per IP) |
| `newsletterHandler.ts` | `POST /api/newsletter` — Nieuwsbrief inschrijvingen |
| `mailer.ts` | E-mail verzending via Resend (productie) of console log (dev/preview) |
| `quotePdf.ts` | PDF generatie voor offertes (pdfkit) |
| `storage.ts` | Abstraction layer: `.data/` (dev) ↔ Netlify Blobs (prod) voor `quotes` en `leads` stores |
| `leadHandler.test.ts` | Unit tests voor lead validatie, quote delivery, storage |
| `newsletterHandler.test.ts` | Tests voor newsletter signup |

## Lead flow

1. Form submit → `useLeadForm()` → `POST /api/lead`
2. `leadHandler` valideert via `utils/lead.ts` (`validateLead`)
3. Berekent quote via `utils/quote.ts` (centen, 21% btw)
4. Genereert PDF via `quotePdf.ts`
5. Beslist delivery via `quoteDelivery(channel)`:
   - **Email**: PDF naar klant + Klusbaas
   - **WhatsApp**: wa.me link in team mail + PDF aan Klusbaas
   - **Allebei**: beide
6. Slaat lead + quote op in storage
7. Stuurt bevestigingsmail

## Environment

- `RESEND_API_KEY` — ontbreekt = preview mode (mails in console)
- Zonder key: data in `.data/` (gitignored)
- Met key: Netlify Blobs stores `quotes` en `leads`
- `ADMIN_PASSWORD` — toegang tot `/klusbaas`; zonder deze variabele is het
  overzicht gesloten
- `PAYMENT_IBAN`, `PAYMENT_NAME`, `PAYMENT_EMAIL` — de betaalgegevens die de
  klant in zijn account en in de mail ziet

## Offerte die Klusbaas zelf schrijft

1. `POST /api/admin` met `action: 'create-quote'` (achter `ADMIN_PASSWORD`)
2. `adminOffer.ts` haalt de klantgegevens uit zijn site, bouwt het
   offerte-record (`utils/quote.ts`), maakt de PDF (`quotePdf.ts`) en slaat
   beide op in `quotes`
3. De offerte wordt gekoppeld aan het account van de klant, zodat hij hem in
   `/mijn-account` ziet
4. De klant krijgt de mail met de offerte als PDF en de link naar de
   online offerte (`utils/leadEmail.ts`, `buildOfferEmail`)
5. De betaalgegevens (`server/payment.ts`) komen in de PDF en in
   `GET /api/quote`, zodat de klant kan betalen zonder account
6. Met `leadReference` neemt de offerte de klantgegevens uit een aanvraag
   (`L-XXXXXX`), voor iemand die nooit een account maakte

## Een aanvraag en haar offerte

`createOfferForCustomer` slaat de `leadReference` van de aanvraag op in de
offerte (`QuoteRecord.leadReference`). `buildOverview` geeft die door, zodat
het overzicht bij een aanvraag kan zeggen welke offerte er al is.

## Een verlopen offerte verlengen

`extend-quote` in `adminHandler.ts`: de offerte krijgt dertig dagen extra,
zodat de klant hem nog kan accepteren. Een betaalde of geannuleerde
offerte kan niet verlengd worden. De klant ziet op de offertepagina wanneer
zijn offerte verlopen is (`isQuoteExpired` in `utils/quote.ts`); een
verlopen offerte kan niet geaccepteerd worden.

## Een openstaande offerte opvolgen

`remind-quote` in `adminHandler.ts`: de klant van een openstaande offerte
krijgt een herinnering met de link naar de offerte, het bedrag en de IBAN
(`server/remindQuote.ts`, `utils/leadEmail.ts` → `buildReminderEmail`).
De mail gaat alleen naar een klant met een e-mailadres; een betaalde of
geannuleerde offerte krijgt geen herinnering.

## Factuur bij een betaalde offerte

Wanneer Klusbaas een offerte op `paid` zet (`adminHandler.ts`, actie
`quote-status`), krijgt de klant een factuur als PDF: `server/paidNotice.ts`
maakt de mail, `server/invoicePdf.ts` tekent het document. De factuurgegevens
van Klusbaas komen uit de omgeving via `server/invoice.ts`
(`INVOICE_NAME`, `INVOICE_ADDRESS`, `INVOICE_KVK`, `INVOICE_VAT`,
`INVOICE_EMAIL`); wat niet is ingevuld, wordt niet afgedrukt.

De klant kan de factuur ook opnieuw downloaden: `GET /api/quote?id=…&token=…&
format=invoice` geeft hem alleen terug als de offerte betaald is.

## Accepteren door de klant

`POST /api/quote/accept` met `{ id, token, name }`: de klant zegt ja op de
offertepagina. De token uit de offertelink bewijst dat de offerte van hem
is. De offerte krijgt de status `accepted` (`acceptedAt`) en Klusbaas krijgt
een mail (`utils/leadEmail.ts`, `buildAcceptEmail`). Accepteren is geen
betalen: het bedrag wordt overgemaakt en Klusbaas markeert de offerte
handmatig als betaald.

## Tests

- Mock `Resend`, `Netlify Blobs`, `crypto.randomUUID`
- Test validatie, quote math, PDF generatie, delivery logic
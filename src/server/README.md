# src/server — Server-side Handlers (Netlify Functions)

Alle backend logica draait als Netlify Functions (of Vite dev middleware). Geen aparte backend server.

## Handlers

| Bestand | Doel |
|---------|------|
| `leadHandler.ts` | `POST /api/lead` — Ontvangt leads van demo sites & wizard, valideert, stuurt mails, slaat op in Blobs/.data |
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

## Tests

- Mock `Resend`, `Netlify Blobs`, `crypto.randomUUID`
- Test validatie, quote math, PDF generatie, delivery logic
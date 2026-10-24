# Contact strategy

## Why WhatsApp-first (option D)

The competitor research concluded that tradespeople use WhatsApp all day,
while a subset of visitors prefers a traditional form. The chosen strategy
is therefore **D: WhatsApp as the primary button, a short form as the
alternative**. Every form now posts to one endpoint, `POST /api/lead`, so
each lead is saved and mailed to us; the prefilled `wa.me` message stays
available as the fallback when sending fails.

## How a lead travels

1. The form validates in the browser and posts JSON with `kind`
   (`offerte`, `contact`, `storing`, `oppervlak`, `afspraak`), a hidden
   honeypot field `website` and `startedAt` (when the form mounted).
2. `src/server/lead.ts` (same code in the Netlify Function and `vite dev`)
   validates again with `utils/lead.ts`, silently drops spam (honeypot or
   under 3 seconds), applies the rate limit and saves the lead in Netlify
   Blobs (`leads`; `.data/leads` in dev).
3. For `offerte` it also creates the numbered quote, stores it plus its PDF
   in `quotes` and builds the private link `/offerte/:id?token=…`.
4. Mail to `QUOTE_NOTIFY_EMAIL` (reply-to the visitor). This must succeed,
   otherwise the visitor sees an error with the WhatsApp fallback; the lead
   is already saved either way.
5. Mail to the visitor, only when they gave an address and, for quotes,
   when the channel includes e-mail. A refusal (Resend test mode) is logged
   and reported, never fatal.

The UI shows the real state through `useLeadSubmit` + `LeadError`:
"Versturen…", a confirmation with the reference, or the error.

## Wizard channel choice

`quoteDelivery(channel)` in `utils/quote.ts` decides:

| Choice | Customer gets | Klusbaas gets |
|--------|---------------|---------------|
| E-mail | mail with PDF + link | mail with PDF |
| WhatsApp | quote link on screen (no mail; e-mail optional) | mail with PDF + one-tap wa.me link to send the quote |
| Allebei | mail with PDF + link | mail with PDF + wa.me link |

## Where contacts can start

| Surface | Component | Channels offered |
|---------|-----------|------------------|
| Demo site, dedicated section | `ContactSection` | WhatsApp card (primary) + short form → `/api/lead` (optional e-mail for a confirmation) |
| Mobile, always visible | sticky bar in `SiteView` | `tel:` call + WhatsApp |
| Desktop, always visible | floating stack in `SiteView` | WhatsApp + quote CTA (`#prijs`) |
| Demo site header | `SiteView` header | `tel:` call |
| Demo site footer | `SiteView` footer | WhatsApp (primary) + call |
| Plumber emergency | `EmergencyButton` | call + emergency WhatsApp with problem prefilled |
| Electrician fault report | `FaultReportForm` | validated form → `/api/lead`; WhatsApp fallback; emergency phone link |
| Painter m² calculator | `SurfaceCalculator` | name + phone → `/api/lead`, or the estimate via WhatsApp |
| Booking calendar | `BookingCalendar` | `/api/lead`, plus Google Calendar/Drive sync when logged in |
| Wizard | `WizardView` step "Versturen" | `/api/lead` (`kind: offerte`) → numbered quote, PDF, link |

## Message templates

All templates live in `src/utils/contact.ts` and are unit-tested:

| Helper | Used by | Contents |
|--------|---------|----------|
| `buildContactMessage` | `ContactSection` form | Free-text message, name, phone |
| `buildEmergencyMessage` | `EmergencyButton` | "SPOEDklus", selected problem, optional name |
| `buildFaultReportMessage` | `FaultReportForm` | fault type, timing, urgency, address, contact details, optional notes |
| `buildSurfaceQuoteMessage` | `SurfaceCalculator` | service, m² breakdown, estimate, optional name |
| `buildWhatsAppUrl` | all of the above | converts `06 …` to `31…` and URL-encodes the message |
| `buildTelUrl` | call buttons | strips spaces/dashes for `tel:` links |

| `buildSiteTelUrl` / `buildSiteWhatsAppUrl` | every call/WhatsApp button on a site | link to `site.contactPhone`, or `#klusbaas-demo` when there is no safe number |

### Which number a site dials

The sector data contains made-up sample numbers (`06 12 34 56 78`, …) that
may belong to real people, so a site never links to them.
`buildActiveSite` sets `site.contactPhone` via `resolveContactPhone`:

1. the owner's own number from the wizard or a personal demo link (`?tel=`);
2. otherwise the Klusbaas number from `VITE_DEMO_PHONE` (also shown as the
   visible number);
3. otherwise `null`: buttons link to `#klusbaas-demo` and `SiteView` shows
   "Dit is een demo — zo komen klanten bij jou binnen" with a button to
   `/start/gegevens`.

The wizard's confirmation screen sends the quote to Klusbaas over the same
number (`getPlatformWhatsApp()` in `data/platform.ts`); without
`VITE_DEMO_PHONE` it only offers e-mail.

New contact buttons must use `buildSiteTelUrl(site.contactPhone)` /
`buildSiteWhatsAppUrl(site.contactPhone, …)`, never `site.phone`.

Phone conversion rule: a leading `0` is replaced by the country code `31`
(`06 12 34 56 78` → `31612345678`). Numbers already in international form
pass through unchanged.

## Validation rules

- Phone fields go through `normalizeDutchPhone()` (accepts `06…`, `+31 6…`,
  `0031 (0)6…`), in the browser and again on the server.
- E-mail is optional on forms, and required in the wizard only when the
  quote is mailed (`E-mail` or `Allebei`).
- Required name/address fields show inline red errors and block submission
  until valid.
- The generic contact message needs at least 10 characters to prevent
  empty enquiries.

## Known gaps (see [known-limitations.md](./known-limitations.md))

- Without a verified mail domain, Resend only delivers to the account
  address; customer confirmations are logged, not sent.
- Leads from demo sites go to Klusbaas, not to the demo's craftsman.
- WhatsApp delivery of a quote is a one-tap link for us, not automatic.

## Changing the strategy

- To reword a template, edit the relevant helper — the tests will show
  every component affected.
- To add a form, give it a `kind` in `utils/lead.ts` (with tests), a mail
  in `utils/leadEmail.ts`, and use `useLeadSubmit` + `LeadHoneypot` +
  `LeadError` in the component. Keep the WhatsApp URL as fallback.

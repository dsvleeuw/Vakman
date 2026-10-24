# Contact strategy

## Why WhatsApp-first (option D)

The competitor research concluded that tradespeople use WhatsApp all day,
while a subset of visitors prefers a traditional form. The chosen strategy
is therefore **D: WhatsApp as the primary button, a short form as the
alternative**. This is implemented without a backend: every form composes
a prefilled `wa.me` message and opens WhatsApp, so the craftsman receives
all leads in a single inbox and nothing can fail server-side.

## Where contacts can start

| Surface | Component | Channels offered |
|---------|-----------|------------------|
| Wizard step 5 | `WizardView` | quote request → `POST /api/lead` (type `quote`): stored, PDF, mail to Klusbaas and (channel E-mail/Allebei) to the customer |
| Demo site, dedicated section | `ContactSection` | WhatsApp card (primary) + short form → `/api/lead` (type `contact`), WhatsApp as fallback |
| Mobile, always visible | sticky bar in `SiteView` | `tel:` call + WhatsApp |
| Desktop, always visible | floating stack in `SiteView` | WhatsApp + quote CTA (`#prijs`) |
| Demo site header | `SiteView` header | `tel:` call |
| Demo site footer | `SiteView` footer | WhatsApp (primary) + call |
| Plumber emergency | `EmergencyButton` | call + emergency WhatsApp with problem prefilled |
| Electrician fault report | `FaultReportForm` | validated form → `/api/lead` (type `fault`); WhatsApp fallback; emergency phone link |
| Painter m² calculator | `SurfaceCalculator` | phone + estimate → `/api/lead` (type `surface`), or send via WhatsApp |
| Booking calendar | `BookingCalendar` | `/api/lead` (type `appointment`) first, then optional Google Calendar/Drive sync |

## Lead API (`POST /api/lead`)

- One endpoint for every form; handler `src/server/leadHandler.ts`, used by
  the Netlify Function and the Vite dev middleware alike.
- Spam: hidden honeypot field `website` and `startedAt` (forms submitted
  within 2.5 s are ignored with a fake success); simple per-IP rate limit.
- Validation per form type in `utils/lead.ts` (tested); phone via
  `normalizeDutchPhone`, e-mail via `isValidEmail`.
- Every lead is stored first, then mailed to `QUOTE_NOTIFY_EMAIL`. A failed
  team mail returns 502 (the form shows an error with WhatsApp fallback); a
  refused customer mail never fails the request. The response lists the
  result per recipient (`delivery.team`, `delivery.customer`).
- Quotes get a number `KB-YYYY-NNNN`, a 24-byte random token and a PDF;
  they are viewable at `/offerte/:id?token=…` (`GET /api/quote`, wrong token
  → 403, unknown → 404) and the PDF at `&format=pdf`.

### Wizard channel choice

| Channel | Customer receives | Klusbaas receives |
|---------|-------------------|-------------------|
| WhatsApp | quote on screen; team sends it via the wa.me link | mail + PDF + wa.me link to the customer |
| E-mail (e-mail required) | mail with PDF | mail + PDF |
| Allebei (e-mail required) | mail with PDF, plus WhatsApp from the team | mail + PDF + wa.me link |

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

- Dutch phone fields require ten digits starting with `0` after stripping
  whitespace and dashes: `/^0\d{9}$/`.
- Required name/address fields show inline red errors and block submission
  until valid.
- The generic contact message needs at least 10 characters to prevent
  empty enquiries.

## Known gaps (see [known-limitations.md](./known-limitations.md))

- Resend runs in test mode until a domain is verified: only the account
  address receives mail, so customer confirmations are refused for now.
- WhatsApp quotes are sent by hand from the team mail (no Business API).
- Demo-site leads go to Klusbaas, not yet to the tradesperson.

## Changing the strategy

- To reword a template, edit the relevant helper — the tests will show
  every component affected.
- To add a real form backend later, keep the WhatsApp URL as a fallback
  path and introduce an async submit alongside the deep link rather than
  replacing it, so the no-backend behaviour remains available in
  previews and tests.

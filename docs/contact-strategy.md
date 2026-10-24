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
| Demo site, dedicated section | `ContactSection` | WhatsApp card (primary) + short form that opens WhatsApp |
| Mobile, always visible | sticky bar in `SiteView` | `tel:` call + WhatsApp |
| Desktop, always visible | floating stack in `SiteView` | WhatsApp + quote CTA (`#prijs`) |
| Demo site header | `SiteView` header | `tel:` call |
| Demo site footer | `SiteView` footer | WhatsApp (primary) + call |
| Plumber emergency | `EmergencyButton` | call + emergency WhatsApp with problem prefilled |
| Electrician fault report | `FaultReportForm` | validated form → WhatsApp notification; emergency phone link |
| Painter m² calculator | `SurfaceCalculator` | quote summary → WhatsApp |
| Booking calendar | `BookingCalendar` | Google Calendar/Drive sync when logged in, otherwise local confirmation |

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

- The wizard's channel choice (WhatsApp / E-mail / Allebei) is not yet
  wired into published sites; every demo currently follows strategy D
  regardless of the selection.
- No e-mail channel exists yet (no `mailto:` or transactional mail).
- Submissions are not stored: opening WhatsApp is the only delivery
  mechanism. A lead API is phase 3 on the [roadmap](../ROADMAP.md).

## Changing the strategy

- To reword a template, edit the relevant helper — the tests will show
  every component affected.
- To add a real form backend later, keep the WhatsApp URL as a fallback
  path and introduce an async submit alongside the deep link rather than
  replacing it, so the no-backend behaviour remains available in
  previews and tests.

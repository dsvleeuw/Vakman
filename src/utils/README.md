# src/utils — Pure Utility Functies & Tests

Alle business logica: pricing, contact, routing, analytics, quotes, leads, kleuren, fonts, Google Workspace, appointments. **Geen React dependencies**.

## Hoofdcategorieën

### Pricing & Quotes
- `pricing.ts` / `pricing.test.ts` — `formatEuro(cents)`, `calculateTotal(plan, addons)`, `btwAmount(cents)`
- `quote.ts` / `quote.test.ts` — Quote berekening: basis + addons + btw, in centen

### Contact & Communicatie
- `contact.ts` / `contact.test.ts` — `buildWhatsAppUrl()`, `buildTelUrl()`, `normalizeDutchPhone()`, message builders
- `lead.ts` / `lead.test.ts` — `validateLead()`, `LeadSchema` (Zod), honeypot check
- `leadEmail.ts` — E-mail templates voor lead/quote bevestiging
- `leadClient.ts` / `leadClient.test.ts` — Client-side lead submit helper
- `newsletter.ts` / `newsletter.test.ts` — Newsletter validatie & submit
- `newsletterClient.ts` / `newsletterClient.test.ts` — Client newsletter helper
- `newsletterStatus.ts` — Status tracking voor newsletters

### Routing & Navigatie
- `router.ts` / `router.test.ts` — Route definities, `routeFromLegacyQuery()` voor oude `?sector=&style=&view=` links, `RouteLink` href helpers

### Kleuren & Styling
- `color.ts` / `color.test.ts` — `computePalette(hue, styleIndex)`, `withAccessibleContrast()`, HSL manipulatie
- `fonts.ts` / `fonts.test.ts` — Font loading, font stack per stijl

### Analytics & Tracking
- `analytics.ts` / `analytics.test.ts` — `track(event, props)`, `pageview()`, consent handling

### Google Workspace & Agenda
- `googleWorkspace.ts` / `googleWorkspace.test.ts` — Calendar/Drive sync via Firebase Auth
- `appointments.ts` / `appointments.test.ts` — Afspraak slots, beschikbaarheid

### Overige
- `surface.ts` / `surface.test.ts` — Oppervlakte berekeningen (m², tegels, verf)
- `quoteEmail.ts` — (in `leadEmail.ts`) Quote specifieke e-mail templates

## Conventies

- **Alle functies zijn pure** — geen side effects, geen React, geen `window`
- Tests naast bron: `*.test.ts`
- Typescript strict mode
- Geen hardcoded regex voor telefoonnummers → gebruik `normalizeDutchPhone()`
- Euro bedragen altijd in **centen** (integer), formatting alleen bij weergave
- BTW vast 21% (Nederland)

## Imports

```ts
import { formatEuro, calculateTotal } from './pricing';
import { buildWhatsAppUrl, normalizeDutchPhone } from './contact';
import { track } from './analytics';
import { validateLead } from './lead';
```
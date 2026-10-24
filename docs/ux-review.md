# UX & UI review — URLs, navigation and conversion

Review of the Klusbaas prototype as it stood before this change, focused on
navigation, page structure and the onboarding funnel. Findings marked
**Fixed** are shipped in this branch; the recommendations are prioritised and
still open.

## What was broken

### 1. There was no URL per page (Fixed)

The app switched views with React state only. Consequences:

- The browser back button left the product instead of going to the previous
  wizard step.
- Refreshing on step 4 dropped you back on step 1.
- A generated preset (`/voorbeeld/loodgieter/krachtig`) could not be shared,
  bookmarked or indexed; the "deep link" format was an undocumented query
  string (`?sector=loodgieter&style=2&view=site`).
- Every page had the same `<title>`, and there was no 404: a typo showed a
  blank screen.

**Now:** a routed SPA. `/` (with `?vak=`), `/voorbeeld/:sector/:stijl`,
`/start/vak|stijl|gegevens|diensten|afspraak|klaar`,
`/componenten/:id` and a branded 404. Each route gets its own title and meta
description. Old query links are redirected with `replaceState`, and
`public/_redirects` keeps deep links working on Netlify. The soft rules live in
`src/utils/router.ts` with unit tests.

### 2. Navigation was state changes, not links (Fixed)

Primary navigation buttons ("Alle 30 presets", "Componenten", sector and
style chips, "Pas deze site aan") were `<button>`s, so they could not be opened
in a new tab, copied, or crawled. They are now `RouteLink`s: a real `<a href>`
that only intercepts plain left clicks.

### 3. The wizard fought the user (Fixed)

- **Back button:** each step is a history entry now; browser back returns to
  the previous step, and the "← Terug" button and the step bullets do the same.
- **Progress indicator:** the step bullets were decorative. They are now a
  `<nav>` with clickable completed steps, `aria-current="step"` and a
  "stap X van 5" label.
- **Lost input:** going to the site preview and back reset the form. The draft
  now lives in `App` + sessionStorage, so data survives navigation and reloads.
- **Mobile preview:** the full demo site (a 1.100-line component) was rendered
  below the form on phones, doubling page length. It is now collapsed behind a
  "Bekijk je website live" toggle below `lg`, and only mounts when opened.
- **Validation:** errors were visual only. Fields now have `id`/`for`,
  `aria-invalid`, `aria-describedby`, `role="alert"`, `autocomplete` and
  `inputMode`; the first invalid field gets focus when the step fails.

### 4. Smaller fixes

- `<html lang="en">` → `lang="nl"` (screen readers pronounced Dutch copy with
  an English voice).
- Added a skip link ("Naar de inhoud"), a polite live region that announces
  each page change, and a visible `:focus-visible` ring for every interactive
  element, including palette-styled trade-site buttons.
- `prefers-reduced-motion` now disables the marquee, pulse and scroll
  animations.
- Mobile menu: closes on outside click and locks background scrolling.
- FAQ kicker read "FAQ & HEBDEN" (a place name); now "Goed om te weten".
  Accordion buttons got `aria-controls`/`aria-expanded` wiring.
- Contact form labels were not associated with their inputs; fixed, with
  error announcements and focus management.
- Duplicated marquee slides are hidden from screen readers and the tab order.
- Header CTA said "Plan een afspraak" while the hero said "Start je website",
  both opening step 1. The header now says "Start je website" so the promise
  and the action match; planning happens at the end of the flow.
- Preset cards: "Bekijk site" / "Kies deze" were vague competing buttons →
  "Bekijk demo" / "Kies deze stijl", with descriptive `aria-label`s and real
  links on the marketing page.

## Recommendations, in priority order

### P1 — conversion and trust

1. **Carry the chosen package into the wizard.**
   `Start met Pro` currently lands on step 1 and forgets the choice. Add
   `?pakket=pro` to the wizard URL, show the selection in step 5 and in the
   confirmation ("Pro · € 995 eenmalig, excl. btw"). Today the pricing table
   ends in a dead click; this is the cheapest funnel fix available.
2. **Wire or remove the "Offertes ontvangen via" choice.**
   The wizard offers WhatsApp / E-mail / Allebei and the confirmation repeats
   it, but nothing changes. Either send a `mailto:` fallback and store the
   channel, or drop the control. A control that does nothing erodes trust in
   a product whose pitch is "within fifteen minutes".
3. **Order the end of the wizard around the deliverable.**
   Step 5 asks for an appointment before the visitor has seen their finished
   site. Consider making "Bekijk je website" the primary action there
   (publish first, then offer an appointment), and treat the Google sign-in as
   an explicit optional extra instead of a surprise popup during booking.

### P2 — mobile and flow polish

4. **Sticky wizard action bar on mobile.** "Volgende stap" sits below a long
   form; on a phone it is off-screen after the last field. A sticky bottom bar
   with "← Terug" and the primary action (with safe-area padding) would cut
   mis-taps.
5. **Collapse the preview chrome on small screens.** The dark preview bar on
   a generated site wraps to three rows on a phone. Make it a bottom sheet or
   a single "aanpassen" chip so the site itself is what people see.
6. **Restore scroll position within a page.** Route changes intentionally jump
   to the top. Returning to a partly-scrolled long page (or a wizard step you
   already filled) could restore the previous offset; `history.state` is free
   to store it.
7. **Explain the shortcut into step 3.** "Kies deze stijl" on a preset jumps
   straight to `/start/gegevens`, so the first thing a visitor sees is
   "STAP 3 VAN 5". Show a small summary ("Vak: loodgieter · Stijl: Signaal ·
   wijzig") above the form so the jump feels intentional rather than broken.
8. **Empty/loading states.** Image fallbacks exist, but there is no shimmer or
   reserved aspect ratio in a few grids, so the layout jumps when photos load.

### P3 — performance, SEO, measurement

9. **Route-level code splitting.** `index-*.js` is ~498 kB (147 kB gzip);
   `WizardView` and `SiteView` could be lazy-loaded per route like the
   component library already is. This matters on the mobile 4G connections the
   target audience often uses.
10. **Prerender the marketing pages.** Client-side routes are a big step up
   from state-only views, but crawlers still see an empty `index.html`.
   Prerendering `/`, `/voorbeeld/*` and `/componenten` (or migrating to a
   framework with SSR) plus a sitemap, canonical tags and an `og:image` is the
   next SEO step.
11. **Funnel analytics.** Emit step-view, step-complete, preset-open and
    WhatsApp-click events; the wizard is the product, and right now nobody can
    see where people drop out.
12. **Accept international phone formats.** `+31 6 1234 5678` and `0031…` are
    rejected by the wizard/contact/booking validators even though
    `phoneToWaDigits` handles them. Normalise before validating and keep the
    friendly error message.
13. **Accessibility audit with real assistive tech.** Labels, focus, skip link
    and reduced motion are in place, but the palette-generated trade sites
    (five styles × light/dark) deserve a contrast pass, especially muted text
    on tinted cards and white text on the accent colour.

## How this was verified

- `npx tsc --noEmit`, the full `node --test` suite (47 tests, 11 new router
  tests) and `vite build` are green.
- `/`, `/voorbeeld/loodgieter/krachtig`, `/start/gegevens`,
  `/componenten/trust-bar` and unknown paths all return the app shell from the
  dev server (SPA fallback), and `buildPath(parseRoute(url))` is asserted to
  round-trip for every route shape.
- Browser-only behaviour (back/forward, scroll reset, draft restore) is
  covered by design and code review; no end-to-end runner is configured in
  this repo yet (roadmap 5.1).

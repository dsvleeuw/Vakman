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

## Round 2 — shipped in this branch

These follow-ups from the first review are now implemented and covered by the
jsdom walkthrough and unit tests:

- **Chosen package travels through the funnel (P1).** `Start met Pro` opens
  `/start/vak?pakket=pro`; the package appears as a chip from step 3, as a
  priced line in step 5 and in the confirmation. Plan data moved to
  `src/data/plans.ts` so pricing table and wizard cannot drift.
- **Shortcut into step 3 explained (P2).** Context chips ("Vak: loodgieter ·
  wijzig", "Stijl: Signaal · wijzig", "Pakket: Pro") sit above the form on
  steps 3–5.
- **Sticky mobile action bar (P2).** "← Terug" and "Volgende stap" are pinned
  to the bottom of the viewport on phones, with the preview toggle just above.
- **Route-level code splitting (P3).** Initial JS: 498 kB → 299 kB
  (147 kB → 95 kB gzip). `SiteView`, `WizardView` and `ComponentGallery` load
  per route with a spinner fallback.
- **International phone numbers (P3).** `+31 6 12345678`, `0031 (0)6-…` and
  local formats pass validation everywhere (`normalizeDutchPhone`), with
  tests.
- **Bug found while testing:** `onStart` handlers attached directly to
  `onClick` passed the click event as a plan id; the wizard entry point now
  validates the argument.

## Recommendations, still open

### P1 — conversion and trust

1. **Wire or remove the "Offertes ontvangen via" choice.**
   The wizard offers WhatsApp / E-mail / Allebei and the confirmation repeats
   it, but nothing changes. Either send a `mailto:` fallback and store the
   channel, or drop the control. A control that does nothing erodes trust in
   a product whose pitch is "within fifteen minutes".
2. **Order the end of the wizard around the deliverable.**
   Step 5 asks for an appointment before the visitor has seen their finished
   site. Consider making "Bekijk je website" the primary action there
   (publish first, then offer an appointment), and treat the Google sign-in as
   an explicit optional extra instead of a surprise popup during booking.

### P2 — mobile and flow polish

3. **Collapse the preview chrome on small screens.** The dark preview bar on
   a generated site wraps to three rows on a phone. Make it a bottom sheet or
   a single "aanpassen" chip so the site itself is what people see.
4. **Restore scroll position within a page.** Route changes intentionally jump
   to the top. Returning to a partly-scrolled long page (or a wizard step you
   already filled) could restore the previous offset; `history.state` is free
   to store it.
5. **Empty/loading states.** Image fallbacks exist, but there is no shimmer or
   reserved aspect ratio in a few grids, so the layout jumps when photos load.

### P3 — performance, SEO, measurement

6. **Prerender the marketing pages.** Client-side routes are a big step up
   from state-only views, but crawlers still see an empty `index.html`.
   Prerendering `/`, `/voorbeeld/*` and `/componenten` (or migrating to a
   framework with SSR) plus a sitemap, canonical tags and an `og:image` is the
   next SEO step.
7. **Funnel analytics.** Emit step-view, step-complete, preset-open and
    WhatsApp-click events; the wizard is the product, and right now nobody can
    see where people drop out.
8. **Accessibility audit with real assistive tech.** Labels, focus, skip link
    and reduced motion are in place, but the palette-generated trade sites
    (five styles × light/dark) deserve a contrast pass, especially muted text
    on tinted cards and white text on the accent colour.

## How this was verified

- `npx tsc --noEmit`, the full `node --test` suite (49 tests: router,
  phone normalisation, pricing, contact, appointments, component renders) and
  `vite build` are green.
- A temporary jsdom walkthrough (deleted before commit) clicked "Start met
  Pro" → asserted `?pakket=pro` in the URL, walked to step 5 and checked the
  package line, restored a typed business name after a preview round-trip,
  accepted `+31 6 12345678`, opened the 404, a deep link, and followed a
  legacy `?view=site` redirect.
- `/`, `/voorbeeld/loodgieter/krachtig`, `/start/gegevens`,
  `/componenten/trust-bar` and unknown paths all return the app shell from the
  dev server (SPA fallback), and `buildPath(parseRoute(url))` is asserted to
  round-trip for every route shape.
- Browser-only behaviour (back/forward, scroll reset, draft restore) is
  covered by design and code review; no end-to-end runner is configured in
  this repo yet (roadmap 5.1).

# UX & UI review — URLs, navigation, conversion and accessibility

Review of the Klusbaas prototype, the fixes shipped in this branch, and the
smaller ideas that are explicitly *not* built yet.

## Part 1 — the problems that were fixed

### 1. There was no URL per page

The app switched views with React state only: the back button left the
product, reloading on step 4 dropped you on step 1, a preset could not be
shared or indexed, every page had the same `<title>`, and a typo produced a
blank screen.

**Now:** a typed client router (`src/utils/router.ts`, `hooks/useRouter.ts`,
`RouteLink`). `/`, `/voorbeeld/:sector/:stijl`,
`/start/vak|stijl|gegevens|diensten|afspraak|klaar`, `/componenten/:id` and a
branded 404. Per-route title + description, legacy `?view=…` links redirect,
`public/_redirects` keeps deep links alive on Netlify.

### 2. Navigation was state changes, not links

Primary navigation, sector chips, style chips and "Pas deze site aan" were
`<button>`s: no new tab, no copy link, nothing for a crawler. They are
`RouteLink`s now — a real `<a href>` that intercepts only plain left clicks.

### 3. The wizard fought the user

- Each step is its own history entry; browser back moves one step back.
- The step indicator is a `<nav>` with clickable completed steps and
  `aria-current="step"`.
- The draft (sector, style, form, services) survives navigation and reloads.
- The full demo site is collapsed on phones instead of doubling page length.
- Validation errors focus the first invalid field and are announced.

### 4. Smaller UI/a11y fixes

`lang="nl"`, skip link, per-route titles, favicon, visible `:focus-visible`
ring, `prefers-reduced-motion`, mobile menu closing on outside click with
scroll lock, contact-form labels, FAQ `aria-controls` and a typo
("FAQ & HEBDEN" → "Goed om te weten"), duplicated marquee slides hidden from
assistive tech, decorative hero photos marked `aria-hidden`.

## Part 2 — the recommendations, all implemented

| # | Recommendation | Status |
|---|----------------|--------|
| 1 | Carry the chosen package through the funnel | ✅ `?pakket=pro`, chip from step 3, priced line in step 5 and on the confirmation. Plan data in `src/data/plans.ts` |
| 2 | Wire or remove the WhatsApp/E-mail channel | ✅ wired: the confirmation offers a prefilled WhatsApp message and/or a `mailto:` with the appointment summary, matching the chosen channel |
| 3 | Order the last step around the deliverable | ✅ "Bekijk je website" is the primary action (page and sticky bar); the appointment is a clearly marked optional block |
| 4 | Sticky wizard action bar on mobile | ✅ "← Terug" / primary action pinned to the bottom, preview toggle right above |
| 5 | Collapse the preview chrome on phones | ✅ preview bar reduced to one row with an "Aanpassen" toggle |
| 6 | Restore scroll position per page | ✅ stored in `history.state`; back/forward restores, new navigation starts at the top |
| 7 | Explain the shortcut into step 3 | ✅ context chips "Vak: … wijzig", "Stijl: … wijzig", "Pakket: Pro" |
| 8 | Empty/loading states | ✅ images reserve space and pulse until loaded; route chunks show a labelled spinner |
| 9 | Route-level code splitting | ✅ initial JS 498 kB → ~304 kB (147 → ~98 kB gzip) |
| 10 | Prerender for SEO | ✅ build-time prerender of 36 routes into real HTML + hydration; canonical, OG/Twitter, `og-image.png`, `sitemap.xml`, `robots.txt` |
| 11 | Funnel analytics | ✅ vendor-free `utils/analytics.ts` with step, preset, plan, WhatsApp, phone, appointment and component events |
| 12 | Accept international phone formats | ✅ `normalizeDutchPhone()` everywhere (wizard, contact, booking, fault report) with tests |
| 13 | Accessibility audit / contrast | ✅ WCAG maths in `utils/color.ts`, palette contrast contract for all 7 trades × 5 styles, form borders raised to 3:1 |

### Notes on the a11y work

- Contrast is now *guaranteed*, not eyeballed: `withAccessibleContrast()`
  nudges OKLCH lightness until body text, muted text, accent text and
  inverted text reach 4.5:1, and picks a readable foreground for filled
  surfaces (accent, highlight). `paletteContrast.test.ts` fails the build if
  any of the 35 combinations regresses.
- Filled surfaces keep their hue: only lightness moves, so a brand accent
  still looks like that brand.
- Decorative divider colours are deliberately *not* forced to 3:1 — that
  turned subtle hairline borders into heavy grey lines. Control boundaries
  (inputs, selectable chips) are what needed the 3:1 treatment and got it.

## Part 3 — ideas that are still open

Nothing from the earlier list is left; these are genuinely new and smaller:

1. **A real backend for leads.** Everything still ends in WhatsApp/`mailto:`
   deep links with no delivery guarantee, no storage and no confirmation.
2. **Persist the pre-rendered wizard step.** `/start/afspraak` in a freshly
   loaded tab shows an empty form because the draft is per session.
3. **Self-host the fonts.** Six Google font families are requested on first
   paint; self-hosting removes two third-party round trips and a privacy
   consideration for a Dutch B2B product.
4. **Real photography.** All imagery is hot-linked from Unsplash and repeats
   across presets (roadmap 5.3).
5. **A/B test the hero copy** ("Binnen een kwartier" vs. the two-week
   delivery promise) — now measurable thanks to the funnel events.
6. **A dashboard for craftsmen** (the FAQ references one that does not exist).
7. **End-to-end tests.** Routing, scroll restoration and hydration are
   verified with temporary jsdom scripts; a Playwright suite in CI would make
   that permanent (roadmap 5.1).

## How this was verified

- `npx tsc --noEmit`, `node --test` (**65 tests**) and `npm run build`
  (Vite + prerender of 36 routes + sitemap/robots) are green.
- Hydration script: prerendered HTML for `/`, `/voorbeeld/loodgieter/krachtig`
  and `/voorbeeld/hovenier/donker` hydrates with **zero** React mismatch
  errors and keeps its content.
- jsdom walkthrough: "Start met Pro" → `?pakket=pro`; step 5 primary action
  opens the site; an appointment can still be requested without Google
  sign-in (no popup) and lands on `/start/klaar`; switching the channel to
  E-mail produces a `mailto:` link; `wizard_step_view` and
  `appointment_requested` reach `window.dataLayer`; scroll offset 640 px is
  restored after back; the mobile preview bar offers "Aanpassen".
- Contrast is enforced by unit tests for every generated palette.

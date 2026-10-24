# Known limitations

Honest inventory of gaps in the current prototype. Phase references point
to [ROADMAP.md](../ROADMAP.md).

## Lead handling

- **No backend.** Every form (contact, fault report, m² quote) only opens
  WhatsApp with a prefilled message. Nothing is stored server-side and
  there is no delivery guarantee if the visitor abandons WhatsApp.
- **No e-mail channel.** The wizard offers "E-mail" and "Allebei" as
  channel choices, but the selection is ignored and there are no `mailto:`
  links anywhere (roadmap 1.1/1.2).
- **No persistence of submissions.** Bookings, fault reports and contact
  messages live in React state and disappear on refresh (roadmap 1.3/3.1).
- `PublishedSiteRecord` is defined in `types.ts` but unused; publishing is
  not actually recorded.

## Customisation

- Only the four wizard fields (business name, owner, phone, city) and the
  service on/off toggles persist, via the `klusbaas_custom_sites`
  localStorage key. Photos, palette, services prices and copy cannot be
  edited by a user yet.
- The FAQ references a "Klusbaas-dashboard" that does not exist
  (roadmap 1.4/3.3).
- Customised data is per browser: there are no accounts for craftsmen
  (Firebase Auth is only used for the Google Calendar/Drive sync).

## Integrations

- The Google Bedrijfsprofiel badge links to a Maps search; there is no
  API integration and reviews are static content from `SectorData`.
- Google Calendar/Drive sync depends on the Firebase configuration in
  `firebase-applet-config.json` and OAuth popups; without a login the
  booking flow still works but stores nothing externally.
- The Firebase web API key is committed to the repository. Web API keys
  are public by design and safe to expose when access is restricted via
  Firebase security rules, but those rules are not part of this repo.

## Content and design

- All imagery is hot-linked from Unsplash and repeats across presets;
  licensed trade photography is a roadmap item (5.3).
- Content is Dutch-only; there is no i18n framework (roadmap 5.5).
- The six trades are fixed; the research's roofer and contractor are not
  implemented yet (roadmap phase 2).

## Engineering

- `npm install` fails with an `ERESOLVE` conflict (Vite 8 vs. pinned
  esbuild); use Bun, which is the committed package manager.
- Only pure utilities have unit tests. There are no component or
  end-to-end tests and no in-repo CI workflow; deploy checks come from
  Netlify (roadmap 5.1/5.4).
- Routing is client-side only. Every view, preset, wizard step and
  component has a real URL (roadmap 4.2 ✔), but because it is a Vite SPA
  the HTML is still rendered in the browser: crawlers see one `index.html`
  unless prerendering/SSR is added (roadmap 4.3).
- There is no route-level code splitting beyond the component library, so
  the first load still ships the whole wizard and demo site bundle.
- The chosen pricing plan and the "Offertes ontvangen via" channel are not
  carried into the wizard/appointment (roadmap 1.1/4.4).
- Accessibility has been handled pragmatically (labels, aria attributes,
  focus styles) but never audited (roadmap 5.2).

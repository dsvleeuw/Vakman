# Known limitations

Honest inventory of gaps in the current prototype. Phase references point
to [ROADMAP.md](../ROADMAP.md).

## Lead handling

- **No own mail domain yet.** Mail goes through Resend with the shared
  sender `onboarding@resend.dev`. In that test mode Resend only delivers to
  the account address (`thomascliphero@gmail.com`): lead notifications
  arrive, but confirmations to customers are refused and only logged until
  a domain is verified and `QUOTE_FROM_EMAIL` changed. The request itself
  still succeeds and the customer sees the quote on screen. For testing,
  `MAIL_TEST_RECIPIENT` redirects customer mails to the account inbox,
  marked `[TEST → …]`.
- **No admin view.** Leads (`leads`) and quotes (`quotes`) are stored in
  Netlify Blobs but can only be read in the Netlify UI/CLI or via the
  quote link; there is no dashboard or export yet.
- **Rate limit is per function instance** (in memory, 20 per 10 minutes per
  IP). It stops a hammered form, not a distributed attack.
- **WhatsApp delivery is manual.** Choosing WhatsApp puts a one-tap wa.me
  link in our notification mail; someone at Klusbaas still has to press
  send. There is no WhatsApp Business API integration.
- **Demo-site leads come to Klusbaas**, not to the craftsman shown on the
  demo; real customer sites need a per-site recipient (roadmap 3.x).
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
- Routing is client-side, but the build prerenders the homepage and all 35
  presets to real HTML (roadmap 4.2/4.3 ✔). The wizard, the component
  library and the 404 are still client-rendered only — they are `noindex`
  by intent, but a cold load shows a spinner until the chunk arrives.
- Canonical URLs, Open Graph tags and the sitemap use
  `PRERENDER_SITE_URL` (default `https://klusbaas.nl`); set it to the real
  deployment origin or those tags point at the wrong host.
- Analytics events are emitted but only collected once a tag manager (GTM or
  GA4) is added to `index.html`; nothing is sent today.
- The wizard draft lives in sessionStorage, so a prerendered deep link such
  as `/start/afspraak` opened in a fresh tab starts with an empty form.
- Accessibility has been handled pragmatically (labels, aria attributes,
  focus styles) but never audited (roadmap 5.2).

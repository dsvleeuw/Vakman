# Known limitations

Honest inventory of gaps in the current prototype. Phase references point
to [ROADMAP.md](../ROADMAP.md).

## Lead handling

- **Lead API exists, but mail is in test mode.** All forms post to
  `POST /api/lead`; leads and quotes are stored (Netlify Blobs, `.data/` in
  dev) and mailed via Resend. Until a domain is verified in Resend, the
  sender `onboarding@resend.dev` only delivers to the account address
  (thomascliphero@gmail.com): the Klusbaas notification arrives, customer
  confirmations are refused and reported per recipient (`delivery.customer`
  = `failed`) without failing the request. Without `RESEND_API_KEY` nothing
  is sent at all (preview mode, mail in the server log).
- **WhatsApp delivery is manual.** Choosing WhatsApp in the wizard gives the
  team a ready wa.me link with the quote URL in the notification mail; there
  is no WhatsApp Business API that sends it automatically.
- **Rate limiting is per function instance** (20 requests per 10 minutes per
  IP, in memory). It stops a single script, not a distributed attack.
- **No admin screen.** Stored quotes and leads are only visible in the mails,
  in Netlify Blobs (dashboard/CLI) or in `.data/` locally.
- Site leads on demo sites go to Klusbaas, not to the tradesperson: a demo
  site has no owner, so Klusbaas receives the lead. The page says that too.
- ~~A published site sends its leads to Klusbaas~~ Fixed: a lead from a
  published site (`/site/<slug>`) now goes to the owner of that site, at the
  e-mail address he entered in the editor. The page says the same thing, so
  the text matches reality. Two things remain: the owner has to enter an
  e-mail address in the editor (without one the lead still comes to Klusbaas),
  and Klusbaas keeps a back-up copy when the mail to the owner does not
  arrive, so a request never disappears.

## Accounts

- **Accounts exist, but there is no password reset.** A customer makes an
  account at `/mijn-account` with an e-mail address and a password; the
  password is stored as a scrypt hash (`src/utils/password.ts`), never as
  text. If the customer forgets the password there is no reset mail: the
  account has to be removed by hand (Blobs or `.data/accounts`).
- **No e-mail verification.** An account works as soon as it is made. The
  e-mail address is not confirmed, so anyone can make an account with an
  address that is not theirs.
- **No rate limit across instances.** Login and registration are limited per
  function instance (10 logins per 15 minutes, 5 registrations per hour, in
  memory), so a distributed attack is not stopped.
- **No "forget my password" and no second factor.** Both are on the wish
  list, not in the code.
- **The session lasts 30 days** and is not shortened on suspicious activity.
  There is no overview of active sessions and no way to sign out everywhere.
- **Deleting an account is not implemented.** The data is in the Blobs store
  `accounts` (and the `sessions` in the same store) and has to be removed by
  hand; the sites keep working, but they lose their `ownerId`.
- The account replaces the management link as the normal way in, but the
  link keeps working: a site published before accounts existed can be linked
  to an account from `/mijn-account` by pasting the management link.

## A published customer site

- **A published site shows only what the craftsman wrote or confirmed.** The
  trade preset is demo material: its reviews, rating (`4,9 uit 5`), Google
  badge, project photos, prices, marks and FAQ are left out of the public
  page (principle 2, principle 6). A block the craftsman switches on only
  appears when he changed or confirmed it; the editor says which blocks are
  still on the example text.
- **He cannot add his own photos yet.** Until that exists (roadmap 6.9) the
  portfolio section and the hero photo stay empty on a published site: there
  is no photo of somebody else's work on a customer's page.
- **He cannot set his own prices or reviews yet** (roadmap 6.1b). Until
  then a published site shows "Prijs op aanvraag" and no review section.
- **The example text stays in the editor**, not on the page. That is the
  point: the editor is where the craftsman writes, the public page is where
  only his own words are.

## Requests and orders

- **The requests are stored, but nothing deletes them.** A request from a
  customer site is stored with the site it belongs to, so the craftsman can
  see it in his account even when the mail did not arrive. The privacy
  statement promises twelve months, but no job removes them after that; they
  have to be removed by hand from the Blobs store `leads`.
- **The craftsman cannot delete or export his requests.** Under the AVG a
  customer can ask for that; today Klusbaas has to do it by hand.

## The welcome mail after publishing

- **The mail only goes out once**, after the first publish. A change in the
  site does not send a new mail, so the checklist in the mail is a snapshot
  of that moment. The checklist in the editor is always current.
- **Without `RESEND_API_KEY` no mail is sent**, not even this one. The site
  is published all the same; the mail is a bonus, not a condition.

## Accounts, passwords and verification

- **The e-mail address is not enforced.** A customer can publish without
  confirming his address. That is deliberate: a customer whose mailbox is
  full would otherwise lose his site. The verification is a signal for
  Klusbaas (the overview shows it), not a lock.
- **The reset and the confirmation depend on Resend.** Without
  `RESEND_API_KEY` no mail is sent at all, so a customer cannot reset his
  password. Klusbaas sees it: the mails are printed in the log instead.
- **The reset link works for one hour and only once.** After that the
  customer has to ask for a new one.
- **There is no "account vergeten":** a customer cannot delete his account
  and the data in it. Under the AVG that has to be possible; today Klusbaas
  removes it by hand from the Blobs store.

## The Klusbaas overview

- **The overview is one password, not accounts.** `ADMIN_PASSWORD` opens
  `/klusbaas` for anyone who has it. A second person (a colleague, an
  assistant) cannot be added without handing over the same password.
- **The overview lists, it does not act.** It shows the requests, the offers
  and the sites, and Klusbaas can mark an offer as paid. There is no
  newsletter list, no search, no export and no way to delete a request.
- **The management link of every site is in the overview.** That is on
  purpose: Klusbaas needs it when a customer lost his account. It means the
  password is worth protecting like a key to every customer site.

## Payment

- **The customer pays by bank transfer, not with a payment provider.** That
  keeps the money between the customer and Klusbaas, but the customer has to
  transfer it himself and Klusbaas has to mark the offer as paid by hand.
  There is no iDEAL link, no automatic reminder and no "paid" webhook.
- **Without `PAYMENT_IBAN` there are no payment details.** The account then
  says that Klusbaas will send them. That is deliberate: a wrong IBAN is
  worse than no IBAN.
- **The status is set by hand.** There is no admin screen yet to mark an
  offer as paid (that is phase 6.4); today it is changed in the Blobs store.

## Privacy and newsletter

- **TODO: KvK-nummer en vestigingsadres ontbreken** in de privacyverklaring
  (`src/components/InfoPages.tsx`). Het contactadres is tijdelijk
  thomascliphero@gmail.com (`PRIVACY_CONTACT_EMAIL`); vervang het door een
  klusbaas.nl-adres zodra dat bestaat. Laat de tekst eenmalig juridisch
  checken.
- **Bewaartermijnen worden niet automatisch afgedwongen.** Onbevestigde
  nieuwsbriefaanmeldingen werken na 30 dagen niet meer, maar er is geen
  geplande taak die oude leads, offertes of aanmeldingen verwijdert; dat is
  handwerk in Netlify Blobs.
- **Nieuwsbrief versturen is nog handwerk.** Er is alleen aanmelden,
  bevestigen en afmelden. Versturen gebeurt via Resend Broadcasts op de
  Audience (`RESEND_AUDIENCE_ID`); zonder Audience staat de lijst alleen in
  Netlify Blobs. De bevestigingsmail gaat, net als de offertemails, pas naar
  willekeurige adressen als het domein in Resend geverifieerd is.
- **Rate limit nieuwsbrief** is 5 aanmeldingen per 10 minuten per IP, in
  geheugen per functie-instantie.

## Demo content and public claims

- **No made-up KvK number.** The footer used to say `KvK 12345678`. A KvK
  number is a public claim about a real company, so the footer only shows a
  KvK number the owner entered themselves (field in the editor).
- **No sample number on a customer's site.** The trade presets contain a
  made-up number (`06 12 34 56 78`) that may belong to a stranger. A demo
  site may show it as text (it is never linked to), but a customer's site
  shows nothing unless the owner entered their own number: the call and
  WhatsApp buttons then disappear instead of pointing at a number that is
  not theirs.
- The demo notice ("this is a demo site") only appears on Klusbaas' own
  demo sites, never on a customer's site.
- Reviews, ratings and portfolio photos in the presets are examples. They
  are not the customer's own work and cannot be replaced yet.

## Customisation

- The editor (`/mijn-site`) lets a craftsman fill in the business name,
  owner, phone, city and e-mail, switch services off, rewrite the page copy
  and the copy per block, and choose which blocks are on the page and in
  which order. Everything is stored per browser in localStorage
  (`klusbaas_mijn_sites`, per trade and style).
- Photos, palette, service prices, reviews and portfolio photos are still
  fixed: they come from the trade preset and cannot be edited.
- The editor publishes the site: it goes to `/site/<slug>` and is stored in
  Netlify Blobs (in `.data/sites` locally). A site published while logged in
  belongs to that account and can be changed from `/mijn-account` without a
  token; a site published without an account is managed through the private
  link `/mijn-site/<slug>?token=…` until it is linked to an account.
- A published site needs a name, an address and a phone number: without
  them the site would show a number that is not the customer's.
- Published sites live in the Blobs store `sites`. There is no overview of
  all published sites: the list is only in the store itself (and in the
  sitemap `/sitemap-sites.xml`).
- Customised data is per browser: a customer who clears his browser data
  loses the draft that was never published. A published site keeps working,
  because it lives on the server. With an account (`/mijn-account`) the
  customer finds his published sites back on any device.

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
- Only pure utilities have unit tests. There are Playwright e2e tests
  (`e2e/`) and a GitHub Actions CI workflow (`.github/workflows/check.yml`)
  that runs lint, typecheck, unit tests, build and the Playwright suite
  against the prerendered `dist` on two viewports.
- Routing is client-side, but the build prerenders the homepage and all 35
  presets to real HTML (roadmap 4.2/4.3 ✔). The wizard, the component
  library and the 404 are still client-rendered only — they are `noindex`
  by intent, but a cold load shows a spinner until the chunk arrives.
- Canonical URLs, Open Graph tags and the sitemap use
  `PRERENDER_SITE_URL` (default `https://klusbaas.nl`); set it to the real
  deployment origin or those tags point at the wrong host.
- Analytics events are emitted but only collected once a tag manager (GTM or
  GA4) is added to `index.html`; nothing is sent today.
- Quote numbers (`KB-2026-0001`) come from a counter in the `quotes` blob
  store with optimistic concurrency; the dev counter in `.data/quotes` is
  per process only.
- The wizard draft lives in sessionStorage, so a prerendered deep link such
  as `/start/afspraak` opened in a fresh tab starts with an empty form.
- Accessibility has been handled pragmatically (labels, aria attributes,
  focus styles) but never audited (roadmap 5.2).

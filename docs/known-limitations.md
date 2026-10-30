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
- ~~No admin screen~~ Fixed: `/klusbaas` shows the requests, the offers, the
  accounts and the sites behind one password (`ADMIN_PASSWORD`). What it
  still cannot do is answer a request in the screen, search, export or
  delete something.
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

- **The customer can reset his password.** A customer makes an account at
  `/mijn-account` with an e-mail address and a password; the password is
  stored as a scrypt hash (`src/utils/password.ts`), never as text. "Wachtwoord
  vergeten" sends a reset link that works once and lasts one hour. Without
  `RESEND_API_KEY` no mail goes out, so the reset has to be done by hand.
- **The e-mail address is not confirmed before the account works.** A
  customer can use the account right away and the confirmation mail is a
  signal for Klusbaas, not a lock. The overview shows whether the address
  is verified.
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
- **He adds his own photos, and only his own.** The editor has a tab
  "Foto's": one photo above the page and a list of his own projects. Without
  his own photos the page shows a transparent placeholder, never a photo of
  somebody else's work.
- **He sets his own prices; the reviews stay example material.** His
  services with his own price ("vanaf € 45 per uur") and his own work area
  drive the calculator and the postcode check. Reviews and ratings of the
  trade example do not end up on his page: they are not his work and he
  cannot make up his own reviews.
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

## The privacy statement of a customer site

- **The craftsman cannot edit the text.** Every site gets the same
  statement, filled in with his name, business, phone number, place and
  e-mail address. That keeps it true, but it also means he cannot add
  something about his own processing.
- **The statement mentions the newsletter only in Klusbaas' own statement.**
  A published site still has Klusbaas' newsletter in the footer; the
  newsletter link points to Klusbaas' privacy statement, which is correct,
  but the statement of the site itself does not mention it.
- **The twelve months are a promise, not a job.** Nothing removes a request
  after twelve months; Klusbaas does that by hand.

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

## Paying an offer

- **The payment details are in the offer itself.** The IBAN, the name of the
  account holder, the amount and the reference stand in the offer PDF and on
  the offer page, so a customer can transfer the money without making an
  account first.
- **Klusbaas marks the payment by hand.** There is no payment provider and
  no automatic check against the bank statement: the offer waits until
  Klusbaas marks it paid in `/klusbaas`. He can chase it: an accepted offer
  shows how many days it has been waiting, and one button sends the customer
  the amount and the IBAN again. The customer can also say he paid
  ("Ja, ik heb het bedrag overgemaakt"); Klusbaas then sees it in the
  overview. The customer cannot mark his own offer as paid. Nothing goes
  out on its own.
- **Without `PAYMENT_IBAN` there are no payment details.** The offer then
  says that Klusbaas will send them. That is deliberate: a wrong IBAN is
  worse than no IBAN.

## Accepting an offer

- **The customer accepts on the offer page.** One click and his name: the
  offer gets the status `accepted` and Klusbaas gets a mail with the
  details. Before this, the customer had to write a mail or a WhatsApp
  message to say yes. He can also accept from his own account in
  `/mijn-account`.
- **The customer keeps the proof of his "ja".** Right after he accepts, he
  gets a mail with the offer number, the amount, the services and the IBAN.
  The banner in the browser used to be the only proof, and that disappears
  when he closes the window. The confirmation only goes out when the offer
  has an e-mail address, and without `RESEND_API_KEY` it is printed in the
  log instead of being sent.
- **Accepting is not paying.** The customer still transfers the money, and
  Klusbaas marks the offer as paid when it arrives. There is no payment
  provider and no automatic check.
- **Accepting is not a contract.** There is no signature and no signed
  document: the mail of the customer is the agreement. For a bigger order it
  is wise to make a contract by hand.
- **A cancelled offer cannot be accepted.** A paid offer stays paid; asking
  to accept it again changes nothing.

## The invoice

- **The customer gets an invoice when the offer is marked as paid.** It is a
  PDF (`F-<year>-<number>`, following the offer number) sent by mail, and
  the customer can download it again from the offer page and from his
  account.
- **Klusbaas' own details come from the environment.** `INVOICE_NAME`,
  `INVOICE_ADDRESS`, `INVOICE_KVK`, `INVOICE_VAT` and `INVOICE_EMAIL` fill
  the sender block. What is not set is not printed: no KvK number and no
  VAT number are ever made up. Set them before you send an invoice to a
  business customer.
- **The payment itself is still manual.** Klusbaas marks the offer as paid
  when the money arrives. There is no payment provider and no automatic
  check, so a customer who transfers the money on Friday evening is not
  confirmed until Monday.
- **The reminder is by hand.** In `/klusbaas` there is a button "Stuur een
  herinnering" for every open offer: the customer gets a mail with the link
  to the offer, the amount and the IBAN again. Nothing goes out on its own,
  and there is no second reminder that says "this is your last chance".
- **An expired offer is not withdrawn by itself.** An offer is valid for
  thirty days. The customer sees that it is expired and cannot accept it;
  the overview shows "Verlopen" so Klusbaas knows the price is no longer a
  promise. Klusbaas can extend the offer with one button when the price
  still holds, or cancel it by hand when the customer is not coming.

## A request and its offer

- **The offer remembers the request it was written for.** The overview
  shows at the request which offer exists, and the "Offerte maken" form
  says "al een offerte", so Klusbaas does not write the same offer twice.
- **A request from a customer site is not in Klusbaas' overview.** That
  request belongs to the craftsman who published the site. Klusbaas
  therefore cannot see whether he already answered it; he has to look in
  his own mailbox.

## The offer Klusbaas writes himself

- **Klusbaas writes the offer, the customer does not ask for one.** In
  `/klusbaas` there is a form "Offerte maken": pick the customer (his site
  fills in the details), pick the package and the extra components. The
  offer becomes a real offer with a number, a PDF and a price, it is linked
  to the customer's account and mailed to him with the PDF attached.
- **Without `RESEND_API_KEY` no mail goes out.** The offer is still made and
  the overview says so ("de mail is niet verstuurd (preview)"); the mail
  itself is then only in the server log. The same is true for the
  `MAIL_TEST_RECIPIENT` redirect, which sends every customer mail to one
  test address.
- **A customer who only sent a request can get an offer too.** The form
  lists the published sites, the accounts and the requests that came in
  through a form of Klusbaas. A request on a published customer site does
  not appear: that one belongs to the craftsman.
- **An offer for someone without an account does not land in an account.**
  The customer gets it by mail and pays with the IBAN in the offer. He sees
  the offer and its status only when he makes an account and claims it.
- **Klusbaas marks the payment by hand.** The offer gets the status `open`
  and Klusbaas changes it to `paid` once the money is in. There is no
  payment provider, no automatic reminder and no separate invoice document:
  the offer with its PDF is the invoice.

## Payment

- **The customer pays by bank transfer, not with a payment provider.** That
  keeps the money between the customer and Klusbaas, but the customer has to
  transfer it himself and Klusbaas has to mark the offer as paid by hand.
  There is no iDEAL link, no automatic reminder and no "paid" webhook.
- **Without `PAYMENT_IBAN` there are no payment details.** The account then
  says that Klusbaas will send them. That is deliberate: a wrong IBAN is
  worse than no IBAN.
- **The status is set by hand.** `/klusbaas` has a button per offer to mark
  it as paid, cancelled or open again. There is no automatic check against
  the bank statement.

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
- Palette and reviews are still fixed: they come from the trade preset and
  cannot be edited. Photos and service prices are his own (see above).
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

## Photos of the customer

- Photos are uploaded from the browser to `POST /api/media` and stored in
  the Blobs store `media`; they are served from `GET /api/media?key=…`.
  The browser scales the photo down (1600 px, jpg, quality 0.82) before
  uploading, so a phone photo of 5 MB becomes a few hundred kilobytes.
- Only jpg, png and webp are accepted, up to 1,5 MB. There is no SVG (a
  file with a script in it) and no other format.
- A photo is kept under a random name. Nothing is deleted: there is no
  delete button and no limit per customer, so the store grows with every
  upload. The Blobs store `media` has to be watched.
- **The upload is open for everyone, so it has a limit.** `POST /api/media`
  accepts 30 uploads per hour per IP address. The limit lives in the memory
  of one function instance, so it stops a single script but not a
  distributed attack, and it is not a quota per customer: a customer with an
  account shares the limit with everyone else behind the same address.
- The published page only shows photos of the customer that are served
  from our own server. A photo address from somewhere else is dropped when
  the content is read (`sanitizePhoto`).
- Without photos the page shows a transparent placeholder, not a photo of
  somebody else's work.

## Promises and packages

- Every line on the pricing page (`src/data/plans.ts`) is either built or
  deliberately removed. What is *not* automatic is still work for Klusbaas
  by hand: an own `.nl` domain is registered per order (the registrar
  costs are the customer's), "three months of service worth € 75" is a
  promise Klusbaas keeps, and "delivery within two weeks" depends on how
  fast the customer answers.
- The price calculator on a published site shows the craftsman's own
  prices as a *starting* price ("vanaf € 45 per uur"). The exact price
  still depends on the situation, so the page says so and asks for a
  quote. Only services with a price appear in the calculator.
- The postcode check compares the first two digits of the visitor's
  postcode with the postcodes the craftsman typed. It is a rough area, not
  a route calculation; the craftsman decides whether he comes.
- A customer site without prices or without a work area has no price
  calculator and no postcode check. The editor's checklist says so.
- The Google Calendar/Drive sync in the booking flow still depends on a
  Firebase login of the visitor; without it the booking works but nothing
  is synced. A craftsman cannot see the visitor's Google account.

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

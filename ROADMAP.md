# Roadmap

Prioritised future work for Klusbaas. Priorities follow the competitor
research (stored informally in
[docs/pricing-and-positioning.md](./docs/pricing-and-positioning.md)): win
on proactive, trade-specific demo sites and premium design, while keeping
the industry baseline features standard everywhere.

Effort estimates: **S** = less than a day, **M** = 1–3 days,
**L** = more than three days.

## Phase 1 — Honour what we already promise

Small, high-trust fixes closing gaps between the UI and real behaviour.

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 1.1 | ~~Wire the wizard's `channel` choice (WhatsApp / E-mail / Allebei)~~ Done: it decides quote delivery via `/api/lead` | S | The state exists in `WizardView` but is not persisted or read by `SiteView`. Today every site is WhatsApp-first regardless of the choice. |
| 1.2 | ~~Implement the e-mail channel~~ Done: the offers, the acceptations, the invoices and the service mails go per mail to the customer; the site has `mailto:` and WhatsApp buttons everywhere | S | The mail only really goes out with a verified Resend domain; without a key it stays in preview mode. |
| 1.3 | ~~Persist appointments and quote requests~~ Done: every request (contact, appointment, fault report, m² estimate, offer request) is stored on the server with the site it belongs to, and the customer sees it in his own account | S | The stored requests are removed by hand after twelve months; no job does it yet. |
| 1.4 | ~~Build (or remove the promise of) the Klusbaas dashboard mentioned in the FAQ~~ Partly done: the FAQ now points to the site editor (`/mijn-site`), where the customer edits his details, copy, services and blocks | L | Prices, photos and portfolio images are still fixed presets and cannot be changed by the customer. |
| 1.5 | ~~Make the Google Bedrijfsprofiel badge honest~~ Done: the badge is not on a published site, so a craftsman cannot claim reviews he did not collect. It stays in the component library | S | A real integration with the Google Bedrijfsprofiel is still possible, but that is a dependency and a decision for Klusbaas (row 4.4). |

## Phase 2 — More trades and more smart tools

The research lists tools for trades that do not exist in the app yet, and
two current sectors have no dedicated tool.

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 2.1 | Add **dakdekker** sector with a gratis-dakcheck request form | M | Reuse the `FaultReportForm` pattern; add the sector id, content and photos per [docs/adding-a-sector.md](./docs/adding-a-sector.md). |
| 2.2 | Add **aannemer** sector with an expanded project timeline | M | Extend `ProjectTimeline` to accept configurable steps instead of the current carpenter-specific constants. |
| 2.3 | Tool for **hovenier** (e.g. seasonal maintenance planner or garden size quote) | M | |
| 2.4 | Tool for **stukadoor** (e.g. wall-surface calculator reusing `utils/surface.ts`) | S | The surface math is already generic and tested. |
| 2.5 | Kleurenkiezer for the **schilder** next to the m² calculator | M | RAL colour swatch picker that adds colour-advice pricing. |
| 2.6 | Make `ProjectTimeline` data-driven from `SectorData` | S | Move step copy out of the component so any trade can own a timeline. |

## Phase 3 — Real backend and lead management

Required before paid customers can rely on the product.

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 3.1 | ~~Lead API: store contact-form, fault-report and quote submissions server-side~~ Done: the requests are stored on the server, they go to the owner of the site instead of to Klusbaas, and Klusbaas sees them in his overview without opening Blobs | S | The mail only really arrives with a verified Resend domain. The overview still lists the requests without a search or an export (phase 8). |
| 3.2 | ~~Transactional e-mail~~ Done: the offer, the acceptance, the reminder, the payment report, the invoice and the five service mails have their own template. The WhatsApp part stays a button with a prefilled message | S | Sending WhatsApp messages from the server needs a provider account and a decision from Klusbaas. |
| 3.3 | Craftsman dashboard: ~~edit services, prices, photos, opening hours~~ The editor covers details, copy, services, opening hours and blocks; prices and photos are still fixed | L | Accounts are in place (3.4): a published site is managed from `/mijn-account`; the private link with a token stays as a fallback. What is still missing is an overview of all quotes and leads per customer. |
| 3.4 | ~~Authentication and multi-site ownership~~ Done: e-mail + password (scrypt), session in an httpOnly cookie, `ownerId` on the published site and a list of his sites at `/mijn-account` | L | Missing: password reset (no mail yet), e-mail verification and a way to delete an account. The password is hashed with `node:crypto`, so no new dependency was needed; Firebase Auth was not used. |
| 3.5 | ~~Conversion analytics per preset~~ Partly done: the events (step views, plan picks, preset opens, WhatsApp and phone clicks, requests) go into `dataLayer`/`gtag` through a vendor-free helper | S | The events go nowhere until a GTM or GA4 id is set; that is a decision for Klusbaas (phase 8). |

## Phase 4 — Discoverability and sales

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 4.1 | ~~`LocalBusiness` JSON-LD structured data on every demo site~~ Done: every demo and every published site carries the structured data of the trade and the place | S | The data comes from the sector; the address is the one the customer fills in. |
| 4.2 | ~~Real routes per sector/style~~ Done: `/voorbeeld/:vak/:stijl`, with the old query links redirected | S | The demo routes are `noindex`; the ones that matter for search are the sector pages. |
| 4.3 | ~~Sitemap, robots.txt and per-sector landing copy~~ Done: the build writes `sitemap.xml` and `robots.txt`, and every sector/style has its own prerendered page with its own title and description | S | The sitemap holds the demo routes; a customer's own site is added when he publishes. |
| 4.4 | Google Bedrijfsprofiel API integration (reviews, posting) | L | |
| 4.5 | ~~Order/checkout flow~~ Done: an offer is an order with a number, a PDF, a price, a validity date, a status and a way to pay; the customer accepts it in his own account, pays by transfer and receives the invoice (phases 6.3 to 7.12) | S | The payment is a transfer, not iDEAL: a provider is a decision for Klusbaas. |

## Phase 5 — Quality and polish

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 5.1 | ~~Component tests and end-to-end tests~~ Done: 380 unit tests via `bun run test`, Playwright specs in `e2e/` and a GitHub Actions workflow that runs lint, tests and build on every push and pull request | S | The Playwright specs need a browser that is installed separately; they do not run in `bun run test`. |
| 5.2 | ~~Accessibility audit~~ Partly done: the contrast of every palette is tested against WCAG AA, the focus ring was made strong enough to win from `focus:outline-none`, the forms got labels, `aria-describedby` and `aria-invalid`, and the FAQ became a native accordion | M | A real audit with a screen reader and a keyboard walk-through is still missing (phase 8). |
| 5.3 | Replace Unsplash placeholders with licensed trade photography | M | Stock photos repeat across presets and weaken the "premium design" claim. |
| 5.4 | ~~CI workflow (lint, test, build) in the repository~~ Done: `.github/workflows/check.yml` runs on push/PR | S | Checks previously came from the external Netlify integration only. |
| 5.5 | Internationalisation setup if Belgium/Flanders is a target market | L | All copy is hard-coded Dutch; the competitor scan included a Belgian provider. |

## Phase 6 — Sell it: from a site to a customer

The product can build a site. It cannot yet sell one: a craftsman cannot
see his requests, cannot pay, and a published site still shows example
copy, example reviews and example photos. Everything in this phase is work
that can be done end-to-end inside this repository — no external accounts,
no provider dashboards, no design decision a human has to make first.

**Definition of done — a craftsman can be sold a website when:**

1. He can sign up, verify his e-mail address and reset his password
   without help from Klusbaas.
2. He can build, publish and edit his site, and find it back on any device.
3. His site shows only what he wrote or supplied: no example reviews, no
   stock photos of other people's work, no "VCA" claim he never made
   (principle 2, principle 6).
4. A visitor's request reaches him by mail **and** is visible in his own
   account, so a lost mail never loses the request (principle 4).
5. There is an order with a price, a status and a way to pay; Klusbaas can
   see it and mark it paid.
6. Klusbaas has one overview of every customer, site, order and request.
7. Every promise on the pricing page is either built or removed
   (principle 2, principle 8).
8. The site's own privacy statement names the craftsman as the party
   responsible for the data on his own site.

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 6.1 | ~~A published site shows only the craftsman's own words, photos and claims~~ Done: the published page leaves out the example reviews, rating, Google badge, photos, prices, marks and FAQ; a block only goes on the page when the craftsman wrote or confirmed it; the editor shows a checklist | L | Still missing: his own photos (6.9) and his own reviews. His own prices are there (6.8). |
| 6.2 | ~~The craftsman sees his requests in `/mijn-account`~~ Done: every request is stored with its site and listed in the account with name, phone, e-mail, message, date and reference | M | Klusbaas stores it on behalf of the craftsman; the privacy statement says so. Still missing: the craftsman cannot delete or export his requests (AVG), and there is no automatic deletion after twelve months. |
| 6.3 | ~~The customer sees his offer, the price and the status in `/mijn-account`~~ Done: the offer, the price, the status and the payment details are in the account; the customer pays by bank transfer to Klusbaas | M | Klusbaas marks the offer as paid by hand; there is no payment provider and no automatic reminder. The customer can link the offer from his mail to his account. |
| 6.4 | ~~An overview for Klusbaas~~ Done: `/klusbaas` behind `ADMIN_PASSWORD` shows the requests, the offers (with the status) and the published sites; Klusbaas marks an offer as paid | M | The overview lists, but does not yet act: no newsletter list, no search, no export. The overview is a password, not an account: no second person can be added. |
| 6.5 | ~~Password reset and e-mail verification~~ Done: the customer resets his password himself by mail (the link works for an hour) and confirms his e-mail address; Klusbaas can confirm it by hand from the overview | M | Verification is not enforced: publishing still works without it, so a customer with a dead mailbox does not lose his site. The reset mail depends on Resend; without an API key no mail is sent at all. |
| 6.6 | ~~A welcome mail after publishing~~ Done: after the first publish the craftsman gets a mail with his address, what happens with a request and the points of his checklist | S | The mail goes to the account address (or the address on the site). Without `RESEND_API_KEY` no mail is sent at all. The checklist in the mail is a snapshot; later changes do not come by mail. |
| 6.7 | ~~A privacy statement per customer site~~ Done: every published site has its own statement at `/site/<slug>/privacy`, built from what the craftsman filled in; the link under the form points there | M | The craftsman cannot edit the text; it is the same for every site. The statement does not mention the newsletter of Klusbaas in the footer, and the retention of twelve months is a promise the code does not enforce by itself. |
| 6.8 | ~~The offer becomes true~~ Done: the price calculator and the postcode check now run on the craftsman's own prices and his own work area (both stay off the page until he fills them in), the calculator sends a real request, and every promise on the pricing page is either built or removed | M | The domain is registered by hand per order, the Google Calendar/Drive sync still needs a Firebase login, and a price is a starting price: the calculator says "vanaf", not a fixed quote. |
| 6.9 | ~~The craftsman uploads his own photos~~ Done: a tab "Photos" in the editor with a hero photo and his own projects (title, kind of work, year and a photo each); the photo is scaled down in the browser, stored in the Blobs store `media` and served by `/api/media`; the published page shows his own work and leaves the placeholder when he has no photos | L | Uploaded photos are never cleaned up: there is no delete and no limit per customer. A photo is a jpg, png or webp of at most 1,5 MB. |

## Phase 7 — Sell without the wizard

Phase 6 made the product honest. Phase 7 closes the gaps that stood between
"the customer has a site" and "Klusbaas can invoice him". All of it is work
inside this repository: no provider, no dashboard, no human decision needed
first.

**Definition of done — Klusbaas can sell to a customer who did not come
through the wizard when:**

1. He can write an offer for a customer who has an account and a published
   site, without the customer asking for one.
2. That offer is a real order: a number, a PDF, a price, a status and a way
   to pay, and it stands in the customer's own account.
3. The customer receives it by mail, with the PDF attached and the link to
   the online offer.
4. The photo upload cannot be abused by a third party.
5. The customer can pay the offer: the IBAN and the amount stand in the offer
   itself, so an account is not needed to pay.
6. A request can become an offer: someone who only sent a request can be
   given an offer, with his details taken from the request.
7. The customer can accept the offer himself, without writing a mail: one
   click on the offer page, and Klusbaas hears about it the same day.
8. The customer gets a document for his administration: marking an offer as
   paid sends him an invoice, and he can download it again later.
9. An offer nobody accepted does not disappear: Klusbaas can send a
   reminder, and he sees which offers have expired.
10. An expired offer does not look like a promise: the customer sees it,
   cannot accept it, and Klusbaas can extend it when the price still holds.
11. A request and the offer written for it are one thing: Klusbaas sees at
   the request which offer exists, so he never writes the same one twice.
12. The customer keeps the proof of his own "ja": right after he accepts he
   gets a mail with what he agreed to, what it costs and where he has to
   transfer the money to.
13. An accepted offer that is not paid does not go quiet: Klusbaas sees how
   long it has been waiting and can send the customer the amount and the
   IBAN one more time.
14. The customer can say he paid: Klusbaas then sees that there is money to
   check, without the customer being able to mark his own order as paid.
15. The customer can ask for an offer himself: in his own site editor he
   picks a package, sees the price right away and gets a real offer in his
   account, while Klusbaas sees the request and the offer next to each
   other.
16. Every promise on the marketing pages is true: an own `.nl` domain is
   registered per order and not at the click of a button, the offers of a
   craftsman live in his own account, and the photos and the prices on a
   customer site are his own.
17. The monthly service is a real order: the customer switches it on in
   his own account, Klusbaas confirms it, sends a monthly invoice and can
   see who has it; the customer stops it himself when he wants to.
18. The customer can see what Klusbaas does for his site: every offer
    carries the checklist of the package, Klusbaas ticks the steps off and
    the customer sees the same list in his account and in the offer.
19. The questions on the marketing pages stand in the page itself: the
    answers are in the HTML that the build writes, so a search engine and a
    visitor without JavaScript read the same text.
20. The price list says what a package is: the customer fills in his own
    site in his own editor, and a package is the delivery — Klusbaas checks
    the work, registers the domain and hands the site over.
21. Klusbaas sees whether the site is ready to sell: the overview says
    whether a customer can pay, whether the invoice is complete and whether
    the mail really goes out, instead of leaving him to guess.
22. The customer can download everything we hold about him: his account,
    his sites, his requests, his offers and his service, in one file.

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 7.1 | ~~The photo upload is not abuse-proof~~ Done: `POST /api/media` has a rate limit of 30 uploads per hour per IP, and the limit is in front of the upload, not behind it | S | The limit lives per function instance, so it stops one script but not a distributed attack. There is still no delete and no quota per customer: a customer can use up his 30 photos and cannot remove them. |
| 7.2 | ~~Klusbaas can write an offer himself~~ Done: in `/klusbaas` there is a form "Offerte maken": pick the customer (his site fills in the details), pick the package and the extra components, and Klusbaas writes the offer. It becomes a quote record with a PDF, it is linked to the customer's account and mailed to him with the PDF attached | M | The customer sees the offer in `/mijn-account` and can pay it by bank transfer. Without `RESEND_API_KEY` no mail goes out (the offer is still made and the overview says so). Klusbaas still marks the payment by hand; there is no payment provider and no automatic reminder. |
| 7.3 | ~~The customer can pay the offer~~ Done: the IBAN and the amount stand in the offer PDF and on the offer page (`/offerte/<id>`), so a customer without an account can also transfer the money right away | S | Klusbaas still has to mark the offer as paid by hand: there is no payment provider and no bank check. Without `PAYMENT_IBAN` there are no payment details, and the offer says so instead of showing a broken bank account. |
| 7.4 | ~~A request can become an offer~~ Done: a customer who only sent a request (`L-XXXXXX`) and never made an account stands in the list of "Offerte maken"; Klusbaas picks him and the offer takes his details from the request | S | The offer of someone without an account does not appear in `/mijn-account`, because he has no account. He gets it by mail and can pay with the IBAN in the offer (7.3). |
| 7.5 | ~~The customer can accept the offer himself~~ Done: on the offer page there is a button "Ja, ik ga akkoord". The customer types his name, the offer gets the status `accepted` and Klusbaas gets a mail with the details | S | Accepting is not paying: the customer still has to transfer the money, and Klusbaas marks the offer as paid when it arrives. There is no signature and no contract; the mail of the customer is the agreement. |
| 7.6 | ~~The customer gets an invoice when he pays~~ Done: when Klusbaas marks an offer as paid, the customer gets an invoice as a PDF (`F-<jaar>-<nr>`, following the offer number) by mail and can download it again from the offer page and from his account | S | The details of Klusbaas on the invoice come from the environment (`INVOICE_NAME`, `INVOICE_ADDRESS`, `INVOICE_KVK`, `INVOICE_VAT`, `INVOICE_EMAIL`); what is not set is not printed. Klusbaas still marks the payment by hand and there is no reminder for an offer that stays open. |
| 7.7 | ~~Klusbaas can follow up on an open offer~~ Done: an open offer has a button "Stuur een herinnering" in `/klusbaas`; the customer gets a mail with the link to the offer, the amount and the IBAN again | S | The reminder is by hand: nothing goes out on its own. |
| 7.8 | ~~An expired offer does not look like a promise~~ Done: an offer is valid for thirty days; the offer page says so and hides the accept button when it is expired, the overview marks it as expired, and Klusbaas can extend it with one button when the price has not changed | S | An expired offer is not withdrawn by itself: Klusbaas cancels it by hand when the customer is not coming. The customer cannot accept an expired offer, so a price that is three months old is never agreed to. |
| 7.9 | ~~A request and its offer are one thing~~ Done: an offer remembers the request it was written for; the overview shows at the request which offer exists, and the "Offerte maken" form says "al een offerte" so Klusbaas does not write the same offer twice | S | A request from a customer site belongs to that craftsman and is not in Klusbaas' overview, so Klusbaas cannot see whether he already answered it. |
| 7.10 | ~~The customer keeps the proof of his own "ja"~~ Done: right after the customer accepts, he gets a mail with the offer number, the amount, the services and the IBAN. The banner in the browser used to be the only proof, and that disappears when he closes the window. He can accept from the offer page and from his own account | S | The mail only goes out when the offer has an e-mail address; without one there is nothing to send to. Without `RESEND_API_KEY` the mail is only printed in the log. The confirmation is not a contract: there is still no signature. |
| 7.11 | ~~An accepted offer that is not paid does not go quiet~~ Done: in `/klusbaas` an accepted offer shows how many days it has been waiting for the money, and Klusbaas can send the customer one more mail with the amount and the IBAN. The offer page and the account keep showing the bank details after the acceptance, so the customer can always pay | S | The reminder is by hand: nothing goes out on its own, and there is no escalation after a second reminder. Klusbaas still marks the payment as paid by hand. |
| 7.12 | ~~The customer can say he paid~~ Done: on the offer page and in his account the customer can press "Ja, ik heb het bedrag overgemaakt". Klusbaas gets a mail and the overview says "De klant meldt dat hij heeft betaald" | S | The customer does not mark his own offer as paid: Klusbaas checks his bank statement and marks it as paid himself. There is still no automatic bank connection. |
| 7.13 | ~~The customer can ask for an offer himself~~ Done: the site editor has a tab "Offerte". The customer picks his package and his extra components, sees what it costs right away and presses "Vraag je offerte aan". He gets a real offer (number, PDF, price, 30 days valid) in his account and by mail; Klusbaas sees the request with the customer's own words in `/klusbaas`, with the offer next to it | M | Only a logged-in customer can ask (an offer without an account would float). The price comes from the catalogue: the customer cannot ask for a price that is not on the pricing page, and Klusbaas writes a different price by cancelling the first offer and writing a new one. The limit is five offers per hour per customer, per process. |
| 7.14 | ~~Every promise on the marketing pages is true~~ Done: the FAQ no longer promises an own `.nl` domain at the moment of publishing nor offers that end up in Google Drive; it says where the offers really are (in the customer's own account) and how a domain works (registered per order). "Hoe het werkt" and the homepage no longer promise example photos or example prices as if they were the customer's, and the monthly service no longer contains a domain that was never registered | S | The domain itself stays manual work: Klusbaas registers it per order and the registrar costs are the customer's. Handing over a site when a customer leaves is manual too; there is no export button. A test (`components/claims.test.tsx`) keeps the old promises out. |
| 7.15 | ~~The monthly service is a real order~~ Done: the customer switches the service on in his own account (`/mijn-account`, under "Service & hosting") and sees what it costs, what is in it and that he can stop it. Klusbaas sees the request in `/klusbaas`, switches the service on (the months that come with the Pro package are free) and sends the monthly invoice with the amount, the IBAN and the reference. The customer can stop the service himself; Klusbaas then hands over the site and the code | M | The monthly invoice is sent by hand every month: nothing goes out on its own and there is no automatic debit. The service is per account, so a customer with two sites has one service. The free months of a package do not stop by themselves; Klusbaas switches the service off after them. |
| 7.16 | ~~The customer sees what Klusbaas does for his site~~ Done: every offer carries the checklist of the package (what Klusbaas does for the site, in the order he does it). Klusbaas ticks the steps off in `/klusbaas` and the customer sees the same list in his account and on the offer page, with the date it is done and the moment the site has to be live | M | The delivery itself stays manual work: the checklist says what happens, the code does not build the site for the customer. The deadline of two weeks counts from the payment, because that is when the work starts. An offer from before this phase has no checklist and shows nothing. |
| 7.17 | ~~The questions and answers stand in the page~~ Done: the FAQ is a native accordion (`<details>`), so every answer is in the HTML that the build writes. A visitor without JavaScript and a search engine read the same text as a visitor with scripts | S | The answers of the questions about Klusbaas are marketing text; the customer keeps his own questions on his own site. The accordion shows one answer at a time, like before. |
| 7.18 | ~~The price list says what a package is~~ Done: the pricing page and the FAQ say that the customer fills in his own site in his own editor, and that a package is the delivery: Klusbaas checks the texts, photos and colours, checks the findability, delivers within two weeks and registers the `.nl` domain in Pro and Premium | M | The prices themselves are unchanged. The domain is only in Pro and Premium, and the registrar costs stay with the customer. A customer who wants to do everything himself can, and that is said out loud |
| 7.19 | ~~Klusbaas sees whether the site is ready to sell~~ Done: the overview in `/klusbaas` checks the four things that decide whether an order works without manual work: the IBAN in the offers, the details on the invoice, the mail that really goes out and the password on the overview. Something missing stands at the top of the overview, with the reason | S | The check looks at the environment of the deployment, not at the running site: a value that is set wrong (a wrong IBAN, a wrong sender) is not caught. The check says nothing about the content of a site |
| 7.21 | ~~The customer can download his own data~~ Done: `/mijn-account` has a button "Download je gegevens". The file holds his account, his sites with their text and photos, his requests, his offers and his service. His password and the management key of a site are not in it: those are keys, not data | S | The file is plain JSON, meant to be read by a person. The removal of the data itself stays manual (row 8.2), and the requests of other customers stay with Klusbaas. |


## Phase 8 — What is left

Everything below is real, but none of it stands between Klusbaas and his
first order: the customer can already find a site, ask for an offer, accept
it, pay, see what Klusbaas does for him and keep the site up. This phase is
what makes the product sturdier as the number of customers grows.

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 8.1 | ~~The customer can download his own data (AVG art. 15)~~ Done (phase 7.21): the customer downloads it himself in his account, as one file | S | The file is plain JSON, meant to be read by a person. |
| 8.2 | The customer can delete his own account (AVG art. 17) | M | Bigger than 8.1: the sites, the offers, the requests and the sessions all have to go, and the published page has to disappear. Irreversible, so it needs a confirmation. |
| 8.3 | A job that removes the requests after twelve months | M | The privacy statement promises twelve months. A scheduled function on Netlify does it without a new dependency. |
| 8.4 | Search and export in `/klusbaas` | M | The overview lists everything; as the number of requests and offers grows, finding one by hand stops working. |
| 8.5 | A status per request, so Klusbaas sees what he called | M | "New", "called", "offer sent": a request that nobody followed up on is a lost order. |
| 8.6 | The trade **dakdekker** with a free roof check (row 2.1) | M | The `FaultReportForm` pattern works for a roof inspection; more trades means more demos and more local search pages. |
| 8.7 | The trade **aannemer** with an expanded project timeline (row 2.2) | M | The timeline exists for the carpenter; the builder needs his own steps. |
| 8.8 | The **stukadoor** gets the surface calculator (row 2.4) | S | The component exists; it only has to be attached to the sector. |
| 8.9 | A **colour picker** for the painter next to the m² calculator (row 2.5) | M | A RAL swatch picker that adds the colour advice to the price. |
| 8.10 | A tool for the **hovenier** (row 2.3) | M | A seasonal maintenance planner or a garden-size estimate. |
| 8.11 | The project timeline gets its steps from the sector (row 2.6) | S | Move the step copy out of the component so every trade can own a timeline. |
| 8.12 | Real trade photography instead of stock photos (row 5.3) | L | The stock photos weaken the "premium design" claim. The app says honestly that the photos are examples until then. |
| 8.13 | Analytics that land somewhere (row 3.5) | S | The events are ready; a GTM or GA4 id is a decision for Klusbaas. |
| 8.14 | A real accessibility audit (row 5.2) | M | With a screen reader and a keyboard walk-through, not only with tests. |
| 8.15 | Self-hosted fonts | S | The Archivo files come from a CDN; hosting them ourselves removes a third party from the page. |
| 8.16 | A signed nonce on the forms | M | The rate limiter is per process, so it does not stop a bot that spreads over several instances. |
| 8.17 | The Google Bedrijfsprofiel integration (row 4.4) | L | A dependency and an API key: a decision for Klusbaas. |

## Decision log

- **Contact option D (WhatsApp primary + form fallback)** was chosen because
  it is the explicit recommendation in the research and matches how Dutch
  tradespeople communicate. Revisit when the lead API (3.1) lands.
- **No backend in 0.1.0**: forms intentionally submit through WhatsApp deep
  links to keep the prototype dependency-free. This is a deliberate
  trade-off, not the final architecture.
- **Phase 6 is the selling phase.** The order follows the site, it does not
  gate it: publishing stays free so the site itself remains the proof that
  the product works (stress test 8). Payment is what closes the deal, not
  what unlocks the page.
- **Price points € 595 / € 995 / € 1.795 + € 25/month** sit mid-market per
  the scan. All source figures were self-reported by the providers and have
  not been independently verified — re-validate before any external use.

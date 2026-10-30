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
| 1.2 | Implement the e-mail channel (`mailto:` at minimum, transactional mail later) | M | There are currently no `mailto:` links anywhere; the FAQ already implies e-mail support. |
| 1.3 | Persist appointments and quote requests | M | Booking state is in-memory only and `PublishedSiteRecord` is defined but unused. Start with `localStorage`, move to a backend in phase 3. |
| 1.4 | ~~Build (or remove the promise of) the Klusbaas dashboard mentioned in the FAQ~~ Partly done: the FAQ now points to the site editor (`/mijn-site`), where the customer edits his details, copy, services and blocks | L | Prices, photos and portfolio images are still fixed presets and cannot be changed by the customer. |
| 1.5 | Make the Google Bedrijfsprofiel badge a real integration or label it honestly | S | It currently links to a Maps search; no API connection exists. |

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
| 3.1 | Lead API: store contact-form, fault-report and quote submissions server-side | L | The API, storage, PDF and mails are in place. A lead from a published customer site now goes to the owner of that site instead of to Klusbaas. Still missing: a way to see the stored leads without opening Netlify Blobs, and a mail that really arrives (the Resend domain is not verified yet). |
| 3.2 | Transactional e-mail and WhatsApp Business templates | L | Depends on 1.2 and a provider decision. |
| 3.3 | Craftsman dashboard: ~~edit services, prices, photos, opening hours~~ The editor covers details, copy, services, opening hours and blocks; prices and photos are still fixed | L | Accounts are in place (3.4): a published site is managed from `/mijn-account`; the private link with a token stays as a fallback. What is still missing is an overview of all quotes and leads per customer. |
| 3.4 | ~~Authentication and multi-site ownership~~ Done: e-mail + password (scrypt), session in an httpOnly cookie, `ownerId` on the published site and a list of his sites at `/mijn-account` | L | Missing: password reset (no mail yet), e-mail verification and a way to delete an account. The password is hashed with `node:crypto`, so no new dependency was needed; Firebase Auth was not used. |
| 3.5 | Conversion analytics per preset (opens, calculator completions, leads) | M | Needed to prove the proactive-demo sales approach works. |

## Phase 4 — Discoverability and sales

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 4.1 | `LocalBusiness` JSON-LD structured data on every demo site | S | Direct local-SEO ("loodgieter Haarlem") benefit; data is already in `SectorData`. |
| 4.2 | Real routes per sector/style instead of URL params only | M | Today state is driven by `?sector=&style=&view=`; dedicated routes improve crawlability and sharing. |
| 4.3 | Sitemap, robots.txt and per-sector landing copy | S | |
| 4.4 | Google Bedrijfsprofiel API integration (reviews, posting) | L | |
| 4.5 | Order/checkout flow for the € 595 / € 995 / € 1.795 packages | L | Pricing is currently presentation-only. |

## Phase 5 — Quality and polish

| # | Item | Effort | Notes |
|---|------|--------|-------|
| 5.1 | Component tests and end-to-end tests (Playwright) | M | Only pure utils are tested today; the SSR smoke approach is documented in [AGENTS.md](./AGENTS.md). Playwright e2e tests exist in `e2e/` and run in GitHub Actions CI. |
| 5.2 | Accessibility audit (focus states, contrast, screen-reader labels) | M | Forms have basic labels and ARIA attributes but have not been audited. |
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

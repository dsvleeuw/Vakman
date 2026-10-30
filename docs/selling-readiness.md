# Selling readiness — what a craftsman cannot do yet

A measured audit of the gap between "the product makes a site" and "a
craftsman can be sold a website". Every claim below was read from the code
on `main`; the commands to re-measure them are at the bottom.

## The journey today (measured on `main`, 2026-10-29)

1. A craftsman picks a trade and a style, fills in his details and sees his
   site in the editor (`/mijn-site`).
2. He publishes it. The site goes live at `/site/<slug>`; with an account he
   finds it back at `/mijn-account`.
3. A visitor fills in the contact form. Since PR #32 the request is mailed
   to the craftsman and the page says exactly that.
4. The request is stored as well as mailed, so the craftsman finds it in
   `/mijn-account` and not only in his mailbox (phase 6.2).
5. The craftsman asks for an offer. The offer becomes an order: it has a
   status and it stands in his account, with the price and the way to pay
   (phase 6.3).
6. Klusbaas marks the order as paid once the money is in, and sees
   everything — requests, orders and published sites — in one overview
   (`/klusbaas`, phase 6.4).
7. A customer who never went through the wizard gets an offer too: Klusbaas
   writes one himself for a customer with an account and a site. It becomes a
   real order with a PDF, it stands in that customer's account and it is
   mailed to him (phase 7.2).
8. The customer can pay that order: the IBAN and the amount stand in the
   offer PDF and on the offer page, so an account is not needed to transfer
   the money (phase 7.3).
9. A request can become an order too: Klusbaas picks the request in the
   "Offerte maken" form and the offer takes the customer's details from it
   (phase 7.4).
10. The customer says yes himself: one click on the offer page, and Klusbaas
    knows it the same day (phase 7.5).
11. The customer gets an invoice when he pays, by mail and as a download
    (phase 7.6).
12. An offer nobody accepted does not disappear: Klusbaas can send a
    reminder and sees which offers have expired (phase 7.7).
13. An expired offer is not a promise: the customer sees it, cannot accept
    it, and Klusbaas can extend it when the price still holds (phase 7.8).
14. A request and its offer are one thing: Klusbaas sees at the request
    which offer exists (phase 7.9).
15. The customer keeps the proof of his own "ja": right after he accepts he
    gets a mail with the amount and the IBAN (phase 7.10).
16. An accepted offer that is not paid does not go quiet: Klusbaas sees how
    long it has been waiting and can chase the money (phase 7.11).
17. The customer can say he paid, so Klusbaas does not have to guess whether
    money is coming (phase 7.12).
18. The customer does not have to ask Klusbaas for a price either: in his
    own site editor there is a tab "Offerte". He picks a package, sees what
    it costs right away and gets a real offer in his account, while Klusbaas
    sees the request with the customer's own words (phase 7.13).
19. Everything the marketing pages promise is true: an own `.nl` domain is
    registered per order (not at the click of a button), the offers of a
    craftsman live in his own account (not in his Google Drive), and the
    photos and the prices on a customer site are his own (phase 7.14).
20. The customer can also keep Klusbaas on the hook afterwards: in his own
    account he switches the monthly service on (hosting, SSL, updates,
    support, one change a month) and stops it himself when he wants to.
    Klusbaas sees who has it, switches it on and sends the monthly invoice
    with the amount, the IBAN and the reference (phase 7.15).
21. After he pays, the customer sees what happens with his site: every
    offer carries the checklist of the package, Klusbaas ticks the steps off
    and the customer sees the same list in his account and on the offer
    page, with the date it is done and the moment the site has to be live
    (phase 7.16).
22. A visitor who asks a question sees the answer without having to click
    first, and a search engine reads the same text: the FAQ is a native
    accordion, so every answer stands in the HTML of the page (phase 7.17).
23. A visitor who compares the price list with the editor sees the same
    thing everywhere: he fills in his own site himself, and a package is
    the delivery — Klusbaas checks the work, registers the domain and
    hands the site over within two weeks (phase 7.18).

The craftsman's side is complete in phase 6: he can reset his password, he
gets a mail when his site goes live, and every promise on the price list is
either built or removed. On Klusbaas' side the sale is complete too: he can
write an offer for anyone (a customer with an account, a customer who only
sent a request), the offer says where to pay, and the customer can pay it.
What is left is the bookkeeping: Klusbaas marks the payment by hand and
there is no payment provider (still open).

## The blockers, measured

| # | Blocker | Where it lives | What it means for the sale |
|---|---------|----------------|---------------------------|
| 1 | A published site shows the trade preset's reviews | `reviews`, `rating` and `reviewCount` in `src/data/tradesData.ts`, rendered in `src/components/SiteView.tsx` | The customer's site says "Wat klanten over mij zeggen" above three invented reviews, a rating of 4,9 and 128 reviews — presented as his own | **fixed (6.1)** |
| 2 | …and an invented Google rating | the Google badge in `SiteView.tsx` | "{rating} op Google · {n} reviews" links to a Maps search, not to a profile: the numbers are made up | **fixed (6.1)** |
| 3 | …and the preset's project photos | `work[].img` and `beforeAfter[].beforeImg/afterImg` in `src/data/tradesData.ts` | The portfolio shows stock photos of other people's work as his | **fixed (6.1)** |
| 4 | …and the preset's prices | `services[].p` in `src/data/tradesData.ts` | "v.a. € 650 per stuk" is an example price shown as his own | **fixed (6.1)** |
| 5 | …and the preset's marks | `defaultBlockContentMap` (`trust-bar`, `guarantees`, `project-stats`) | "VCA gecertifieerd", "120 projecten": claims the craftsman never made, and the editor falls back to them while a field is still empty | **fixed (6.1)** |
| 6 | Nothing can be ordered or paid | `grep -rni "stripe\|ideal\|betaal" src netlify` finds nothing | The packages (€ 595 / € 995 / € 1.795) are presentation only — ROADMAP 4.5 | **partly fixed (6.3)** |
| 7 | No password reset, no e-mail verification | `src/server/accountHandler.ts` has `register`, `login`, `logout`, `me`, `sites`, `claim` | A craftsman who forgets his password loses his site, and every request has to go through Klusbaas by hand | **fixed (6.5)** |
| 8 | The requests live only in the mail | `src/server/leadHandler.ts` | When the mail to the craftsman does not arrive, Klusbaas keeps a back-up but the craftsman sees nothing — and the back-up can only be found in the Blobs store | **fixed (6.2)** |
| 9 | No overview for Klusbaas | no admin route; `src/server/` has no list view | Customers, sites, orders and requests are invisible outside the mail and the Blobs dashboard | **fixed (6.4)** |
| 10 | The privacy note on a customer site points to Klusbaas' statement | `src/components/PrivacyNote.tsx` links to `{ name: 'privacy' }` | On a customer site the craftsman is the party responsible for the data on his own site; the link says otherwise | **fixed (6.7)** |
| 11 | The pricing page promises what is not built | `src/data/plans.ts` | "Eigen .nl-domein, eerste jaar inbegrepen", "Offertes automatisch opgeslagen in Google Drive" and "Koppeling met je Google Bedrijfsprofiel" are on the price list and nowhere in the code | **fixed (6.8)** |
| 12 | The photo upload can be abused | `POST /api/media` had no limit and no login | Anyone could fill the photo store with rubbish: the upload is open on purpose, so it needs a limit | **fixed (7.1)** |
| 13 | Only the wizard creates an offer | `src/server/adminHandler.ts` knew `login`, `logout`, `overview`, `quote-status` and `verify-account` | A customer who makes his own account and publishes his own site never gets an offer, and therefore no order and no invoice. Klusbaas could not write one either | **fixed (7.2)** |
| 14 | The offer does not say where to pay | `src/server/quotePdf.ts` had no payment block and `GET /api/quote` returned no payment details | A customer without an account could open the offer but not see where to transfer the money, so the sale stopped at the offer | **fixed (7.3)** |
| 15 | A request cannot become an offer | the "Offerte maken" form listed only published sites and accounts | Someone who only sent a request could not be given an offer, so a lead from a form had no path to an order | **fixed (7.4)** |
| 16 | The customer has to write a mail to accept | the offer page only showed the price and the way to pay | The customer had to write a mail or a WhatsApp message to say yes, and that is where a sale is lost most easily | **fixed (7.5)** |
| 17 | A paid customer gets nothing | `quote-status` only changed a field in the store | The customer transferred the money and heard nothing: no confirmation and no document for his own administration | **fixed (7.6)** |
| 18 | An open offer is never followed up | the overview only showed the status of an offer | An offer nobody accepted sat there until it expired; Klusbaas had to remember it himself and write the mail by hand | **fixed (7.7)** |
| 19 | An expired offer still looks like a promise | the offer page said "geldig tot 28 november" and kept the accept button, whatever the date was | A customer could agree to a price from three months ago, and the page said a date that had passed | **fixed (7.8)** |
| 20 | A request and its offer are two things | the offer did not remember the request it was written for | The overview showed the request and the offer side by side with nothing in between, so Klusbaas could write the same offer twice or forget that he had already answered | **fixed (7.9)** |
| 21 | The customer's "ja" leaves no trace | accepting only changed the status and showed a banner in the browser | When the customer closed his browser the only proof was gone: he had nothing to show his bookkeeper and nothing to remind himself what he agreed to | **fixed (7.10)** |
| 22 | An accepted offer that is not paid goes quiet | the overview only showed the status `accepted` | The customer said yes, so the sale was real, but the money never arrived and nobody noticed: the IBAN was in a mail the customer had lost, and the order looked finished in the overview | **fixed (7.11)** |
| 23 | The customer cannot say he paid | there was no way to report a transfer | The customer transferred the money and told nobody: Klusbaas only found out when he happened to look at his bank statement, so a paid order looked unpaid for weeks | **fixed (7.12)** |
| 24 | The customer cannot ask for an offer himself | `/mijn-account` promised "vraag een offerte aan via de site-editor", but the editor had no such button | The customer had to write a mail or a WhatsApp message to get a price, and the promise in his own account was not true. He now asks in the editor and gets a real offer with a number, a price and a way to pay | **fixed (7.13)** |
| 25 | The marketing pages promise things that are not built | `src/components/FaqSection.tsx` promised an own `.nl` domain at the moment of publishing and automatic offers in Google Drive; `HowItWorks.tsx` promised an own domain; the homepage promised example photos and prices as if they were the customer's | A customer who reads the FAQ before he buys is told something that does not happen. The first impression is where the sale is won or lost | **fixed (7.14)** |
| 26 | The monthly service cannot be ordered | `src/data/plans.ts` had no service price, the pricing page offered a service of € 25 per month that could only be asked for by mail, and nothing tracked who had it | A customer who wanted hosting, updates and support had no way to buy it, and Klusbaas had no list of the customers who pay monthly. The service is now a real order: the customer switches it on in his account, Klusbaas confirms it and sends the monthly invoice, and the customer stops it himself | **fixed (7.15)** |
| 27 | The customer does not see what happens with his site | the offer carried a price and a status, nothing about the work itself; "binnen twee weken opgeleverd" was a sentence on the price list | After he paid, the customer had to ask Klusbaas what the status was, and Klusbaas had no list of what was still to do per order. Every offer now carries the checklist of the package; Klusbaas ticks it off and the customer sees the same list | **fixed (7.16)** |
| 28 | The answers of the FAQ only appear after a click | the FAQ was a button with `useState`: the answer was painted only after a click, so the prerendered homepage had the questions but not the answers. A visitor without JavaScript never read an answer, and a search engine had to guess | The questions a craftsman asks most (price, ownership, delivery time) were invisible in the page that should answer them | The FAQ is a native `<details>` now: every answer stands in the HTML of the build | **fixed (7.17)** |
| 29 | The price list does not say what a package is | the customer fills in his own site in his own editor, without paying, but the price list sold "a website". He finds out in the editor that he could have done it himself, and the price of € 595 looks like a bait and switch | The sale is won or lost in that moment: either he buys a delivery he did not know he was buying, or he feels tricked and walks away | The pricing page and the FAQ say what a package is: the delivery (check the texts, photos, colours and findability, deliver within two weeks, register the domain in Pro and Premium) | **fixed (7.18)** |


The status column says what has been done since the audit was written
(phases 6.1–6.9 and 7.1–7.13). "Partly fixed" means: an offer can be ordered
and paid for, but there is no payment provider, no automatic reminder and
no invoice.

## What is already true

- The craftsman writes his own copy; nothing is generated for him
  (VISION principle 1, PR #30).
- The site is published on an address of his own and is reachable without
  Klusbaas (principle 6, PR #30).
- A request from a published site reaches the craftsman and the page says
  what happens (principle 2 and 4, PR #32).
- Accounts, sessions and site ownership work; the management link keeps
  working and never changes (PR #31).
- A published site only says true things: the craftsman writes his own text
  and confirms it (phase 6.1).
- A request is stored with its site and stands in the craftsman's account
  (phase 6.2).
- An offer is an order with a status, a price and a way to pay, and it
  stands in the customer's account (phase 6.3).
- Klusbaas has one overview for the requests, the orders and the published
  sites, behind a password (phase 6.4).
- Every trade preset has 5 styles, the site renders on the server, and the
  page has `LocalBusiness` structured data for local SEO.
- The customer can reset his password and confirm his e-mail address
  himself (phase 6.5), and gets a mail when his site goes live (phase 6.6).
- Every promise on the price list is either built or removed (phase 6.8).
- The customer site has its own privacy statement that names the craftsman
  as the responsible party (phase 6.7).
- Klusbaas can write an offer for a customer who did not ask for one; it
  becomes an order in that customer's account and is mailed to him
  (phase 7.2).
- The offer says where to pay: the IBAN and the amount are in the PDF and on
  the offer page (phase 7.3).
- A request can become an offer: the request is a customer in the "Offerte
  maken" form (phase 7.4).
- The customer accepts the offer himself: one click on the offer page, and
  Klusbaas hears about it the same day (phase 7.5).
- A paying customer gets an invoice by mail and can download it again
  (phase 7.6).
- Klusbaas can follow up on an open offer and sees which offers have
  expired (phase 7.7).
- An expired offer is not a promise: the customer sees it and cannot accept
  it (phase 7.8).
- A request remembers the offer written for it (phase 7.9).
- The customer keeps the proof of his own "ja": right after he accepts he
  gets a mail with the amount and the IBAN, and he can accept from his
  account too (phase 7.10).
- An accepted offer that is not paid does not go quiet: the overview shows
  how many days it has been waiting and Klusbaas can send the customer the
  amount and the IBAN again (phase 7.11).
- The customer can report that he transferred the money; Klusbaas sees it in
  the overview and checks his bank statement himself (phase 7.12).
- The customer asks for an offer himself, in his own site editor: he chooses
  the package and the extra components, sees the price and gets a real
  offer in his account; the request is stored, so Klusbaas sees what he
  wants (phase 7.13).
- Every promise on the marketing pages is built: the FAQ, "hoe het werkt"
  and the homepage say what really happens (phase 7.14). A test keeps the
  old promises out.
- The monthly service is a real order: the customer switches it on in his
  own account, Klusbaas sees it, switches it on and sends the monthly
  invoice; the customer stops it himself (phase 7.15).
- The customer sees what Klusbaas does for his site: the checklist of the
  package comes with the offer, Klusbaas ticks it off and the customer sees
  the same list in his account (phase 7.16).

## Definition of done

The eight conditions in ROADMAP phase 6 are the contract: a craftsman can
be sold a website when he can sign up, publish a site that only says true
things, see his requests, pay, and find everything back on any device.
Phase 7 adds twelve conditions of its own: Klusbaas can write an offer for a
customer who did not come through the wizard (7.2), the photo upload cannot
be used to fill the store (7.1), the customer can pay the offer without
making an account first (7.3), a request can become an offer (7.4), the
customer can accept the offer himself (7.5), a paying customer gets an
invoice (7.6), an open offer can be followed up (7.7), an expired offer is
not a promise (7.8), a request remembers its offer (7.9), the customer keeps
the proof of his own "ja" (7.10), an accepted offer that is not paid does
not go quiet (7.11), the customer can report that he paid (7.12), and the
customer can ask for an offer himself (7.13), every promise on the
marketing pages is true (7.14), and the monthly service is a real order
that the customer can also stop himself (7.15).

## How to re-measure this

```sh
# 6: the offer is the order, with a status and a way to pay
grep -rn "status" src/utils/quote.ts | head -3
grep -rn "PAYMENT_IBAN" src/server/payment.ts .env.example

# 7: no reset and no verification
grep -rn "action ===" src/server/accountHandler.ts

# 1, 2, 3, 4: the preset's claims and numbers do not reach a published site
grep -rn "publishedSite\|publishedBlocks" src/utils/publishedContent.ts | head -3
grep -rn "NO_PHOTO" src/utils/publishedContent.ts | head -2

# 8: the requests stand in the account of the craftsman
grep -rn "listLeads" src/server/storage.ts src/server/accountHandler.ts

# 9: the overview of Klusbaas
grep -rn "action === 'overview'" src/server/adminHandler.ts

# 11: the promises on the price list
grep -n "domein\|Drive\|Bedrijfsprofiel" src/data/plans.ts

# 12: the photo upload has a limit
grep -n "MEDIA_UPLOADS_PER_HOUR" src/server/mediaHandler.ts

# 13: Klusbaas writes an offer himself
grep -rn "'create-quote'" src/server/adminHandler.ts

# 14: the offer says where to pay
grep -n "payment" src/server/quotePdf.ts | head -1

# 15: a request can become an offer
grep -n "leadReference" src/server/adminOffer.ts | head -1

# 16: the customer accepts the offer himself
grep -n "quote/accept" src/server/acceptQuote.ts | head -1

# 17: a paid customer gets an invoice
grep -n "sendPaidNotice" src/server/adminHandler.ts | head -1

# 18: an open offer is followed up
grep -n "remind-quote" src/server/adminHandler.ts | head -1

# 19: an expired offer is not a promise
grep -n "isQuoteExpired" src/utils/quote.ts | head -1

# 20: a request and its offer are one thing
grep -n "leadReference" src/utils/quote.ts | head -1

# 21: the customer keeps the proof of his "ja"
grep -n "buildAcceptConfirmationEmail" src/server/acceptQuote.ts | head -1

# 22: een geaccepteerde offerte die niet betaald is, blijft niet stil
grep -n "remind-payment" src/server/adminHandler.ts | head -1

# 23: de klant kan zeggen dat hij betaald heeft
grep -n "quote/payment" netlify/functions/quote-payment.mts | head -1

# 24: de klant vraagt zelf een offerte aan
grep -n "quote/request" netlify/functions/quote-request.mts | head -1
grep -n "Offerte aanvragen" src/components/editor/OfferteTab.tsx | head -1

# 25: elke belofte op de marketingpagina's is waar
bun test src/components/claims.test.tsx
grep -n "per opdracht" src/components/FaqSection.tsx | head -1

# 26: de maandelijkse service is een echte bestelling
bun test src/server/service.test.ts
grep -n "service-request" src/server/accountHandler.ts | head -1
grep -n "SERVICE_PRICE" src/data/plans.ts | head -1

# 27: de klant ziet wat Klusbaas voor zijn site doet
bun test src/server/delivery.test.ts
grep -n "buildDeliveryItems" src/utils/quote.ts | head -1

# 28: de antwoorden van de FAQ staan in de pagina
bun test src/components/FaqSection.test.tsx
grep -n "<details" src/components/FaqSection.tsx | head -1

# 29: de prijzenpagina zegt wat een pakket is
bun test src/components/claims.test.tsx
grep -n "PACKAGE_DELIVERY_NOTE" src/data/marketing.ts | head -1

# and the checks that must stay green
bun run check
```

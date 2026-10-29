# Selling readiness — what a craftsman cannot do yet

A measured audit of the gap between "the product makes a site" and "a
craftsman can be sold a website". Every claim below was read from the code
on `main`; the commands to re-measure them are at the bottom.

## The journey today

1. A craftsman picks a trade and a style, fills in his details and sees his
   site in the editor (`/mijn-site`).
2. He publishes it. The site goes live at `/site/<slug>`; with an account he
   finds it back at `/mijn-account`.
3. A visitor fills in the contact form. Since PR #32 the request is mailed
   to the craftsman and the page says exactly that.
4. Nothing else happens. There is no order, no invoice, no payment, and
   nothing for the craftsman to look at except his mailbox.

A craftsman can therefore be *shown* the product, but he cannot be *sold*
it: nothing can be ordered, nothing can be paid, and the site he publishes
still carries the demo's claims.

## The blockers, measured

| # | Blocker | Where it lives | What it means for the sale |
|---|---------|----------------|---------------------------|
| 1 | A published site shows the trade preset's reviews | `reviews`, `rating` and `reviewCount` in `src/data/tradesData.ts`, rendered in `src/components/SiteView.tsx` | The customer's site says "Wat klanten over mij zeggen" above three invented reviews, a rating of 4,9 and 128 reviews — presented as his own |
| 2 | …and an invented Google rating | the Google badge in `SiteView.tsx` | "{rating} op Google · {n} reviews" links to a Maps search, not to a profile: the numbers are made up |
| 3 | …and the preset's project photos | `work[].img` and `beforeAfter[].beforeImg/afterImg` in `src/data/tradesData.ts` | The portfolio shows stock photos of other people's work as his |
| 4 | …and the preset's prices | `services[].p` in `src/data/tradesData.ts` | "v.a. € 650 per stuk" is an example price shown as his own |
| 5 | …and the preset's marks | `defaultBlockContentMap` (`trust-bar`, `guarantees`, `project-stats`) | "VCA gecertifieerd", "120 projecten": claims the craftsman never made, and the editor falls back to them while a field is still empty |
| 6 | Nothing can be ordered or paid | `grep -rni "stripe\|ideal\|betaal" src netlify` finds nothing | The packages (€ 595 / € 995 / € 1.795) are presentation only — ROADMAP 4.5 |
| 7 | No password reset, no e-mail verification | `src/server/accountHandler.ts` has `register`, `login`, `logout`, `me`, `sites`, `claim` | A craftsman who forgets his password loses his site, and every request has to go through Klusbaas by hand |
| 8 | The requests live only in the mail | `src/server/leadHandler.ts` | When the mail to the craftsman does not arrive, Klusbaas keeps a back-up but the craftsman sees nothing — and the back-up can only be found in the Blobs store |
| 9 | No overview for Klusbaas | no admin route; `src/server/` has no list view | Customers, sites, orders and requests are invisible outside the mail and the Blobs dashboard |
| 10 | The privacy note on a customer site points to Klusbaas' statement | `src/components/PrivacyNote.tsx` links to `{ name: 'privacy' }` | On a customer site the craftsman is the party responsible for the data on his own site; the link says otherwise |
| 11 | The pricing page promises what is not built | `src/data/plans.ts` | "Eigen .nl-domein, eerste jaar inbegrepen", "Offertes automatisch opgeslagen in Google Drive" and "Koppeling met je Google Bedrijfsprofiel" are on the price list and nowhere in the code |

## What is already true

- The craftsman writes his own copy; nothing is generated for him
  (VISION principle 1, PR #30).
- The site is published on an address of his own and is reachable without
  Klusbaas (principle 6, PR #30).
- A request from a published site reaches the craftsman and the page says
  what happens (principle 2 and 4, PR #32).
- Accounts, sessions and site ownership work; the management link keeps
  working and never changes (PR #31).
- Every trade preset has 5 styles, the site renders on the server, and the
  page has `LocalBusiness` structured data for local SEO.

## Definition of done

The eight conditions in ROADMAP phase 6 are the contract: a craftsman can
be sold a website when he can sign up, publish a site that only says true
things, see his requests, pay, and find everything back on any device.

## How to re-measure this

```sh
# 6: nothing to pay with
grep -rni "stripe\|ideal\|betaal" src netlify

# 7: no reset and no verification
grep -rn "action ===" src/server/accountHandler.ts

# 1, 2, 3, 4: the preset's claims and numbers
grep -n "rating:\|reviewCount:\|since:" src/data/tradesData.ts
grep -n "p: '" src/data/tradesData.ts | head

# 11: the promises on the price list
grep -n "domein\|Drive\|Bedrijfsprofiel" src/data/plans.ts

# and the checks that must stay green
bun run check
```

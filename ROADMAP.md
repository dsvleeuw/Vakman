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

## Decision log

- **Contact option D (WhatsApp primary + form fallback)** was chosen because
  it is the explicit recommendation in the research and matches how Dutch
  tradespeople communicate. Revisit when the lead API (3.1) lands.
- **No backend in 0.1.0**: forms intentionally submit through WhatsApp deep
  links to keep the prototype dependency-free. This is a deliberate
  trade-off, not the final architecture.
- **Price points € 595 / € 995 / € 1.795 + € 25/month** sit mid-market per
  the scan. All source figures were self-reported by the providers and have
  not been independently verified — re-validate before any external use.

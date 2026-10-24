# Pricing and market positioning

> **Source caveat.** The figures below come from the competitors' own
> marketing pages and public price lists. They have **not** been
> independently verified. Re-validate the numbers before using them in
> external communication, investment material or customer promises.

## Market summary (at the time of the research)

The niche is crowded: many small agencies focus specifically on
construction and installation trades. Observed one-off entry prices ranged
from roughly € 375 to € 1.295, with subscriptions from about € 39/month
and all-in annual plans around € 399/year. The median of the nine tracked
one-off entry prices was approximately **€ 620**. Freelancers typically
charged € 800–€ 3.000.

Common baseline features across competitors — therefore expectations, not
differentiators:

- mobile call button always on screen
- quote/offer form
- before/after project gallery
- certification marks (VCA, guarantees)
- Google Bedrijfsprofiel integration
- local SEO (e.g. "loodgieter Haarlem")
- delivery within two weeks

## Chosen positioning

Klusbaas sits in the **middle of the market** and competes on quality and
proactive sales rather than price. The platform prices are implemented in
`src/components/PricingSection.tsx`:

| Package | One-off price (excl. btw) | Position |
|---------|---------------------------|----------|
| Basis | € 595 | One-page site with every baseline feature |
| Pro (most popular) | € 995 | Multi-page, calculator, postcode check, domain included |
| Premium | € 1.795 | Booking, Google sync and the trade-specific smart tool |
| Service & hosting | € 25/month, optional, monthly cancellable | Hosting, SSL, updates, one change per month, support |

All amounts are explicitly labelled **exclusief btw** in the UI and an
ownership promise is featured prominently: the craftsman keeps the site,
code, domain and photos (no vendor lock-in). Ownership is a selling point
competitors such as Digitaalnu also use, so it is treated as a trust
baseline rather than a unique claim.

## Differentiators to keep investing in

1. **Proactive outreach with per-trade demos.** Instead of waiting for
   organic search traffic, prospects receive a link to a demo of their own
   trade. Preset quality is therefore the primary sales weapon.
2. **"Eerst zien, dan beslissen."** No quote trajectory: the prospect sees
   the finished-looking site immediately.
3. **Smart per-trade components** — emergency button (plumber), roof check
   (roofer, roadmap), colour picker / m² calculator (painter), fault
   report (electrician), project timeline (contractor/carpenter).
4. **Distinctive premium design.** Many competitors run standard
   templates; the five bespoke layouts and OKLCH palettes are intended to
   visibly outclass them.

## Where prices live in code

| Concern | Location |
|---------|----------|
| Platform package prices and service fee | `PricingSection.tsx` constants |
| Platform pricing FAQ answers | `FaqSection.tsx` (`DEFAULT_FAQS`) |
| Customer-facing service prices (e.g. "€ 18 per m²") | `SECTORS[*].services` in `src/data/tradesData.ts` |
| Quiz-based estimate logic | `src/utils/pricing.ts` (`calculateEstimate`) |
| m² estimate logic | `src/utils/surface.ts` |

When changing a platform price, update the component **and** the FAQ
answer in the same commit, and add a `Changed` entry to `CHANGELOG.md`.

## Open commercial questions

- Whether the € 25/month service should include the first period free in
  Pro (the current copy already mentions three months of service in the
  Pro feature list — keep the two in sync if pricing changes).
- Whether to show competitor comparison openly (one competitor does) or
  stay premium/non-comparative.
- Refund and cancellation terms, which are not yet formalised anywhere in
  the product.

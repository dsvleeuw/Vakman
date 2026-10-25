# src/components — React UI Componenten

Alle presentatie-componenten voor de marketing pagina, wizard, demo sites en component gallery.

## Submappen

- `extras/` — Optionele extra componenten voor demo sites (TrustBar, TestimonialCard, TeamMemberCard, etc.)
- `tools/` — Interactieve "smart tools" per vak (SurfaceCalculator, EmergencyButton, FaultReportForm, ProjectTimeline)

## Hoofdcomponenten

| Bestand | Doel |
|---------|------|
| `SiteView.tsx` | Volledige demo marketing site voor een sector+stijl combinatie |
| `WizardView.tsx` | 6-stappen wizard om een demo site samen te stellen |
| `ComponentGallery.tsx` | Overzicht van alle beschikbare componenten |
| `HeroStrip.tsx`, `PresetsSection.tsx`, `PricingSection.tsx`, `HowItWorks.tsx`, `FaqSection.tsx`, `ContactSection.tsx` | Marketing landing page secties |
| `Header.tsx`, `SiteFooter.tsx`, `Logo.tsx`, `Icons.tsx` | Shared layout & branding |
| `BookingCalendar.tsx`, `QuoteView.tsx`, `QuoteSummary.tsx`, `PriceCalculator.tsx` | Wizard/quote functionaliteit |
| `RouteLink.tsx` | Interne navigatie met echte `<a>` hrefs (middle-click, SEO) |
| `AreaChecker.tsx`, `ProspectMapView.tsx`, `LeadStatus.tsx`, `NewsletterSignup.tsx`, `DemoContactNotice.tsx`, `PrivacyNote.tsx`, `NotFoundView.tsx` | Specifieke views & notices |

## Styling regels

- Gebruik palette tokens uit `ActiveSiteData` (`site.accent`, `site.card`, `site.radiusLg`, `site.onAccent`) — **no hard-coded colors**
- Tailwind v4 arbitrary values (`h-13`, `p-[18px]`) zijn toegestaan
- Shared keyframes in `src/index.css`
- Responsive: mobile-first, `sm:` breakpoint voor desktop
- Sticky contact bar op mobile: page root heeft `pb-20 sm:pb-0`

## Tests

- Component tests liggen naast de component (`*.test.tsx`)
- Gebruik `renderToStaticMarkup` voor smoke tests; assert op entity-decoded markup (`&` → `&`)
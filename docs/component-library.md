# Component library

The component library is a searchable, interactive catalogue of the React
components used by Klusbaas and its generated trade websites.

## Open the library

- Choose **Componenten** in the main Klusbaas navigation (including the
  mobile hamburger menu).
- Or open `/?view=components` directly.

The page contains 30 entries: the 20 component modules that existed before
the library plus ten new reusable additions. Select an entry to render its
real component with demo data. Calculators, forms, accordions, sliders and
navigation remain interactive. The full `SiteView` and `WizardView` open in
a scrollable preview so they do not take over the catalogue page.

Use the search field to match a component name, Dutch label, description or
file path. Filters separate **Nieuw**, **Platform**, **Vakmansite**,
**Vaktools** and **Basis**.

## Ten reusable additions

The additions live in `src/components/extras/` and are exported from its
`index.ts`. They consume `ActiveSiteData` palette, typography and radius
tokens, so they can be reused across all five preset styles.

| Component | Purpose |
|-----------|---------|
| `TrustBar` | Compact trust, response-time, location and review signals |
| `OpeningHoursCard` | Business hours with call and WhatsApp actions |
| `AvailabilityCard` | Next availability and a link to appointment booking |
| `TeamMemberCard` | Personal introduction to the owner/tradesperson |
| `TestimonialCard` | Featured review with rating and review summary |
| `GuaranteeList` | Price, workmanship, delivery and contact guarantees |
| `PromotionBanner` | Seasonal promotion, combined-job or recommendation banner |
| `ServiceAreaChips` | Compact location list with postcode-check link |
| `ProjectStats` | Experience, review, rating and service-area figures |
| `ContactCtaBanner` | Closing price-calculator and phone conversion banner |

These components are **available in the library but are not automatically
inserted into every generated site**. They can be added selectively to a
preset or composed into a future page layout without changing all 35 trade
and style combinations at once.

## Catalogue source

`src/data/componentCatalog.ts` contains the inventory metadata: stable id,
component name, Dutch label, description, source file, category and preview
layout. It contains no React imports, so its integrity can be tested without
mounting the application.

## Add another component to the gallery

1. Create the component in `src/components/` or the appropriate subdirectory.
2. If it belongs with the reusable trade-site additions, export it from
   `src/components/extras/index.ts` and use the `ActiveSiteData` tokens.
3. Add an entry to `COMPONENT_ENTRIES` in `src/data/componentCatalog.ts`.
4. Import the component in `src/components/ComponentGallery.tsx` and add its
   id to `renderPreview`.
5. Use `preview: 'bleed'` for a full-width section or `preview: 'scroll'`
   for a complete application view. The default `card` layout adds padding.
6. Add or update tests and run `bun run lint`, `bun test` and `bun run build`.

## Verification

- `src/data/componentCatalog.test.ts` protects the complete existing-module
  inventory, the ten additions, unique ids/files and category filters.
- `src/components/extras/extras.test.tsx` server-renders every new component
  and checks for useful Dutch content and palette-token output.
- `src/components/ComponentGallery.test.tsx` server-renders the gallery and
  checks that every catalog entry and the default live preview are present.

# Adding a new sector (trade)

This guide walks through adding a new trade, e.g. **fysiotherapeut**.

## 1. Register the id

In `src/types.ts`, add the id to the `SectorId` union:

```ts
export type SectorId =
  | 'timmerman' | 'aannemer' | 'hovenier' | 'schilder'
  | 'loodgieter' | 'elektricien' | 'stukadoor'
  | 'dakdekker' | 'overige';
```

Add it to `ORDER` in `src/data/tradesData.ts` to control its tab position:

```ts
export const ORDER: SectorId[] = [
  'timmerman', 'aannemer', 'hovenier', 'schilder',
  'loodgieter', 'elektricien', 'stukadoor', 'dakdekker',
  'overige',
];
```

## 2. Add a `SectorData` entry

Add a key to the `SECTORS` record. Copy an existing sector as a skeleton
and replace every field. Required groups:

- **Identity & contact**: `id`, `name`, `biz`, `owner`, `city`, `phone`,
  `near` (two-digit postcode prefixes served), `pcExample`, `since`,
  `rating`, `reviewCount`.
- **Color inputs**: `hD` (foreground hue), `hB` (background hue),
  `cf` (chroma factor, usually `1`), optional `vivid` OKLCH accent and
  `vividLight` flag used by the bold style.
- **Content**: `kicker`, `headline`, `intro`, `cta1`, `cta2`, `about`,
  `servicesTitle`, `marks` (certifications), `workNote`.
- **Services**: array of `{ n, d, p }`. If the sector will use the
  m² calculator, include prices formatted exactly like `"€ 18 per m²"`
  so `parsePricePerM2` can read them.
- **Portfolio**: three `work` items and, recommended, a `beforeAfter`
  entry using `getUnsplashUrl('<photo-id>', 1000)`.
- **Quiz flow**: `flow` questions whose first-question options carry a
  base price `b` and later options carry additive `a` values; consumed by
  `calculateEstimate`.
- **Trust**: `estNote` and three `reviews`.
- **Optional tool**: set `tool: 'emergency' | 'fault-report' |
  'm2-calculator' | 'timeline' | 'roof-check' | 'garden-plan'` (see
  [adding-a-trade-tool.md](./adding-a-trade-tool.md)).
- **Own timeline**: a trade whose tool is `timeline` gets its own steps in
  `src/data/timeline.ts` (`TIMELINES`), with a title and a line above them.
  A trade without steps gets the generic route (`DEFAULT_TIMELINE`).

### Photo pools

`pool` contains Unsplash photo ids (the numeric id after `photo-` in the
image URL). Provide 10–12 relevant ids; `getPhotoSet` rotates through them
per style index. Every image renders through `ImageWithFallback`, which
degrades gracefully if a photo fails to load.

## 3. Check the automatic touchpoints

Once the data exists, the sector appears automatically in:

- the home marquee (`HeroStrip`) and preset tabs (`PresetsSection`),
- the quick-switch circles in `SiteView`'s preview bar,
- the wizard's trade picker (step 1),
- all five style palettes via `computePalette`.

No component changes are needed unless the sector needs a new smart tool.

## 4. Verify

```bash
bun run lint      # types: the SectorId union forces completeness
bun test          # existing utilities must stay green
bun run build     # production build
bun run dev       # manual check of /?sector=dakdekker&view=site
```

Manual checklist:

- All five styles render with readable contrast (check the bold style if
  you set a custom `vivid` accent).
- The price calculator's quiz produces a sensible estimate.
- The postcode checker accepts an example postcode inside `near` and
  rejects one outside it.
- If a tool is assigned, it appears between the area checker and booking
  calendar on mobile and desktop.
- Dutch copy uses euro formatting (`€ 1.250`, comma decimals) and
  "exclusief/inclusief btw" wording consistent with existing sectors.

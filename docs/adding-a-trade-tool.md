# Adding a trade-specific tool

Smart tools are the product's main differentiator: each preset can own one
purpose-built conversion component. Today five exist (`emergency`,
`fault-report`, `m2-calculator`, `timeline`, `roof-check`); this guide adds a
sixth.

## 1. Declare the tool id

In `src/types.ts`, extend the union:

```ts
export type TradeToolId =
  | 'emergency' | 'fault-report' | 'm2-calculator'
  | 'timeline' | 'roof-check';
```

Optionally set it on a sector in `src/data/tradesData.ts`:

```ts
aannemer: {
  // ...
  tool: 'timeline',
},
```

## 2. Put pure logic in a tested util first

Message wording, price math and validation belong in `src/utils/`, not in
the component. For a dakcheck form, add a template to
`src/utils/contact.ts`, for example:

```ts
export function buildRoofCheckMessage(
  bizName: string,
  input: RoofCheckInput
): string { /* ... */ }
```

Then add unit tests next to the existing `contact.test.ts` /
`surface.test.ts` files. Follow the `node:test` style already in the repo
and run `bun test src`.

## 3. Build the component

Create `src/components/tools/RoofCheckForm.tsx`. Conventions to follow:

- Accept a single `site: ActiveSiteData` prop and read all colors, fonts
  and radii from the palette tokens (`site.card`, `site.accent`,
  `site.radiusLg`, …) so the tool works in all five styles.
- Write all user-facing copy in Dutch, matching the tone of the existing
  tools.
- Use `lucide-react` icons (verify the export exists first).
- Forms validate locally (reuse the `^0\d{9}$` Dutch mobile pattern) and
  submit by opening a WhatsApp deep link from
  `buildWhatsAppUrl(site.phone, ...)` in a new tab — there is no backend.
- Give the section an `id` and `scroll-mt-24` so header anchors work, and
  keep it responsive: the mobile sticky bar reserves space via the page
  root's `pb-20`.
- Confirmation states use the `animate-fade-in` utility and
  `pulse-glow` ring, mirroring `FaultReportForm`.

## 4. Register it in the switch

In `src/components/tools/TradeTool.tsx`:

```tsx
case 'dakcheck':
  return <RoofCheckForm site={site} />;
```

`SiteView` already renders `<TradeTool site={site} />` between the area
checker and the booking calendar, so nothing else changes there.

## 5. Document and verify

- Add the tool to the README feature list and to `CHANGELOG.md` under
  `Added`.
- If it introduces new user-facing promises (e.g. "gratis dakcheck binnen
  48 uur"), make sure the roadmap or FAQ stays truthful.
- Run the full verification:

```bash
bun run lint
bun test
bun run build
```

- Render-check every style of the affected sector. Without a browser you
  can use a temporary `renderToStaticMarkup` script (see
  [architecture.md](./architecture.md#testing)); remember to delete it
  afterwards.

## Design rules of thumb

- A tool must reduce friction to a quote or contact moment, not just
  display information.
- WhatsApp is the primary exit; call (`buildTelUrl`) is the secondary one
  for urgent trades.
- Keep each tool to one focused job. If a sector needs two, split them
  into separate sections rather than adding tabs inside the tool.

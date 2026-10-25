# public/brand — Klusbaas Brand Assets

Alle officiële brand assets voor Klusbaas. Gegenereerd via `scripts/generate-brand.mjs` vanuit source SVG.

## Bestanden

| Bestand | Gebruik |
|---------|---------|
| `klusbaas-logo.svg` | Hoofdlogo (donker op licht) |
| `klusbaas-logo-light.svg` | Logo variant voor donkere achtergronden |
| `klusbaas-mark.svg` | Alleen het icoon/mark (zonder wordmark) |
| `klusbaas-mark-light.svg` | Mark variant voor donkere achtergronden |
| `klusbaas-logo-email.png` | Email signature (raster, fixed size) |
| `klusbaas-icon-square.svg` | Square variant voor favicon, app icon, social |

## Generatie

```bash
bun run generate:brand
```

Bron SVG in `public/brand/` (source files) → script genereert alle variants + PNG exports + favicon set.

## Specificaties

- **Kleuren**: Klusbaas stone/amber palette (vast, niet sector-afhankelijk)
- **Typography**: Space Grotesk (heading) + Inter (body) — via CSS variables
- **Formaten**:
  - Favicon: 16, 32, 48, 64, 128, 256px (ICO + PNG)
  - Apple touch icon: 180×180px
  - PWA icons: 192×192, 512×512px
  - OG image: 1200×630px

## Gebruik in code

```tsx
import Logo from '@/components/Logo'; // gebruikt klusbaas-logo.svg intern
import { klusbaasMark } from '@/components/Icons'; // mark variant
```

## Updaten brand

1. Update source SVG in `public/brand/`
2. Run `bun run generate:brand`
3. Commit alle gegenereerde bestanden
4. Test in browser (favicon, PWA install, OG sharing)
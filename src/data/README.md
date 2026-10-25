# src/data — Statische Data & Configuratie

Centrale locatie voor alle statische data die de app aanstuurt: sectoren, kleurpaletten, abonnementen, component catalogus, prospects.

## Bestanden

| Bestand | Inhoud |
|---------|--------|
| `tradesData.ts` | **Hoofdconfiguratie**: 6 sectoren × 5 stijlen = 30 presets. Elk sector heeft: `id`, `label`, `icon`, `accentHue`, `tools[]`, `pool[]` (Unsplash IDs), `faq[]`, `services[]` |
| `paletteContrast.test.ts` | Tests die contrast garanderen voor alle palette combinaties (WCAG AA) |
| `plans.ts` | Platform abonnementen: `starter`, `professional`, `enterprise` — prijzen in centen, 21% btw |
| `platform.ts` | Platform configuratie: naam, tagline, contact, links, features per plan |
| `componentCatalog.ts` | Catalogus van alle beschikbare componenten voor wizard/component gallery |
| `componentCatalog.test.ts` | Tests voor catalogus consistentheid |
| `prospects.ts` | Demo prospect data voor kaart/lijst weergave |
| `brandMark.ts` | Klusbaas brand mark (logo/svg) configuratie |
| `addons.ts` | Extra diensten/add-ons die in wizard kunnen worden geselecteerd |
| `tradesData.test.ts` | Tests voor sector data validatie |

## Sector data structuur (vereenvoudigd)

```ts
interface Sector {
  id: string;           // 'loodgieter', 'elektricien', ...
  label: string;        // 'Loodgieter'
  icon: LucideIcon;     // lucide-react export
  accentHue: number;    // HSL hue (0-360) voor palette generatie
  tools: ToolConfig[];  // Smart tools voor deze sector
  pool: string[];       // Unsplash photo IDs per stijl (5 per sector)
  faq: FAQItem[];
  services: Service[];
}
```

## Palette generatie

Kleuren worden gegenereerd via `computePalette(sector.accentHue, styleIndex)` in `utils/color.ts`. Tests in `paletteContrast.test.ts` valideren contrast ratios.

## Prijzen

Alle prijzen in **centen** (integer). Formatting via `formatEuro(cents)` in `utils/pricing.ts`. BTW = 21%.

## Toevoegen nieuwe sector

Zie [docs/adding-a-sector.md](../../docs/adding-a-sector.md)
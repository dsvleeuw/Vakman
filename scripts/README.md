# scripts — Build, Deploy & Utility Scripts

Node/Bun scripts voor build proces, prerendering, brand generatie, en performance audits.

## Scripts

| Script | Doel | Commando |
|--------|------|----------|
| `prerender.ts` | Prerender alle 39 routes voor SEO + sitemap/robots.txt generatie | `bun run build` (auto) |
| `check.mjs` | Voert `lint`, applicatietests, inventarisatietests en `build` parallel uit | `bun run check` |
| `file-inventory.mjs` | Houdt per bestandswijziging Git-historie, actuele versies en metadata bij in `docs/` | `bun run inventory` |
| `file-inventory.test.mjs` | Test versiehistorie, branches, merges, privacy en publicatie | `bun run inventory:test` |
| `publish-file-inventory.sh` | Publiceert het overzicht vanuit een schone GitHub Actions-checkout | Alleen via Actions |
| `generate-brand.mjs` | Genereert brand assets (logos, icons, OG images) uit SVG source | `bun run generate:brand` |
| `lighthouse-scan.mjs` | Lighthouse CI audit voor performance, accessibility, SEO | `bun run lighthouse` |

## Prerendering (`prerender.ts`)

- Genereert static HTML voor alle routes: `/`, `/voorbeeld/:sector/:stijl` (30), `/start/:stap` (6), `/componenten/:id` (N)
- Client hydrateert daarna (React 19 hydration)
- **Let op**: geen `window`/`matchMedia`/randomness tijdens eerste render — gebruik `useMediaQuery` patroon
- Output in `dist/` (Vite) + `out/` (prerendered HTML)

## Brand generatie (`generate-brand.mjs`)

- Leest source SVG uit `public/brand/`
- Genereert: favicon set, apple-touch-icon, PWA icons (192/512), OG image, email logo variants
- Output naar `public/` en `public/brand/`

## Lighthouse scan

- Draait gegenereerde `dist/` of `out/` naar Lighthouse CI
- Output JSON + HTML rapport in `lh-scores.json` / `leads/`

## Toevoegen script

1. Maak `.mjs` (ESM) of `.ts` in deze map
2. Voeg toe aan `package.json` scripts
3. Zorg dat `bun run check` het script valideert (indien relevant)
4. Documenteer in deze README
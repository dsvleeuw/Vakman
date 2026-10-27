# public — Static Assets & Netlify Config

Statische bestanden die direct worden geserveerd (geen Vite processing) + Netlify redirects.

## Bestanden in root

| Bestand | Doel |
|---------|------|
| `favicon.svg` | Hoofd favicon (SVG, scalable) |
| `icon-192.png` / `icon-512.png` | PWA icons (manifest) |
| `apple-touch-icon.png` | iOS home screen icon |
| `og-image.png` | Open Graph social share image (1200×630) |
| `site.webmanifest` | PWA manifest (naam, icons, theme_color) |
| `_redirects` | Netlify redirects (SPA fallback, legacy query rewrites) |

## Submappen

### `assets/`
Algemene assets (afbeeldingen, documenten) die niet bij een specifiek vak horen.
- `aistudio/` — AI gegenereerde design assets (voorbeeld)

### `brand/`
Alle Klusbaas brand assets:
- `klusbaas-logo.svg` — Hoofdlogo
- `klusbaas-logo-light.svg` — Licht variant (donker achtergrond)
- `klusbaas-mark.svg` / `klusbaas-mark-light.svg` — Icon mark (zonder tekst)
- `klusbaas-logo-email.png` — Email signature variant
- `klusbaas-icon-square.svg` — Square icon voor favicon/app icon

### `github-history/`
De losse GitHub-geschiedenispagina, bereikbaar via `/github-history/index.html`.
Deze staat los van de Klusbaas-homepage.

### `kaart/`
Data voor prospect kaart weergave:
- `leads.example.json` — Voorbeeld data structuur

### `video/`
Video assets voor marketing video's (Remotion):
- `audio/` — Voice-over (`.mp3`), background muziek
- `audio/sfx/` — Sound effects (`.wav`, `.mp3`)
- Achtergrond video's, overlays, textures

## Netlify Redirects (`_redirects`)

```
# Legacy query parameters → nieuwe routes
/?sector=:sector&style=:style&view=site  /voorbeeld/:sector/:stijl  301
/?autostart=1                            /start/vak                  301

# SPA fallback
/*  /index.html  200
```

## Conventies

- Bestandsnamen: kebab-case (`og-image.png`, niet `ogImage.png`)
- Afbeeldingen geoptimaliseerd (SVG waar mogelijk, WebP/AVIF voor raster)
- Geen grote bestanden (>1MB) — gebruik CDN voor video's
- `generate-brand.mjs` in `scripts/` genereert de brand assets
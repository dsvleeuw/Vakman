# src — Application Source Code

De hoofdfolder voor alle React/TypeScript broncode van de Klusbaas demo website generator.

## Structuur

```
src/
├── components/      # React componenten (UI, tools, extras)
├── data/            # Statische data: sectoren, paletten, abonnementen, component catalogus
├── hooks/           # Custom React hooks (router, media query, lead formulier, etc.)
├── server/          # Server-side handlers (Netlify Functions): leads, quotes, newsletters, PDF, storage
├── utils/           # Pure utility functies (pricing, contact, router, analytics, etc.) + tests
├── video/           # Remotion video specificatie voor marketing video's
└── *.tsx            # App entry points, types, globale styles
```

## Belangrijkste bestanden

- `App.tsx` — Root component, routing, lazy-loading van `SiteView`/`WizardView`/`ComponentGallery`
- `main.tsx` / `entry-server.tsx` — Client & SSR entry points (Vite + React 19)
- `index.css` — Tailwind v4 imports, CSS custom properties, shared keyframes
- `types.ts` — Gedeelde TypeScript interfaces (`ActiveSiteData`, `Sector`, `Plan`, etc.)

## Conventies

- **Alle user-facing copy is Nederlands** (euro formatting `€ 1.250`, "exclusief btw")
- Logica blijft **zuiver in `utils/`** met unit tests naast de bron (`*.test.ts`)
- Componenten lezen kleuren/fonts/radii van `ActiveSiteData` palette tokens (`site.accent`, `site.onAccent`, `site.radiusLg`…)
- Contact acties gaan via `utils/contact.ts` helpers (`buildWhatsAppUrl`, `buildTelUrl`)
- Iconen uit `lucide-react`; controleren of export bestaat voordat je gebruikt
- Geen secrets committen; Firebase web key in `firebase-applet-config.json` is publiek by design
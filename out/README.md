# out — Prerendered Static HTML Output

Output map voor `bun run build` (prerender stap). Bevat alle statisch gegenereerde HTML pagina's voor SEO en snelle eerste laad.

## Inhoud na `bun run build`

```
out/
├── index.html                    # Homepage (/)
├── voorbeeld/
│   ├── loodgieter/
│   │   ├── 1/index.html         # Stijl 1
│   │   ├── 2/index.html         # Stijl 2
│   │   └── ...
│   ├── elektricien/
│   └── ... (30 sector+stijl combinaties)
├── start/
│   ├── vak/index.html           # Stap 1: vak kiezen
│   ├── stijl/index.html         # Stap 2: stijl kiezen
│   ├── gegevens/index.html      # Stap 3: bedrijfsgegevens
│   ├── diensten/index.html      # Stap 4: diensten/selectie
│   ├── afspraak/index.html      # Stap 5: afspraak/plan
│   └── klaar/index.html         # Stap 6: klaar/resultaat
├── componenten/
│   └── :id/index.html           # Component gallery detail
├── sitemap.xml                   # Alle routes voor zoekmachines
├── robots.txt                    # Crawler instructies
└── _headers                      # Netlify headers (CSP, cache, etc.)
```

## Generatie

- `scripts/prerender.ts` rendert alle routes via `renderToString` (React 19)
- Client-side hydrateert daarna (`main.tsx` → `hydrateRoot`)
- **Vereist**: geen `window`/`matchMedia`/randomness in eerste render

## Deployment

- Netlify serveert `out/` als publish directory
- `_redirects` uit `public/` wordt gekopieerd
- `_headers` voor security headers (CSP, HSTS, etc.)

## Lokaal testen

```bash
bun run build
npx serve out -p 3000
# of
bun run preview  # als geconfigureerd
```

## Git

- **Niet committen** — gegenereerde output
- `.gitignore` bevat `out/`
- Netlify bouwt & deployt automatisch op push
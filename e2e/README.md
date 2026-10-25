# e2e — End-to-End Tests (Playwright)

Browser-gebaseerde integratie tests die de volledige gebruikersflows valideren.

## Tests

| Bestand | Geteste flows |
|---------|---------------|
| `routes.spec.ts` | Alle 39 routes laden zonder fouten (200/301), legacy query redirects, SPA fallback |
| `wizard.spec.ts` | Volledige 6-stap wizard: vak → stijl → gegevens → diensten → afspraak → klaar; form validatie, navigatie, quote generatie |

## Draaien

```bash
# Alle e2e tests
bun run test:e2e

# Alleen routes
bun run test:e2e -- routes.spec.ts

# Headed mode (browser zichtbaar)
bun run test:e2e -- --headed

# Debug mode
bun run test:e2e -- --debug
```

## Config

- `playwright.config.ts` in project root
- Base URL: `http://localhost:3000` (dev server moet draaien)
- Browsers: Chromium, Firefox, WebKit
- Mobile viewports: iPhone 12, Pixel 5

## Test data

- Gebruikt test sectoren/stijlen uit `tradesData.ts`
- Mock data via `test.use({ storageState: ... })` voor auth flows
- Geen echte API calls — dev server middleware handelt `/api/lead` af

## CI

- Draait in GitHub Actions / Netlify build
- Artifacts: screenshots, traces, video on failure
- Timeout: 30s per test, 120s totaal

## Nieuwe test toevoegen

1. Maak `.spec.ts` in deze map
2. Gebruik `test.describe` voor logische groepering
3. `page.goto('/route')` → assertions op `page.locator()`
4. Voor formulieren: `page.fill()`, `page.click()`, `page.waitForURL()`
5. Screenshots: `await page.screenshot({ path: '...' })`
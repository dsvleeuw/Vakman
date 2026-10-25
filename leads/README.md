# leads — Lead Data & Export Bestanden

Lokaal gegenereerde lead data (development) en export bestanden voor analyse. **Niet in productie gebruikt** — productie leads gaan naar Netlify Blobs.

## Bestanden

| Bestand | Oorsprong | Doel |
|---------|-----------|------|
| `leads-haarlemmermeer.example.csv` | Handmatig/export | Voorbeeld CSV export voor Haarlemmermeer regio |
| `lh-scores.json` | `scripts/lighthouse-scan.mjs` | Lighthouse CI scores (performance, a11y, SEO) |

## Development data

Tijdens lokaal development (`bun run dev`) worden leads opgeslagen in `.data/` (gitignored):
- `.data/leads/` — JSON bestanden per lead
- `.data/quotes/` — JSON + PDF per quote

## Productie

- Netlify Blobs stores: `leads` en `quotes`
- Geen lokale bestanden
- Toegang via Netlify dashboard of API

## CSV Export formaat

```csv
id,sector,company,city,email,phone,package,addons,channel,createdAt,quoteTotalCents
lead_abc123,loodgieter,"Jansen Installaties",Haarlem,info@jansen.nl,0612345678,professional,"['emergency']",email,2026-01-15T10:30:00Z,245000
```

## Analyse

- `lh-scores.json` bevat Lighthouse resultaten voor monitoring
- CSV exports voor sales team / CRM import
- Geen PII in git — `.data/` en exports zijn gitignored
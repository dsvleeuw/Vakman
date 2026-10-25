# public/kaart — Prospect Kaart Data

Data bestanden voor de interactieve prospect kaart (map view) op de marketing pagina.

## Bestanden

| Bestand | Doel |
|---------|------|
| `leads.example.json` | Voorbeeld structuur voor prospect data |

## Datastructuur (`leads.example.json`)

```json
{
  "prospects": [
    {
      "id": "prospect-1",
      "sector": "loodgieter",
      "company": "Jansen Installaties",
      "city": "Haarlem",
      "lat": 52.3874,
      "lng": 4.6462,
      "score": 85,
      "website": "https://jansen-installaties.nl",
      "phone": "06 12345678"
    }
  ]
}
```

## Gebruik

- Geladen door `ProspectMapView` component
- Coördinaten in WGS84 (lat/lng)
- `score` = lead quality (0-100)
- Sector matcht `tradesData.ts` sector IDs

## Productie data

Echte prospect data komt via Netlify Blobs (`leads` store) of externe API — **niet** in deze map committen. Deze map bevat alleen voorbeeld/fallback data voor development.
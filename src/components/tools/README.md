# src/components/tools — Smart Tools per Vak

Interactieve tools die specifiek zijn voor een vak (loodgieter, elektricien, schilder, etc.). Deze worden in de demo site getoond als "slimme tool" en helpen bezoekers direct een inschatting te maken of actie te ondernemen.

## Tools

| Bestand | Vak | Beschrijving |
|---------|-----|--------------|
| `SurfaceCalculator.tsx` | Schilder, Stukadoor | Bereken oppervlakte & schatting materiaal/kosten. Het icoon en de naam van het werk volgen het vak (`site.id`). |
| `EmergencyButton.tsx` | Loodgieter, Elektricien | Grote CTA voor spoeddienst (bel/Whatsapp direct) |
| `FaultReportForm.tsx` | Alle vakken | Gestructureerd storingsformulier met foto upload |
| `ProjectTimeline.tsx` | Aannemer, Tuinier | Visualisatie projectfasen & planning |
| `RoofCheckForm.tsx` | Dakdekker | Gratis dakcheck: type dak, klacht en urgentie. De aanvraag komt binnen als aanvraag (`type: 'roof-check'`). |

## Basis: `TradeTool.tsx`

Abstracte basis component die gemeinsame functionaliteit biedt:
- Sector-aware styling via palette tokens
- Analytics tracking via `track()`
- Responsive layout
- Error boundary wrapper

## Nieuwe tool toevoegen

Zie [docs/adding-a-trade-tool.md](../../docs/adding-a-trade-tool.md) voor de volledige procedure:
1. Extend `TradeTool` of maak nieuwe component
2. Registreer in `tradesData.ts` onder `sector.tool`
3. Voeg icons toe uit `lucide-react`
4. Schrijf tests
5. Update documentatie

## Styling

- Gebruik `site.accent`, `site.onAccent`, `site.card`, `site.radiusLg`
- Mobile-first, touch-friendly controls
- Accessible form labels, focus states, ARIA
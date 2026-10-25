# src/video/scenes — Individuele Video Scènes

Elke scène is een zelfstandige React component die één visueel segment van de marketing video rendert.

## Scene Interface

```tsx
interface SceneProps {
  t: number;           // Huidige frame (0-based)
  // Optioneel: extra props via composition inputProps
}
```

## Beschikbare scènes

| Bestand | Beschrijving | Duur (frames) |
|---------|--------------|---------------|
| `IntroScene.tsx` | Opening: logo, tagline, animatie | 120 (5s @ 24fps) |
| `ProblemScene.tsx` | Pijnpunten van vakman zonder website | 180 |
| `SolutionScene.tsx` | Klusbaas oplossing: demo site in 1 min | 240 |
| `DemoScene.tsx` | Live demo van wizard/site generator | 300 |
| `PricingScene.tsx` | Abonnementen & prijzen | 150 |
| `CTAScene.tsx` | Call-to-action: "Start vandaag" | 90 |
| `OutroScene.tsx` | Afsluiting: logo, website, contact | 60 |

## Helpers

- `useVideoConfig()` — `{ fps, durationInFrames, width, height }`
- `interpolate()` — Remotion easing/interpolatie
- `spring()`, `animate()` — Animatie helpers
- `Audio` component — Gesynchroniseerde audio playback

## Styling

- Tailwind CSS werkt in Remotion (via PostCSS)
- Gebruik `absolute` positioning voor precise layout
- Kleuren: Klusbaas brand palette (stone/amber) of sector palettes
- Fonts: `site.fontHeading` / `site.fontBody` via CSS variables

## Audio sync

Voice-over timing in `video-script.json` (frame-accurate). SFX in `public/video/audio/sfx/`.

## Toevoegen nieuwe scène

1. Maak `NieuweScene.tsx` in deze map
2. Exporteer default component
3. Voeg toe aan `composition.tsx` in `Sequence` met `from`/`to` frames
4. Update `video-script.json` voor voice-over timing
5. Test in Remotion Studio
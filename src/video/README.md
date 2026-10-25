# src/video — Remotion Video Specificatie

Marketing video's gegenereerd met Remotion (React voor video). Bevat scène definities, audio, en compositie logic.

## Structuur

```
src/video/
├── scenes/           # Individuele scènes (React componenten)
├── composition.tsx   # Hoofdcompositie (tijdlijn, sequencing)
├── audio/            # Audio assets & timing (wordt gegenereerd)
└── *.ts              # Config, types, helpers
```

## Scènes (`scenes/`)

Elke scène is een React component die `props: { t: number }` ontvangt (tijd in frames). Gebruik `useVideoConfig()` voor fps, duration, width, height.

## Belangrijkste concepten

- **Composition** — Definieert duration, fps, dimensions, en welke scènes wanneer spelen
- **Sequence** — Rijtjes scènes met overlap/transition
- **Audio** — Voice-over, muziek, SFX gesynchroniseerd met frames
- **Props drilling** — Scene props via composition `inputProps`

## Development

```bash
# Remotion studio (live preview)
bun run remotion studio

# Render naar MP4
bun run remotion render composition output.mp4

# Still frames
bun run remotion still composition frame.png --frame=150
```

## Config

`remotion.config.ts` — Root config (output locatie, webpack overrides, fonts).

## Assets

- Video assets in `public/video/` (achtergronden, overlays)
- Audio in `public/video/audio/` (voice-over, SFX in `sfx/`)
- Unsplash foto's via sector `pool` IDs (geen externe hosts)

## Deploy

Gerenderde video's worden geüpload naar CDN/Cloudflare Stream en in marketing pagina's ingesloten via `<video>` of Remotion player.
# public/video — Video Assets voor Remotion

Raster/video/audio assets die door Remotion composities worden gebruikt. **Geen broncode** — alleen gegenereerde/geleverde assets.

## Structuur

```
public/video/
├── audio/           # Voice-over, background muziek
│   └── sfx/         # Sound effects (UI clicks, whooshes, transitions)
├── backgrounds/     # Achtergrond video's/loop animations
├── overlays/        # Overlay graphics (lower thirds, bugs, transitions)
└── textures/        # Textures, grain, light leaks
```

## Naming conventie

- `{scene-name}-{variant}.{ext}` — bijv. `intro-bg-loop.webm`, `solution-vo-nl.mp3`
- SFX: `sfx-{name}.wav` — bijv. `sfx-click.wav`, `sfx-whoosh.wav`

## Formaten & Specificaties

| Type | Formaat | Specificaties |
|------|---------|---------------|
| Video | WebM (VP9), MP4 (H.264) | 1920×1080, 24/30fps, <50MB |
| Audio (VO) | MP3, 128kbps+ | 44.1kHz, stereo |
| Audio (SFX) | WAV (44.1kHz) of MP3 | Korte clips (<3s), mono/stereo |
| Images | WebP, AVIF, PNG | 1920×1080 max, geoptimaliseerd |

## Generatie

- Video rendering: `bun run remotion render` → output in `dist/video/` of CDN
- Assets hier zijn **input** voor Remotion, niet output
- Voice-over: opnames in `public/video/audio/` → gesynced via `video-script.json`

## Git

- Alleen kleine assets (<10MB) in git
- Grote video bestanden → Git LFS of CDN (Cloudflare Stream, Mux)
- `public/video/audio/sfx/` mag in git (klein)
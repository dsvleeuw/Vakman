# public/video/audio — Audio Assets

Voice-over, background muziek, en sound effects voor marketing video's.

## Structuur

```
audio/
├── voiceover/       # Gesproken tekst per scène (NL)
│   ├── intro-vo.mp3
│   ├── problem-vo.mp3
│   ├── solution-vo.mp3
│   ├── demo-vo.mp3
│   ├── pricing-vo.mp3
│   ├── cta-vo.mp3
│   └── outro-vo.mp3
├── music/           # Achtergrondmuziek (loopable)
│   ├── ambient-loop.mp3
│   └── upbeat-loop.mp3
└── sfx/             # Sound effects (zie sfx/README.md)
```

## Specificaties

- **Voice-over**: NL, professionele spreker, 44.1kHz/128kbps MP3
- **Muziek**: Loopable, royalty-free, subtiel (onder VO)
- **Loudness**: -16 LUFS (broadcast standaard voor web)
- **Timing**: Frame-accuraat gesynced via `video-script.json`

## Productie flow

1. Script schrijven in `video-script.json`
2. Voice-over opnemen/let AI genereren
3. Bestanden hier plaatsen met matching namen
4. Remotion `Audio` component speelt gesynchroniseerd af

## Git

- Alleen finale assets committen
- Ruwe opnames/outtakes → niet in repo
# public/video/audio/sfx — Sound Effects

Korte geluidseffecten voor video transitions, UI interacties, emphasis.

## Bestanden

| Bestand | Gebruik |
|---------|---------|
| `sfx-click.wav` | Button click, CTA press |
| `sfx-whoosh.wav` | Scene transitions, slide-ins |
| `sfx-pop.wav` | Counter animations, number reveal |
| `sfx-chime.wav` | Success states, checkmarks |
| `sfx-ambient.wav` | Subtiele achtergrond atmosfeer |

## Specificaties

- **Formaat**: WAV, 44.1kHz, 16-bit (beste kwaliteit voor korte SFX)
- **Duur**: 0.1s – 3s
- **Loudness**: -20 dBFS peak (laag genoeg voor mix onder VO/muziek)
- **Licentie**: Royalty-free (Freesound, Eigen opnames, of gegenereerd)

## Gebruik in Remotion

```tsx
import { Audio } from 'remotion';
import clickSfx from '../../../../public/video/audio/sfx/sfx-click.wav';

<Audio src={clickSfx} startFrom={frame} endAt={frame + 12} />
```

## Toevoegen

1. Plaats `.wav` in deze map
2. Naamgeving: `sfx-{beschrijving}.wav`
3. Test in Remotion Studio (volume, timing)
4. Commit
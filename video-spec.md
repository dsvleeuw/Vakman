# Klusbaas Motion Graphic Video Specification

**Project:** Klusbaas Brand Video  
**Duration:** 150 seconds (2:30)  
**Dimensions:** 1920 × 1080 (Full HD)  
**Frame Rate:** 30 fps  
**Style:** Clean, professional, trade-focused motion graphics  
**Mood:** Confident, trustworthy, energetic but grounded  
**Language:** Dutch (Netherlands)  
**Voice:** nl-NL-MaartenNeural, +8% rate, 0.5s lead, 1.0s tail  

---

## Audio Strategy

### Background Music
- **Style:** Modern corporate/tech with subtle Dutch folk influence (acoustic guitar + light electronic)
- **Mood:** Confident, forward-moving, trustworthy
- **Energy Level:** Medium (5/10) — builds to Medium-High (7/10) at peak scenes
- **Key Sync Points:**
  - 0s: Hook impact — music starts with subtle pulse
  - 12s (Scene 2): Tension build — add percussion
  - 36s (Scene 3): Reveal — full arrangement kicks in
  - 54s (Scene 4): Demo showcase — bright, rhythmic
  - 72s (Scene 5): Styles — playful variation
  - 88s (Scene 6): Trades — steady, confident
  - 104s (Scene 7): Smart tools — tech-forward feel
  - 120s (Scene 8): Packages — warm, decisive
  - 134s (Scene 9): Proof — reassuring resolution
  - 146s (Scene 10): Process — clean, simple
  - 160s (Scene 11): CTA — final resolve, fade out
- **Volume Envelope:** Start at 40%, duck to 30% during voiceover, swell to 60% at transitions, fade to 20% at end

### Sound Effects
| Time | SFX | Purpose |
|------|-----|---------|
| 0.0s | Low impact "thud" + subtle reverb | Hook anchor |
| 2.5s | Cash register "cha-ching" (soft) | Money loss pain point |
| 5.0s | Phone notification "pop" | WhatsApp button |
| 7.0s | Calendar "click" + pen scribble | Planner fills itself |
| 9.0s | Calculator beep sequence | Price calculator |
| 11.0s | Map pin "drop" | Postcode check |
| 13.0s | Review star "ping" ×3 | Google reviews |
| 15.0s | Checkmark "pop" | Live in 14 days |
| 17.0s | Magic "whoosh" | Style reveal transitions |
| 21.0s | Hammer "tap" | Timmerman |
| 23.0s | Shovel "thud" | Hovenier |
| 25.0s | Paint roller "swish" | Schilder |
| 27.0s | Water drop "plop" + pipe clang | Loodgieter |
| 29.0s | Electric "zap" | Elektricien |
| 31.0s | Trowel "scrape" | Stukadoor |
| 33.0s | Emergency siren (very brief) | Spoedknop |
| 35.0s | Alert "ding" | Storingsmelding |
| 37.0s | Tape measure "extend" | m² calculator |
| 39.0s | Timeline "snap" | Projecttijdlijn |
| 41.0s | Calendar "pop" + sync "whoosh" | Boekingskalender |
| 43.0s | Cloud upload "whoosh" | Google Drive |
| 45.0s | Price tag "flip" ×3 | Package tiers |
| 49.0s | Badge "stamp" ×3 | Certifications |
| 51.0s | Checkmark "pop" ×4 | Process steps |
| 53.0s | Phone "ring" vibration | Call CTA |
| 55.0s | QR "scan" beep | QR code |
| 57.0s | Logo "stamp" + final chord | Brand lockup |

### Voiceover
- **File:** `voiceover.wav` (to be generated via Azure TTS)
- **Processing:** Light compression, -3dB peak, high-pass at 100Hz
- **Cue Markers:** Each `{cue}` in script = animation trigger at first word after marker

---

## Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Primary Dark | #1A1A2E | Backgrounds, primary text |
| Primary Blue | #0F4C81 | Brand accent, CTAs, highlights |
| Accent Amber | #E8A838 | Warm highlights, prices, trust badges |
| Success Green | #2D7D46 | Checkmarks, live status, positive |
| Warning Red | #C0392B | Pain points, alerts (sparingly) |
| Surface White | #F8F9FA | Cards, light backgrounds |
| Surface Gray | #E9ECEF | Dividers, subtle backgrounds |
| Text Primary | #212529 | Body text |
| Text Secondary | #6C757D | Captions, metadata |
| Text on Accent | #FFFFFF | On Primary Blue |
| Text on Amber | #1A1A2E | On Accent Amber |

---

## Typography

| Role | Font | Size | Weight | Tracking |
|------|------|------|--------|----------|
| Hero Headline | Inter | 72px | 700 | -0.5px |
| Section Title | Inter | 48px | 600 | 0 |
| Body Large | Inter | 32px | 400 | 0 |
| Body Medium | Inter | 24px | 400 | 0 |
| Body Small | Inter | 18px | 400 | 0 |
| Caption | Inter | 16px | 500 | 0.5px |
| Price | Inter | 56px | 700 | -0.5px |
| Label | Inter | 20px | 600 | 0.5px |

---

## Animation Defaults

| Type | Config |
|------|--------|
| Entrance (fade+slide) | `spring({damping: 200, stiffness: 300, mass: 1})` from `opacity: 0, y: 30` |
| Entrance (scale) | `spring({damping: 220, stiffness: 400})` from `opacity: 0, scale: 0.9` |
| Exit | `spring({damping: 250, stiffness: 500})` to `opacity: 0, y: -20` (1.5× faster than entrance) |
| Text Reveal (per word) | `spring({damping: 180, stiffness: 280})` staggered 3 frames |
| Counter/Number | `interpolate(frame, [0, 60], [0, target], {extrapolate: 'clamp'})` |
| Icon Pulse | `spring({damping: 150, stiffness: 200})` scale 1 → 1.15 → 1 |
| Card Flip | `spring({damping: 220, stiffness: 350})` rotateY 90° → 0° |
| Page Transition | `spring({damping: 240, stiffness: 400})` x: 0 → -1920 (slide) |

---

## Scene Breakdown

### Scene 1: The Hook — Pain (0s – 12s)

**Visual Description:**
- Dark gradient background (#1A1A2E → #0F4C81 radial)
- Center: Large animated "🌐" icon with red slash through it (pulsing)
- Below: "Geen website?" in Hero Headline, white
- Pain points appear as red "receipt" cards sliding up from bottom:
  - "Elke dag klanten verliezen" (with leaking bucket icon 💧)
  - "€ 15.000 – € 30.000 per jaar" (large Price text, Warning Red)
  - "Zolang je onzichtbaar bent" (Body Medium, Text Secondary)

**Animation Details:**
- 0.0–0.5s: Background fade in, icon scales from 0 with bounce
- 0.5–2.0s: "Geen website?" word-by-word reveal (3-frame stagger)
- 2.0–4.0s: First pain card slides up + fade, bucket icon drips (loop 2×)
- 4.0–6.0s: Second card slides up, number counts up €0 → €30.000
- 6.0–8.0s: Third card slides up, "onzichtbaar" highlights in Warning Red
- 8.0–12.0s: All elements hold, subtle breathing animation on cards

**Timing (frames @30fps):**
- 0–15: Background + icon entrance
- 15–60: Headline reveal
- 60–120: Pain card 1
- 120–180: Pain card 2 (counter animate 120–160)
- 180–240: Pain card 3
- 240–360: Hold + micro-interactions

**Audio:**
- Music: 40%, subtle pulse on downbeats
- SFX @0s: Low impact thud
- SFX @2.5s: Soft cha-ching on money reveal
- SFX @5.5s: Subtle "leak" drip on bucket

**Transition to Scene 2:** 
- Cards fold down like closing laptop (rotateX 0→90°)
- Background shifts to cooler blue
- "Facebook" logo icon slides in from right

**Focus Points:**
1. Slashed globe icon (0–2s)
2. Money amount counter (4–6s)
3. "Onzichtbaar" highlight (6–8s)

---

### Scene 2: False Solutions (12s – 26s)

**Visual Description:**
- Split screen: left "Facebook pagina" (phone mockup), right "Werkspot" (listing card)
- Phone shows Facebook page — text too small, pinch-zoom gesture fails
- Werkspot card shows "Jouw concurrent" above client, "Betaal om te staan" badge
- Center divider: "STOP" button (large, Warning Red, pulsing)

**Animation Details:**
- 12.0–14.0s: Split screen slides in from sides (x: ±960 → 0)
- 14.0–16.0s: Phone mockup pinch-zoom fails (shake animation)
- 16.0–18.0s: Werkspot card highlights "concurrent" in red
- 18.0–20.0s: "Betaal om te staan" badge pulses
- 20.0–22.0s: STOP button scales up with impact
- 22.0–26.0s: Press STOP — screen shatters (particle burst)

**Timing:**
- 360–420: Split entrance
- 420–480: Phone fail
- 480–540: Werkspot highlight
- 540–600: Badge pulse
- 600–660: STOP impact
- 660–780: Shatter + transition

**Audio:**
- Music: 45%, added light percussion
- SFX @14s: Phone shake "thud"
- SFX @16s: Error "buzz"
- SFX @20s: Badge pulse "pop"
- SFX @22s: Heavy impact + glass shatter

**Transition to Scene 3:**
- Shatter particles form Klusbaas logo
- Logo resolves from particles (0.8s)
- Clean white background fades in

**Focus Points:**
1. STOP button (20–22s)
2. Shatter → logo formation (22–24s)

---

### Scene 3: The Reveal (26s – 36s)

**Visual Description:**
- Clean white background (#F8F9FA)
- Center: Klusbaas logo (wordmark + icon) — large, breathes in
- Below: "Jouw vak. Jouw website." (Section Title, Primary Dark)
- Sub: "Een echte website. Vandaag besteld, over 14 dagen live." (Body Large)
- Right side: Phone mockup showing live website preview (animated scroll)

**Animation Details:**
- 26.0–27.0s: Logo resolves from particles, subtle glow pulse
- 27.0–29.0s: Tagline word-by-word reveal
- 29.0–31.0s: Sub-line types out (typewriter effect)
- 31.0–36.0s: Phone mockup scrolls through homepage demo

**Timing:**
- 780–810: Logo resolve
- 810–870: Tagline reveal
- 870–930: Sub-line typewriter
- 930–1080: Phone demo scroll

**Audio:**
- Music: 55%, full arrangement enters (warm, confident)
- SFX @26s: Magic whoosh (logo resolve)
- SFX @27s: Soft "ding" per tagline word
- SFX @31s: Typewriter ticks (subtle)
- SFX @34s: Scroll "whoosh" on phone

**Transition to Scene 4:**
- Phone mockup expands to full screen
- Background shifts to subtle grid pattern

**Focus Points:**
1. Logo resolve (26–27s)
2. "14 dagen live" (29–31s)
3. Phone demo (31–36s)

---

### Scene 4: Feature Showcase (36s – 54s)

**Visual Description:**
- Horizontal carousel of 6 feature cards (auto-advance, 2.5s each)
- Each card: Icon (large, Primary Blue) + Title (Label) + Description (Body Small)
- Cards have subtle hover/tap state preview

**Features:**
1. **Heldere prijzen** — Price tag icon, "Diensten met heldere prijzen"
2. **WhatsApp-knop** — WhatsApp logo, "Direct openen in app"
3. **Afsprakenplanner** — Calendar icon, "Vult zichzelf in"
4. **Prijscalculator** — Calculator icon, "Offertes in seconden"
5. **Postcodecheck** — Map pin icon, "Jouw werkgebied"
6. **Google Reviews** — Star icons, "Automatisch binnenkomen"

**Animation Details:**
- 36.0–36.5s: Carousel container slides up
- Each card (2.5s = 75 frames):
  - 0–10f: Card entrance (scale + fade, staggered 5f per element)
  - 10–55f: Hold + micro-animation (icon pulse, text highlight)
  - 55–65f: Exit (slide left, fade)
  - Next card enters at 50f (overlap)
- 54.0s: Final card holds, "Geen abonnement. Eén vast tarief" banner slides in bottom

**Timing:**
- 1080–1095: Container entrance
- 1095–1170: Card 1 (Prijzen)
- 1170–1245: Card 2 (WhatsApp)
- 1245–1320: Card 3 (Planner)
- 1320–1395: Card 4 (Calculator)
- 1395–1470: Card 5 (Postcode)
- 1470–1545: Card 6 (Reviews)
- 1545–1620: Final banner

**Audio:**
- Music: 50%, rhythmic, consistent
- SFX per card (at 10f): Price tag flip, WhatsApp pop, Calendar click, Calculator beeps, Map pin drop, Star pings
- SFX @54s: Checkmark pop on "Eén vast tarief"

**Transition to Scene 5:**
- Carousel folds into 5 style cards (accordion)

**Focus Points:**
- Each card's icon pulse at 10f
- Final banner "Eén vast tarief"

---

### Scene 5: Five Styles (54s – 70s)

**Visual Description:**
- 5 style cards in horizontal row (scrollable on mobile, all visible desktop)
- Each card: Style name + thumbnail preview (color palette swatches + font sample)
- Active card centered, larger, with glow

**Styles:**
1. **Vakwerk** — Warm serif, amber/brown palette, classic
2. **Helder** — Clean sans, blue/white, full-width
3. **Signaal** — Bold display, high contrast, signal colors
4. **Avond** — Dark mode, gold accents, premium
5. **Puur** — Minimal, monospace accents, content-first

**Animation Details:**
- 54.0–55.0s: Cards fan out from center (staggered 3f)
- 55.0–58.0s: Auto-scroll through styles (each 0.6s center)
- 58.0–62.0s: Tap/interaction demo — user selects, card expands to show full preview
- 62.0–66.0s: "Jij kiest wat bij jou past" — text appears under selection
- 66.0–70.0s: Cards collapse back, transition to trades

**Timing:**
- 1620–1650: Fan out
- 1650–1740: Auto-scroll (5 × 18f)
- 1740–1860: Interaction demo
- 1860–1980: Selection confirm
- 1980–2100: Collapse + transition

**Audio:**
- Music: 50%, playful variation per style (subtle instrumentation change)
- SFX @54s: Magic whoosh (fan out)
- SFX per style (at center): Subtle "ding" with character
- SFX @62s: Selection "pop" + expand whoosh
- SFX @66s: Confirm "chime"

**Transition to Scene 6:**
- Style cards flip to reveal trade icons (rotateY)

**Focus Points:**
- Active style card (centered, glowing)
- "Jij kiest" confirmation text

---

### Scene 6: Six Trades (70s – 84s)

**Visual Description:**
- Grid of 6 trade cards (2×3), each with:
  - Trade icon (custom illustration)
  - Trade name (Label)
  - 3 service examples (Caption)
- Cards animate in with stagger

**Trades:**
1. **Timmerman** — 🪚 Kozijnen, Trappen, Kasten op maat
2. **Hovenier** — 🌿 Tuinen, Beplanting, Onderhoud
3. **Schilder** — 🎨 Binnen, Buiten, Lakwerk
4. **Loodgieter** — 🚿 Spoed, Sanitair, Verduurzaming
5. **Elektricien** — ⚡ Installaties, Slimme huizen, Laadpalen
6. **Stukadoor** — 🏗️ Pleisterwerk, Isolatie, Afwerking
7. *Note: "En overige vakken" as 7th card or footer*

**Animation Details:**
- 70.0–71.0s: Grid container scales in
- 71.0–74.0s: Cards stagger in (5f stagger, spring entrance)
- 74.0–78.0s: Each card highlights on voiceover mention (icon pulse + border glow)
- 78.0–82.0s: Cards shuffle to show "En overige vakken" card
- 82.0–84.0s: Grid folds into single column for transition

**Timing:**
- 2100–2130: Container
- 2130–2220: Stagger entrance (6 cards × 15f)
- 2220–2340: Highlight sequence (sync with VO)
- 2340–2460: Shuffle + extra card
- 2460–2520: Fold transition

**Audio:**
- Music: 50%, steady confident rhythm
- SFX per trade (on highlight): Hammer tap, Shovel thud, Roller swish, Water drop+pipe, Electric zap, Trowel scrape
- SFX @78s: Card shuffle "whoosh"
- SFX @82s: Fold "thud"

**Transition to Scene 7:**
- Trade icons morph into smart tool icons

**Focus Points:**
- Highlighted trade card (sync with VO)
- Custom icons with trade personality

---

### Scene 7: Smart Tools (84s – 100s)

**Visual Description:**
- 6 tool cards in horizontal scroll, each showing:
  - Tool name + icon
  - Split view: "Klant ziet..." (left) ↔ "Jij doet..." (right)
  - Animated micro-demo of interaction

**Tools:**
1. **Spoedknop** — Klant: red button → Jij: phone rings
2. **Storingsmelding** — Klant: time slot picker → Jij: calendar fill
3. **m² Calculator** — Klant: dimensions input → Jij: instant quote
4. **Projecttijdlijn** — Klant: phase view → Jij: update button
5. **Boekingskalender** — Klant: book slot → Jij: Google Calendar sync
6. **Drive Sync** — Klant: accepts quote → Jij: Drive folder auto-populates

**Animation Details:**
- 84.0–85.0s: Tool cards slide in horizontally
- Each tool (2.5s = 75f):
  - 0–15f: Card entrance
  - 15–45f: Split demo animation (left→right flow)
  - 45–60f: Result state (checkmark, sync icon)
  - 60–75f: Hold + auto-advance
- 100.0s: "Slimme tools per vak" banner

**Timing:**
- 2520–2550: Container entrance
- 2550–2625: Spoedknop
- 2625–2700: Storingsmelding
- 2700–2775: m² Calculator
- 2775–2850: Projecttijdlijn
- 2850–2925: Boekingskalender
- 2925–3000: Drive Sync
- 3000–3000: Banner

**Audio:**
- Music: 50%, tech-forward feel (light synth)
- SFX per tool: Siren, Alert ding, Tape measure, Timeline snap, Calendar pop+whoosh, Cloud upload
- SFX @100s: Final tool "complete" chime

**Transition to Scene 8:**
- Tool cards stack vertically, become pricing cards

**Focus Points:**
- Split demo flow (left→right)
- Result state checkmarks

---

### Scene 8: Three Packages (100s – 114s)

**Visual Description:**
- 3 pricing cards side-by-side (desktop) / stacked (mobile)
- Each: Tier name, Price (large), Feature list, CTA button
- Pro card highlighted (Popular badge, Accent Amber glow)

**Packages:**
1. **Basis — € 595** — One-page, 5 stijlen, WhatsApp, Offerteformulier, Voor/na, Google Profiel, Lokale SEO, 2 weken
2. **Pro — € 995** — Meerdere pagina's, Prijscalculator, Postcodecheck, Reviews, Eigen .nl domein, 3 maanden service ⭐ POPULAIR
3. **Premium — € 1.795** — Slimme tool, Boekingskalender, Drive-sync, Persoonlijk advies, Voorrang

**Animation Details:**
- 100.0–101.0s: Cards flip in (rotateY 90→0, stagger 5f)
- 101.0–103.0s: Prices count up (€0 → target)
- 103.0–108.0s: Feature lists type out (staggered per item)
- 108.0–110.0s: Pro card "Popular" badge pops + glow pulse
- 110.0–114.0s: Cards breathe, CTA buttons pulse gently

**Timing:**
- 3000–3030: Flip entrance
- 3030–3090: Price counters (60f each)
- 3090–3240: Feature lists (15f per item × ~10 items)
- 3240–3300: Popular badge
- 3300–3420: Hold + pulse

**Audio:**
- Music: 55%, warm decisive
- SFX @100s: Card flip "whoosh" ×3
- SFX @101s: Price tag flip per card
- SFX @108s: Typewriter per feature (very subtle)
- SFX @110s: Badge pop + glow hum

**Transition to Scene 9:**
- Cards fade, trust badges fade in

**Focus Points:**
- Price counters
- Pro card Popular badge
- Feature checkmarks

---

### Scene 9: Social Proof (114s – 126s)

**Visual Description:**
- Clean layout with animated counters + trust badges
- Left: Large counter "492" → "Vakbedrijven in de regio"
- Right: 3 stat pills — "15 demo's deze week" | "5 klanten live deze maand"
- Bottom row: 4 trust badges (KVT, VCA Vol, AVG, Geen abonnement)

**Animation Details:**
- 114.0–115.0s: Counters count up (spring)
- 115.0–117.0s: Stat pills slide in from sides
- 117.0–121.0s: Badges stamp in (rotate + scale, stagger 5f)
- 121.0–126.0s: "Geen abonnement. Nooit verrassingen." types out center

**Timing:**
- 3420–3450: Main counter (492)
- 3450–3510: Stat pills (3 × 20f)
- 3510–3630: Badges (4 × 30f stagger)
- 3630–3780: Final tagline

**Audio:**
- Music: 50%, reassuring resolution
- SFX @114s: Counter tick (rapid, settles)
- SFX @117s: Pill slide "whoosh"
- SFX per badge: Stamp "thud"
- SFX @121s: Final typewriter + resolve chime

**Transition to Scene 10:**
- Badges fold into process steps

**Focus Points:**
- 492 counter
- Trust badges stamping

---

### Scene 10: Process (126s – 140s)

**Visual Description:**
- 4-step horizontal timeline (connected by line)
- Each step: Number circle, Title, Description, Checkmark
- Steps animate sequentially

**Steps:**
1. **Stap 1: Bellen of appen** — Phone + WhatsApp icons
2. **Stap 2: Persoonlijke demo** — Phone with demo screen
3. **Stap 3: Akkoord geven** — Document + checkmark
4. **Stap 4: Live. Klaar.** — Rocket/globe + checkmark
- Bottom: "Niet tevreden? Geld terug." (guarantee badge)

**Animation Details:**
- 126.0–127.0s: Timeline line draws (0→100%)
- Each step (3s = 90f):
  - 0–15f: Circle pops in
  - 15–45f: Text reveals
  - 45–60f: Checkmark animates (scale 0→1.2→1)
  - 60–90f: Line to next draws
- 138.0–140.0s: Guarantee badge pops up

**Timing:**
- 3780–3810: Line draw
- 3810–3900: Step 1
- 3900–3990: Step 2
- 3990–4080: Step 3
- 4080–4170: Step 4
- 4170–4200: Guarantee

**Audio:**
- Music: 45%, clean simple
- SFX @126s: Line draw "scribe"
- SFX per step: Circle pop, Checkmark pop (rising pitch)
- SFX @138s: Guarantee badge "stamp"

**Transition to Scene 11:**
- Timeline compresses into CTA bar

**Focus Points:**
- Sequential checkmarks
- "Live. Klaar." final step
- Guarantee badge

---

### Scene 11: CTA (140s – 156s)

**Visual Description:**
- Full-screen CTA section
- Large: "Bel vandaag nog" (Hero Headline)
- Phone number: "06 [pauze] [nummer]" (Price size, animated digits)
- QR code (large, scannable) with "Scan voor gratis demo"
- Klusbaas logo + tagline: "Jouw vak, jouw website"
- Sub-tagline: "De enige website die klanten binnenhaalt"

**Animation Details:**
- 140.0–141.0s: Background shifts to Primary Dark gradient
- 141.0–143.0s: Headline + sub reveal
- 143.0–145.0s: Phone number digits animate (slot machine style)
- 145.0–147.0s: QR code fades in + subtle scan line animation
- 147.0–150.0s: Logo + taglines reveal
- 150.0–156.0s: Hold, subtle pulse on phone/QR, music fade

**Timing:**
- 4200–4230: Background shift
- 4230–4290: Headlines
- 4290–4350: Phone number animation
- 4350–4410: QR code
- 4410–4500: Logo + taglines
- 4500–4680: Hold + fade

**Audio:**
- Music: 40% → 20% fade out over last 6s
- SFX @140s: Transition whoosh
- SFX @143s: Phone ring vibration
- SFX @145s: QR scan beep
- SFX @150s: Logo stamp + final chord
- SFX @156s: Silence

**Focus Points:**
- Phone number (clickable in video description)
- QR code (high contrast, scannable)
- Logo lockup

---

## Technical Specifications for Remotion

### Composition Structure
```tsx
// Root composition: 150s × 30fps = 4500 frames
<Composition
  id="klusbaas-brand-video"
  width={1920}
  height={1080}
  fps={30}
  durationInFrames={4500}
  component={Video}
/>
```

### Scene Sequence (using `<Sequence>`)
```tsx
<Sequence from={0} durationInFrames={360} component={Scene1_Hook} />
<Sequence from={360} durationInFrames={420} component={Scene2_FalseSolutions} />
<Sequence from={780} durationInFrames={300} component={Scene3_Reveal} />
<Sequence from={1080} durationInFrames={540} component={Scene4_Features} />
<Sequence from={1620} durationInFrames={480} component={Scene5_Styles} />
<Sequence from={2100} durationInFrames={420} component={Scene6_Trades} />
<Sequence from={2520} durationInFrames={480} component={Scene7_SmartTools} />
<Sequence from={3000} durationInFrames={420} component={Scene8_Packages} />
<Sequence from={3420} durationInFrames={360} component={Scene9_Proof} />
<Sequence from={3780} durationInFrames={420} component={Scene10_Process} />
<Sequence from={4200} durationInFrames={480} component={Scene11_CTA} />
```

### Assets Required
| Asset | Format | Specs |
|-------|--------|-------|
| Klusbaas Logo | SVG | Wordmark + icon, Primary Blue |
| Trade Icons (6) | SVG | Custom illustrations, 128×128 |
| Style Thumbnails (5) | PNG | 400×300, representative |
| Phone Mockup | PNG | 375×812, transparent UI area |
| Trust Badges (4) | SVG | KVT, VCA, AVG, No-subscription |
| Background Gradients | CSS | Generated in Remotion |
| Voiceover | WAV | 48kHz, 16-bit, -3dB peak |
| Background Music | MP3 | 150s, loopable sections |
| SFX Pack | WAV | 25 effects, -6dB peak |

### Spring Configurations
```ts
const springs = {
  entrance: { damping: 200, stiffness: 300, mass: 1 },
  entranceFast: { damping: 220, stiffness: 400, mass: 0.8 },
  exit: { damping: 250, stiffness: 500, mass: 0.7 },
  pulse: { damping: 150, stiffness: 200, mass: 1 },
  counter: { damping: 180, stiffness: 250, mass: 1 },
  cardFlip: { damping: 220, stiffness: 350, mass: 1 },
  stagger: { damping: 200, stiffness: 300, mass: 1 },
};
```

### Rendering Targets
| Target | Command |
|--------|---------|
| MP4 (H.264) | `npx remotion render KlusbaasVideo out/video.mp4` |
| ProRes (for edit) | `npx remotion render KlusbaasVideo out/video.mov --codec=prores` |
| GIF (preview) | `npx remotion render KlusbaasVideo out/preview.gif --image-format=gif` |
| Still (thumbnail) | `npx remotion still KlusbaasVideo out/thumb.png --frame=2700` |

---

## Quality Checklist

- [ ] All 11 scenes specified with frame-accurate timing
- [ ] Audio strategy complete (music, SFX, VO)
- [ ] Color palette defined with contrast ratios
- [ ] Typography scale consistent
- [ ] Animation defaults documented
- [ ] Spring configs provided
- [ ] Asset list complete
- [ ] Remotion composition structure defined
- [ ] Transitions designed between all scenes
- [ ] Focus points identified per scene
- [ ] Dutch copy matches voiceover script exactly
- [ ] Cue markers ({hook}, {pain}, etc.) mapped to animations
- [ ] Total duration: 150s (4500 frames @ 30fps)

---

## Next Steps

1. **Generate Voiceover** — Use Azure TTS with nl-NL-MaartenNeural, +8% rate
2. **Create Assets** — Design trade icons, style thumbnails, badges in Figma
3. **Implement in Remotion** — Build scenes as components using this spec
4. **Test Render** — Preview at 720p, verify timing sync
5. **Final Render** — 1080p MP4 + ProRes master
6. **Caption File** — Generate .srt from voiceover for accessibility

---

*Specification created for Klusbaas brand video. Ready for Remotion implementation.*
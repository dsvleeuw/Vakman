# Plan: Motion Graphic UI Verbetering & Video Research

## Context
Klusbaas generates demo marketing websites for Dutch tradespeople. The project is a React 19 + TypeScript + Vite + Tailwind v4 SPA. We need to:
1. Create a brand video based on the provided script (video-script.json, video-spec.md)
2. Research and implement motion graphic UI improvements for the marketing/demo pages

## Goals
1. **Brand Video Production** — Implement the 150s motion graphic video spec using Remotion
2. **UI Motion Improvements** — Add subtle, performant animations to key marketing components (Hero, FeatureCards, StyleSelector, PackageCards, Wizard steps)
3. **Video Research** — Document findings on video hosting, compression, and integration strategies for the marketing site

## Tasks

### Task 1: Remotion Video Implementation
**Scope:** `src/video/`, `remotion.config.ts`, `package.json`
**Goal:** Build the 11-scene brand video per video-spec.md
**Acceptance Criteria:**
- `npx remotion render` produces 1080p MP4 without errors
- All 11 scenes render with correct timing (4500 frames @ 30fps)
- Voiceover syncs with animation cues ({hook}, {pain}, {money}, etc.)
- SFX trigger at specified timestamps
- Output passes `bun run lint` and `bun run build`

### Task 2: Marketing Page Motion Enhancements
**Scope:** `src/components/marketing/`, `src/index.css`
**Goal:** Add purposeful micro-interactions to marketing components
**Acceptance Criteria:**
- Hero: subtle parallax/fade-in on scroll (IntersectionObserver)
- FeatureCards: stagger entrance, hover lift (2px, 200ms spring)
- StyleSelector: smooth card flip on selection (300ms)
- PackageCards: Popular badge pulse, price count-up on view
- Wizard steps: progress line draw, step transition slide
- All animations respect `prefers-reduced-motion`
- No layout shift, CLS < 0.1

### Task 3: Video Hosting & Integration Research
**Scope:** `docs/video-integration.md`
**Goal:** Research and document video strategy for marketing site
**Acceptance Criteria:**
- Compare: self-hosted (Cloudflare Stream, Mux) vs CDN (Vimeo, Bunny)
- Recommend compression settings (H.264, WebM, AV1 fallbacks)
- Document lazy-loading + poster image strategy
- Provide `<VideoPlayer>` component spec with TypeScript types
- Include analytics events (play, progress, complete)

## Parallelism
- Task 1 and Task 2 are independent (different codebases: Remotion vs React app)
- Task 3 can run in parallel with both
- No shared dependencies between tasks

## Non-Goals
- Full Remotion studio setup (CLI rendering only)
- Complex character animation
- Audio mixing/mastering (use provided VO/SFX as-is)
- A/B testing infrastructure
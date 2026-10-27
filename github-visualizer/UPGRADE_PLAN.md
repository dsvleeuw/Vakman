# GitHub Commit Visualizer - World-Class UI/UX Upgrade Plan

## Vision
Transform the visualizer into a **best-in-class, glassmorphic, animated developer tool** with rich interactive visualizations, deep insights, and delightful micro-interactions.

---

## Phase 1: Foundation & Design System (Parallel Tasks)

### Task 1.1: Glassmorphism Design System
**Scope:** `style.css`
- CSS custom properties for glassmorphism: backdrop-filter, glass surfaces, layered shadows
- Color palette: modern GitHub-inspired with semantic tokens
- Fluid typography scale with clamp()
- Motion tokens: duration, easing (cubic-bezier), reduced-motion support
- Z-index scale for layering
- Focus-visible styles for accessibility

### Task 1.2: Animation & Interaction Primitives
**Scope:** `style.css`, `app.js`
- Reusable keyframes: fade, slide, scale, stagger, morph
- CSS-only micro-interactions: hover lift, press scale, focus ring
- IntersectionObserver scroll-reveal utility
- Reduced-motion media query handling
- Staggered entrance animations for lists

---

## Phase 2: Core UI Overhaul (Parallel Tasks)

### Task 2.1: Header & Navigation Redesign
**Scope:** `index.html`, `style.css`, `app.js`
- Glassmorphic toolbar with avatar, repo selector, theme toggle
- Command palette (⌘K) for instant navigation
- Keyboard shortcuts help modal (?)
- Breadcrumb navigation for deep views
- Repo switcher with recent history

### Task 2.2: Input Section - Modern Upload Experience
**Scope:** `index.html`, `style.css`, `app.js`
- Drag-and-drop zone with visual feedback
- Paste detection with auto-parse
- Loading skeleton states
- Dropzone transitions to summary card on success
- GitHub CLI command generator with copy button

### Task 2.3: View Tabs → Segmented Control + View Switcher
**Scope:** `index.html`, `style.css`, `app.js`
- Animated segmented control with sliding indicator
- View transition animations (cross-fade + slide)
- Keyboard navigation (←/→ arrows)

---

## Phase 3: Heatmap View - Major Upgrade (Sequential)

### Task 3.1: Contribution Calendar v2
**Scope:** `style.css`, `app.js`
- SVG-based calendar (crisp at any zoom)
- Tooltip with commit details on hover
- Click day → filter timeline to that day
- Year selector with smooth transition
- Streak visualization (current/longest)
- Contribution level gradient legend
- Animated cell entrance (staggered by week)

### Task 3.2: Contribution Stats Sidebar
**Scope:** `style.css`, `app.js`
- Collapsible sidebar with:
  - Total commits, active days, longest streak
  - Top authors, busiest day/hour
  - Commit frequency chart (mini sparkline)
  - Language breakdown (from commit files)

---

## Phase 4: Timeline View - Rich Interactive List (Parallel Tasks)

### Task 4.1: Commit Card v2 with Glassmorphism
**Scope:** `style.css`, `app.js`
- Glass card with subtle border glow on hover
- Expandable file list with animated accordion
- Author avatar (GitHub API or generated)
- Commit type badges (feat, fix, chore, etc. from conventional commits)
- Relative time with live update
- Copy SHA with toast confirmation + fallback
- Keyboard: Enter to expand, C to copy SHA

### Task 4.2: Timeline Interactions
**Scope:** `app.js`
- Virtual scrolling for 1000+ commits
- Date grouping with sticky headers
- Filter pills with animated count badges
- Search highlighting in messages
- URL hash sync for deep linking

---

## Phase 5: Branches View - GitHub-Level UX (Parallel Tasks)

### Task 5.1: Branch Cards with Rich Metadata
**Scope:** `style.css`, `app.js`
- Branch cards showing: protection status, PR state, CI status, last commit
- Inline PR preview on hover
- Merge conflict indicator
- Age visualization (relative + absolute)
- Sortable columns: name, last update, status, author

### Task 5.2: Branch Comparison & Actions
**Scope:** `app.js`
- Compare any two branches (ahead/behind counts)
- Quick actions: open PR, view on GitHub, copy branch name
- Search/filter with debounce
- Batch operations UI

---

## Phase 6: Network Graph - Professional Grade (Sequential)

### Task 6.1: WebGL/Canvas 2D Git Graph
**Scope:** `style.css`, `app.js`, new `network-graph.js`
- Proper topological layout (not linear)
- Merge commit visualization with curved edges
- Branch lanes with distinct colors
- Tag/Release markers
- Zoom/pan with mouse wheel + drag
- Minimap for navigation
- Hover: commit details tooltip
- Click: select commit → show in timeline

### Task 6.2: Graph Controls & Features
**Scope:** `app.js`
- Time-range slider
- Author filter (highlight commits by author)
- Branch filter (show only selected branches)
- Layout algorithms: linear, topological, radial
- Export as SVG/PNG

---

## Phase 7: Advanced Analytics Views (Parallel Tasks)

### Task 7.1: Authors/Contributors Dashboard
**Scope:** new `authors-view.html/.js`, integrate in `index.html`
- Contributor cards with avatar, commit count, first/last commit
- Contribution timeline per author
- Collaboration matrix (who works with whom)
- Bus factor visualization

### Task 7.2: Code Churn & File Analytics
**Scope:** new `files-view.html/.js`
- File change frequency heatmap
- Top changed files (Pareto chart)
- File ownership (who touches what)
- Churn vs complexity scatter (if data available)
- File lifetime timeline

### Task 7.3: Temporal Analysis
**Scope:** new `temporal-view.html/.js`
- Commits by hour/day/month (polar/radial charts)
- Work pattern detection (weekends, nights)
- Release cadence visualization
- Sprint/iteration detection from merge patterns

---

## Phase 8: Polish & Delight (Parallel Tasks)

### Task 8.1: Empty States & Onboarding
**Scope:** `index.html`, `style.css`, `app.js`
- Illustrated empty states with guidance
- First-run onboarding tour (driver.js style)
- Sample data loader (one-click demo)

### Task 8.2: Export & Sharing
**Scope:** `app.js`
- Export view as PNG/PDF
- Shareable URL with encoded filters
- Copy markdown table for commits
- Embeddable widget iframe

### Task 8.3: Performance & Accessibility
**Scope:** all files
- WCAG 2.1 AA compliance audit
- Lighthouse performance > 95
- Bundle size optimization (code splitting)
- Service worker for offline

---

## Technical Architecture

### Module Structure
```
github-visualizer/
├── index.html              # Main shell
├── style.css               # Design system + components
├── app.js                  # Core orchestration
├── modules/
│   ├── design-system.js    # Tokens, theme, motion
│   ├── data-store.js       # Commits, branches, cache
│   ├── github-api.js       # API client with rate limit handling
│   ├── views/
│   │   ├── heatmap.js
│   │   ├── timeline.js
│   │   ├── branches.js
│   │   ├── network.js
│   │   ├── authors.js
│   │   ├── files.js
│   │   └── temporal.js
│   ├── components/
│   │   ├── commit-card.js
│   │   ├── branch-card.js
│   │   ├── tooltip.js
│   │   ├── modal.js
│   │   ├── command-palette.js
│   │   └── virtual-list.js
│   └── utils/
│       ├── date.js
│       ├── format.js
│       └── dom.js
```

### Dependencies (Zero/Minimal)
- **Zero framework** - vanilla ES modules
- **Optional**: `d3-scale` for color scales (1kb gzipped)
- **Icons**: Inline SVG (Heroicons style)
- **Charts**: Custom Canvas/SVG (no Chart.js)

---

## Acceptance Criteria (Per Task)

Each task must:
- [ ] Pass `bun run check` (lint + test + build)
- [ ] Work in both light/dark themes
- [ ] Respect `prefers-reduced-motion`
- [ ] Keyboard navigable
- [ ] Screen reader accessible (ARIA)
- [ ] Mobile responsive (375px+)
- [ ] No console errors/warnings
- [ ] Smooth 60fps animations

---

## Execution Strategy

1. **Checkpoint current state** → `T checkpoint`
2. **Dispatch Phase 1 tasks in parallel** (2 tasks)
3. **Review & land Phase 1**
4. **Dispatch Phase 2 tasks in parallel** (3 tasks)
5. **Review & land Phase 2**
6. **Phase 3 sequential** (2 tasks)
7. **Phase 4-8 in dependency order with max parallelism**

---

## Notes
- Keep `commits.json` auto-load working
- Maintain backward compatibility with existing JSON format
- All new features behind feature flags initially
- Document new APIs in `docs/` if needed
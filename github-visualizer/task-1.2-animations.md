# Task 1.2: Animation & Interaction Primitives

## Goal
Create reusable CSS animation keyframes, utility classes, and JavaScript helpers for micro-interactions, scroll-reveal, and staggered entrances.

## Approach
Define a complete motion system in CSS with:
- Core keyframes: fade, slide (4 directions), scale, flip, morph
- Utility classes for common patterns
- Staggered entrance system using CSS custom properties
- IntersectionObserver-based scroll reveal utility in JS
- Reduced-motion handling

## Constraints
- Pure CSS animations where possible
- JS only for scroll-triggered animations
- All animations respect `prefers-reduced-motion`
- 60fps target (transform/opacity only)
- No layout thrashing

## Files in Scope
- `github-visualizer/style.css` (keyframes, utilities)
- `github-visualizer/app.js` (scroll-reveal utility)

## Acceptance Criteria
1. **Keyframes defined**: `fade-in`, `fade-out`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `scale-in`, `scale-out`, `flip-in`, `flip-out`
2. **Utility classes**: `.animate-fade-in`, `.animate-slide-up`, `.animate-scale-in`, `.stagger-children`, `.stagger-item`
3. **Stagger system**: `--stagger-delay` custom property, `.stagger-1` through `.stagger-12`
4. **Hover/tap interactions**: `.hover-lift`, `.hover-glow`, `.tap-scale`, `.focus-ring`
5. **Scroll reveal**: `ScrollReveal` class in JS with `observe(element, options)` API
6. **Reduced motion**: All animations disabled via `@media (prefers-reduced-motion: reduce)`
7. **Performance**: Only transform/opacity animated, will-change used appropriately
8. **`bun run lint` passes**

## Non-Goals
- View-specific animations (handled in view tasks)
- Complex orchestration (handled in view tasks)
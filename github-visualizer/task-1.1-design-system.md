# Task 1.1: Glassmorphism Design System

## Goal
Create a comprehensive glassmorphism design system with CSS custom properties, semantic color tokens, fluid typography, motion tokens, and accessibility foundations.

## Approach
Replace the existing CSS variables with a modern design system that supports:
- Glassmorphic surfaces (backdrop-filter, layered transparency)
- Semantic color aliases (surface, surface-elevated, surface-overlay, etc.)
- Fluid typography using clamp()
- Motion system with duration/easing tokens
- Z-index scale for proper layering
- Reduced-motion support
- Focus-visible styles

## Constraints
- Must work in both light and dark themes
- No framework dependencies
- Backward compatible with existing component classes
- All tokens must be CSS custom properties
- Must pass `bun run lint` (no TypeScript errors in CSS)

## Files in Scope
- `github-visualizer/style.css` (primary)
- `github-visualizer/index.html` (may need minor class updates)

## Acceptance Criteria
1. **Glassmorphism tokens**: `--glass-bg`, `--glass-border`, `--glass-shadow`, `--glass-backdrop` defined for light/dark
2. **Semantic surfaces**: `--surface-1` (base), `--surface-2` (elevated), `--surface-3` (overlay), `--surface-4` (modal)
3. **Fluid typography**: `--text-xs` through `--text-4xl` using clamp()
4. **Motion tokens**: `--duration-fast` (150ms), `--duration-base` (250ms), `--duration-slow` (350ms), `--ease-out`, `--ease-spring`
5. **Z-index scale**: `--z-dropdown`, `--z-tooltip`, `--z-modal`, `--z-toast`, `--z-command-palette`
6. **Focus styles**: Visible focus rings using `--focus-ring` token
7. **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables animations
8. **All existing components still render correctly**
9. **`bun run lint` passes**

## Non-Goals
- Component implementations (handled in later tasks)
- JavaScript changes (only CSS)
- New HTML structure
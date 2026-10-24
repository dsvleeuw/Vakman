# AGENTS.md — instructions for the next agent

Read this before changing anything. It captures the project rules,
workflow and gotchas so work stays consistent across sessions.

## What this product is

Klusbaas generates demo marketing websites for Dutch tradespeople
(6 trades × 5 styles = 30 presets). It is a React 19 + TypeScript +
Vite + Tailwind v4 single-page app with **no application backend**:
forms submit through WhatsApp/tel deep links, and the only API
integration is optional Google Calendar/Drive sync via Firebase Auth.
Full context: [docs/architecture.md](./docs/architecture.md).

## Branch and GitHub rules

- Work only on the session branch (`arena/...`). Never create, switch to
  or push another branch.
- Commit in small, focused chunks using Conventional Commits
  (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- Push to the session branch and open/update one PR against `main`.
- Only merge when the user explicitly asks. When you do, use
  `gh pr merge <number> --merge` as the **last** command of the chain,
  with no pipes or redirects, and never pass `--auto`. Do not delete the
  session branch unless asked.
- Never request credentials or tokens; GitHub auth is preconfigured. If
  `git`/`gh` fails with an auth error, tell the user to reconnect GitHub.

## Environment and commands

Use **Bun** (committed `bun.lock`). `npm install` fails on an
esbuild/Vite peer conflict.

```bash
bun install
bun run dev      # dev server on port 3000, bound to 0.0.0.0
bun run lint     # tsc --noEmit — must stay clean
bun test         # node:test unit tests under src/**/*.test.ts
bun run build    # production build to dist/
```

All three (`lint`, `test`, `build`) must be green before you finish a
change. The Netlify deploy preview is the only external CI check.

## Code conventions

- **All user-facing copy is Dutch.** Use Dutch euro formatting
  (`€ 1.250`, comma decimals) and state "exclusief btw" on platform
  prices. Keep code identifiers English.
- Keep logic **pure and in `src/utils/`**, with unit tests next to it
  (`*.test.ts`). Components compose results; they do not re-implement
  pricing or message formatting.
- Preset components must read colors, fonts and radii from the
  `ActiveSiteData` palette tokens (`site.accent`, `site.card`,
  `site.radiusLg`, …) so they work in all five styles. Home/marketing
  components use the fixed stone/amber theme.
- Contact actions go through `utils/contact.ts` helpers
  (`buildWhatsAppUrl`, `buildTelUrl`, the message builders) — never hand-
  roll a `wa.me` string. Phone conversion (`06…` → `31…`) is tested there.
- Icons come from `lucide-react`; verify an export exists before using it.
- Tailwind v4 accepts arbitrary numeric spacing such as `h-13`; do not
  add config for it. Shared keyframes live in `src/index.css`.
- Do not commit secrets. The Firebase web key in
  `firebase-applet-config.json` is public by design; real secrets belong
  in environment variables (see `.env.example`).

## Common tasks (full how-tos in `docs/`)

- Add a trade: [docs/adding-a-sector.md](./docs/adding-a-sector.md)
- Add a smart tool: [docs/adding-a-trade-tool.md](./docs/adding-a-trade-tool.md)
- Understand contact flows: [docs/contact-strategy.md](./docs/contact-strategy.md)
- Change prices: [docs/pricing-and-positioning.md](./docs/pricing-and-positioning.md)
- Check current gaps before planning: [docs/known-limitations.md](./docs/known-limitations.md)
- Longer-term priorities: [ROADMAP.md](./ROADMAP.md)

## Gotchas

- Quick preset testing uses URL params:
  `/?sector=loodgieter&style=2&view=site` (`autostart=1` also opens the
  site view).
- The mobile sticky contact bar overlays the bottom of `SiteView`; the
  page root carries `pb-20 sm:pb-0` — preserve that spacing when adding
  full-width sections.
- When smoke-rendering with `renderToStaticMarkup`, assert against
  entity-decoded markup (`&` renders as `&amp;`). Delete any temporary
  render script before committing.
- The wizard's WhatsApp/E-mail/Allebei channel state is currently **not
  wired** to the published site — do not assume it works (roadmap 1.1).
- Unsplash ids in each sector's `pool` are rotated by
  `getPhotoSet(sector, styleIndex)`; reuse pool ids rather than adding
  external image hosts.

## Definition of done for any change

1. `bun run lint`, `bun test` and `bun run build` all pass.
2. New pure logic has tests; user-facing strings are Dutch.
3. `CHANGELOG.md` updated under `Unreleased` (or a new dated section at
   release time).
4. Docs touched when behaviour or workflows change; roadmap updated if
   you close or add a gap.
5. Commit history is reviewable (one concern per commit) and the PR
   description explains what changed, why, and how it was verified.

# 2026-10-25 — Updated Roadmap (Post-Documentation Audit)

## Context
This roadmap incorporates findings from the 2026-10-25 documentation completeness audit (score: 9.1/10, target: 9.5+). P0 items from the audit are now the highest priority.

---

## Phase 0 — Launch Blockers (THIS WEEK) 🔴 CRITICAL

*Must complete before any public launch or paid customer onboarding.*

| # | Item | Owner | Effort | Status | Dependencies |
|---|------|-------|--------|--------|--------------|
| 0.1 | **KvK registration & BTW activation** | Founder | 1 day | 🔴 Not started | External |
| 0.2 | **Fill legal entity, address, bank details** | Founder | 2 hrs | 🔴 Not started | 0.1 |
| 0.3 | **Setup `privacy@klusbaas.nl` email** | Founder | 1 hr | 🔴 Not started | DNS |
| 0.4 | **Replace `thomascliphero@gmail.com` in all docs** | Founder | 30 min | 🔴 Not started | 0.3 |
| 0.5 | **Conduct DPIA for lead/quote processing** | DPO/Founder | 4 hrs | 🔴 Not started | Legal review |
| 0.6 | **Create runbooks directory + Google Calendar sync runbook** | Tech Lead | 2 hrs | 🔴 Not started | — |
| 0.7 | **Create postmortems directory** | Tech Lead | 30 min | 🔴 Not started | — |

**Definition of Done**: All 7 items ✅, `bun run check` green, legal sign-off on DPIA.

---

## Phase 1 — Documentation Polish (THIS SPRINT) 🟠 HIGH

*Close remaining P1 gaps to reach 9.5+ score.*

| # | Item | Owner | Effort | Status | Notes |
|---|------|-------|--------|--------|-------|
| 1.1 | **Standardize trade terminology**: "6 core trades + 1 fallback = 30 presets" | Docs/Dev | 30 min | 🟡 Ready | Update README, CHANGELOG, architecture, pricing, klantwerving |
| 1.2 | **Add OpenAPI contracts** for `/api/lead`, `/api/quote`, `/api/newsletter` | Tech Lead | 2 days | 🟡 Ready | Use `@anatine/zod-openapi` or manual spec |
| 1.3 | **Document component props interfaces** in `src/components/README.md` | Dev | 1 day | 🟡 Ready | Extract from TypeScript interfaces |
| 1.4 | **Add Ahrefs/Semrush budget (€200/mo)** to `bedrijf/financieel/financieel.md` | Finance | 30 min | 🟡 Ready | Align with SEO strategie.md |
| 1.5 | **Create ESOP plan document** | Founder | 4 hrs | 🟡 Ready | 10-15% pool, 4yr vesting, 1yr cliff |
| 1.6 | **Document wizard step count consistently** (5 steps + klaar = 6) | Docs | 30 min | 🟡 Ready | architecture.md, mobile-ux-plan.md, operaties.md |

---

## Phase 2 — Platform Hardening (NEXT 2 SPRINTS) 🟡 MEDIUM

*Technical debt and quality improvements from audit.*

| # | Item | Owner | Effort | Phase | Notes |
|---|------|-------|--------|-------|-------|
| 2.1 | **Cookie consent UI implementation** | Dev | 3 days | Sprint 1 | Per `cookiebeleid.md` spec |
| 2.2 | **Automated docs validation script** (`bun run docs:validate`) | Dev | 2 days | Sprint 1 | Cross-ref checks, link validation |
| 2.3 | **Trade count consistency CI check** | Dev | 1 day | Sprint 1 | Fail build on mismatch |
| 2.4 | **Markdown link checker in `bun run check`** | Dev | 1 day | Sprint 1 | `markdown-link-check` |
| 2.5 | **Component test coverage** (Playwright) | Dev | 5 days | Sprint 2 | Per ROADMAP 5.1 |
| 2.6 | **Accessibility audit** (axe, screen reader) | Dev | 3 days | Sprint 2 | Per ROADMAP 5.2 |
| 2.7 | **Replace Unsplash with licensed photography** | Marketing | 5 days | Sprint 2 | Per ROADMAP 5.3 |

---

## Phase 3 — Business Features (Q1 2026) 🟢 PLANNED

*From original ROADMAP.md, re-prioritized.*

| # | Item | Owner | Effort | Notes |
|---|------|-------|--------|-------|
| 3.1 | **Lead API: real backend storage** | Dev | 5 days | Replace WhatsApp-only path |
| 3.2 | **Transactional email + WhatsApp Business** | Dev | 5 days | Depends on 1.2, 3.1 |
| 3.3 | **Craftsman dashboard** (edit services, prices, photos) | Dev | 10 days | Delivers FAQ promise (ROADMAP 1.4) |
| 3.4 | **Authentication + multi-site ownership** | Dev | 5 days | Reuse Firebase Auth |
| 3.5 | **Conversion analytics per preset** | Dev/Marketing | 3 days | Prove proactive-demo approach |
| 3.6 | **LocalBusiness JSON-LD on all demo sites** | Dev | 1 day | SEO quick win (ROADMAP 4.1) |
| 3.7 | **Real routes per sector/style** (already done ✅) | — | — | PR #23 completed |
| 3.8 | **Order/checkout flow for packages** | Dev | 10 days | Pricing currently presentation-only |

---

## Phase 4 — Scale & Polish (Q2 2026) 🔵 FUTURE

| # | Item | Owner | Effort | Notes |
|---|------|-------|--------|-------|
| 4.1 | **Google Bedrijfsprofiel API integration** | Dev | 5 days | Reviews, posting |
| 4.2 | **Add dakdekker sector** | Dev | 2 days | Per adding-a-sector.md |
| 4.3 | **Add aannemer sector** | Dev | 2 days | Extend ProjectTimeline |
| 4.4 | **Hovenier smart tool** | Dev | 3 days | Seasonal planner |
| 4.5 | **Stukadoor smart tool** | Dev | 1 day | Reuse surface.ts |
| 4.6 | **Schilder kleurenkiezer (RAL)** | Dev | 3 days | Colour swatch picker |
| 4.7 | **i18n setup for Belgium/Flanders** | Dev | 10 days | All copy is hard-coded Dutch |

---

## Resource Allocation (Current Team: 1 Dev + 1 PM + 0.5 Admin)

| Sprint | Dev Focus | PM Focus | Admin Focus |
|--------|-----------|----------|-------------|
| **This Week** | Phase 0.6, 0.7, 1.2 | Phase 0.1-0.5, 1.4, 1.5 | KvK, BTW, bank, email setup |
| **Sprint 1** | Phase 1.2, 1.3, 2.2-2.4 | Phase 1.1, 1.4, 1.6 | Legal review DPIA |
| **Sprint 2** | Phase 2.1, 2.5, 2.6 | Phase 3.5, 3.6 | Compliance check |
| **Sprint 3** | Phase 3.1, 3.2 | Phase 3.3, 3.4 | Contracts, invoicing |
| **Sprint 4** | Phase 3.3, 3.8 | Phase 3.4, 4.2, 4.3 | Hiring prep |

---

## Success Metrics (Updated)

| Metric | Current | Target Q1 | Target Q2 |
|--------|---------|-----------|-----------|
| Documentation score | 9.1 | **9.5+** | 9.7 |
| `bun run check` time | 11s | <10s | <8s |
| Test coverage (utils) | ~80% | >90% | >95% |
| E2E test coverage | 2 flows | 8 flows | 15 flows |
| Launch blockers | 7 | **0** | 0 |
| Legal compliance gaps | 5 | **0** | 0 |

---

## Decision Log Updates

- **2026-10-25**: Documentation audit completed → 6 templates added via PR #24
- **2026-10-25**: Trade terminology standardized to "6 core + 1 fallback = 30 presets" (pending implementation)
- **2026-10-25**: DPIA required before launch (new requirement from audit)
- **2026-10-25**: ESOP plan needed before hiring (from HR audit)

---

*Roadmap updated: 2026-10-25 | Based on audit findings | Next review: 2026-11-01*
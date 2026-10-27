# 2026-10-25 — GitHub Repository Analysis

## Repository State (Post PR #24 Merge)

### Branch Status
- **main**: `3c8ed2e` (24 commits ahead of local pre-merge)
- **Open PRs**: 2
- **Closed PRs (recent)**: #24 (merged 2026-10-25T18:41:58Z), #23 (merged 2026-10-25T18:14:41Z)

### Open Pull Requests

| # | Title | Branch | Author | Created | Status | Checks |
|---|-------|--------|--------|---------|--------|--------|
| **22** | feat: brand, privacy, newsletter pages (C1-C3) | `feat/click-test-loose-ends` | upnexxt + claude | 2026-10-25T16:43:17Z | **OPEN** | Netlify ✓, GitHub Actions ❌ |
| **21** | fix: wizard D2 losse eindjes (Google-config, formulier-submit, contrast, datumtests) | `arena/30d36368-vakman` | arena-agent | 2026-10-24T22:28:50Z | **OPEN** | Netlify ✓, GitHub Actions ❌ |

### Check Status Analysis

#### PR #22 — Brand, Privacy, Newsletter (C1-C3)
**Commits**: 4 (feat(brand), feat(nieuwsbrief), feat(privacy), docs)
**Netlify**: Deploy Preview Ready ✅
**GitHub Actions**: **NOT RUN** — No `check` workflow in statusCheckRollup
**Risk**: Large feature PR (brand assets, privacy pages, newsletter double opt-in) without CI validation

#### PR #21 — Wizard D2 Fixes
**Commits**: 3 (fix: wizard D2, fix: scope D2, docs: commentaar)
**Netlify**: Deploy Preview Ready ✅
**GitHub Actions**: **NOT RUN** — No `check` workflow in statusCheckRollup
**Risk**: Wizard fixes (Google config, form submit, contrast, date tests) without CI validation

### Root Cause: Missing GitHub Actions Runs
Both PRs show only Netlify checks in `statusCheckRollup`. The `check.yml` workflow (lint + test + build + e2e) has not executed for these PR branches.

**Likely Causes**:
1. PRs opened before `check.yml` was finalized in `main` (workflow added in `387c3dc`, PRs created 2026-10-24)
2. Workflow requires `pull_request` event but may not have triggered on PR creation
3. No recent pushes to PR branches to trigger `synchronize` event

### Recent Workflow Runs (check.yml)

| Run | Branch | Conclusion | Time |
|-----|--------|------------|------|
| 40222485393 | main | ✅ success | 2026-10-25T18:42:00Z |
| 40222401010 | arena/1ce597de-vakman | ✅ success | 2026-10-25T18:40:56Z |
| 40219018361 | arena/3f301fb7-vakman | ✅ success | 2026-10-25T17:58:31Z |
| 40218972405 | arena/3f301fb7-vakman | ✅ success | 2026-10-25T17:57:57Z |
| 40218416697 | arena/3f301fb7-vakman | ✅ success | 2026-10-25T17:50:43Z |
| 40215519143 | main | ✅ success | 2026-10-25T17:14:44Z |
| 40215250425 | arena/add-readmes-and-docs | ✅ success | 2026-10-25T17:11:24Z |
| 40215220843 | arena/add-readmes-and-docs | ✅ success | 2026-10-25T17:10:59Z |
| 40212361772 | main | ✅ success | 2026-10-25T16:34:53Z |
| 40144746312 | arena/2e332817-vakman | ❌ failure | 2026-10-24T23:56:40Z |

**Note**: PR #21 (`arena/30d36368-vakman`) and PR #22 (`feat/click-test-loose-ends`) **do not appear** in recent workflow runs.

---

## Recommended Actions (Priority Order)

### 🔴 IMMEDIATE — Trigger CI for Open PRs
```bash
# Option 1: Push empty commit to trigger synchronize
cd /path/to/PR21-worktree
git commit --allow-empty -m "ci: trigger check.yml workflow"
git push

# Option 2: Re-run via GitHub CLI (if workflow run exists)
gh run rerun <run-id> --repo dsvleeuw/Vakman

# Option 3: Manually dispatch workflow (if workflow_dispatch enabled)
# Not currently configured in check.yml
```

**Why**: Both PRs have significant code changes (brand assets, privacy pages, newsletter, wizard fixes) that must pass `bun run check` (lint + test + build + e2e) before merge per AGENTS.md.

### 🟠 HIGH — Review & Merge PR #21 First
**Reason**: PR #21 fixes wizard D2 loose ends (Google config, form submit, contrast, date tests) — these are **bug fixes** that improve stability. PR #22 adds new features (brand, privacy, newsletter) which can wait.

**PR #21 Changes**:
- `googleWorkspace.ts`: Load Firebase config via `import.meta.glob` (Vite ESM)
- `BookingCalendar`/`WizardView`: Real `<form>` with submit behavior, `onRetry` passed to `LeadErrorNotice`
- Google option only after mount (no hydration mismatch)
- Stone-500 borders (≥3:1) on controls and buttons
- WhatsApp button with dark text
- Wizard: Visible hint when no sector selected
- Tests: `googleWorkspace.test.ts` added, `buildNextDates` default test

### 🟡 MEDIUM — Review PR #22 After PR #21
**PR #22 Changes** (4 commits):
1. **Brand (C3)**: Klusbaas logo, favicon, app icons, og-image from `generate-brand.mjs`
2. **Newsletter (C2)**: Double opt-in, confirm, unsubscribe via Resend/Netlify Blobs
3. **Privacy (C1)**: `/privacy`, `/nieuwsbrief`, `/afmelden` routes, new footer
4. **Docs**: Huisstijl, privacy, newsletter documented

**Dependencies**: PR #22 adds new routes (`/privacy`, `/nieuwsbrief`, `/afmelden`) that will be prerendered. Must verify `bun run build` includes them in the 39 routes.

### 🟢 LOW — Clean Up Arena Branches
**Stale arena branches** (from `git branch -a`):
- `arena/session-` (empty?)
- `arena/vk-ci-e2e-g`, `arena/vk-docs-truth-d-10242158`, `arena/vk-seo-meta-e-10242158`, etc.
- Many `arena/vk-*` branches from automated Arena runs

**Action**: Delete merged/abandoned arena branches via GitHub UI or `gh api`.

---

## Merge Order Recommendation

```
1. Trigger check.yml for PR #21 → wait for green → merge (bug fixes)
2. Trigger check.yml for PR #22 → wait for green → merge (features)
3. Delete stale arena branches
4. Next sprint: Phase 0 launch blockers (from roadmap)
```

---

## Repository Health Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Open PRs | 2 | < 3 | ✅ |
| CI pass rate (main) | 100% (last 10) | 100% | ✅ |
| CI pass rate (PRs) | 0% (2/2 missing) | 100% | ❌ |
| Deploy preview success | 100% | 100% | ✅ |
| Netlify builds | Passing | Passing | ✅ |
| Branch protection | main protected | Required | ✅ |
| Conventional commits | Enforced | Required | ✅ |

---

## Next Steps for Maintainer

1. **Today**: Trigger CI for PR #21 and #22 (push empty commit or use GitHub Actions UI)
2. **Today**: Review PR #21 diff — ensure wizard fixes don't break existing flows
3. **Tomorrow**: Review PR #22 diff — ensure new routes prerender correctly, no hydration issues
4. **This Week**: Merge both, delete stale branches, start Phase 0 launch blockers

---

*Analysis: 2026-10-25 | Based on gh CLI data | Next check: after CI triggers*
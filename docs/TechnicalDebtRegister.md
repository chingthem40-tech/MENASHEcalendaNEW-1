# Technical Debt Register

> Purpose: Centralized registry of all technical debt items — prioritized by severity and mapped to recommended sprint.
> Last updated: 2026-06-26 (SPR-001)

---

## Legend

**Severity:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low
**Impact:** How much this debt costs the team per sprint it remains unresolved.
**Estimate:** Story points (1 SP ≈ half a day of focused engineering work).

---

## Security Debt

| ID | Issue | Severity | Impact | Recommended Sprint | Estimate | Priority |
|---|---|---|---|---|---|---|
| TD-001 | Admin auth uses hardcoded PIN `1948` with no Clerk session required — grants full platform control to anyone who knows the PIN | 🔴 Critical | Existential security risk; cannot go public | SPR-002 | 5 SP | P0 |
| TD-002 | Census GET endpoints unprotected — all family names and location data are publicly readable | 🔴 Critical | GDPR/privacy violation; data exposure | SPR-002 | 2 SP | P0 |
| TD-003 | Object storage ACL not enforced — authenticated users can access any other user's private files | 🔴 Critical | Data breach risk | SPR-002 | 3 SP | P0 |
| TD-004 | No rate limiting on any API endpoint — brute force, AI cost abuse, DoS | 🟠 High | Unbounded cost + DoS vulnerability | SPR-002 | 4 SP | P1 |
| TD-005 | CORS defaults to `origin: true` when `ALLOWED_ORIGINS` unset | 🟠 High | Cross-site credential theft | SPR-002 | 1 SP | P1 |
| TD-006 | `VITE_ADMIN_PIN` baked into browser bundle | 🟠 High | Admin PIN exposed to all users | SPR-002 | 1 SP | P1 |
| TD-007 | JSONB census columns accept raw unvalidated JSON before DB insert | 🟠 High | Data corruption, unexpected behavior | SPR-002 | 3 SP | P1 |
| TD-008 | No audit log for admin mutations | 🟡 Medium | No accountability trail | SPR-003 | 3 SP | P2 |
| TD-009 | Host header injection risk in Clerk proxy middleware | 🟡 Medium | URL spoofing risk | SPR-002 | 2 SP | P2 |
| TD-010 | No user data export / deletion flow (GDPR) | 🟡 Medium | Regulatory risk in EU/UK | SPR-004 | 5 SP | P2 |

---

## Performance Debt

| ID | Issue | Severity | Impact | Recommended Sprint | Estimate | Priority |
|---|---|---|---|---|---|---|
| TD-011 | All 20+ modals eagerly bundled in `App.tsx` — no code splitting | 🔴 Critical | Multi-MB initial bundle; slow first load on mobile | SPR-003 | 5 SP | P0 |
| TD-012 | Zero `React.memo` usage — every modal open/close re-renders the full tree | 🔴 Critical | Jank on low-end devices; wasted CPU | SPR-003 | 8 SP | P0 |
| TD-013 | Large uncompressed PNG images (up to 2.5 MB per file) | 🟠 High | Slow page loads; poor Lighthouse score | SPR-003 | 2 SP | P1 |
| TD-014 | Push schedulers run in the main API process — will block event loop at scale | 🟠 High | API latency under load | SPR-004 | 8 SP | P1 |
| TD-015 | No pagination on list endpoints | 🟠 High | Response time and memory degrade as data grows | SPR-004 | 4 SP | P1 |
| TD-016 | Hebrew calendar calculations not memoized — recalculate on every render | 🟡 Medium | Unnecessary CPU on Home.tsx renders | SPR-003 | 3 SP | P2 |
| TD-017 | No DB connection pool configuration | 🟡 Medium | Connections exhausted under load | SPR-002 | 1 SP | P2 |
| TD-018 | Daf Yomi Sefaria API fetch has no caching | 🟢 Low | Redundant network requests; modal feels slow | SPR-003 | 1 SP | P3 |
| TD-019 | WebGL context disposal on Sanctuary close unverified | 🟢 Low | Potential VRAM leak on repeated open/close | SPR-005 | 3 SP | P3 |

---

## Architecture Debt

| ID | Issue | Severity | Impact | Recommended Sprint | Estimate | Priority |
|---|---|---|---|---|---|---|
| TD-020 | `Home.tsx` is 5,206 lines — the largest file in the codebase | 🔴 Critical | Impossible to maintain; any change risks regression | SPR-003 | 13 SP | P0 |
| TD-021 | `App.tsx` (931 lines) manages 30+ modal booleans + routing + auth + profile sync | 🟠 High | God file; any change affects everything | SPR-003 | 8 SP | P1 |
| TD-022 | `MemorialValley3D.tsx` (~2,500 lines) — entire 3D world in one file | 🟠 High | Unmaintainable; difficult to optimize subsystems | SPR-005 | 13 SP | P1 |
| TD-023 | `CensusModal.tsx` (2,298 lines) and `AdminModal.tsx` (2,038 lines) — monolithic admin UI | 🟡 Medium | Hard to test; changes are high-risk | SPR-004 | 8 SP | P2 |
| TD-024 | Business logic duplicated between web and mobile (zmanim, calendar, translations, locations) | 🟠 High | Any bug fix or feature must be applied twice; drift already detected | SPR-003 | 13 SP | P1 |
| TD-025 | `lib/api-client-react` generated hooks are largely unused — web app uses raw `fetch` | 🟡 Medium | Loses caching, loading states, and type safety | SPR-003 | 5 SP | P2 |
| TD-026 | Raw SQL startup migrations with no version tracking — no rollback capability | 🟠 High | Schema changes are irreversible in production | SPR-002 | 5 SP | P1 |
| TD-027 | No foreign key constraints on most table relationships | 🟡 Medium | Orphaned records accumulate silently | SPR-002 | 3 SP | P2 |
| TD-028 | No database indexes on `user_id` for most tables | 🟡 Medium | Table scans on every user data request at scale | SPR-002 | 2 SP | P2 |
| TD-029 | Web app has no URL-based modal routing — deep-links and back button broken | 🟡 Medium | Poor UX; shareable links to features impossible | SPR-004 | 8 SP | P2 |
| TD-030 | `TranslationEditorModal.tsx` implemented but not wired into navigation | 🟢 Low | Dead code; confuses maintainers | SPR-003 | 1 SP | P3 |
| TD-031 | `whop-api.mjs` and `whop-mcp.mjs` at project root with unclear purpose | 🟢 Low | Clutter; unclear if active | SPR-002 | 1 SP | P3 |

---

## Quality & Testing Debt

| ID | Issue | Severity | Impact | Recommended Sprint | Estimate | Priority |
|---|---|---|---|---|---|---|
| TD-032 | 185 uses of TypeScript `any` across the codebase | 🟠 High | Type safety bypass; hides bugs | SPR-003 onwards | 13 SP | P1 |
| TD-033 | Zero unit tests for calendar/zmanim calculations | 🔴 Critical | Regression risk on every calendar change | SPR-002 | 8 SP | P0 |
| TD-034 | Zero integration tests for API routes | 🟠 High | Regression risk on every backend change | SPR-003 | 13 SP | P1 |
| TD-035 | No end-to-end test suite | 🟠 High | No automated confidence before deploy | SPR-004 | 13 SP | P1 |
| TD-036 | No error monitoring in production (Sentry or equivalent) | 🟠 High | Blind to production failures | SPR-002 | 2 SP | P1 |
| TD-037 | No analytics — zero usage data collected | 🟡 Medium | Cannot make data-driven product decisions | SPR-004 | 3 SP | P2 |

---

## Accessibility Debt

| ID | Issue | Severity | Impact | Recommended Sprint | Estimate | Priority |
|---|---|---|---|---|---|---|
| TD-038 | Modals lack `role="dialog"`, `aria-labelledby`, focus trapping | 🟠 High | Screen reader users cannot navigate the app | SPR-004 | 8 SP | P1 |
| TD-039 | No `prefers-reduced-motion` handling for 3D scene or Framer Motion | 🟡 Medium | Vestibular disorder risk for affected users | SPR-005 | 3 SP | P2 |
| TD-040 | No keyboard navigation for modal open/close | 🟡 Medium | Keyboard-only users cannot access features | SPR-004 | 5 SP | P2 |

---

## Total Debt Summary

| Category | Items | Total Estimate |
|---|---|---|
| Security | 10 | 29 SP |
| Performance | 9 | 35 SP |
| Architecture | 12 | 78 SP |
| Quality & Testing | 6 | 52 SP |
| Accessibility | 3 | 16 SP |
| **Total** | **40** | **210 SP (~105 engineering days)** |

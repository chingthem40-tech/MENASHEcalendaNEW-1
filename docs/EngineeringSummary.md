# Engineering Summary

> Purpose: Executive-level assessment of the Menashe Platform's current engineering maturity, risks, and strengths.
> Sprint: SPR-001 | Date: 2026-06-26

---

## Scores

All scores are on a scale of 1–10.

| Dimension | Score | Rationale |
|---|---|---|
| **Architecture** | 5 / 10 | Monorepo structure and OpenAPI contract are solid; undermined by a god-file App.tsx, no shared logic package, and no URL routing for modals |
| **Maintainability** | 4 / 10 | Five files exceed 1,000 lines (peak: 5,206); zero test coverage; 185 `any` types; critical business logic duplicated between platforms |
| **Scalability** | 4 / 10 | No pagination; push schedulers block the main API thread; no DB indexes on `user_id`; single-process architecture with no horizontal scaling plan |
| **Security** | 3 / 10 | Three critical vulnerabilities (admin bypass, census data exposure, storage ACL); no rate limiting; CORS open by default; sensitive PIN in client bundle |
| **Performance** | 4 / 10 | No code splitting; no `React.memo`; uncompressed images up to 2.5 MB; calendar recalculated every render; 3D quality tiers are functional but coarse |
| **Accessibility** | 2 / 10 | No ARIA roles on modals; no focus management; no keyboard navigation; no `prefers-reduced-motion` |
| **Testing** | 1 / 10 | Zero unit, integration, or E2E tests; no CI/CD pipeline; only TypeScript compilation is verified |
| **Documentation** | 7 / 10 | Strong architecture documentation created this sprint; API spec is the source of truth; inline comments are present but sparse |
| **Overall Engineering Maturity** | **3.5 / 10** | Feature-rich product with significant underlying technical debt; suitable for controlled community use but not for public launch |

---

## Current Architecture Score: 5 / 10

The platform makes good architectural choices at the macro level — a well-structured monorepo, a code-generated API contract, Clerk for auth, Drizzle for type-safe DB access — but execution at the component and route level reveals maturity gaps. The three most acute architectural problems are:

1. **`Home.tsx` at 5,206 lines** — the largest file in the codebase contains what should be 8–12 independent components
2. **No shared logic package** — business-critical code (zmanim, calendar, translations) is duplicated between web and mobile, with drift already observable
3. **`App.tsx` as a god file** — manages routing, 30+ modal states, auth, profile sync, and theme in one 931-line component

---

## Top Five Risks

### Risk 1 — Security Breach via Admin PIN (🔴 Critical)
The hardcoded PIN `1948` grants full platform control — premium grants, user deletion, device broadcasts — with no Clerk session required. If discovered, a malicious actor can manipulate the entire community platform without leaving a trace. **This is the single most urgent issue in the codebase.**

### Risk 2 — Community Data Exposure (🔴 Critical)
Census submissions (`/census/submissions`, `/census/member-submissions`) are publicly accessible without any authentication. Family names, cities, and headcount data for the entire Bnei Menashe community is readable by anyone with a browser.

### Risk 3 — Platform Instability Under Load (🟠 High)
Push notification schedulers run in the same process as the HTTP server. During the 9 AM holiday alert window, the scheduler fans out to all registered devices in a tight loop, potentially blocking the event loop and making the app unresponsive for all users simultaneously.

### Risk 4 — Code Regression from Unmaintainable Files (🟠 High)
`Home.tsx` at 5,206 lines is the primary user surface of the app. Any change to it risks breaking unrelated features. Without tests, there is no safety net. This file will become increasingly dangerous to touch as the team grows.

### Risk 5 — Shared Logic Divergence (🟡 Medium)
`zmanim.ts` already has a measurable difference between the web and mobile versions (the Jerusalem candle-lighting offset). As both apps evolve independently, prayer time calculations will drift apart — users on mobile will see different Zmanim than users on web for the same location.

---

## Top Five Strengths

### Strength 1 — Feature Completeness
The platform delivers an exceptionally wide feature surface for a community religious app: Hebrew calendar, 14 Zmanim, bilingual UI (EN + TK), Siddur library, AI companion, push notifications (web + mobile), payments, community yahrzeit board, census, Torah tracker, and a full 3D memorial sanctuary. This is a year's worth of features.

### Strength 2 — 3D Memorial Sanctuary
The `MemorialValley3D` scene is technically sophisticated — procedural terrain, PBR water shaders, atmospheric scattering sky, day/night cycle, instanced vegetation, and adaptive quality tiers. The `R3FErrorBoundary` fallback and `QualityProvider` tier system show thoughtful engineering for a broad device range.

### Strength 3 — Bilingual Architecture
The `LanguageContext` + `translations.ts` + `useLanguage()` pattern is cleanly designed. Every UI string has an EN and TK translation, enforced by convention. The translation editor component (even if currently unwired) shows intentional design for community-managed localization.

### Strength 4 — Monorepo + OpenAPI Contract
The pnpm workspace structure with a shared OpenAPI spec (`lib/api-spec/openapi.yaml`) as the source of truth is architecturally sound. Orval-generated React Query hooks and Zod schemas mean the API contract is machine-enforced, not documentation that drifts from the implementation.

### Strength 5 — Clerk Authentication Integration
The Clerk integration is correctly implemented on both web and mobile, including the custom domain proxy middleware, secure token cache on mobile (`expo-secure-store`), and bearer token attachment in `apiFetch`. The biometric auth layer on mobile is a strong UX addition for a community app handling personal religious data.

---

## Recommended Sprint 2 (SPR-002): Security & Stability Foundation

**Duration:** 2 weeks
**Theme:** Make it safe to launch publicly

### Goals
1. Replace PIN admin auth with Clerk role-based authorization (TD-001)
2. Protect census read endpoints with `requireAuth` (TD-002)
3. Enforce object storage ownership ACL (TD-003)
4. Add `express-rate-limit` to all endpoints (TD-004)
5. Set `ALLOWED_ORIGINS` and enforce in production (TD-005)
6. Remove `VITE_ADMIN_PIN` from frontend bundle (TD-006)
7. Add Zod validation to all JSONB census inputs (TD-007)
8. Configure DB connection pool explicitly (TD-017)
9. Migrate to Drizzle Kit versioned migrations (TD-026)
10. Add FK constraints + indexes on `user_id` (TD-027, TD-028)
11. Move VAPID keys to Replit Secrets (SEC-09)
12. Add error monitoring (Sentry) (TD-036)

**Estimated total:** ~38 SP (~19 engineering days)
**Expected outcome:** Security score improves from 3/10 → 7/10. Platform safe for controlled public launch.

---

## Blockers Discovered

| # | Blocker | Affects | Resolution |
|---|---|---|---|
| B-01 | `r3f-perf` 7.x incompatible with R3F 9.x — `ScenePerf.tsx` is a stub | 3D performance visibility | Wait for `r3f-perf` compatible release or write custom stats overlay |
| B-02 | `ASSET_MANIFEST` in `loaders.ts` is empty — GLTF model pipeline is not active | 3D scene asset integration | Define manifest and provide Draco-compressed GLTF files before 3D assets can be loaded |
| B-03 | `whop-api.mjs` and `whop-mcp.mjs` at project root with no documentation | Unclear production role | Clarify with project owner: active integration or dead code? |
| B-04 | `TranslationEditorModal.tsx` is built but not wired to navigation | TK translation management | Decision needed: integrate into Settings page or remove |
| B-05 | Razorpay integration may require India-based business registration for live keys | Payments | Verify with Razorpay account status before enabling production payments |

---

## Files Created — SPR-001

| File | Purpose |
|---|---|
| `docs/Architecture.md` | System overview, routing, data flow, key design decisions |
| `docs/ProjectStructure.md` | Folder map, large-file registry, duplicate logic registry, module boundaries, proposed future structure |
| `docs/CodingStandards.md` | TypeScript, component, state, API, naming, security, testing conventions |
| `docs/DatabaseOverview.md` | Complete 18-table schema reference, migration strategy, constraint gaps |
| `docs/PerformanceNotes.md` | Bottleneck registry with severity, fix guidance, and sprint mapping |
| `docs/SecurityChecklist.md` | Vulnerability register with severity, status, and fix guidance |
| `docs/TechnicalDebtRegister.md` | 40-item debt register across 5 categories; 210 SP total estimated |
| `docs/ProductionReadinessChecklist.md` | 82-item gate checklist across 9 categories; current score ~21% |
| `docs/EngineeringSummary.md` | This file — scores, risks, strengths, recommended SPR-002, blockers |

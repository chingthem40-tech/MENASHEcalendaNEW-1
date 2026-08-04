# Menashe Platform — Known Issues (v1.0)

---

## Functional Blockers (Require Config)

### KI-001 — Authentication non-functional until Clerk is configured
**Status:** Config-blocked (see Task #2)  
**Impact:** All user-specific features return 401. Guest features (calendar, zmanim, announcements, community yahrzeit) work correctly.  
**Resolution:** Set `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` in Replit Secrets and redeploy.

### KI-002 — Sacred Wisdom chat unavailable until AI keys are configured
**Status:** Config-blocked (see Task #3)  
**Impact:** The AI chat screen shows an error state. All other features unaffected.  
**Resolution:** Set at least `OPENAI_API_KEY` in Replit Secrets and redeploy.

---

## TypeScript

### KI-003 — Pre-existing TypeScript errors in shared library dist builds
**Status:** Non-blocking (does not affect runtime — Vite uses esbuild, not tsc)  
**Detail:** `tsc --noEmit` reports errors because `lib/shared-core`, `lib/db`, `lib/api-zod`, and `lib/object-storage-web` dist/ directories are not built in the development environment. These errors are pre-existing and do not affect the Vite or esbuild compilation pipelines.  
**Resolution:** Run `pnpm run typecheck:libs` from the workspace root to build dist/ directories before running tsc checks.

### KI-004 — CensusModal.tsx has implicit `any` parameters
**Status:** Non-blocking  
**Detail:** ~40 implicit `any` type annotations exist in the large legacy CensusModal component. These do not affect runtime behaviour.  
**Resolution:** Defer to a dedicated TypeScript hardening sprint post-v1.0.

---

## Performance

### KI-005 — Rate limiter is in-memory and per-process
**Status:** Acceptable for single-replica deployment  
**Detail:** The rate limiter uses an in-memory Map per process instance. It resets on restart and is not shared across multiple replicas. Limits are generous enough for the expected load.  
**Resolution:** Migrate to a Redis-backed rate limiter if horizontal scaling is required.

### KI-006 — API bundle is 5.3MB (unminified)
**Status:** Acceptable — this is a server bundle, not served to browsers  
**Detail:** The API server bundles all dependencies into a single `dist/index.mjs` for fast startup. File size does not affect user-perceived performance.

---

## Minor

### KI-007 — `APP_VERSION` is hardcoded to `"1.0"`
**Status:** Minor  
**Detail:** `src/modals/whatsNewVersion.ts` hardcodes the version string. Must be manually bumped before each release to trigger the What's New modal for returning users.  
**Resolution:** Bump `APP_VERSION` in `whatsNewVersion.ts` before each release.

### KI-008 — Duplicate service worker registration
**Status:** Non-breaking (browser deduplicates)  
**Detail:** The SW is registered in both `main.tsx` (authoritative) and `hooks/usePushSubscription.ts`. The browser deduplicates SW registrations; no user impact.  
**Resolution:** Remove the registration from `usePushSubscription.ts` in a future cleanup sprint.

### KI-009 — `VITE_UPI_ID` falls back to a hardcoded UPI ID
**Status:** Minor risk  
**Detail:** If `VITE_UPI_ID` is not set, the premium payment screen uses a hardcoded fallback UPI VPA. This could route real payments to the wrong account in a misconfigured staging environment.  
**Resolution:** Set `VITE_UPI_ID` explicitly in all environments.

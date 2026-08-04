---
name: RC1 security hardening
description: Changes made to the API server during RC1 release-candidate hardening.
---

## Changes applied in RC1

- `helmet` installed and applied in `app.ts` with HSTS + all defaults; CSP disabled (handled by frontend/CDN)
- Rate-limiter skip path corrected from `/healthz` to `/health` (and `/healthz` as alias) in `lib/rateLimiter.ts`
- Global error handler added at bottom of `app.ts` — suppresses stack trace in production (`NODE_ENV === "production"`), always returns JSON `{ error: "Internal server error" }`
- Unknown `/api/*` routes now return JSON `{ error: "Not found" }` 404 instead of falling through to Express default HTML handler
- `/push/subscribe` no longer trusts client-supplied `userId`; derives from `safeGetAuth(req)` only
- `FeedbackButton.tsx` deleted (dead code — removed from App.tsx in QA-800)

## Documentation generated

Six files written to `docs/`:
- `RELEASE_NOTES_v1.0.md`
- `DEPLOYMENT_CHECKLIST.md`
- `PRODUCTION_SECRETS_CHECKLIST.md`
- `ROLLBACK_CHECKLIST.md`
- `KNOWN_ISSUES.md`
- `POST_LAUNCH_MONITORING.md`

**Why:** All API server changes are additive hardening only (no schema or business-logic changes). Safe to apply without data migration.

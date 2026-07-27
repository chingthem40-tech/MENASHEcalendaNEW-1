---
name: Clerk provisioning requirement
description: Clerk must be provisioned via setupClerkWhitelabelAuth() before the web app works; App.tsx and post-merge.sh now guard against missing keys.
---

# Clerk Provisioning

**Rule:** At the start of any session involving auth, always call `checkClerkManagementStatus()` first. If it returns `not_configured`, immediately call `setupClerkWhitelabelAuth()` before touching any other code.

**Why:** VITE_CLERK_PUBLISHABLE_KEY is a Replit-managed secret that only exists after provisioning. Without it, the web app renders a "Authentication Not Provisioned" screen and throws. The app used to crash the entire React tree with a bare `throw new Error`; it now shows a styled fallback UI so the symptom is obvious without a white screen.

**How to apply:**
1. `checkClerkManagementStatus()` → if `not_configured` → `setupClerkWhitelabelAuth()`
2. Then restart both the API server and the web workflows so new secrets are baked in.
3. The `post-merge.sh` guard will also fail loudly (`exit 1`) if `VITE_CLERK_PUBLISHABLE_KEY` is unset after a merge, preventing silent failures.

**Re-import note (2026-07-12):** on a fresh GitHub re-import, `checkClerkManagementStatus()` returned `"external"` (not `not_configured`) because `.replit` userenv.shared already had the publishable keys baked in from before.

**Cross-instance key mismatch symptom:** if EVERY authenticated route returns 401 (not just one feature) even though the user is visibly signed in, suspect the publishable key and secret key belong to different Clerk applications — this happens when a project is re-imported/forked and the new owner doesn't have dashboard access to the original Clerk app the publishable key points to. Diagnose without ever printing the secret value: fetch `https://api.clerk.com/v1/jwks` with `Authorization: Bearer <secret>` and compare its `kid` against `https://<slug-from-decoded-pk>.clerk.accounts.dev/.well-known/jwks.json` — if the `kid`s differ, the keys are from different instances.
**Fix when the user has no access to the original dashboard:** call `setupClerkWhitelabelAuth()` to provision a brand-new Replit-managed Clerk app; it sets `CLERK_SECRET_KEY`/`CLERK_PUBLISHABLE_KEY`/`VITE_CLERK_PUBLISHABLE_KEY` as Secrets. Then: (1) remove the old plaintext `CLERK_PUBLISHABLE_KEY`/`VITE_CLERK_PUBLISHABLE_KEY` entries from `.replit` userenv.shared (they shadow/conflict with the new secrets — plaintext env wins over same-named secret), (2) re-read the new publishable key from `process.env` (safe — publishable keys are meant to be public) and propagate it to any other consumer that still hardcodes the old one (e.g. `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` for a mobile app) via `setEnvVars`, (3) restart all affected workflows. Note this creates a brand-new user base — old accounts and any user-ID-keyed config (e.g. an `ADMIN_USER_ID`) become stale and must be redone by the new owner.

**Safeguards added (as of 2025-06-17):**
- `artifacts/menashe-calendar/src/App.tsx` — styled fallback UI instead of hard crash
- `scripts/post-merge.sh` — exits with clear error message if key is missing

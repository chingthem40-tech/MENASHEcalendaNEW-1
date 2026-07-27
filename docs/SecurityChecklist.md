# Security Checklist

> Purpose: Track all security vulnerabilities, mitigations, and required hardening work across the Menashe Platform.
> Last updated: 2026-06-27 (SPR-010 — Platform Hardening)

---

## Severity Legend

- 🔴 **Critical** — exploitable by any user; fix before any public launch
- 🟠 **High** — exploitable by a motivated attacker; fix in the next sprint
- 🟡 **Medium** — exploitable under specific conditions; fix within 2 sprints
- 🟢 **Low** — hardening / best practice; fix when capacity allows

---

## SPR-010 Endpoint Registry

### Public (no authentication required)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/healthz` | Health check; excluded from rate limiting |
| GET | `/api/books` | Returns only `published: true` books for non-admins |
| GET | `/api/books/:id` | Returns 404 for unpublished books to non-admins (fixed SPR-010) |
| GET | `/api/announcements` | Returns only `status: 'sent'` announcements for non-admins |
| GET | `/api/calendar/ics` | ICS feed; requires lat/lng/tz query params |
| GET | `/api/holiday-halacha` | Static halacha lookup; no user data |
| GET | `/api/payment/config` | Returns only public Razorpay key ID |
| GET | `/api/storage/public-objects/*` | Public file serving from public bucket path |
| GET | `/api/community/yahrzeit` | Public community candle board |
| POST | `/api/census/member-submissions` | Intentionally public — community members submit without login |
| POST | `/api/push/subscribe` | Web push subscription (rate-limited; endpoint validated) |
| DELETE | `/api/push/unsubscribe` | Web push unsubscription |
| GET | `/api/push/vapid-public-key` | Returns VAPID public key only |

### Authenticated (Clerk session required)

| Method | Path | Notes |
|--------|------|-------|
| GET/PUT | `/api/user/profile` | Own profile only; `isPremium` not writable by user (fixed SPR-010) |
| GET/PUT | `/api/user/public-profile` | Own public profile |
| GET/POST/DELETE | `/api/user/yahrzeit` | Own yahrzeit entries |
| GET/POST/DELETE | `/api/user/torah-tracker` | Own Torah study log |
| GET/PUT | `/api/user/torah-tracker/goal` | Own daily goal |
| POST | `/api/premium/request` | Submit premium access request |
| GET | `/api/premium/my-request` | Own request status |
| POST | `/api/payment/razorpay/order` | Create payment order (rate-limited) |
| POST | `/api/payment/razorpay/verify` | Verify payment + activate premium (rate-limited) |
| POST | `/api/storage/uploads/request-url` | Upload presigned URL |
| GET | `/api/storage/objects/*path` | Private file serving (auth required) |
| GET/PUT | `/api/census/branch` | Own branch data (community admin) |
| POST | `/api/census/submissions` | Submit branch for review |
| POST | `/api/community/yahrzeit` | Create + light community candle |
| POST | `/api/community/yahrzeit/:id/light` | Light existing candle |
| DELETE | `/api/community/yahrzeit/:id` | Delete own entry (scoped by userId in WHERE clause) |
| POST | `/api/community/yahrzeit/:id/dedicate` | Dedicate learning to candle |
| POST | `/api/parsha-insights` | AI Torah insights (rate-limited) |
| POST | `/api/holiday-insights` | AI holiday insights (rate-limited) |
| POST | `/api/chat` | AI chat / Rav Menashe (rate-limited) |
| POST | `/api/push/expo-token` | Register Expo push token |
| DELETE | `/api/push/expo-token` | Remove Expo push token |
| POST | `/api/push/send-test` | Send test push to self |
| POST | `/api/push/expo-send-test` | Send test Expo push to self |

### Admin (Clerk session + ADMIN_USER_ID match)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/books` | Create book |
| PUT | `/api/books/:id` | Update book |
| DELETE | `/api/books/:id` | Delete book |
| POST | `/api/books/seed` | Seed default library |
| POST | `/api/announcements/broadcast` | Create + broadcast announcement |
| PATCH | `/api/announcements/:id` | Edit or send announcement |
| DELETE | `/api/announcements/:id` | Delete announcement |
| GET | `/api/census/submissions` | View all branch submissions |
| PATCH | `/api/census/submissions/:id` | Approve/reject branch submission |
| GET | `/api/census/member-submissions` | View all member submissions |
| PATCH | `/api/census/member-submissions/:id` | Review member submission |
| GET | `/api/admin/premium-requests` | Pending premium requests |
| PUT | `/api/admin/premium-requests/:userId/approve` | Approve premium |
| PUT | `/api/admin/premium-requests/:userId/deny` | Deny premium |
| GET | `/api/admin/users` | List all user profiles |
| PUT | `/api/admin/users/:userId/premium` | Set premium status |
| GET | `/api/admin/payments` | Payment records |
| GET | `/api/admin/yahrzeit` | All community yahrzeit entries |
| DELETE | `/api/admin/yahrzeit/:id` | Remove any yahrzeit entry |
| GET | `/api/push/subscriber-count` | Push subscription count |
| POST | `/api/push/broadcast` | Broadcast push to all |
| GET/POST/DELETE | `/api/push/broadcast/scheduled` | Scheduled push management |

---

## SPR-010 Authorization Summary

`requireAdmin` middleware requires **both**:
1. A valid Clerk session token
2. The authenticated `userId` must match `ADMIN_USER_ID` env var

`requireAuth` middleware requires:
1. A valid Clerk session token only

All admin routes are protected by `requireAdmin`. No route relies on a PIN alone.

---

## Authentication & Authorization

| # | Item | Severity | Status | Notes |
|---|---|---|---|---|
| A-01 | Admin PIN hardcoded with no Clerk session required | 🔴 Critical | ✅ Fixed (SPR-003) | `requireAdmin` now requires Clerk session + ADMIN_USER_ID match. PIN system removed. |
| A-02 | Census GET endpoints had no auth | 🔴 Critical | ✅ Fixed (SPR-003) | Both `/census/submissions` and `/census/member-submissions` GET use `requireAdmin`. |
| A-03 | Object storage ACL not enforced | 🔴 Critical | ❌ Open | Any authenticated user can download any file via `/storage/objects/*path`. Ownership not verified. Fix: check userId against path prefix before serving. |
| A-04 | Admin routes in user.ts bypassed Clerk | 🟠 High | ✅ Fixed (SPR-003) | All admin routes require Clerk session via `requireAdmin`. |
| A-05 | No audit log for admin actions | 🟡 Medium | ⚠️ Partial | `auditLog.record()` calls exist but use a no-op storage backend. Persistent storage deferred to future sprint. |
| A-06 | `PUT /user/profile` accepted `isPremium` from user | 🔴 Critical | ✅ Fixed (SPR-010) | `isPremium` field stripped from user-controlled profile updates. Premium only set by admin routes and payment verification. |
| A-07 | `GET /books/:id` returned unpublished books to anyone | 🟠 High | ✅ Fixed (SPR-010) | Non-admin requests for unpublished books now return 404. |

---

## Input Validation

| # | Item | Severity | Status | Notes |
|---|---|---|---|---|
| V-01 | JSONB census columns accepted raw user input without Zod | 🟠 High | ✅ Fixed (SPR-010) | `branchSchema` and `memberSubmissionSchema` added with field limits. |
| V-02 | AI chat input not sanitized | 🟡 Medium | ✅ Improved (SPR-010) | Message length capped at 2000 chars per message, max 20 messages per request via Zod. Prompt injection remains a model-level concern; no server-side content filter yet. |
| V-03 | No input length limits on text fields | 🟡 Medium | ✅ Fixed (SPR-010) | Zod schemas added to: user profile, public profile, yahrzeit, Torah tracker, announcements, community yahrzeit, census branches, chat, parsha/holiday insights, payments. |
| V-04 | Request body size limit | 🟡 Medium | ✅ Fixed (SPR-010) | `express.json()` and `urlencoded()` now enforce a 512kb body size limit. |

---

## Rate Limiting

| # | Item | Severity | Status | Notes |
|---|---|---|---|---|
| R-01 | No rate limiting on any endpoint | 🟠 High | ✅ Fixed (SPR-010) | Global limiter: 300 req/15min/IP (health excluded). Applied in `app.ts`. |
| R-02 | No rate limit on AI endpoints | 🟠 High | ✅ Fixed (SPR-010) | AI limiter: 20 req/15min/IP on `/chat`, `/parsha-insights`, `/holiday-insights`. |
| R-03 | Payment endpoint spam | 🟠 High | ✅ Fixed (SPR-010) | Payment limiter: 10 req/15min/IP on order creation and verification. |
| R-04 | Push subscribe flood | 🟡 Medium | ✅ Fixed (SPR-010) | Push subscribe: 20 req/hr/IP. |
| R-05 | Per-user AI cost cap | 🟡 Medium | ❌ Open | IP-based rate limiting is in place but a determined user behind NAT could still exhaust the limit. Per-user daily cap (stored in DB or Redis) is the complete solution. Recommended follow-up. |

---

## Secrets & Configuration

| # | Item | Severity | Status | Notes |
|---|---|---|---|---|
| S-01 | `VITE_ADMIN_PIN` baked into browser bundle | 🟠 High | ✅ Resolved (SPR-010) | Admin PIN system replaced with Clerk-based auth; no PIN exists to expose. |
| S-02 | VAPID private key stored in `.replit` `[userenv]` | 🟡 Medium | ✅ Migrated (SPR-010 import) | All secrets migrated from `.replit` userenv to Replit Secrets store. |
| S-03 | Razorpay public key exposed via `/api/payment/config` | 🟢 Low | ✅ Acceptable | Public keys are designed to be shared. Private key is never in this route. |

---

## Network & Transport

| # | Item | Severity | Status | Notes |
|---|---|---|---|---|
| N-01 | CORS defaults to `origin: true` when `ALLOWED_ORIGINS` unset | 🟠 High | ✅ Improved (SPR-010) | Production now logs a warning and sets CORS to `false` (reject all cross-origin) when `ALLOWED_ORIGINS` is unset. Development keeps `origin: true` for convenience. |
| N-02 | Host header injection in Clerk proxy | 🟡 Medium | ❌ Open | `x-forwarded-host` used to construct proxy URLs without allowlist validation. Mitigated by Replit's proxy infrastructure but not explicitly validated. |
| N-03 | No HTTPS enforcement at app level | 🟢 Low | ✅ Replit handles | Replit's proxy terminates TLS. Acceptable in current hosting. |

---

## Data Privacy

| # | Item | Severity | Status | Notes |
|---|---|---|---|---|
| D-01 | No data retention policy | 🟡 Medium | ❌ Open | Census submissions, push tokens, and payment records accumulate indefinitely. |
| D-02 | No PII scrubbing in logs | 🟡 Medium | ❌ Open | The `?` split in pino serializer helps but doesn't cover all cases. |
| D-03 | No user data export/deletion flow | 🟡 Medium | ❌ Open | GDPR/privacy compliance requires user data export and deletion. |

---

## Remaining Security Risks (Recommended Follow-Up Work)

### High Priority
1. **A-03 (Object Storage ACL)** — Implement file-path-prefix ownership check before serving private objects. Any authenticated user can currently access any private file.
2. **R-05 (Per-user AI cap)** — Add a DB-backed per-user daily request counter for AI endpoints to prevent cost abuse behind shared IPs.

### Medium Priority
3. **N-02 (Host header allowlist)** — Add an explicit allowlist for `x-forwarded-host` values accepted by the Clerk proxy middleware.
4. **A-05 (Audit log storage)** — Replace `NoopAuditLog` with a real DB-backed implementation so admin actions are traceable.
5. **V-02 (Prompt injection)** — Consider a server-side content filter or moderation layer before Gemini calls.

### Low Priority
6. **D-01/D-02/D-03** — Define and implement a data retention + privacy (GDPR) strategy.

---

## Production Readiness — Security Gate

Before any public / production launch, the following must be resolved:

- [x] A-01: Replace PIN-only admin auth with Clerk role check ✅
- [x] A-02: Protect census read endpoints with `requireAdmin` ✅
- [ ] A-03: Enforce file ownership in object storage ACL ❌
- [x] A-06: Remove `isPremium` from user-controlled profile updates ✅
- [x] R-01: Add `express-rate-limit` to all endpoints ✅
- [x] N-01: Set and enforce `ALLOWED_ORIGINS` in production ✅ (fails safely when unset)
- [x] V-01: Add Zod validation to all JSONB census inputs ✅
- [x] S-01: Remove `VITE_ADMIN_PIN` from frontend bundle ✅ (PIN system removed)

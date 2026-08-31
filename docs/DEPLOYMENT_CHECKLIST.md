# Menashe Platform — Deployment Checklist

Use this checklist before every production deployment.

---

## 1. Required Secrets (Replit Secrets panel)

### Authentication (REQUIRED — app non-functional without)
- [ ] `SESSION_SECRET` — Random 64-char secret for Replit Auth session signing
- [ ] `REPL_ID` — Managed Replit Auth client identifier (auto-injected)

### Legacy Auth Transition (temporary)
- [ ] Keep Clerk secrets only while verifying existing users and organization-admin compatibility
- [ ] Do not rotate or remove Clerk credentials until identity migration acceptance checks pass

### AI / Sacred Wisdom (OPTIONAL — degrades gracefully when absent)
- [ ] `OPENAI_API_KEY` — OpenAI primary provider
- [ ] `GOOGLE_API_KEY` — Gemini fallback provider
- [ ] `GROK_API_KEY` — Grok tertiary fallback provider

### Payments — Razorpay (OPTIONAL — payment flow disabled when absent)
- [ ] `RAZORPAY_KEY_ID` — Razorpay API key ID
- [ ] `RAZORPAY_KEY_SECRET` — Razorpay API secret
- [ ] `VITE_UPI_ID` — UPI VPA for direct UPI payments (e.g. `yourorg@upi`)

### Push Notifications (OPTIONAL — push disabled when absent)
- [ ] `VAPID_PRIVATE_KEY` — VAPID private key (generate with `npx web-push generate-vapid-keys`)
- [ ] `VAPID_PUBLIC_KEY` — VAPID public key
- [ ] `VAPID_SUBJECT` — `mailto:admin@yourdomain.com`

### Object Storage (OPTIONAL — file uploads disabled when absent)
- [ ] `PUBLIC_OBJECT_SEARCH_PATHS` — Comma-separated public storage search paths
- [ ] `PRIVATE_OBJECT_DIR` — Private upload directory path

### CORS (OPTIONAL — defaults to REPLIT_DOMAINS in production)
- [ ] `ALLOWED_ORIGINS` — Comma-separated list of allowed CORS origins (e.g. `https://app.yourdomain.com`)

### Admin
- [ ] `ADMIN_USER_ID` — Application account ID of the admin notification recipient (for premium request alerts)

---

## 2. Database

- [ ] PostgreSQL database is provisioned (Replit built-in DB recommended)
- [ ] Connection string is available (auto-injected by Replit DB)
- [ ] Run migrations: API server runs `runMigrations()` automatically on startup — check logs for `Schema ready`

---

## 3. Build Verification

- [ ] API server builds without error: `pnpm --filter @workspace/api-server run build`
- [ ] Web app builds without error: `pnpm --filter @workspace/menashe-calendar run build`
- [ ] Mobile app builds without error: `node scripts/build.js` (in `artifacts/menashe-mobile`)

---

## 4. Replit Auth Configuration

- [ ] Auth providers are enabled in the Replit Auth panel and saved
- [ ] Production redirect URI is served at `/api/auth/callback` on the published domain
- [ ] A real sign-in round trip succeeds through the published domain
- [ ] Existing user identity mappings and application-owned admin roles are verified

---

## 5. Deployment Steps

1. Set all required secrets in Replit Secrets panel
2. Trigger a new deployment (Replit Deploy button)
3. Monitor startup logs for `Schema ready` and `Server listening`
4. Verify `/health` endpoint returns `{"status":"ok"}`
5. Sign in with the admin account and verify admin panel access
6. Test push notification subscription (if VAPID keys are set)
7. Test payment flow with Razorpay test keys before switching to live

---

## 6. Post-Deployment Verification

- [ ] Landing page loads correctly
- [ ] Sign In / Sign Up flow completes
- [ ] Calendar and zmanim display for the user's location
- [ ] At least one announcement is visible
- [ ] Community Yahrzeit page loads
- [ ] Settings → Help & Support → Feedback Center opens
- [ ] Admin panel accessible for org:admin users

---

## 7. Rollback

See `docs/ROLLBACK_CHECKLIST.md`.

# Production Configuration Guide

> MEP-605 — Menashe Platform deployment reference.
> Architecture: **Replit (backend) + Netlify (frontend)**.
> See `docs/ENVIRONMENT_VARIABLES.md` for the complete variable reference.

---

## Recommended Architecture

```
Users ──► Netlify CDN ──► React/Vite PWA (static)
               │
               │ /api/* proxy
               ▼
         Replit Reserved VM ──► Express API server
               │
               ├──► Replit PostgreSQL (DATABASE_URL)
               ├──► Replit Object Storage (GCS sidecar)
               ├──► Clerk (auth)
               ├──► OpenAI / Gemini / Grok (AI)
               └──► WebPush / VAPID (notifications)

Mobile ──► EAS Build ──► iOS / Android ──► same API server
```

---

## Deployment Checklist

### Phase 1 — Database

- [ ] Provision a PostgreSQL instance (Replit managed DB recommended — preserves object storage compatibility)
- [ ] Copy the connection string as `DATABASE_URL`
- [ ] Set `DATABASE_URL` as a Replit secret on the API server project
- [ ] Startup migrations run automatically on first boot (`runMigrations()`) — verify in logs

### Phase 2 — API Server (Replit Deployment)

**Secrets to set in Replit dashboard:**

| Secret | Where to get it |
|---|---|
| `DATABASE_URL` | Replit DB panel or your PostgreSQL provider |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `OPENAI_API_KEY` | platform.openai.com |
| `VAPID_PUBLIC_KEY` | Run `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Same as above |
| `RAZORPAY_KEY_ID` | Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | Razorpay dashboard |
| `ALLOWED_ORIGINS` | Set AFTER Netlify deploy (step 3.5) |

**Verification:**
- [ ] Deploy via Replit → Reserved VM
- [ ] Check startup logs for the configuration summary block
- [ ] All required services show `READY`
- [ ] `GET /healthz` returns `{ "status": "ok" }`

### Phase 3 — Web Frontend (Netlify)

**Before deploying, verify these files exist:**

- [ ] `artifacts/menashe-calendar/public/_redirects` — SPA routing + API proxy (already added)
- [ ] `netlify.toml` (optional but recommended for build settings as code)

**Netlify build settings:**

| Setting | Value |
|---|---|
| Base directory | `artifacts/menashe-calendar` |
| Build command | `pnpm build` |
| Publish directory | `dist/public` |
| Node version | 20+ |

**Netlify environment variables:**

| Variable | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key (`pk_live_...`) |

**Steps:**
- [ ] Connect the GitHub repo to Netlify
- [ ] Set base/build/publish directories as above
- [ ] Set `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] Trigger a deploy and verify the build succeeds
- [ ] Copy the Netlify production URL (`https://yourapp.netlify.app`)

**After Netlify deploy:**
- [ ] Edit `public/_redirects` — replace `YOUR_API_SERVER_URL` with the Replit production URL
- [ ] Redeploy Netlify
- [ ] Set `ALLOWED_ORIGINS=https://yourapp.netlify.app` on Replit API server
- [ ] Add the Netlify URL to **Clerk → Authorized Domains**

### Phase 4 — Mobile (Expo / EAS)

**EAS secrets to configure:**

```bash
# Add via EAS CLI or EAS dashboard
eas secret:create --scope project --name EXPO_PUBLIC_DOMAIN --value api.yourserver.com
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value pk_live_...
```

**Steps:**
- [ ] Link the project to EAS: `eas project:init`
- [ ] Add `projectId` to `app.json` under `extra.eas`
- [ ] Configure `updates.url` in `app.json` for OTA updates
- [ ] Add `EXPO_PUBLIC_DOMAIN` and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to EAS secrets
- [ ] Build: `eas build --platform all --profile production`
- [ ] Configure APNs (iOS) and FCM (Android) credentials in EAS for push notifications
- [ ] Submit: `eas submit --platform all`

---

## Service Configuration Details

### Clerk

- Create a production application at [clerk.com](https://clerk.com)
- Under **API Keys**: copy `pk_live_...` (publishable) and `sk_live_...` (secret)
- Under **Domains**: add your Netlify URL and your Replit API domain
- Under **JWT Templates** (if used): verify configuration
- The API server relays Clerk requests through `/clerk` proxy path — no client-side Clerk domain configuration required beyond the publishable key

### OpenAI

- API key from [platform.openai.com](https://platform.openai.com/api-keys)
- Set as `OPENAI_API_KEY` on the API server
- The AI gateway automatically falls back to Gemini → Grok if OpenAI fails
- At least one of `OPENAI_API_KEY`, `GOOGLE_API_KEY`, or `GROK_API_KEY` should be set

### Push Notifications

**Generate VAPID keys (run once, save results as secrets):**
```bash
npx web-push generate-vapid-keys
```

This outputs:
```
Public Key: <base64url string>
Private Key: <base64url string>
```

Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` on the API server.

The frontend already subscribes to push using the public key returned by `GET /api/push/public-key`. No frontend environment variable is needed for push.

**For mobile push (Expo):**
- Configure APNs credentials in EAS: `eas credentials`
- Configure FCM in EAS for Android
- Expo push tokens are registered via the API automatically when users grant notification permission

### Razorpay

- Dashboard at [dashboard.razorpay.com](https://dashboard.razorpay.com)
- Use **Live** keys (not Test) for production
- Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on the API server
- No webhook configuration is documented in the current codebase

### Object Storage (Replit GCS Sidecar)

> **⚠️ Replit lock-in:** The storage client in `objectStorage.ts` authenticates through `http://127.0.0.1:1106` — a Replit-internal endpoint. This **will not work** on Railway, Render, or Fly.io. See the migration path below.

**On Replit (current setup):**
- Object storage works automatically via the sidecar — no configuration required
- Optionally set `PRIVATE_OBJECT_DIR` and `PUBLIC_OBJECT_SEARCH_PATHS` to control directory paths

**Migrating off Replit:**
To move object storage off Replit, replace the `credentials` block in `src/lib/objectStorage.ts` with:
```typescript
const objectStorageClient = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GCS_PROJECT_ID,
});
```
Then set `GOOGLE_APPLICATION_CREDENTIALS` to the path of a GCS service account JSON file and `GCS_PROJECT_ID` to your GCP project ID.

---

## Post-Deployment Smoke Tests

Run these after every production deploy:

| Test | Expected result |
|---|---|
| `GET /healthz` | `{ "status": "ok" }` |
| Load the Netlify URL | SPA renders, no blank screen |
| Navigate to `/app` directly | App renders (not 404) |
| Sign in with Clerk | Auth flow completes |
| Open the calendar | Calendar renders for current month |
| Open AI chat (if OPENAI_API_KEY set) | SSE stream responds |
| Submit a prayer request | Request appears in board |
| Install as PWA | Prompt appears on mobile browser |

---

## Environment Variable Quick Reference

### Replit API Server Secrets

```
DATABASE_URL            = postgresql://...
CLERK_SECRET_KEY        = sk_live_...
CLERK_PUBLISHABLE_KEY   = pk_live_...
OPENAI_API_KEY          = sk-...
GOOGLE_API_KEY          = AIza...
GROK_API_KEY            = xai-...
VAPID_PUBLIC_KEY        = <base64url>
VAPID_PRIVATE_KEY       = <base64url>
RAZORPAY_KEY_ID         = rzp_live_...
RAZORPAY_KEY_SECRET     = <secret>
ALLOWED_ORIGINS         = https://yourapp.netlify.app
NODE_ENV                = production
```

### Netlify Build Environment Variables

```
VITE_CLERK_PUBLISHABLE_KEY = pk_live_...
```

### EAS Secrets

```
EXPO_PUBLIC_DOMAIN                 = api.yourserver.com  (no https://)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY  = pk_live_...
```

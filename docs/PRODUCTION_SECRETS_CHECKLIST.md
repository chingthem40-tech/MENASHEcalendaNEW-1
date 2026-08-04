# Menashe Platform — Production Secrets Checklist

## Critical (App fails to function without these)

| Secret | Where to get it | Impact if missing |
|---|---|---|
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys | All authenticated routes return 401; users cannot sign in |
| `CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys | Frontend crashes with "Authentication Not Provisioned" |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same as above | Same as above (required for Vite build-time injection) |
| `SESSION_SECRET` | Generate: `openssl rand -hex 64` | Session security degraded |

## High (Major features disabled)

| Secret | Where to get it | Impact if missing |
|---|---|---|
| `OPENAI_API_KEY` | platform.openai.com | Sacred Wisdom chat falls through to next provider |
| `GOOGLE_API_KEY` | console.cloud.google.com (Gemini) | AI falls through to Grok; parsha/holiday insights disabled |
| `GROK_API_KEY` | console.x.ai | If all 3 AI keys missing, Sacred Wisdom returns error |
| `RAZORPAY_KEY_ID` | razorpay.com Dashboard | Premium payment flow shows "unavailable" |
| `RAZORPAY_KEY_SECRET` | razorpay.com Dashboard | Same as above |
| `VITE_UPI_ID` | Your Razorpay/UPI account | Defaults to hardcoded UPI ID — set explicitly |

## Medium (Features degrade gracefully)

| Secret | Where to get it | Impact if missing |
|---|---|---|
| `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` | Push notifications disabled |
| `VAPID_PUBLIC_KEY` | Same command as above | Same as above |
| `VAPID_SUBJECT` | Your admin email | Falls back to `mailto:admin@menashecalendar.app` |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Your object storage config | File browsing throws at request time |
| `PRIVATE_OBJECT_DIR` | Your object storage config | Private file uploads fail at request time |

## Optional

| Secret | Where to get it | Impact if missing |
|---|---|---|
| `ALLOWED_ORIGINS` | Your domain list | Falls back to `REPLIT_DOMAINS` in production |
| `ADMIN_USER_ID` | Clerk user ID of admin | Premium request push notifications not sent to admin |
| `LOG_LEVEL` | Desired level | Defaults to `info` |

## Generating VAPID keys

```bash
npx web-push generate-vapid-keys
```

Copy the output — set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` from the result.

## Rotating secrets

After rotating any secret:
1. Update the value in Replit Secrets
2. Redeploy the app
3. For Clerk key rotation: users will be signed out and need to sign in again
4. For VAPID key rotation: all push subscriptions become invalid — users must re-subscribe

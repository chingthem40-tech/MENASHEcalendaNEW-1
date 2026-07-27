# Release Notes — Menashe Calendar v1.0

> **Version:** 1.0.0  
> **Release Date:** TBD (pending operator switch to Clerk production keys)  
> **Platform:** Web (PWA) + Mobile (Expo)  
> **Audience:** Bnei Menashe community — bilingual EN + Thadou Kuki  
> **Status:** 🟢 GO (conditional — see Deployment Notes)

---

## Overview

Menashe Calendar v1.0 is the first public release of the sacred calendar platform for the Bnei Menashe community. It provides daily Jewish calendar data, prayer times (Zmanim), Torah portions, community tools, and a digital Siddur library — all in English and Thadou Kuki.

---

## Features

### Jewish Calendar & Torah

- **Hebrew Date Display** — Today's Hebrew date on every screen; full month calendar view with Jewish holidays overlaid
- **Zmanim (Prayer Times)** — Detailed daily Zmanim (Alot HaShachar through Tzet HaKochavim) calculated from GPS or selected location using `suncalc`
- **Parasha of the Week** — Current Torah portion with insights and commentary
- **Daf Yomi** — Daily Talmud page tracker
- **Jewish Holidays** — Full holiday calendar with descriptions and dates
- **Omer Counter** — Counting of the Omer with daily sefirot
- **Tahara & Mikveh tracker** — Personal calendar tool (local, private)

### Community

- **Announcements** — Admin-posted community announcements with push notification support
- **Yahrzeit / Memorial** — Track yahrzeit dates with Hebrew calendar conversion
- **Birthday Tracker** — Hebrew birthday reminders
- **Community Census** — Household registration (local storage, v1)
- **Prayer Board & Events** — Local community bulletin board (localStorage, v1)

### Memorial Sanctuary

- **3D Memorial Sanctuary** — Immersive Three.js / React Three Fiber environment with virtual candles and flowers
- **Memorial Profiles** — Create and browse digital memorial profiles with photos, tributes, and candle lighting
- **Tributes** — Leave text tributes and virtual flowers on memorial profiles
- **Yahrzeit Integration** — Hebrew yahrzeit dates calculated via `@hebcal/core`

### Siddur Library

- **Sacred Text Library** — Browsable library of Siddur and community books
- **Book Reader** — In-app PDF/text viewer
- **Admin CRUD** — Authenticated admin can add, edit, and remove books (PIN: operator-managed)

### Settings & Personalization

- **Dark / Light / Sapphire Themes** — Three visual themes
- **Language Toggle** — Full bilingual UI: English ↔ Thadou Kuki
- **Location Picker** — Select city for Zmanim; persisted in localStorage
- **Push Notifications** — Opt-in for community announcements (requires VAPID keys)

### Progressive Web App (PWA)

- **Installable** — Manifest + service worker for home screen installation on iOS and Android
- **Offline Shell** — App shell cached offline; content loads when connection is available
- **Service Worker v3** — Two-cache strategy (shell + assets); no build-manifest dependency

---

## Known Limitations (v1.0)

| ID | Area | Description | Plan |
|---|---|---|---|
| L-01 | Community | Events, Prayer Board, Member Directory stored in localStorage — not synced across devices | v1.1: backend API |
| L-02 | Mobile | Memorial Sanctuary 3D environment is web-only | v1.1: mobile deep-link to web |
| L-03 | Push | Push notifications require `VAPID_PRIVATE_KEY` — silently disabled if not set | v1.1: operator sets key |
| L-04 | Auth | Clerk dev keys (`pk_test_`) must be switched to production keys before launch | Operator action required |
| L-05 | SEO | No sitemap.xml — app is community-gated, not public-indexed content | Acceptable for v1 |
| L-06 | Security | `VITE_ADMIN_PIN` is exposed in the frontend bundle | Operator should remove before launch |
| L-07 | Memorial | Memorial share links do not generate server-side OG preview cards | v1.1 |
| L-08 | Mobile | Landscape orientation not explicitly tested | v1.1 QA pass |
| L-09 | Architecture | URL routing is React state only — deep-linking not supported | v1.1 refactor |
| L-10 | Audit | `pnpm audit` not run — dependency vulnerability status unverified | Operator: run before go-live |

---

## Deployment Notes

### Prerequisites (Operator)

The following **three actions are required** before a public production launch. They are configuration changes, not code changes:

#### 1. Switch Clerk to Production Keys

In the Replit environment secrets and env vars, replace:
- `CLERK_SECRET_KEY` → production `sk_live_…` value (set as secret)
- `CLERK_PUBLISHABLE_KEY` → production `pk_live_…` value (set as env var)
- `VITE_CLERK_PUBLISHABLE_KEY` → same `pk_live_…` value
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` → same `pk_live_…` value

Obtain keys from: [clerk.com](https://clerk.com) → Dashboard → API Keys → Production instance.

#### 2. Remove Admin PIN from Frontend Bundle (SEC-06)

Delete the following from shared env vars:
- `VITE_ADMIN_PIN`
- `VITE_ADMIN_USER_ID`

The admin PIN is only needed server-side (`ADMIN_PIN`, `ADMIN_USER_ID` — already set correctly as backend-only).

#### 3. Set VAPID_PRIVATE_KEY (if push notifications needed at launch)

Generate a VAPID key pair and set:
- `VAPID_PRIVATE_KEY` as a Replit secret

The public key (`VAPID_PUBLIC_KEY`) is already configured. Without the private key, push notifications are silently disabled — no error is thrown.

### CORS

`ALLOWED_ORIGINS` is set to the current Replit dev domain. On first production deployment, Replit automatically populates `REPLIT_DOMAINS` with the production domain — the API server will accept it automatically via the `buildAllowedOrigins()` fallback. No additional CORS configuration is needed for the `.replit.app` domain.

If a custom domain is configured, add it to `ALLOWED_ORIGINS` (comma-separated).

### Database

- Database is provisioned and schema is current.
- Migrations run automatically on API startup (idempotent).
- Books library is seeded (8 books).
- No manual migration steps required for v1.0.

### Build Commands

```bash
# Build API server
pnpm --filter @workspace/api-server run build

# Build frontend (output: artifacts/menashe-calendar/dist/public)
pnpm --filter @workspace/menashe-calendar run build

# Full workspace build + typecheck
pnpm run build
```

### Health Check

```
GET /api/healthz → {"status":"ok"}
```

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 7 + Tailwind CSS + Wouter |
| Mobile | Expo SDK 54 + React Native |
| API | Express 5 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Clerk |
| 3D | React Three Fiber + Three.js |
| Jewish Calendar | `@hebcal/core` + `suncalc` |
| Offline | Service Worker v3 (custom) |
| Monorepo | pnpm workspaces + Node.js 24 |

---

## Release Engineer Sign-off

| Check | Status |
|---|---|
| Critical blockers (B-03, B-05) resolved | ✅ |
| Global Error Boundary in place | ✅ |
| CORS configured for production | ✅ |
| PWA assets verified | ✅ |
| API smoke test passed | ✅ |
| Frontend boots without error | ✅ |
| Database connected | ✅ |
| Auth guard enforced | ✅ |
| Clerk keys switched to production | ⏳ Operator action |
| VITE_ADMIN_PIN removed | ⏳ Operator action |
| VAPID_PRIVATE_KEY set | ⏳ Operator action (optional) |

**Overall: 🟢 GO — pending 3 operator-owned configuration actions.**

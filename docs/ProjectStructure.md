# Project Structure

> Purpose: Canonical folder map, large-file registry, duplicate logic register, reusable module boundaries, and proposed future structure.
> Last updated: 2026-06-26 (SPR-001)

---

## Current Folder Structure

```
workspace/
├── artifacts/
│   ├── api-server/
│   │   ├── src/
│   │   │   ├── routes/              # 14 Express route modules
│   │   │   │   ├── announcements.ts
│   │   │   │   ├── books.ts
│   │   │   │   ├── calendar.ts
│   │   │   │   ├── census.ts
│   │   │   │   ├── chat.ts
│   │   │   │   ├── communityYahrzeit.ts
│   │   │   │   ├── health.ts
│   │   │   │   ├── holidayHalacha.ts
│   │   │   │   ├── holidayInsights.ts
│   │   │   │   ├── parshaInsights.ts
│   │   │   │   ├── payments.ts
│   │   │   │   ├── push.ts
│   │   │   │   ├── storage.ts
│   │   │   │   └── user.ts
│   │   │   ├── middlewares/
│   │   │   │   └── clerkProxyMiddleware.ts
│   │   │   ├── lib/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── objectStorage.ts
│   │   │   │   └── requireAuth.ts
│   │   │   ├── migrate.ts           # Raw SQL startup migrations
│   │   │   ├── app.ts               # Express app wiring
│   │   │   └── index.ts             # Entry: migrate → schedulers → listen
│   │   └── build.mjs                # esbuild config
│   │
│   ├── menashe-calendar/
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Home.tsx         ⚠️ 5,206 lines
│   │       │   ├── CalendarPage.tsx
│   │       │   ├── ZmanimPage.tsx
│   │       │   ├── SiddurPage.tsx
│   │       │   ├── SettingsPage.tsx
│   │       │   ├── Landing.tsx
│   │       │   └── TorahPage.tsx
│   │       ├── modals/              # 20+ modal components
│   │       │   ├── AdminModal.tsx          ⚠️ 2,038 lines
│   │       │   ├── CensusModal.tsx         ⚠️ 2,298 lines
│   │       │   ├── MemorialSanctuaryModal.tsx ⚠️ 1,823 lines
│   │       │   ├── TranslationEditorModal.tsx  ⚠️ UNUSED
│   │       │   └── … (16 additional modals)
│   │       ├── components/
│   │       │   ├── BottomNav.tsx
│   │       │   ├── SplashScreen.tsx
│   │       │   └── ui/              # shadcn/ui primitives (duplicated in mockup-sandbox)
│   │       ├── scene/               # R3F 3D world
│   │       │   ├── MemorialValley3D.tsx  ⚠️ ~2,500 lines (estimate)
│   │       │   ├── QualityContext.tsx
│   │       │   ├── SceneFoundation.tsx
│   │       │   ├── loaders.ts
│   │       │   └── ScenePerf.tsx    ⚠️ STUB (r3f-perf incompatibility)
│   │       ├── lib/
│   │       │   ├── hebrewCalendar.ts   ⚠️ DUPLICATED in mobile
│   │       │   ├── zmanim.ts           ⚠️ DUPLICATED in mobile
│   │       │   ├── parasha.ts
│   │       │   ├── parashaInsights.ts
│   │       │   ├── locations.ts        ⚠️ DUPLICATED in mobile
│   │       │   ├── translations.ts     ⚠️ 1,293 lines, DUPLICATED in mobile
│   │       │   └── userApi.ts          ⚠️ DUPLICATED in mobile
│   │       ├── context/
│   │       │   └── LanguageContext.tsx
│   │       └── App.tsx              ⚠️ 931 lines — god file
│   │
│   ├── menashe-mobile/
│   │   ├── app/
│   │   │   ├── _layout.tsx          # Root + Clerk guard
│   │   │   ├── sign-in.tsx
│   │   │   └── (tabs)/              # Calendar, Zmanim, Torah, Community tabs
│   │   ├── context/
│   │   │   ├── AppContext.tsx       # Theme, location, push token, notif prefs
│   │   │   └── LanguageContext.tsx
│   │   ├── lib/
│   │   │   ├── hebrewCalendar.ts   ⚠️ DUPLICATE of web version
│   │   │   ├── zmanim.ts           ⚠️ DUPLICATE of web version
│   │   │   ├── locations.ts        ⚠️ DUPLICATE of web version
│   │   │   ├── translations.ts     ⚠️ DUPLICATE of web version (426 lines)
│   │   │   ├── biometricAuth.ts
│   │   │   ├── clerkTokenCache.ts
│   │   │   └── expoPush.ts
│   │   └── shims/                  # Native compatibility shims
│   │
│   └── mockup-sandbox/
│       └── src/
│           ├── components/
│           │   ├── ui/              ⚠️ 100% DUPLICATE of menashe-calendar/ui/
│           │   └── mockups/         # A/B calendar variants
│           └── main.tsx
│
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml            # Source of truth for API contract
│   ├── api-client-react/           # Generated hooks (underused by web app)
│   ├── api-zod/                    # Generated Zod schemas
│   ├── db/
│   │   ├── src/schema/             # Drizzle table definitions (18 tables)
│   │   └── drizzle.config.ts
│   └── object-storage-web/
│
├── scripts/
│   ├── post-merge.sh               # CI: install + db push + Clerk guard
│   ├── start-frontend.sh
│   └── generate-scene-models.mjs
│
├── docs/                           # ← This directory (created SPR-001)
├── attached_assets/                # Design references and images
├── whop-api.mjs                    ⚠️ ROOT-LEVEL — purpose unclear
├── whop-mcp.mjs                    ⚠️ ROOT-LEVEL — purpose unclear
├── app.jx                          ⚠️ ROOT-LEVEL — unknown file type
└── pnpm-workspace.yaml
```

---

## Task 3 — Large File Refactoring Candidates

> Files exceeding 400 lines. Do NOT split yet — document only.

| # | File | Lines | Primary Problem | Suggested Sprint |
|---|---|---|---|---|
| 1 | `pages/Home.tsx` | 5,206 | Renders the entire home dashboard; contains calendar previews, zmanim panel, parasha widget, announcement banners, all holiday cards, Daf Yomi preview, and all event handlers. Should be 8–12 smaller components. | SPR-003 |
| 2 | `modals/CensusModal.tsx` | 2,298 | Full multi-step form wizard, branch management, member submission flow, and admin review UI in one file. | SPR-004 |
| 3 | `modals/AdminModal.tsx` | 2,038 | Admin dashboard with user management, premium grants, announcement broadcast, book management, and census review — six distinct sub-features in one component. | SPR-004 |
| 4 | `scene/MemorialValley3D.tsx` | ~2,500 | 3D terrain, water shaders, sky dome, vegetation, wildlife, lighting, particles, flowers, candles, and camera logic — all in one file. Should be 10+ sub-modules. | SPR-005 |
| 5 | `modals/MemorialSanctuaryModal.tsx` | 1,823 | R3F canvas host + all floating UI panels (Home, Memorials, Flowers, Music) in one component. | SPR-005 |
| 6 | `lib/translations.ts` (web) | 1,293 | Entire EN/TK dictionary in a single export. Fine for now; becomes a bottleneck when adding languages or domains. | SPR-006 |
| 7 | `App.tsx` | 931 | Root router + 30+ modal boolean states + auth UI + profile sync + theme logic. Should be decomposed into a router, a modal manager, and an auth wrapper. | SPR-003 |
| 8 | `routes/push.ts` (API) | 834 | Web push scheduler, Expo push scheduler, holiday reminder scheduler, yahrzeit scheduler, and VAPID logic — five distinct responsibilities. | SPR-004 |
| 9 | `routes/user.ts` (API) | 484 | User profile CRUD, public profile, admin user management, premium grants, and torah tracker — should be split by domain. | SPR-004 |
| 10 | `lib/translations.ts` (mobile) | 426 | Same issue as web version, but smaller. | SPR-006 |

---

## Task 4 — Duplicated Business Logic Registry

> Logic that exists in two or more places. Do NOT modify — document only.

| # | Logic Unit | Web Location | Mobile Location | Drift Risk |
|---|---|---|---|---|
| 1 | `zmanim.ts` — Gra prayer time calculations | `menashe-calendar/src/lib/zmanim.ts` (89 lines) | `menashe-mobile/lib/zmanim.ts` (74 lines) | High — JERUSALEM candle-lighting offset inconsistency already present |
| 2 | `hebrewCalendar.ts` — HDate conversion, month grid generation, Gematria | `menashe-calendar/src/lib/hebrewCalendar.ts` (126 lines) | `menashe-mobile/lib/hebrewCalendar.ts` | Medium |
| 3 | `translations.ts` — Full EN/TK dictionary | `menashe-calendar/src/lib/translations.ts` (1,293 lines) | `menashe-mobile/lib/translations.ts` (426 lines) | High — TK strings may diverge silently |
| 4 | `locations.ts` — City preset list + Location type | `menashe-calendar/src/lib/locations.ts` | `menashe-mobile/lib/locations.ts` | Medium |
| 5 | `announcementsApi.ts` — fetchAnnouncements | `menashe-calendar/src/lib/` | `menashe-mobile/lib/` | Medium |
| 6 | `userApi.ts` / profile sync | `menashe-calendar/src/lib/userApi.ts` | `menashe-mobile/lib/userApi.ts` | Medium |
| 7 | `ui/` components (shadcn/ui) | `menashe-calendar/src/components/ui/` | `mockup-sandbox/src/components/ui/` | Low (sandbox only) |

**Root cause:** No shared workspace library for cross-platform business logic exists. All seven units above should live in a new `packages/shared/` package (see Task 6).

---

## Task 5 — Reusable Module Boundaries

> Logical domains that should be isolated as self-contained modules.

### Module: Calendar Engine
**Responsibilities:** Hebrew date conversion, month grid generation, Gematria numerals, holiday detection, Parasha lookup, Daf Yomi cycle, Omer counting.
**Current location:** `menashe-calendar/src/lib/hebrewCalendar.ts`, `parasha.ts`, fragmented in modal components.
**Dependencies:** `@hebcal/core` only.
**Proposed package:** `packages/shared/calendar/`

### Module: Zmanim Engine
**Responsibilities:** All 14 Gra prayer time calculations, candle lighting, havdalah, Shaah Zmanit.
**Current location:** `menashe-calendar/src/lib/zmanim.ts` + duplicate in mobile.
**Dependencies:** `suncalc` only.
**Proposed package:** `packages/shared/zmanim/`

### Module: Translations / i18n
**Responsibilities:** EN/TK dictionary, `useLanguage` hook, TK override system.
**Current location:** `translations.ts` + `LanguageContext.tsx` (both platforms).
**Proposed package:** `packages/shared/i18n/`

### Module: Location Engine
**Responsibilities:** Preset city list, geolocation, reverse geocoding, timezone detection.
**Current location:** `locations.ts` + `LocationModal.tsx`.
**Proposed package:** `packages/shared/locations/`

### Module: Memorial Engine
**Responsibilities:** 3D scene management, quality tiers, virtual flowers, candle lighting, ambient sound, yahrzeit data.
**Current location:** `scene/` directory + `MemorialSanctuaryModal.tsx`.
**Proposed package:** `packages/memorial/` (web-only; R3F is not React Native compatible)

### Module: Community
**Responsibilities:** Yahrzeit board, census, announcements, prayer board.
**Current location:** API routes + frontend modals.
**Proposed package:** `packages/community/` (shared API types and validation)

### Module: AI
**Responsibilities:** Gemini chat (Rav Menashe), parasha insights, holiday insights.
**Current location:** `routes/chat.ts`, `routes/parshaInsights.ts`, `routes/holidayInsights.ts`.
**Proposed package:** `packages/ai/` (server-side only)

### Module: Notifications
**Responsibilities:** Web Push (VAPID), Expo push, holiday schedulers, yahrzeit reminders.
**Current location:** `routes/push.ts` (834 lines).
**Proposed package:** `packages/notifications/` (server-side; client subscription helpers in shared)

### Module: Payments
**Responsibilities:** Razorpay order creation, payment verification, premium status grant.
**Current location:** `routes/payments.ts`.
**Proposed package:** `packages/payments/` (server-side only)

### Module: Authentication
**Responsibilities:** Clerk middleware, token cache, `requireAuth`, admin auth.
**Current location:** `middlewares/clerkProxyMiddleware.ts`, `lib/requireAuth.ts`, `lib/clerkTokenCache.ts`.
**Proposed package:** Remain in each artifact; shared types only in `packages/shared/auth/`

---

## Task 6 — Proposed Future Folder Structure

> Documentation only. Do NOT move any files during this sprint.

```
workspace/
├── packages/                         ← NEW: replaces lib/ + adds shared logic
│   ├── shared/
│   │   ├── calendar/                 ← hebrewCalendar.ts, parasha.ts, dafYomi.ts
│   │   ├── zmanim/                   ← zmanim.ts (single source for both platforms)
│   │   ├── i18n/                     ← translations.ts, LanguageContext (base)
│   │   ├── locations/                ← locations.ts, Location type
│   │   ├── auth/                     ← shared Clerk types, apiFetch helper
│   │   └── api-types/                ← replaces api-zod (typed from OpenAPI)
│   ├── ui/                           ← replaces duplicate shadcn/ui in both apps
│   │   └── components/               ← Button, Dialog, Select, etc.
│   ├── memorial/                     ← R3F scene (web-only)
│   │   ├── scene/
│   │   │   ├── Terrain.tsx
│   │   │   ├── Water.tsx
│   │   │   ├── Sky.tsx
│   │   │   ├── Vegetation.tsx
│   │   │   ├── Lighting.tsx
│   │   │   ├── Particles.tsx
│   │   │   ├── Flowers.tsx
│   │   │   ├── Candles.tsx
│   │   │   └── Camera.tsx
│   │   └── MemorialSanctuary.tsx     ← shell only (imports sub-modules)
│   ├── community/
│   │   ├── yahrzeit/
│   │   ├── census/
│   │   └── announcements/
│   ├── notifications/
│   │   ├── vapid/
│   │   ├── expo/
│   │   └── schedulers/
│   ├── ai/
│   │   ├── chat/
│   │   ├── parshaInsights/
│   │   └── holidayInsights/
│   └── payments/
│       └── razorpay/
│
├── artifacts/
│   ├── api-server/                   ← Imports from packages/; routes stay thin
│   ├── menashe-calendar/             ← Imports from packages/shared/ and packages/memorial/
│   └── menashe-mobile/               ← Imports from packages/shared/ only (no R3F)
│
├── lib/                              ← Retained during migration; deprecated gradually
│   ├── api-spec/                     ← Keep: OpenAPI is still source of truth
│   ├── db/                           ← Keep: Drizzle schema stays here
│   └── object-storage-web/           ← Keep or migrate to packages/
│
└── docs/                             ← This directory
```

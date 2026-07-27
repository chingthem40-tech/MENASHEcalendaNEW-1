# Menashe Calendar

## Setup Status (as of 2026-07-22)

Project imported from GitHub and set up on Replit:

- **Dependencies**: `pnpm install` run at root — all 1728 packages resolved and hoisted to root `node_modules` via `shamefully-hoist=true` (.npmrc).
- **Database**: Replit-managed PostgreSQL provisioned and reachable. Drizzle migrations run automatically on API server startup (`runMigrations()` in `artifacts/api-server/src/index.ts`).
- **Workflows**: All four workflows confirmed running:
  - `artifacts/menashe-calendar: web` — Vite dev server on port 21636 ✓
  - `artifacts/api-server: API Server` — Express on port 8080, migrations applied ✓
  - `artifacts/menashe-mobile: expo` — Metro bundler on port 25726 ✓
  - `artifacts/mockup-sandbox: Component Preview Server` — Vite on port 8081 ✓
- **Secrets pending**: `CLERK_SECRET_KEY` is **not yet set** — authentication middleware is disabled and all protected routes return 401 until this is added as a Replit Secret. All public env vars (`CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`, `ADMIN_PIN`, `ADMIN_USER_ID`) are already configured in shared environment.
- **Optional secrets not yet set**: `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `GROK_API_KEY` (AI chat), `VAPID_PRIVATE_KEY` (push notifications), `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` (payments) — app runs without these but those features are disabled.

A sacred Jewish calendar app for the Bnei Menashe community — featuring Hebrew/Jewish calendar, Zmanim (prayer times), Parasha, Daf Yomi, holidays, a Siddur library, 3D Memorial Sanctuary, community tools, and AI-powered sacred wisdom chat.

## Run & Operate

### Replit workflows

The project is registered as 4 Replit artifacts, each with its own managed workflow (run together via the **"Project"** run button):

| Workflow | Service | Port | Preview path |
|----------|---------|------|---------------|
| `artifacts/menashe-calendar: web` | Frontend (Vite) | 21636 | `/` |
| `artifacts/api-server: API Server` | API Server (Express) | 8080 | `/api` |
| `artifacts/mockup-sandbox: Component Preview Server` | Canvas design sandbox (Vite) | 8081 | `/__mockup` |
| `artifacts/menashe-mobile: expo` | Expo Metro bundler | 25726 | `/mobile/` |

The frontend proxies all `/api/*` requests to `http://localhost:8080` (configured in `artifacts/menashe-calendar/vite.config.ts`).

Note: `scripts/start-dev.sh` (old combined frontend+API launcher) is superseded by the per-artifact workflows above and is no longer used by any workflow — kept only for manual/local use.

### Other useful commands
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — build all packages
- `pnpm --filter @workspace/api-server run dev` — rebuild + start API server in isolation
- `pnpm --filter @workspace/menashe-calendar run build` — production frontend build

### Environment / secrets

**Required to run:**

| Key | Where | Notes |
|-----|-------|-------|
| `DATABASE_URL` | Runtime-managed | PostgreSQL attached by Replit — do not set manually |
| `CLERK_PUBLISHABLE_KEY` | `.replit` userenv.shared | Clerk dev instance (public key — safe in repo) |
| `VITE_CLERK_PUBLISHABLE_KEY` | `.replit` userenv.shared | Same value, injected into Vite bundle |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | `.replit` userenv.shared | Same value, injected into Expo bundle |
| `CLERK_SECRET_KEY` | Replit Secrets | — |
| `VAPID_PUBLIC_KEY` | `.replit` userenv.shared | Web push public key |
| `VAPID_SUBJECT` | `.replit` userenv.shared | Web push contact email |
| `ADMIN_PIN` | `.replit` userenv.shared | Admin access PIN (also `VITE_ADMIN_PIN`) |
| `ADMIN_USER_ID` | `.replit` userenv.shared | Clerk user ID for admin (also `VITE_ADMIN_USER_ID`) |

**Optional (AI features):**

| Key | Feature |
|-----|---------|
| `OPENAI_API_KEY` | Primary AI provider for Sacred Wisdom chat |
| `GOOGLE_API_KEY` | Gemini fallback |
| `GROK_API_KEY` | Grok fallback |

**Optional (payments):**

| Key | Feature |
|-----|---------|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Premium subscription payments |
| `VITE_UPI_ID` | UPI payment display |

**Optional (push notifications):**
- `VAPID_PRIVATE_KEY` — required to actually send web push notifications; not set by default so push is disabled until added as a Replit Secret.

## Stack

- **Monorepo**: pnpm workspaces
- **Runtime**: Node.js 20, TypeScript 5.9
- **API**: Express 5, Drizzle ORM, PostgreSQL
- **Validation**: Zod (v4), drizzle-zod
- **Build**: esbuild (API), Vite 7 (frontend)
- **Frontend**: React 19, Tailwind CSS, Wouter routing, Radix UI, Framer Motion
- **3D**: Three.js, @react-three/fiber, @react-three/drei
- **Auth**: Clerk (@clerk/react + @clerk/express)
- **Mobile**: Expo SDK 54, React Native
- **Jewish calendar**: @hebcal/core, suncalc

## Where things live

```
artifacts/
  menashe-calendar/src/
    pages/          — Home, CalendarPage, ZmanimPage, SiddurPage, SettingsPage, Landing, TorahPage, PremiumPage
    modals/         — Day, Holidays, Parashah, DafYomi, Zmanim, Community, CommunityYahrzeit, Chat, Admin, ...
    scene/          — 3D Memorial Sanctuary (Three.js / R3F)
    features/memorial/ — memorial API, stores, hooks
    components/     — UI primitives, BottomNav, banners
    lib/            — hebrewCalendar, zmanim, parasha, translations, LanguageContext
  api-server/src/
    routes/         — books, memorials, community, ai, payments, directory (member_directory), ...
    memorial/       — repos + services for memorial system
    ai/             — gateway (OpenAI → Gemini → Grok fallback), circuit breaker
  menashe-mobile/   — Expo app (tabs: Calendar, Torah, Community, Settings)
    app/community/directory.tsx, directory-register.tsx — Member Directory browse + register/edit
    lib/directoryApi.ts — Clerk-token-authenticated fetch client for the directory API
  mockup-sandbox/   — Vite component preview server for Canvas design work
lib/
  shared-core/      — Hebrew calendar utils, zmanim, parasha aliyot, translations
  db/src/schema/    — Drizzle table schemas (books, memorial, community, users)
  api-client-react/ — TanStack Query hooks generated from OpenAPI spec
```

## Architecture decisions

- Bilingual: **English (EN) + Thadou Kuki (TK)**. All UI text goes through `LanguageContext` / `useLanguage()` — never hardcode English-only strings.
- Hebrew calendar calculations done client-side with `@hebcal/core`.
- Zmanim (prayer times) calculated client-side with `suncalc`.
- Auth uses Clerk; API calls attach Bearer token via `window.Clerk?.session?.getToken()` (cookies alone don't work through Replit's proxy).
- Admin access uses a PIN header (`x-admin-pin`) in addition to Clerk auth for admin routes.
- 3D scene files strip Cartographer `data-component-name` props at build time (R3F 9.x throws on hyphenated props).

## User preferences

- All new UI text must have both English and Thadou Kuki translations in `artifacts/menashe-calendar/src/lib/translations.ts`, referenced via `useLanguage()` / `t.xxx`.
- Never hardcode English-only strings in UI components.

## Gotchas

- `CLERK_SECRET_KEY` is stored as a Replit Secret (not tracked in git).
- AI features (Sacred Wisdom chat) silently degrade if no AI API keys are set — add `OPENAI_API_KEY` as a Replit Secret to enable.
- Push notifications require `VAPID_PRIVATE_KEY` as a Replit Secret.
- `@hebcal/noaa` ships pure ESM; a pre-compiled CJS shim is used via Metro `resolveRequest` for the mobile build.
- Any change to the Memorial Sanctuary 3D scene must avoid `r3f-perf` / `ScenePerf` — it breaks the R3F reconciler every frame.

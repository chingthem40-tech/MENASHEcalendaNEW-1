# Menashe Calendar


## Setup Status (as of 2026-09-01)

Project imported from GitHub and set up on Replit:

- **Dependencies**: `pnpm install` run at root — all 1728 packages resolved and hoisted to root `node_modules` via `shamefully-hoist=true` (.npmrc).
- **Database**: Replit-managed PostgreSQL provisioned and reachable. Development API startup applies the idempotent bootstrap migrations. Production API startup never runs migrations or seeds; Replit Publish must initialize the production schema.
- **Workflows**: Four managed workflows are configured for the web app, API, mobile app, and design sandbox.
- **Authentication**: The web and API use Supabase Auth with email/password sessions. The browser attaches Supabase bearer tokens to same-origin API calls; the API verifies each token and resolves it to a stable application account ID.
- **Account continuity**: A new verified Supabase identity is linked automatically only when its email matches exactly one existing verified identity. Ambiguous matches remain isolated for explicit administrator review.
- **Optional secrets not yet set**: `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `GROK_API_KEY` (AI chat), and `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` (payments) — the app runs without these but those features are disabled.

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
- `pnpm --filter @workspace/api-server run db:bootstrap` — explicitly apply development schema/bootstrap changes
- `pnpm --filter @workspace/api-server run dev` — bootstrap development DB, then start API server
- `pnpm --filter @workspace/menashe-calendar run build` — production frontend build

### Production API

- Replit Autoscale builds only `@workspace/api-server`.
- Production starts with `node --enable-source-maps artifacts/api-server/dist/index.mjs`.
- The server uses the hosting-provided `PORT`, binds to `0.0.0.0`, and exposes `/health`.
- Production startup assumes Publish has already initialized the schema; it does not run migrations or seeds.
- The Netlify web build requires the real published API origin in `NETLIFY_API_URL`.

### Environment / secrets

**Required to run:**

| Key | Where | Notes |
|-----|-------|-------|
| `DATABASE_URL` | Runtime-managed | PostgreSQL attached by Replit — do not set manually |
| `VITE_SUPABASE_URL` | Shared environment | Public Supabase project URL used by the web and API auth clients |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Shared environment | Public Supabase browser key; never substitute a service-role key |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Shared environment | Mobile Clerk publishable key |
| `VAPID_PUBLIC_KEY` | `.replit` userenv.shared | Web push public key |
| `VAPID_SUBJECT` | `.replit` userenv.shared | Web push contact email |
| `VAPID_PRIVATE_KEY` | Replit Secrets | Web push private key; never expose it to the browser |
| `ADMIN_USER_ID` | Server environment | Optional notification recipient only; does not grant admin access |

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

**Web push:**
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` must all be valid before Web Push delivery is enabled.

## Stack

- **Monorepo**: pnpm workspaces
- **Runtime**: Node.js 20, TypeScript 5.9
- **API**: Express 5, Drizzle ORM, PostgreSQL
- **Validation**: Zod (v4), drizzle-zod
- **Build**: esbuild (API), Vite 7 (frontend)
- **Frontend**: React 19, Tailwind CSS, Wouter routing, Radix UI, Framer Motion
- **3D**: Three.js, @react-three/fiber, @react-three/drei
- **Web Auth**: Supabase Auth (`@supabase/supabase-js`)
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
- Web auth uses Supabase email/password sessions; the browser attaches the current access token to same-origin `/api/*` requests.
- Admin access is enforced server-side after a valid Supabase identity resolves to an account in `app_admin_assignments`.
- 3D scene files strip Cartographer `data-component-name` props at build time (R3F 9.x throws on hyphenated props).

## User preferences

- All new UI text must have both English and Thadou Kuki translations in `artifacts/menashe-calendar/src/lib/translations.ts`, referenced via `useLanguage()` / `t.xxx`.
- Never hardcode English-only strings in UI components.

## Gotchas

- Never use a Supabase service-role key in browser code or a `VITE_*` variable.
- AI features (Sacred Wisdom chat) silently degrade if no AI API keys are set — add `OPENAI_API_KEY` as a Replit Secret to enable.
- Push notifications require `VAPID_PRIVATE_KEY` as a Replit Secret.
- `@hebcal/noaa` ships pure ESM; a pre-compiled CJS shim is used via Metro `resolveRequest` for the mobile build.
- Any change to the Memorial Sanctuary 3D scene must avoid `r3f-perf` / `ScenePerf` — it breaks the R3F reconciler every frame.

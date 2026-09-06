---
name: Offline service worker — Menashe Calendar
description: How offline mode is structured; must stay git-safe (no build manifests)
---

**Rule:** Do NOT use `vite-plugin-pwa` or any build-generated precache manifests.
The SW lives as a static `artifacts/menashe-calendar/public/sw.js` and is committed to git as-is.

**Two caches:**
- `menashe-shell-vN` — app shell (HTML, icons, manifest). Pre-cached on SW install.
- `menashe-assets-vN` — JS/CSS/font/image bundles. Stale-while-revalidate (serve cached immediately, update in background).

**Pass-throughs (never intercepted):** `/api/*`, Clerk hostnames (`*.clerk.com`, `*.accounts.dev`), Vite dev internals (`/@*`, `/node_modules/`, `/__*`), cross-origin requests.

**SW registration:** Done in `main.tsx` on startup only in production (not only when push notifications are enabled in `usePushSubscription.ts`). Development unregisters stale workers and clears Menashe caches so Vite module changes cannot leave the preview blank. Both production and push paths call the same `${import.meta.env.BASE_URL}sw.js` — duplicate register calls are no-ops.

**Why:** Service-worker caching of mutable Vite development modules can produce a blank Replit preview after a rebuild even when the fresh app renders correctly.

**Offline banner:** `src/components/OfflineBanner.tsx` + `src/hooks/useOnlineStatus.ts`. Banner is mounted in Root component in `main.tsx`, positioned fixed at top, z-index 9999.

**Why:** Calendar, Zmanim, and Siddur use `@hebcal/core` and `suncalc` (bundled into JS) — pure client-side, no network needed once JS bundle is cached.

**Cache version bump:** When changing SW caching logic, bump `N` in both `SHELL_CACHE` and `ASSET_CACHE` names to force all clients to update.

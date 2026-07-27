# Performance Notes

> Purpose: Document all identified performance bottlenecks, optimization opportunities, and current mitigation strategies.
> Last updated: 2026-06-26 (SPR-001)

---

## Bundle & Loading Performance

### P1 — No Code Splitting on Modals (Critical)
`App.tsx` statically imports all 20+ modals and all 7 pages. These are always in the initial bundle, even if the user never opens most of them.

**Impact:** Initial JS payload is several MB. Users on mobile connections wait longer for first interactive paint.

**Fix (SPR-003):** Wrap every modal and page in `React.lazy()` + `<Suspense>`. Only `MemorialValley3D` is currently lazy-loaded.

**Estimated bundle savings:** 40–60% reduction in initial parse time.

### P2 — No `React.memo` Anywhere (High)
A global search for `React.memo` and `memo(` returns zero results in `menashe-calendar`. The `AppShell` in `App.tsx` holds 30+ modal boolean states — any state change (e.g., opening any modal) triggers a full re-render of the entire component tree.

**Fix (SPR-003):** Apply `React.memo` to all leaf components; move modal state out of `AppShell`.

### P3 — Large Uncompressed Images (High)
Images served from `/public` are not optimized:
| File | Size | Issue |
|---|---|---|
| `daily-wisdom-bg.png` | ~2.5 MB | Background image; should be <200 KB WebP |
| `saipikhup-sticker.png` | ~2.3 MB | PNG with transparency; should be WebP |
| `saipikhup-reference.png` | ~1.1 MB | Reference image; should be resized + WebP |
| `saipikhup-nobg.png` | ~574 KB | Can be reduced 70%+ with WebP |

**Fix (SPR-003):** Convert to WebP, add `srcset` for responsive sizes. Estimated 70–80% reduction in image payload.

---

## 3D Scene Performance

### P4 — `MemorialValley3D.tsx` is 2,500 Lines in One File
The entire 3D scene is one file: terrain generation, water shaders, sky dome, vegetation, wildlife, lighting, particles, candles, and flowers. This is difficult to tree-shake, profile, or optimize independently.

**Fix (SPR-005):** Split into sub-modules. See `ProjectStructure.md` for proposed file breakdown.

### P5 — Shadow Maps and Post-Processing
On the `high` quality tier (triggered for any machine with ≥8 CPU cores):
- `GoldenHourLighting` uses 2048px shadow maps
- Bloom and SMAA post-processing are active
- PCFSoft shadow type

On mid-range devices that qualify as "high" tier, this can produce frame drops below 30 FPS.

**Fix (SPR-005):** Refine quality tier thresholds; add GPU benchmark on first scene load rather than relying solely on core/RAM count.

### P6 — `r3f-perf` Monitor is Stubbed
`ScenePerf.tsx` is intentionally non-functional because `r3f-perf` 7.x is incompatible with R3F 9.x. Engineers have no in-scene FPS or draw call visibility.

**Fix (SPR-005):** Implement a lightweight custom stats overlay using `useFrame` and `gl.info`, or wait for `r3f-perf` to publish a compatible release.

### P7 — WebGL Context Leak Risk on Modal Open/Close
The R3F `<Canvas>` is mounted inside `MemorialSanctuaryModal`. If a user opens and closes the Sanctuary repeatedly, the WebGL context may not be fully disposed. Three.js recommends calling `renderer.dispose()` and disposing all geometries/materials.

**Status:** Unverified — needs profiling in Chrome DevTools Memory panel.

---

## Server Performance

### P8 — Push Scheduler Blocks Event Loop (High)
`routes/push.ts` runs multiple `setInterval` loops inside the same Node.js process that handles HTTP requests. At scale (>10,000 push tokens), fan-out during peak scheduling windows will block the event loop and delay API responses.

**Fix (SPR-004):** Extract push schedulers into a dedicated worker process or use a proper job queue (BullMQ, pg-boss).

### P9 — No Database Connection Pooling Config
The `pg` client uses its default pool configuration. Under concurrent load, connections can be exhausted silently.

**Fix (SPR-002):** Set explicit `max`, `idleTimeoutMillis`, and `connectionTimeoutMillis` on the pool.

### P10 — No Pagination on List Endpoints
`GET /api/books`, `GET /api/announcements`, `GET /community/yahrzeit` return all rows with no limit, offset, or cursor.

**Fix (SPR-004):** Add `limit` and `offset` (or cursor) query params to all list endpoints. Update OpenAPI spec first.

---

## Client-Side Calculation Performance

### P11 — Hebrew Calendar Recalculated on Every Render
`hebrewCalendar.ts` functions are called directly in component render paths without `useMemo`. On `Home.tsx` (5,206 lines), this means the full month calendar is recalculated on every state change.

**Fix (SPR-003):** Wrap all calendar/zmanim calculations in `useMemo` keyed by date and location.

### P12 — Daf Yomi Sefaria API Fetch Has No Caching
`DafYomiModal.tsx` fetches the current daf text from `api.sefaria.org` every time the modal opens. No caching, no stale-while-revalidate.

**Fix (SPR-003):** Cache the response in `localStorage` with a 24-hour TTL keyed by `YYYY-MM-DD`.

---

## Service Worker Caching Strategy

### Current Behavior
- **Navigation:** Network-first with cached shell fallback (good for PWA reliability)
- **Assets:** Stale-while-revalidate (good for speed, but users may see stale JS/CSS)

### Gaps
- Siddur book content (PDFs, text) is not pre-cached — offline reading is unavailable for library content
- No cache versioning strategy — cache invalidation relies on service worker update detection

**Fix (SPR-006):** Add a precache manifest for core Siddur texts; implement cache versioning tied to the app build hash.

---

## Summary — Priority Order

| # | Bottleneck | Severity | Sprint |
|---|---|---|---|
| 1 | No code splitting on modals | 🔴 Critical | SPR-003 |
| 2 | No `React.memo` — full-tree re-renders | 🔴 Critical | SPR-003 |
| 3 | Large uncompressed PNG images | 🟡 High | SPR-003 |
| 4 | Push scheduler in main API process | 🟡 High | SPR-004 |
| 5 | No DB connection pool config | 🟡 High | SPR-002 |
| 6 | No list endpoint pagination | 🟡 High | SPR-004 |
| 7 | Hebrew calendar not memoized | 🟡 Medium | SPR-003 |
| 8 | Daf Yomi fetch not cached | 🟢 Low | SPR-003 |
| 9 | 3D quality tier thresholds too coarse | 🟢 Low | SPR-005 |
| 10 | WebGL context disposal unverified | 🟢 Low | SPR-005 |

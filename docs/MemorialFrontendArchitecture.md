# Memorial Frontend Architecture

**Sprint:** SPR-017 (Living Memorial Experience) builds on SPR-016 (profile page) / SPR-015 (sanctuary shell) — **updated SPR-034A (dead code elimination)**
**Status:** Living Memorial Experience complete (SPR-017). Dead code removed (SPR-034A).
**Scope:** Frontend only. Backend APIs, DB schema, and 3D scene are out of scope for this document.

> **SPR-034A — One Production Implementation:**
> `MemorialSanctuaryPage`, `MemorialProfilePage`, and their exclusive sub-components (`SanctuaryHeader`, `SanctuaryHero`, `SanctuaryWorldPreview`, `MemorialPlaceholderCard`, `LoadingState`) have been deleted. They were never reachable via routing or navigation.
>
> **Memorial Sanctuary now has one production implementation:**
> `CommunityYahrzeitModal` → `MemorialSanctuaryModal` → `MemorialValley3D`.

---

## 1. Module Structure

```
src/features/memorial/
├── api/
│   └── memorialApi.ts                — API client (fetch + Clerk Bearer auth), MemorialApiError
├── hooks/
│   ├── useMemorial.ts                — Fetch + refetch a single memorial by slug
│   ├── useCandles.ts                 — Paginated candle list + optimistic light action
│   ├── useTributes.ts                — Paginated tribute list + submit (moderation-aware)
│   ├── useSearch.ts                  — Debounced search with stale-response guard
│   ├── useCreateMemorial.ts          — Multi-step create submission lifecycle
│   ├── useUploadPhoto.ts             — File upload to Object Storage + API registration
│   ├── useMemorialPermissions.ts     — Derives effective permissions from Clerk + family membership
│   ├── useFamilyManagement.ts        — Family record + member CRUD (SPR-017)
│   ├── useCollections.ts             — 5 curated sanctuary collections (SPR-017)
│   └── index.ts
├── components/
│   ├── SanctuaryHeader.tsx           — Sticky back-button header (shared across pages)
│   ├── SanctuaryHero.tsx             — Hero banner with search input
│   ├── GlassPanel.tsx                — Frosted-glass card container
│   ├── SectionTitle.tsx              — Section label + optional count + optional action
│   ├── MemorialPlaceholderCard.tsx   — Compact result card for search/lists
│   ├── EmptyState.tsx                — Centered icon + message + optional CTA
│   ├── LoadingState.tsx              — Skeleton shimmer rows
│   └── index.ts
├── pages/
│   ├── MemorialSanctuaryPage.tsx     — Shell: search, 5 live collection strips (SPR-017)
│   ├── MemorialProfilePage.tsx       — Profile: candle tabs, tribute filter, family management,
│   │                                   yahrzeit alert, load more (SPR-017)
│   └── index.ts
└── types/
    └── index.ts                      — All domain + UI + API types
```

---

## 2. Navigation Model

Navigation is state-driven (no URL routing for this page set):

```
App.tsx
  activePage = "memorial"
    memorialSlug === null  →  MemorialSanctuaryPage  (search + browse + collections)
    memorialSlug !== null  →  MemorialProfilePage    (profile for that slug)
```

`onSelectMemorial(slug)` on `MemorialSanctuaryPage` sets `memorialSlug` in App state.
`onBack()` on `MemorialProfilePage` clears `memorialSlug`, returning to the sanctuary.

---

## 3. SPR-017 — Living Memorial Experience

### 3.1 Type Extensions

| Field | On | Type | Notes |
|-------|----|------|-------|
| `relationship` | `MemorialCandle` / `LightCandleInput` | `string \| null` | Optional relationship to deceased (Son, Friend, etc.) |
| `community` | `MemorialCandle` / `LightCandleInput` | `string \| null` | Optional congregation name |
| `tributeType` | `MemorialTribute` / `AddTributeInput` | `TributeType \| null` | memory / prayer / scripture / family / community |
| `sort` | `SearchMemorialParams` | `string?` | Sort hint for collections; server-side support pending |

`TributeType = "memory" | "prayer" | "scripture" | "family" | "community"`

### 3.2 New Hooks

**`useFamilyManagement(familyId)`**
- Fetches `MemorialFamily` + `MemorialFamilyMember[]` in parallel
- Provides: `invite(userId, role)`, `updateRole(memberId, role)`, `remove(memberId)`, `refetch()`
- Called with `null` when `permissions.canManageFamily` is false (hook no-ops cleanly)

**`useCollections()`**
- Fires 5 parallel `searchMemorial` calls with different `sort` hints on mount
- Returns 5 independent `{ items, status, error }` states:
  - `recentlyRemembered` — sort: `recent_activity`
  - `mostVisited` — sort: `most_visited`
  - `recentlyLit` — sort: `recently_lit`
  - `upcomingYahrzeit` — sort: `upcoming_yahrzeit`
  - `communityPicks` — sort: `community_picks`
- Server currently ignores sort params (returns default). Collections differentiate when API is enhanced.

---

## 4. MemorialProfilePage — Composition (SPR-017)

### Props

| Prop | Type | Description |
|------|------|-------------|
| `slug` | `string` | Memorial slug from the sanctuary list |
| `onBack` | `() => void` | Clears active slug, returns to sanctuary |

### Hook Wiring

| Hook | Arg | Purpose |
|------|-----|---------|
| `useMemorial(slug)` | slug | Fetches `MemorialWithPerson`, drives all states |
| `useCandles(memorial?.id)` | memorial ID | Paginated candles + optimistic light + Load More |
| `useTributes(memorial?.id)` | memorial ID | Paginated tributes + submit + Load More |
| `useMemorialPermissions({memorial})` | memorial | Gates action buttons per user role |
| `useFamilyManagement(familyId \| null)` | family ID | Family member list + invite/role/remove |

### State Machine

```
status = "idle" | "loading"    →  <LoadingState />
!isOnline && !memorial         →  Offline state
status = "error" && 404        →  Not Found state
status = "error" && 403        →  Private (access denied) state
status = "error" && other      →  Generic error + Retry button
permissions?.canView = false   →  Private gate (published but visibility-restricted)
status = "success"             →  Full profile render
```

### Rendered Sections (in order)

1. **SanctuaryHeader** — sticky back button · full name · Hebrew name subtitle
2. **YahrzeitAlert** — rendered when `daysAway === 0` (full card with Kaddish + Psalm 23 + Light CTA) or `daysAway ≤ 7` (subtle banner with countdown)
3. **Hero** — avatar (🕊 placeholder), full name, Hebrew name, privacy badge, birth/death/age pills, candle count
4. **Action Row** — Light Candle · Leave Tribute · Photos (disabled) · Manage Family (if `canManageFamily`) · Share
5. **Biography** — `person.biography` freetext or empty state
6. **Candles** — tabbed: Recent / Today / Community; cards show relationship + community if set; Load More when `hasMore`
7. **Tributes** — type filter chips (All / Memory / Prayer / Scripture / Family / Community); cards show type badge; Load More when `hasMore`
8. **Family** — parents, tribe, occupation; member count from `useFamilyManagement`; Manage button if `canManageFamily`
9. **Upcoming Yahrzeit** — next Hebrew anniversary + Kaddish/Psalm suggestions if today
10. **Location** — birthplace + death location (omitted if both empty)

### Inline Interaction Sheets

All three actions open as `BottomSheet` overlays — no external modal library.

**CandleSheet** (enhanced SPR-017)
- 5 candle types: Memorial · Yahrzeit · Neshama · Shabbat · Shloshim
- **Relationship picker** — dropdown with 16 preset options (Son, Daughter, Friend, Rabbi, etc.)
- **Community field** — free text (congregation / community name)
- Optional message (280 chars), optional guest name, anonymous toggle
- Calls `useCandles.light()` → optimistic prepend → triggers `refetch()`

**TributeSheet** (enhanced SPR-017)
- **Tribute type picker** — chips: Memory / Prayer / Scripture / Family / Community (colour-coded)
- Optional title (120 chars), required body (1200 chars), optional guest name, anonymous toggle
- Calls `useTributes.submit()` → pending moderation notice on success

**FamilyManagementSheet** (new SPR-017)
- Shows current family name + member count
- Member list: userId preview, role dropdown, remove button
- Primary contact badge (★) on `family.primaryContactId`
- Invite form: User ID text input + role select + submit
- Only rendered when `sheet === "family" && permissions?.canManageFamily`

### YahrzeitAlert Component

| Condition | Render |
|-----------|--------|
| `daysAway === 0` | Gold bordered card — "Today is the Yahrzeit" — Hebrew date — Kaddish + Psalm 23 rows — Light Yahrzeit Candle CTA |
| `1 ≤ daysAway ≤ 7` | Subtle banner — "Yahrzeit in N days · [Hebrew date]" |
| `daysAway > 7` | Not rendered |

---

## 5. MemorialSanctuaryPage — Collections (SPR-017)

Replaces the static placeholder sections with live `useCollections()` data.

### Non-search Layout (in order)

1. **3D Sanctuary CTA** (if `onEnter3D` prop provided)
2. **Recently Remembered** strip — `collections.recentlyRemembered`
3. **Recently Lit** strip — `collections.recentlyLit`
4. **Upcoming Yahrzeit** strip — `collections.upcomingYahrzeit`
5. **Community Picks** strip — `collections.communityPicks`
6. **Family Memorials** panel (empty state + Create CTA)
7. **Create Memorial CTA** button

### CollectionStrip Component

Each strip uses a horizontal `overflow-x: auto` row of `MemorialPlaceholderCard` items (width 200px each, `scrollbar-width: none`). Status states:
- `loading` → `<LoadingState rows={2} />`
- `success` + empty → `<EmptyState />`
- `success` + items → horizontal scroll row
- `error` → `<EmptyState icon="⚠️" />`

---

## 6. Permission Gating

`useMemorialPermissions` resolves role via Clerk public metadata + family membership table:

| Role | Light candle | Leave tribute | View photos | Manage family |
|------|-------------|---------------|-------------|---------------|
| guest | per privacy | per privacy | per privacy | ✗ |
| authenticated | per privacy | per privacy | per privacy | ✗ |
| family_member | ✓ | ✓ | ✓ | ✗ |
| family_admin | ✓ | ✓ | ✓ | ✓ |
| moderator | ✓ | ✓ | ✓ | ✗ |
| administrator | ✓ | ✓ | ✓ | ✓ |

Action buttons are rendered `disabled` (not hidden) when permission is denied.

---

## 7. Bilingual Support

All UI strings flow through `useLanguage()` / `t.mem*` keys in `lib/translations.ts`.

**SPR-017 added 40 new translation keys** (EN + TK), covering:
- `memCandleTab*` — candle tab labels (Recent / Today / Community)
- `memCandleRelationship`, `memCandleCommunityField`, `memCandleRelationshipPlaceholder`
- `memTributeType*` — tribute type labels and filter
- `memFamily*` — family management UI (12 keys)
- `memYahrzeitAlert*`, `memYahrzeitSuggest*` — yahrzeit alert + suggestions (5 keys)
- `memCol*` — collection section titles (5 keys)
- `memLoadMore`

---

## 8. Candle Tab Logic

Client-side filtering from the flat `candles[]` array:

| Tab | Filter |
|-----|--------|
| Recent | All candles (default, sorted by `litAt` desc from API) |
| Today | `new Date(c.litAt).toDateString() === new Date().toDateString()` |
| Community | `Boolean(c.community)` — requires `community` field to be set when lighting |

"Load More" is only shown on the **Recent** tab (since Today/Community are client-side subsets).

---

## 9. Future Extensions

| Feature | What exists today | Remaining work |
|---------|-------------------|----------------|
| Profile photo | `MemorialPhoto.isFeatured` in DB; hero avatar ready for URL | `useUploadPhoto` + Object Storage wiring; hero `<img>` |
| Photo gallery | `canViewPhotos` permission; `getPhotos()` API; action button present (disabled) | Gallery panel |
| DB columns for `relationship` / `community` / `tributeType` | Frontend types + API input fields ready | Drizzle migration + server route update |
| Collection API sorts | `sort` param in `SearchMemorialParams`; 5 collection queries fire | Server-side sort implementation |
| Family invite by email | UI shows User ID input (V1) | User search / email lookup endpoint |
| Edit memorial | `canEditProfile` permission resolves correctly | Edit sheet/page (separate sprint) |
| URL deep linking | State-driven nav works | `/memorial/:slug` routing |
| Create memorial wizard | `useCreateMemorial` hook + types exist | Multi-step wizard page |
| Moderation panel | `moderateTribute()` API exists | Admin tribute review UI |

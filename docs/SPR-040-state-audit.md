# SPR-040 — State Management Architecture Audit

**Date:** 2026-07-01  
**Scope:** `artifacts/menashe-calendar/src/`  
**Auditor:** Chief Architect review pass

---

## 1. Complete Store Inventory

### 1a. LanguageContext
| Attribute | Value |
|---|---|
| File | `src/context/LanguageContext.tsx` |
| Type | React Context |
| Purpose | App-wide language selection (EN / TK) and Thadou Kuki translation overrides |
| Lines | 100 |
| State fields | `lang` (Lang), `tkOverrides` (Partial\<Translations\>) |
| Actions | `setLang`, `setTkOverride`, `saveTkOverrides`, `resetTkOverrides` |
| Consumers | **40 files / 80 call sites** across pages, modals, components |
| Rerender impact | **Medium** — context value update propagates to all 80 call sites. Triggered only on intentional user language switch (rare). |

### 1b. QualityContext
| Attribute | Value |
|---|---|
| File | `src/scene/QualityContext.tsx` |
| Type | React Context (correctly split: value + dispatch) |
| Purpose | 3D rendering quality tier for Memorial Sanctuary scene |
| Lines | 144 |
| State fields | 11 quality settings (dprMax, shadowsEnabled, particleScale, lightPoolSize, etc.) |
| Actions | `setTier` (via separate QualityDispatchContext) |
| Consumers | `MemorialValley3D.tsx`, `FPSAdaptation.tsx`, `PostProcessingPipeline.tsx`, `SceneFoundation.tsx`, `scene/index.ts` |
| Rerender impact | **Low** — deliberately split into value + dispatch contexts; reading quality does not subscribe to the setter, and vice versa. FPSAdaptation adapts tier at runtime without re-rendering consumers. |

### 1c. memorialStore (hook-based local store)
| Attribute | Value |
|---|---|
| File | `src/features/memorial/stores/memorialStore.ts` |
| Type | Hook-based local state (NOT global — not a Context or Zustand store) |
| Purpose | Ephemeral UI state for the create-memorial wizard and active-panel tracking |
| Lines | 161 |
| Exports | `useMemorialUIStore()` (5 fields, 6 actions), `useCreateMemorialFormStore()` (1 field, 6 actions) |
| Consumers | `useCreateMemorial.ts` (1 consumer each — correctly local) |
| Rerender impact | **None globally** — state is local to the modal lifecycle; unmounts with the modal. |

### 1d. AppShell (App.tsx)
| Attribute | Value |
|---|---|
| File | `src/App.tsx` |
| Type | Component-level useState (14 fields) |
| Purpose | All global application state: navigation, modals, user preferences, auth profile, ephemeral UI |
| Lines | 985 |
| State fields | See table below |
| Actions | 25+ useCallback-stabilized handlers |
| Consumers | All pages (via props), all modals (conditional render at AppShell level) |
| Rerender impact | **Contained** — all page components are `memo()`-wrapped; modal state changes do not re-render pages because modal is not in their props |

**AppShell state fields:**

| Field | Type | Category |
|---|---|---|
| `publicProfile` | PublicProfile \| null | Auth / User |
| `activePage` | Page (string union) | Navigation |
| `modal` | Modal (string union of 20+ values) | Navigation |
| `chatOpen` | boolean | Ephemeral UI |
| `dayModal` | DayInfo \| null | Ephemeral UI |
| `readingBook` | Book \| null | Ephemeral UI |
| `siddurRefreshKey` | number | Ephemeral UI |
| `toast` | string | Ephemeral UI |
| `theme` | "dark" \| "light" \| "sapphire" | User Preference |
| `location` | Location | User Preference |
| `shareToken` | string \| null | URL / Init |
| `isPremium` | boolean | User Preference |
| `premiumJustApproved` | boolean | Ephemeral UI |
| `candleEnabled` | boolean | User Preference |

**AppShell hooks (already correctly extracted):**

| Hook | Purpose |
|---|---|
| `useNotifications` | Notification permissions + preferences |
| `usePushSubscription` | Web Push subscription state |
| `useAnnouncements` | Admin announcement CRUD |
| `useUnreadAnnouncements` | Unread count + mark-read |

---

## 2. State Architecture Diagram

```
ClerkProvider
└── LanguageProvider          ← React Context (lang, t, tkOverrides)
    └── AppShell              ← Component state (14 useState fields)
        ├── Home              ← memo() ✅  receives: location, theme, isPremium, callbacks
        ├── CalendarPage      ← memo() ✅  receives: location, callbacks
        ├── ZmanimPage        ← memo() ✅  receives: location, isPremium, callbacks
        ├── SiddurPage        ← memo() ✅  receives: isPremium, callbacks
        ├── SettingsPage      ← memo() ✅  receives: theme, location, notif state, callbacks
        ├── PremiumPage       ← memo() ✅  receives: callbacks only
        └── Modals            ← Conditionally rendered at AppShell level (not passed to pages)
            ├── LocationModal
            ├── CommunityYahrzeitModal
            │   └── MemorialSanctuaryModal
            │       └── MemorialValley3D   ← QualityContext consumer
            │           ├── QualityProvider  ← React Context (quality tier, split value/dispatch)
            │           └── MemorialValley3D scene tree (2-level max prop depth)
            └── [20+ other modals — lazy-loaded, lifecycle-scoped]

Memorial Feature (local state only):
src/features/memorial/stores/memorialStore.ts
  useMemorialUIStore()        ← local to modal lifecycle
  useCreateMemorialFormStore() ← local to create wizard lifecycle
```

---

## 3. Oversized Store Report

**Finding: None requiring action.**

AppShell (985 lines) appears large but is architecturally sound:

- Every child page is wrapped in `memo()`, so AppShell state changes that don't affect a page's specific props produce zero re-renders in that page.
- The `modal` string (which changes most frequently) is **not passed as a prop to any page** — modals are rendered conditionally at the AppShell level. A modal open/close causes AppShell to re-render, but all memo'd pages see identical props and skip.
- The 25+ `useCallback` wrappers are correctly implemented with stable/minimal deps; all modal-opener callbacks have `deps: []` since `setModal` is stable.
- Splitting AppShell into feature stores would require introducing React Context or Zustand, adding new context boundaries, and wrapping consumers — producing identical performance characteristics (every page is already memo'd) with additional complexity.

**Chief Architect's verdict:** The architectural intent is already achieved via `memo + useCallback`. No split is warranted.

---

## 4. Duplicate State Report

**Finding: No runtime duplicate state.**

| Concern | Finding |
|---|---|
| `theme` | Single source: AppShell. Written to localStorage as a cache for cold-start hydration only. |
| `location` | Single source: AppShell. `OnboardingFlow.tsx` reads localStorage on init (line 48) but does not maintain its own runtime state — it's a one-time read. |
| `lang` | Single source: LanguageContext. |
| `isPremium` | Single source: AppShell. Hydrated from server profile on sign-in; localStorage is a cold-start cache. |
| `currentUser` | Single source: Clerk (`useUser()`). `publicProfile` in AppShell holds the *community profile* (displayName, role, city) which is distinct and non-overlapping with Clerk identity. |
| Current Hebrew date | Computed independently in `useHomeCalendar` (Home) and `CalendarPage`. This is a **derived value** (pure function of system clock), not state — computing it twice is correct and cheaper than sharing it via context. |

---

## 5. Refactoring Summary

**Phase 6 action: One targeted fix only.**

The only change warranted by this audit is in `LanguageContext.tsx`:

**Before:** `activeTk` is recomputed inline on every `LanguageProvider` render. The context value object `{ lang, setLang, t, ... }` is a new reference on every render, which means React sees a new context value even when nothing actually changed (if LanguageProvider were triggered to re-render by anything other than its own state).

**After:**
- `activeTk` wrapped in `useMemo(() => buildTk(tkOverrides), [tkOverrides])` — `buildTk` only runs when overrides change.
- `setLang` converted from an inline function to `useCallback` (was already stable via closure, now explicitly stable for the deps array).
- Context value object wrapped in `useMemo<LanguageContextValue>(..., [lang, setLang, t, tkOverrides, ...])` — consumers only re-render when language or translations actually change.

**Why this matters at scale:** `useLanguage()` is called in **40 files across 80 call sites**. With the memoized context value, React's context propagation correctly skips all 80 subscribers when nothing changed — a correctness improvement that also prevents any future bugs if LanguageProvider's parent ever re-renders for external reasons.

**Everything else:** No action taken. The architecture correctly follows the Chief Architect's principle — state follows features, shared state is minimal, and a change in one feature does not re-render the entire application.

---

## 6. Performance Comparison

### Before fix
| Scenario | LanguageProvider renders | buildTk() calls | Context propagation |
|---|---|---|---|
| Language switch (en→tk) | 1 | 1 | Propagates to all 80 subscribers (correct) |
| TK override saved | 1 | 1 | Propagates to all 80 subscribers (correct) |
| Any future parent re-render | 1 | 1 (unnecessary) | Propagates to all 80 subscribers (unnecessary) |

### After fix
| Scenario | LanguageProvider renders | buildTk() calls | Context propagation |
|---|---|---|---|
| Language switch (en→tk) | 1 | 0 (tkOverrides unchanged → activeTk cached) | Propagates (lang changed — correct) |
| TK override saved | 1 | 1 (overrides changed) | Propagates (t changed — correct) |
| Any future parent re-render | 1 | 0 | **Skips all 80 subscribers** (value unchanged — correct) |

---

## 7. Before/After Rerender Analysis

### AppShell state change scenarios (unchanged — already optimal)

| Event | AppShell re-renders | Home re-renders | CalendarPage re-renders | ZmanimPage re-renders |
|---|---|---|---|---|
| `modal` changes | ✅ 1 | ❌ 0 (memo — modal not in props) | ❌ 0 | ❌ 0 |
| `toast` changes | ✅ 1 | ❌ 0 (memo — toast not in props) | ❌ 0 | ❌ 0 |
| `theme` changes | ✅ 1 | ✅ 1 (theme in props — correct) | ❌ 0 | ❌ 0 |
| `location` changes | ✅ 1 | ✅ 1 (location in props — correct) | ✅ 1 (correct) | ✅ 1 (correct) |
| `isPremium` changes | ✅ 1 | ✅ 1 (in props — correct) | ❌ 0 | ✅ 1 (correct) |
| `chatOpen` changes | ✅ 1 | ❌ 0 | ❌ 0 | ❌ 0 |

### MemorialValley3D (unchanged — already optimal)

| Event | Scene re-renders | Sub-components |
|---|---|---|
| `walkMode` toggle | Targeted — only walkMode consumers update | Max 5 consumers |
| Quality tier change (FPS adaptation) | Via QualityContext — only value subscribers | Not dispatch subscribers |
| `selectedId` change | Via prop — only AAAFocusCamera + AAAEntryCandle | 2-level max depth |

---

## 8. Verification Checklist

| Check | Status |
|---|---|
| ✅ Calendar behaves identically | No calendar state touched |
| ✅ Memorial behaves identically | No memorial state touched |
| ✅ Sanctuary behaves identically | QualityContext untouched |
| ✅ Rav Menashe AI behaves identically | No AI state touched |
| ✅ Siddur behaves identically | No Siddur state touched |
| ✅ Settings behave identically | No settings state touched |
| ✅ Language switch (EN ↔ TK) behaves identically | Logic preserved; only memoization added |
| ✅ TK override save/reset behaves identically | All three callbacks preserved with same logic |
| ✅ No UI regressions | Only LanguageContext internals changed |
| ✅ No navigation regressions | AppShell navigation state untouched |
| ✅ TypeScript passes | Verified post-fix |
| ✅ Production build passes | Verified post-fix |

---

## Conclusion

The Menashe Calendar web application's state management is **architecturally sound** for Version 1.0.

Key strengths already in place:
- All page components are `memo()`-wrapped — modal/toast/chat state changes never cascade into page re-renders
- All AppShell callbacks are `useCallback`-stabilized — memo pages don't break due to unstable prop references
- QualityContext is correctly split into separate value and dispatch contexts — the industry-standard pattern
- Memorial state is correctly local to the modal lifecycle — no global store pollution
- Language is the only true global Context — appropriate for a bilingual app with 80 call sites

One targeted fix applied: **LanguageContext value memoization** — ensuring the 40-file, 80-call-site language system only propagates context updates when language or translations genuinely change.

No Zustand introduction. No store splitting. No new abstraction layers.

The architecture is ready for Version 1.0 and future expansion.

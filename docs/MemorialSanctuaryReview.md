# Memorial Sanctuary — Architectural Review
**Reviewed:** June 28, 2026  
**Reviewer role:** Principal UX Architect · Mobile UX Specialist · Senior React Engineer · Product Designer · Environment Artist · Human-Centered Design Expert  
**Scope:** Memorial Sanctuary feature only. No code modified.

---

## Section 1 — User Journey

### Complete Flow
```
Home → "Memorial Sanctuary" entry point
  → MemorialSanctuaryPage (2D browse)
      → SanctuaryHero (cinematic hero + search)
      → Portrait strips (Recently Remembered, Lit, Most Visited, etc.)
      → EnterSanctuaryCTA → MemorialSanctuaryModal (3D environment)
          → SanctuaryHomePanel (welcome card)
          → 3D Valley canvas (R3F / Three.js)
          → Search → SearchResults overlay
          → Select entry → CandleDetailPanel
          → Light Candle → CandleForm → Submit → Success
          → Dedicate Learning → DedicateForm → Submit
```

### Friction Points Identified

| Step | Friction |
|---|---|
| Entry | Two parallel systems: the 2D Page and the 3D Modal. The relationship between them is unclear to new users. Is the 3D modal a deeper "level" of the page, or an alternative? There is no onboarding that explains this. |
| 3D environment | A 7-second hint overlay (`showHints`) is the only guidance. It disappears on a timer and never returns. Users who miss it have no recovery path. |
| Search (modal) | The search input in the 3D modal renders as a floating overlay (`SearchResults`). It covers the 3D scene completely. The user loses spatial context — they cannot see candles or the valley while searching. |
| Open Memorial | Clicking a candle in 3D or a name in the panel opens a side panel. The panel is `position: absolute` inside the modal. On 320px screens this panel will clip or overlap the 3D canvas with no scroll. |
| Light Candle (page) | `onLightCandle` in `SanctuaryHomePanel` places the candle at a random position — the user never sees it land. The 3D canvas is the only place to see placed candles, but the home panel is in the 2D-over-3D overlay. |
| Leave Tribute | `DedicateForm` ("Dedicate Learning") is the tribute path. The label "Dedicate Learning" is Judaic vocabulary that the Bnei Menashe community may not immediately recognise as "leave a message." |
| Return Home | Escape key returns to nav "home" first, then closes modal. This is logical but undiscoverable — there is no visible close affordance on most sub-panels. |

---

## Section 2 — Mobile Experience

### Viewport Scores

| Viewport | Score | Notes |
|---|---|---|
| 320px | 4/10 | `SanctuaryHomePanel` is 268px wide — takes 83.75% of screen. `MusicPanel` / `FlowersPanel` are 230–234px wide at `right: 80px` — extends nearly to left edge with no safe-area. |
| 360px | 5/10 | Panels viable but still overlap canvas significantly. |
| 390px | 6/10 | iPhone 14 standard. Usable but panel height can exceed `calc(100dvh - 148px)` when the keyboard opens. |
| 412px | 7/10 | Pixel 6. Most comfortable size — panels have breathing room. |
| 480px | 7/10 | Tablet-mini. Layout designed for this range. |

### Mobile Issues Found in Code

1. **`SanctuaryHomePanel` width: 268px fixed** — clips on 320px with 14px left offset. Should be `min(268px, calc(100vw - 28px))`.
2. **`MusicPanel` / `FlowersPanel`: `right: 80px` at `width: 230–234px`** — on 360px screen the panel's left edge is at `360 - 80 - 234 = 46px`. Acceptable, but on 320px it's `6px` — nearly full-width with no padding.
3. **Search input padding: `15px 44px`** — correct for large screens; on 320px the usable text area is `320 - 32 - 88 = 200px`, acceptable but tight.
4. **`input type="search"`** — on iOS Safari this triggers the native search keyboard with a "Search" button that pushes layout up unexpectedly and causes bottom safe-area confusion.
5. **3D canvas performance on low-end Android** — WebGL R3F scene with multiple `OscillatorNode`s + staggered `motion.div` animations running simultaneously. No device-capability check before rendering the 3D environment.
6. **`fontSize: 7px` stat labels** in `SanctuaryHomePanel` — below the iOS minimum legible size of 11px. Unreadable without zoom.
7. **Bottom nav clearance: 110px** — correctly applied on `MemorialSanctuaryPage`. The 3D modal uses `position: fixed, inset: 0` so it correctly covers full screen. No issue here.
8. **Keyboard overlap** — the candle form inputs (`name`, `hebrewName`, `message`, `date`) inside the 3D modal have no `scrollIntoView` or `KeyboardAvoidingView` equivalent. On mobile, the keyboard will cover the form.

---

## Section 3 — Visual Hierarchy

### Current Order (MemorialSanctuaryPage)
1. Header (sticky)
2. Cinematic Hero + Search
3. Recently Remembered (portrait strip)
4. **Enter 3D Sanctuary CTA** ← buried between content
5. Create Memorial CTA
6. Divider
7. Recently Lit
8. Most Visited
9. Upcoming Yahrzeit
10. Community Picks

### Analysis

**What should move:**
- "Enter 3D Sanctuary" CTA should be **immediately below the hero** before any collections. It is the primary experience differentiator. Burying it between content collections ensures most users miss it.
- "Upcoming Yahrzeit" should be **above** "Most Visited" and "Community Picks". Yahrzeit dates are time-sensitive and emotionally significant — the most sacred content should have the highest position.

**What should disappear or shrink:**
- "Community Picks" is the weakest collection — it is identical to "Most Visited" in current implementation (both use `most_visited` sort implicitly). One should be removed or genuinely differentiated.
- The `Divider` component adds visual weight without meaning. The section titles (`SectionTitle`) are sufficient separators.
- "Create Memorial CTA" (✡ icon, faint ghost button) reads as a tertiary action but is placed prominently. Should move to the very bottom of the page, below all collections.

**What should be larger:**
- "Upcoming Yahrzeit" items deserve a list-row treatment, not compressed portrait cards. A yahrzeit is date-critical; showing the date prominently matters more than the portrait thumbnail format.

**Recommended order:**
1. Header
2. Hero + Search
3. Enter 3D Sanctuary CTA (prominent)
4. Upcoming Yahrzeit (time-sensitive first)
5. Recently Remembered
6. Recently Lit
7. Most Visited
8. Divider
9. Create Memorial (ghost CTA, bottom)

---

## Section 4 — Sanctuary Atmosphere

### Does it feel sacred?

**Yes, in places.** The cinematic night-sky hero with mountain ridges, candle glow bloom, and layered star field is genuinely evocative. The ambient sound engine (brown noise + D-major pentatonic drones with LFO tremolo) is an impressive and appropriate choice. The Hebrew daily intention panel inside `SanctuaryHomePanel` (`יהי זכרם ברוך` / `תנצב"ה`) is the most emotionally resonant element in the entire feature.

**No, in others.** The following elements actively reduce the sacred atmosphere:

| Element | Problem |
|---|---|
| **Fake social-proof notifications** | `buildNotifText()` generates fabricated events: "Sarah from Jerusalem just lit a candle for Miriam Cohen." These are randomly assembled from `NOTIF_NAMES` and `NOTIF_CITIES` arrays. In a memorial product — where every name represents a real deceased person — fabricated activity is ethically inappropriate and will destroy trust if discovered. |
| **Fake statistics** | `hashNum("global-flowers", 1200, 2800)` produces a deterministic, never-changing flower count. `candleCount` is `24832 + totalLit` (a hard-coded base). `visitorCount` is `hashNum("global-visitors", 4000, 6000)` — same every session. These numbers are presented as live community data. |
| **MusicPanel track list** | The panel shows four selectable tracks: "Wind & Leaves," "Flowing Water," "Soft Piano," "Birdsong." Only one sound engine exists (brown noise + drone oscillators). Clicking the other tracks does nothing. This is deceptive UI. |
| **"COMMUNITY TODAY" dashboard label** | Dashboard terminology breaks the spiritual framing. "COMMUNITY TODAY" with uppercase label styling reads as an analytics widget, not a sanctuary element. |
| **`fontSize: 7px` / `8px` section headers** | Text this small (7–8px) requires the user to lean in and squint. This destroys the sense of calm and ease a sanctuary should create. |
| **Hard-coded English strings not translated** | "Welcome to the Memorial Sanctuary," "A sacred space of memory, love, and eternal connection," "Light a Candle," "Ambient sound on/off," "Share feedback" — none of these pass through `useLanguage()` / `t.xxx`. Bnei Menashe users with Thadou Kuki enabled will see English only inside the most sacred screen in the app. |

---

## Section 5 — Design Consistency

### Gold Color Inconsistency
Three distinct gold values are used across the feature:
- `#D4A843` — from `src/lib/theme.ts` (`GOLD`)
- `#D4AF37` — used directly in `MemorialSanctuaryModal.tsx`
- `rgba(212,168,67, x)` — used in `MemorialSanctuaryPage.tsx` and `SanctuaryHero.tsx`

`D4A843` ≠ `D4AF37` ≠ `rgba(212,168,67)`. These are measurably different gold tones. At small sizes they are imperceptible, but at headline sizes the inconsistency is visible.

### Card Inconsistency
Two card components display the same `MemorialWithPerson` data on the same page:
- `PortraitCard` — used in portrait strips. Avatar area always shows 🕯 emoji. Ignores photo data.
- `MemorialPlaceholderCard` — used in search results. Different dimensions, different border radius, different typography scale.

A user can see the same memorial rendered in two visually different cards on the same screen. No design rationale for this split exists in the code.

### PortraitCard Avatar
`PortraitCard` always renders a 🕯 candle emoji in the avatar slot, regardless of whether the memorial has photos. The `MemorialPhoto` type exists, photo upload is fully implemented (`useUploadPhoto`), and the API supports `GET /memorials/{id}/photos`. The portrait card ignores all of this. The most visual element of a memorial — the person's face — is absent from every card on the browse page.

### Typography Scale
| Element | Size | Assessment |
|---|---|---|
| Section labels (`COMMUNITY TODAY`, `RECENTLY LIT`) | 7–8px | Fails WCAG 1.4.4 (min 9px practical; 12px recommended) |
| Sub-labels, dates | 9px | Borderline |
| Card names | 11–13px | Acceptable |
| Panel header | 20px | Good |
| Hero title | 20px | Good |
| Search input | 15px | Good |

### Animation Consistency
- `SanctuaryHomePanel` recently-lit rows use `motion.div` with `initial={{ opacity: 0, x: -8 }}` staggered by `i * 0.05s` — fires on every render, not just mount.
- Candle form uses `AnimatePresence` with spring transitions — correct.
- `MusicPanel` / `FlowersPanel` slide in from right with spring — consistent.
- `SanctuaryHero` expand/collapse has no animation — just a conditional render. Feels abrupt compared to everything around it.

---

## Section 6 — Performance

### Heavy Renders

| Issue | Location | Severity |
|---|---|---|
| `MemorialSanctuaryModal.tsx` is **1,949 lines** with 18+ `useState` calls at the top level | `MemorialSanctuaryModal.tsx:1620` | High |
| `SanctuaryHomePanel` has no `React.memo` — re-renders on every one of the 18 parent state changes | `MemorialSanctuaryModal.tsx:346` | Medium |
| Staggered `motion.div` animations on recently-lit rows fire on **every render**, not just mount | `MemorialSanctuaryModal.tsx:517` | Medium |
| `<style>{STYLES}</style>` injected inline on every render rather than extracted to a CSS file | `MemorialSanctuaryModal.tsx:1776` | Low |

### API Calls

| Issue | Location | Severity |
|---|---|---|
| `useCollections` makes **5 parallel `searchMemorial` calls** on mount, one per collection | `hooks/useCollections.ts` | Medium |
| `fetchCommunityYahrzeit` polled **every 30 seconds** with `setInterval` — fires in background even when the 3D scene is not visible | `MemorialSanctuaryModal.tsx:1683` | Medium |
| No stale-while-revalidate caching — every 30s poll is a full network round trip | `MemorialSanctuaryModal.tsx:1678` | Low |

### Memory Issues
- `useAmbientSound` creates `AudioContext`, 5 `OscillatorNode`s, a `BiquadFilterNode`, and a `BufferSourceNode`. On `stop()`, `ctxRef.current?.close()` is called — correct. The `useEffect` cleanup also calls `close()` — correct. No memory leak.
- `virtualFlowers` array has no explicit cap enforced in the UI (the 3D scene caps at `MAX_VIRTUAL_FLOWERS=40` per memory notes, but the state array is unbounded).

### Expensive Animations
- The 3D valley scene with ambient candles, flower instances, and R3F render loop is the largest performance cost. The `R3FErrorBoundary` and `canRender3D` mount guard are well-implemented.
- `useAmbientSound.start()` is called with the current `volume` via closure — but `volume` in the closure may be stale at call time (it captures the value from the render when `start` was created, not the current value). This is a subtle bug where the initial volume may not reflect user adjustment before first play.

---

## Section 7 — Information Density

### The 3D Modal (MemorialSanctuaryModal)

The 3D experience shows simultaneously:
- Full-screen 3D valley scene
- `SanctuaryHomePanel` (268px wide, up to full viewport height)
- Bottom navigation bar (5 tabs)
- Ambient notification toasts (top-right)
- Right-side action panels (MusicPanel, FlowersPanel) — appear over the canvas
- Search overlay — appears over all of the above
- Candle form — appears over all of the above
- Entry detail panel — appears over all of the above

At peak state (notification + home panel + 3D scene active) there are 4 distinct UI regions competing for attention simultaneously. For a sanctuary — which should feel quiet and focused — this is excessive.

**Remove entirely:**
- Fake ambient notifications. They add cognitive load and are ethically problematic.
- `MusicPanel` track list (4 tracks shown, only 1 works) — replace with a simple volume slider.
- `filterYear` dropdown state exists but has no UI — remove the dead state or build the filter.

**Group differently:**
- The 5 bottom nav tabs (`home`, `memorials`, `flowers`, `messages`, `music`) create 5 distinct panel states that all overlay the same 3D canvas. Consider consolidating `music` into the `home` panel (ambient sound toggle already exists there) and `flowers` into a single mode toggle, reducing nav to 3 tabs.

### The 2D Page (MemorialSanctuaryPage)

More appropriately dense. Five horizontal strips is at the outer limit of what a user will scroll through before abandoning. With "Community Picks" removed, four strips is the correct maximum.

---

## Section 8 — Production Readiness

### Verdict: **NO**

The Memorial Sanctuary is approximately **75% production-ready**. The atmosphere, architecture, and core interaction model are strong. The blockers below must be resolved before public launch.

### Blockers

| # | Blocker | Reason |
|---|---|---|
| **B-1** | **Fabricated activity notifications** | `buildNotifText()` generates fake memorials and fake names. In a sacred memorial product, presenting fabricated human activity ("Miriam from Jerusalem lit a candle for Yosef Cohen") is ethically unacceptable. If discovered, it will permanently damage community trust. |
| **B-2** | **Fabricated statistics** | `hashNum("global-flowers")`, `24832 + totalLit` (hardcoded base), `hashNum("global-visitors")` — these are displayed as live community data. They are lies. Either show real data or remove the stats section. |
| **B-3** | **MusicPanel is deceptive UI** | 4 tracks shown, 1 plays. Users who tap "Flowing Water" or "Birdsong" will receive no feedback and no sound change. This is a broken interaction, not a missing feature. |
| **B-4** | **`SanctuaryHomePanel` not translated** | Every string in the welcome panel — the most-seen screen in the entire sanctuary — is hardcoded English. This directly violates the project's bilingual requirement for the Bnei Menashe community. |
| **B-5** | **`fontSize: 7px` fails accessibility** | The stat labels inside `SanctuaryHomePanel` render at 7px. This fails WCAG 2.1 SC 1.4.4 (Resize Text) and is unreadable on non-retina displays. |
| **B-6** | **PortraitCard ignores photos** | Every memorial card shows a candle emoji. Memorial photos are fully supported in the data model and API. The most humanising element of a memorial page — the person's face — is absent from every browse card. |
| **B-7** | **Mobile keyboard covers candle form** | The candle creation form inside the 3D modal has no keyboard-avoidance behaviour. On mobile, the keyboard covers the form fields and submit button. |
| **B-8** | **`input type="search"` on iOS** | Causes unexpected keyboard behaviour (Search button vs Return, toolbar shifts). Use `type="text"` with `inputMode="search"`. |

---

## Section 9 — Executive Recommendations (Top 20)

| Rank | Priority | Recommendation | Impact | Effort |
|---|---|---|---|---|
| 1 | **Critical** | Remove fabricated activity notifications entirely | Trust, Ethics | Low |
| 2 | **Critical** | Replace fake statistics with real API data or remove section | Trust, Ethics | Medium |
| 3 | **Critical** | Fix MusicPanel — remove fake track list, keep one sound engine with volume slider | UX Integrity | Low |
| 4 | **Critical** | Run all `SanctuaryHomePanel` strings through `useLanguage()` / `t.xxx` | Compliance, TK users | Medium |
| 5 | **Critical** | Fix candle form keyboard avoidance on mobile | Mobile usability | Medium |
| 6 | **High** | `PortraitCard` — display actual memorial photo when available, fall back to initials avatar | Emotional resonance | Medium |
| 7 | **High** | Raise `fontSize` minimums to 11px — eliminate all 7px/8px/9px text | Accessibility | Low |
| 8 | **High** | Replace `input type="search"` with `type="text" inputMode="search"` | Mobile UX | Low |
| 9 | **High** | Move "Enter 3D Sanctuary" CTA to immediately below the hero | Discoverability | Low |
| 10 | **High** | Move "Upcoming Yahrzeit" to first collection slot | Emotional hierarchy | Low |
| 11 | **High** | `SanctuaryHero` expand/collapse — animate the transition (match surrounding spring animations) | Visual consistency | Low |
| 12 | **High** | Clamp `SanctuaryHomePanel` width to `min(268px, calc(100vw - 28px))` | 320px mobile fix | Low |
| 13 | **High** | Fix `useAmbientSound.start()` volume closure bug — read `volume` from ref, not closure | Audio bug | Low |
| 14 | **Medium** | Unify gold: adopt `#D4AF37` everywhere, remove `#D4A843` and `rgba(212,168,67)` | Visual consistency | Low |
| 15 | **Medium** | Extract `STYLES` string to a `.css` file — remove inline `<style>` injection | Performance, DX | Low |
| 16 | **Medium** | Add `React.memo` to `SanctuaryHomePanel` | Performance | Low |
| 17 | **Medium** | Reduce bottom nav to 3 tabs (Home · Memorials · 3D) — fold Music into Home panel, Flowers into a mode toggle | Cognitive load | Medium |
| 18 | **Medium** | Remove "Community Picks" strip (duplicate of Most Visited) or implement genuine curation | Content quality | Medium |
| 19 | **Medium** | Break `MemorialSanctuaryModal.tsx` (1,949 lines) into composable files: `SanctuaryModal.tsx`, `panels/HomePanel.tsx`, `panels/MusicPanel.tsx`, `panels/FlowersPanel.tsx`, `panels/SearchPanel.tsx`, `forms/CandleForm.tsx` | Maintainability | High |
| 20 | **Low** | Remove the dead `filterYear` state (set to `"all"`, never changed) or add year-filter UI | Code hygiene | Low |

---

## Final Question — Next Sprint Before Public Launch

### Sprint: "Truth & Trust"

The Memorial Sanctuary is emotionally compelling and technically sound in most areas. The single sprint blocking public launch is not about adding features — it is about **removing dishonesty and barriers**.

**Sprint Goal:** Every interaction the user has with the Memorial Sanctuary should be truthful, accessible to the full Bnei Menashe community, and functional on a 360px mobile screen.

**Sprint Stories:**

1. **Remove fabricated notifications** (`buildNotifText`, `NOTIF_NAMES`, `NOTIF_CITIES` random assembly). Replace with: either real `fetchCommunityYahrzeit` events surfaced as genuine activity, or silence — no toast at all. (1 day)

2. **Real statistics or none.** Connect `candleCount` and `visitorCount` to real API aggregates. If aggregates don't exist yet on the backend, remove the stats grid entirely — an empty space is better than a lie. (1 day backend, 0.5 day frontend)

3. **Fix MusicPanel.** Remove the 4-track decorative list. Render only: a play/pause button, a volume slider, and a single label "Sanctuary Ambient Sound." The existing toggle in the home panel is already correct — promote that pattern. (0.5 day)

4. **Translate SanctuaryHomePanel.** Audit every hardcoded string and add EN + TK keys to `translations.ts`. (1 day)

5. **Portrait photo in PortraitCard.** `useCollections` returns `MemorialWithPerson` which carries photo data. Render the first photo as a CSS `background-image` in the avatar area; fall back to the person's initials on a gradient. The candle emoji moves to an overlay badge. (1 day)

6. **Mobile keyboard avoidance.** Wrap the candle form's scroll container in a `useEffect` that calls `scrollIntoView({ behavior: 'smooth', block: 'center' })` on the active input's `focus` event. (0.5 day)

7. **Typography floor.** Global find-replace: raise all `fontSize` below `11` in memorial feature files to `11`. (0.5 day)

8. **Quick wins** (batch, 1 day):
   - `input type="search"` → `type="text" inputMode="search"`
   - Move Enter 3D CTA above collection strips
   - Move Upcoming Yahrzeit to first strip slot
   - Clamp panel widths for 320px
   - Unify gold constant to `#D4AF37`
   - Fix ambient sound volume closure bug

**Total sprint estimate: ~6 developer days.**  
**Result:** A Memorial Sanctuary that is truthful, bilingual, mobile-safe, and accessible — ready for the Bnei Menashe community to trust with the memory of their loved ones.

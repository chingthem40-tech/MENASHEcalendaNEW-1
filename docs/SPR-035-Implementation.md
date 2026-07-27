# SPR-035 — Menashe Experience Unification: Implementation Notes

## Sprint Goal

Unify the platform's visual language, remove fabricated data from the Memorial Sanctuary, redesign the Home page journey, standardize the mobile design system, and document the experience guidelines.

---

## T001 — Truth & Trust: Fabricated Data Removal

**Status**: Complete

**Changes made** in `artifacts/menashe-calendar/src/modals/MemorialSanctuaryModal.tsx`:

- **Removed** `hashNum()` — a deterministic fake-number generator seeded on entry IDs
- **Removed** `NOTIF_NAMES`, `NOTIF_CITIES`, `buildNotifText()` — generators of fake "Sarah from Jerusalem lit a candle" activity notifications
- **Removed** fake ambient notification timer — was firing fake engagement popups every 28–46 seconds
- **Removed** fake global stats: `24832` base candle count, fake `totalVisitors`, fake `flowerCount`
- **Removed** per-memorial fake `candleN`, `flowerN`, `visitorN` stats from `MemorialProfileSheet`
- **Removed** fake `birthYear` computation (was subtracting a hash-derived age from passingYear) and fabricated "Born" / "Life's Journey" timeline events
- **Removed** fake `candleN` from `MemorialScrollStrip` and mobile memorial cards

**Replaced with**:
- `EntranceCard`: shows real `totalLit` (= `entries.length`) as candle count, or "No recent activity yet." for zero
- `StatsChipRow`: shows only real candle count (single chip)
- `MemorialProfileSheet`: Life Timeline shows only the real year of passing; stats grid removed entirely
- `MemorialScrollStrip`: shows candle icon only, no fake count
- `AmbientNotification`: returns `null` — preserved as stub for future real activity stream

---

## T002 — Memorial Sanctuary Translation Completeness

**Status**: Complete

**New translation keys added** (17 keys, in `translations.ts` interface + `en` + `tk` objects):

| Key | EN | TK |
|---|---|---|
| `memNavFlowers` | Flowers | Pathian Thu |
| `memNavMessages` | Messages | Thu Gen |
| `memNavMusic` | Music | Hla |
| `memSceneValley` | Valley | Luang |
| `memSceneGarden` | Garden | Zung |
| `memSceneWaterfall` | Waterfall | Tui Thlak |
| `memSceneSanctuary` | Sanctuary | Inn Thianghlim |
| `memSceneSunset` | Sunset | Ni Tlai |
| `memAmbientOn` | Ambient on | Ambient on |
| `memAmbientOff` | Ambient off | Ambient off |
| `memNoRecentActivity` | No recent activity yet. | Thil thar om lo. |
| `memTodayRemembrance` | TODAY'S REMEMBRANCE | NI TIN THILSIM |
| `memLightFirstCandle` | Light the first candle | Meihal a hmawhna hmat rawh |
| `memSceneLoadError` | 3D scene could not be loaded | 3D scene a lo thei lo |
| `memTimelineTitle` | LIFE TIMELINE | NUNPUI THILOM |
| `memTimelineJourney` | Life's Journey | Nunpui Lamka |
| `memTimelineRemembered` | Remembered | Nunnem |

**Components updated to use translations**:
- `RightNavPanel` — `R_NAV_ITEMS` array moved inside function, uses `t.memNavHome/Memorials/Flowers/Messages/Music`
- `BottomSceneTabs` — `SCENE_TABS` array moved inside function, uses `t.memScene*`
- `InteractionHints` — uses `t.memHintDrag/Pinch/Tap`
- `MemorialProfileSheet` — uses `t.memTimelineTitle/Remembered`, `t.memMemoryBlessing`

---

## T003 — Home Experience Redesign

**Status**: Complete

**Changes made** in `artifacts/menashe-calendar/src/pages/Home.tsx`:

**New component**: `MemorialSanctuaryEntry` — an atmospheric card placed in the home journey between CommunitySection and PrayerSection. Features:
- Gold candlelight aesthetic consistent with Memorial Sanctuary branding
- Tappable → calls `onShowCommunityYahrzeit`
- Bilingual title/subtitle via `t.memShellWelcome` / `t.memShellWelcomeSub`
- Accessible: `role="button"`, `tabIndex={0}`, `onKeyDown`

**Section reorder**:

| Before | After |
|---|---|
| CalendarSection | CalendarSection |
| LearningSection | LearningSection |
| PrayerSection | CommunitySection ↑ (moved up) |
| QuickActionsSection | **MemorialSanctuaryEntry** (new) |
| CommunitySection | PrayerSection |
| | QuickActionsSection |

---

## T004 — Mobile Design Unification

**Status**: Complete

**Keyboard overlap fix** in 3 screens:
- `app/(tabs)/community.tsx` — Android `KeyboardAvoidingView` behavior changed from `undefined` → `"height"`
- `app/sign-in.tsx` — same fix + added `keyboardVerticalOffset={24}` for Android
- `app/forgot-password.tsx` — same fix + `keyboardVerticalOffset`

Note: `sign-up.tsx` was already using `"height"` behaviour for Android.

---

## T005 — Shared Design System

**Status**: Complete

**Web**: `artifacts/menashe-calendar/src/lib/theme.ts` expanded with:
- Documented canonical gold palette (4 tokens: `GOLD`, `GOLD_DIM`, `GOLD_BRIGHT`, `GOLD_SANCTUARY`)
- Surface tokens: `SURFACE_0/1/2`
- Typography scale (`TEXT`)
- Spacing scale (`SPACE`)
- Border radius scale (`RADIUS`)

**Mobile**: `artifacts/menashe-mobile/constants/colors.ts` expanded with:
- `SPACE` export (matching web)
- `TEXT` export (mobile-adjusted sizes)
- `RADIUS` export
- Documented header comment naming canonical gold value

---

## T006 — Documentation

**Status**: Complete

Created:
- `docs/DesignSystem.md` — token reference, component patterns, bilingual system, accessibility
- `docs/ExperienceGuidelines.md` — home journey, Memorial Sanctuary truth policy, motion, forms, empty states
- `docs/SPR-035-Implementation.md` — this file

---

## Key Architectural Decisions

1. **`AmbientNotification` retained as stub** — the component is preserved (returns null) so future engineers can wire it to a real WebSocket activity stream without hunting for call sites.

2. **`GOLD` vs `GOLD_SANCTUARY`** — two gold values are intentional. `#d4a843` is the warm amber used throughout the app. `#D4AF37` (slightly cooler/richer) is used only in the Memorial Sanctuary 3D scene to give it a distinct, more solemn atmosphere.

3. **`MemorialSanctuaryEntry` on Home** — placed between Community and Prayer so it reads as: "here is your community → and here is a way to honour those who have passed." Prayer tools follow as a deeper commitment.

4. **Timeline real-data-only** — the profile sheet timeline now shows only the year of passing (the only date reliably stored per entry). A richer timeline (birth year, life events) requires explicit user input, which is a future product decision.

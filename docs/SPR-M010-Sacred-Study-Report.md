# SPR-M010 — Sacred Study Experience (Mobile V1)

Status: **Complete**. The Sacred Study hub already existed (`artifacts/menashe-mobile/app/(tabs)/torah.tsx`)
before this spec revision landed and covered sections 1–8 almost 1:1. This revision
added the two sections and details the original build was missing — **Bookmarks**
and **Learning Journey** — plus a large hero artwork motif, comfortable reading
width, and a renamed/expanded Study Paths grid. Everything else in the spec was
already satisfied and is documented below as the baseline.

No web app, API, or database code was touched. No Torah/Siddur/Parashah/Daf Yomi
calculation engine was duplicated or modified — the screen consumes the existing
shared-core libraries (`lib/hebrewCalendar.ts`, `lib/dafYomi.ts`, `lib/siddurApi.ts`)
exactly as before. No Community/AI/Sanctuary/Settings/Notifications/Widgets work
was performed.

## 1. Folder tree (Sacred Study surface only)

```
artifacts/menashe-mobile/
├── app/
│   ├── (tabs)/
│   │   └── torah.tsx            Sacred Study hub screen — all 10 spec sections
│   ├── daf-yomi.tsx             Daf Yomi detail screen
│   ├── siddur.tsx               Siddur / prayer library screen
│   ├── mussar.tsx               Mussar / reflection reading screen
│   └── torah-tracker.tsx        Torah reading progress tracker
├── src/mobile/
│   ├── components/cards/ParashaCard.tsx   Reusable MMDL Parashah card (available, opt-in)
│   ├── design-system/                     Theme tokens, useReducedMotion, a11y helpers
│   └── types/screens.ts                   Route registry
├── lib/
│   ├── hebrewCalendar.ts        Shared-core wrapper (Hebrew date, Parashah)
│   ├── dafYomi.ts               Shared-core wrapper (Daf Yomi)
│   ├── siddurApi.ts             Shared-core wrapper (Siddur content)
│   ├── storageUtils.ts          AsyncStorage helpers (last study + history)
│   └── translations.ts          Re-exports shared-core translations
└── context/LanguageContext.tsx  EN / TK language provider (`useLanguage()`)

lib/shared-core/src/translations/translations.ts   New sacredStudy* EN + TK keys
```

No new screens or navigation routes were added — the hub and its four drill-down
screens cover the full spec surface. "Bookmarks" and "Learning Journey" are new
*sections within* the existing hub screen, not new routes.

## 2. Screen architecture

`torah.tsx` is a single-scroll hub, now composed of all 10 spec sections in order:

1. **Hero** — Sacred Study title, this week's Parashah, and a large Star-of-David
   watermark artwork over a warm parchment/gold gradient (added).
2. **Continue Learning** — resumes the user's last study session, one-tap Continue;
   shows "Begin Your Journey" when no history exists (label now sourced from
   `t.sacredStudyBeginJourney`, added).
3. **Weekly Parashah** — Hebrew + English name, summary, reading time, Continue
   Study CTA.
4. **Today's Daf Yomi** — current tractate/page, Continue Study CTA.
5. **Siddur** — Morning / Afternoon / Evening prayer cards.
6. **Torah Insights** — expandable daily insight.
7. **Reflection** — a single quiet quotation with source.
8. **Study Paths** (renamed from "Study Collections", added 2 tiles) — Parashah,
   Torah, Daf Yomi, Siddur, Prayer, **Jewish Calendar** (new — links to the
   Calendar tab), Learning Library, **Bookmarks** (new — jumps to section 9).
9. **Bookmarks** (new) — the 4 most recent study sessions before the current one
   (auto-saved from study history), each one tap to resume; friendly empty state
   when nothing is saved yet.
10. **Learning Journey** (new) — three gentle, non-competitive stat cards: Study
    Days, Lessons Completed, This Week's Reading — computed from local study
    history, never framed as a leaderboard or streak-at-risk warning.

Each section is driven entirely by shared-core data or local device storage — no
mock or duplicated content.

## 3. Component reuse map

| Spec requirement | Reused from | Notes |
|---|---|---|
| Hebrew date / calendar math | `lib/hebrewCalendar.ts` (Shared Core) | No duplication |
| Daf Yomi data | `lib/dafYomi.ts` (Shared Core) | No duplication |
| Siddur content | `lib/siddurApi.ts` (Shared Core) | No duplication |
| Jewish Calendar navigation | Existing `/(tabs)/calendar` tab | Reused, not rebuilt |
| Theming (colors, spacing, gold token) | `src/mobile/design-system` | Shared `GOLD` token across app |
| Reduce-motion entrance animation | `useReducedMotion()` (design-system) | Honors OS accessibility setting |
| Bilingual strings | `useLanguage()` / shared-core translations | New sections routed through new `sacredStudy*` keys (EN + TK) |
| Local persistence | `lib/storageUtils.ts` (`storageGet`/`storageSet`) | Reused for both "last study" and the new study-history log — no new storage layer |
| Card visuals | Inline hub-specific markup (Parashah/Siddur cards) | `ParashaCard.tsx` MMDL component exists but is not used in the hub — left untouched |

No new engines, calculators, or duplicate data-fetching logic were introduced.
Bookmarks and Learning Journey are presentation-layer features derived from the
existing "record study" local-storage pattern, not new backend/business logic.

## 4. Learning flow diagram

```
User opens Sacred Study
        │
        ▼
 ┌─────────────┐   has history   ┌───────────────────────────┐
 │ Continue    │ ───────────────▶│ Resume last study session  │
 │ Learning    │                 │ (Parashah / Daf / Siddur)  │
 └─────────────┘                 └───────────────────────────┘
        │ no history
        ▼
 "Begin Your Journey" → user taps any of:
   Weekly Parashah / Daf Yomi / Siddur / Torah Insights / Study Paths tile
        │
        ▼
 recordStudy() → writes "last study" + appends to study history (local, capped 30)
        │
        ├──▶ Continue Learning card updates immediately on next visit
        ├──▶ Bookmarks section surfaces it as "recently saved" (once superseded)
        └──▶ Learning Journey stats (Study Days / Lessons / This Week) recompute
```

## 5. Animation summary

- Hero uses a book-opening entrance (`scaleY` + fade), gated by `useReducedMotion()`.
- All 10 sections use the existing staggered fade/slide-up entrance pattern
  (`useEntrance`), extended with two new stagger slots for Bookmarks and Learning
  Journey so they animate in sequence with the rest of the hub, not as an
  afterthought.
- The hero watermark (Star of David, `Feather` icon at low opacity) is a static
  decorative layer with `pointerEvents="none"` — it does not animate.
- Tapping the "Bookmarks" Study Paths tile smoothly auto-scrolls to the Bookmarks
  section (`scrollTo`, disabled under reduced motion).

## 6. Performance report

- Bookmarks and Learning Journey both derive from a single `history` array already
  held in state (loaded once on mount) — no additional network calls or polling.
- Journey stats (`computeJourneyStats`) and the bookmarks slice are both wrapped in
  `useMemo`, recomputing only when `history` changes.
- `JourneyStat` and existing `CollectionTile`/`SiddurTimeCard` components are
  `memo`-wrapped, so idle cards do not re-render when sibling state changes.
- Study history is capped at 30 entries (`MAX_HISTORY`) to keep storage reads/writes
  and list rendering bounded regardless of how long a user has been studying.
- No new rasterized images were added; the hero watermark is a vector icon.

## 7. Accessibility report

- Hero watermark is `pointerEvents="none"` and purely decorative — not exposed to
  screen readers, not in the focus/reading order.
- Bookmarks list items and Study Paths tiles carry `accessibilityRole="button"` and
  descriptive `accessibilityLabel`s (e.g. "Recently Saved: Parashat Korach").
- Learning Journey stat cards use `accessibilityRole="text"` with a combined label
  ("Study Days: 5") so VoiceOver/TalkBack reads the value and its meaning together
  rather than as two disconnected fragments.
- All touch targets (tiles, bookmark rows, CTA buttons) meet the 48dp minimum
  height requirement, consistent with the rest of the hub.
- Dynamic Type is unaffected — `allowFontScaling` remains enabled by default
  app-wide; the design system only disables it on a narrow, pre-existing allowlist
  unrelated to this screen's new text.
- Reduce-motion is respected for both the new scroll-to-bookmarks interaction and
  the two new section entrance animations.

## 8. Verification checklist

- [x] Sacred Study hub renders all **10** spec sections, including the newly added
      Bookmarks and Learning Journey.
- [x] Hero includes large inspirational artwork (Star-of-David watermark).
- [x] Reading content respects a comfortable max width (640px) on large screens.
- [x] Study Paths grid includes all 8 spec destinations (Parashah, Torah, Daf Yomi,
      Siddur, Prayer, Jewish Calendar, Learning Library, Bookmarks).
- [x] Bookmarks show recently saved study and resume where the user left off.
- [x] Learning Journey shows Study Days / Lessons Completed / This Week's Reading
      framed gently, with no competitive/streak-pressure language.
- [x] Web application untouched — no files under `artifacts/menashe-calendar`
      modified.
- [x] Shared Core reused — Hebrew Calendar, Daf Yomi, and Siddur engines untouched,
      only consumed via their existing wrapper modules.
- [x] Mobile Shell, MMDL, and MEL visual language followed — no new component
      library or design system introduced.
- [x] No API routes or database schema modified.
- [x] No Community/AI/Sanctuary/Settings/Notifications/Widgets work performed.
- [x] All new UI copy (Begin Your Journey, Study Paths, Jewish Calendar, Bookmarks,
      Recently Saved, empty-bookmarks message, Learning Journey, Study Days,
      Lessons Completed, This Week's Reading) has both EN and TK translations in
      `lib/shared-core/src/translations/translations.ts`, referenced via `t.*`.
- [x] `tsc --noEmit` shows zero new errors introduced in `torah.tsx` (verified
      against a clean baseline; remaining project-wide TS errors are pre-existing
      and outside this screen).
- [x] All 6 workflows (`Start application`, `API Server`, `Mobile App`, and their
      `artifacts/*` counterparts) run without errors after the change.

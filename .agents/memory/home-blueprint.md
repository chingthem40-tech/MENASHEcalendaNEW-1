---
name: Home.tsx blueprint
description: Full inventory and extraction plan for the 5207-line Home.tsx monolith; documented in docs/Architecture.md §SPR-004
---

# Home.tsx Architecture Blueprint

## Summary
Home.tsx (5,207 lines) contains 16 inline sub-components, 6 utility functions, 7 data constants, and the main Home export (23 props). Full blueprint lives in `docs/Architecture.md` under `## SPR-004 — Home.tsx Architecture Blueprint`.

## Key facts
- HomeProps has 23 props: 8 data + 15 modal/navigation callbacks
- All modal opens are delegated up to App.tsx — Home never owns modal visibility state
- Home has only 5 pieces of local state: `mapForceExpand`, `showCompassCard`, `candleCountdown`, `showShabbatBanner`, `candleNotifFiredRef`
- getAiToken() is duplicated in 4 sub-components (TD-H01) — should be extracted to src/lib/auth.ts
- CandleLightingCountdown and Home both run independent setInterval on the same zmanimResult (TD-H04)

## 12-phase extraction order
H-001: data/ constants → H-002: utility functions → H-003: AiChatFAB → H-004: CommunityFAB →
H-005: DateZmanimCard → H-006: NextHolidayCard → H-007: ShabbatCountdownBar →
H-008: YahrzeitReminderCard → H-009: CandleLightingCountdown → H-010: useCandleCountdown hook →
H-011: all remaining pure cards → H-012: HomeProps.ts + index.tsx slim

## Target directory structure
src/pages/home/index.tsx, HomeProps.ts, hooks/, data/, cards/ (13 files), overlays/ (2 files)

## Backward compat
Existing `import Home from './pages/Home'` preserved by re-export from src/pages/home/index.tsx

## SPR-035 section order (canonical)
CalendarSection → LearningSection → CommunitySection → MemorialSanctuaryEntry → PrayerSection → QuickActionsSection
`MemorialSanctuaryEntry` is defined as a component inside Home.tsx (above the default export); calls `onShowCommunityYahrzeit` on tap.

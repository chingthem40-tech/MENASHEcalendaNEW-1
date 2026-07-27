/**
 * SPR-M001 Phase 1 — Features Directory
 *
 * This directory will hold self-contained feature modules as the mobile app grows.
 * Each feature is a directory containing its own components, hooks, and types —
 * keeping features isolated and independently testable.
 *
 * ─── Planned feature modules ─────────────────────────────────────────────────
 *
 *  features/
 *  ├── calendar/       → Hebrew calendar display + day detail
 *  ├── zmanim/         → Prayer times + location picker
 *  ├── community/      → Announcements, prayer board, census
 *  ├── torah/          → Parasha, Daf Yomi, Mussar, Torah tracker
 *  ├── siddur/         → Book library, reader
 *  ├── sanctuary/      → Memorial Sanctuary (3D — platform-gated)
 *  ├── ai/             → Rav Menashe AI chat
 *  └── notifications/  → Push notification management
 *
 * ─── Shared business logic ────────────────────────────────────────────────────
 *
 *  All calendar, zmanim, parasha, and translation logic lives in:
 *    @workspace/shared-core  (lib/shared-core)
 *
 *  Feature modules import from shared-core — they do NOT duplicate the logic.
 *
 * ─── Anti-pattern to avoid ───────────────────────────────────────────────────
 *
 *  ❌ features/calendar/hebrewCalendar.ts  ← duplicates shared-core
 *  ✅ import { getHebDate } from "@workspace/shared-core/calendar"
 */

export const FEATURES_DOCS = "Feature modules are scaffolded in future Mobile SPRs.";

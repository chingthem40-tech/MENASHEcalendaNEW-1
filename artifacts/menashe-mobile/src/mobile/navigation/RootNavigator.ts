/**
 * SPR-M001 Phase 3 — Navigation: Root Navigator (stub)
 *
 * The actual root navigator is implemented via Expo Router's file-based
 * routing in app/_layout.tsx.  This file documents the intended stack
 * structure and is the home for any future imperative navigation helpers.
 *
 * ─── Stack Structure ──────────────────────────────────────────────────────────
 *
 *  Stack (root)
 *  ├── sign-in          (no auth required)
 *  ├── sign-up          (no auth required)
 *  ├── forgot-password  (no auth required)
 *  └── (tabs)           (auth required)
 *       ├── index        → Home
 *       ├── calendar     → Calendar
 *       ├── zmanim       → Zmanim
 *       ├── community    → Community
 *       ├── torah        → Torah
 *       └── settings     → Settings
 *       (stack within tabs)
 *       ├── torah-tracker
 *       ├── siddur
 *       ├── daf-yomi
 *       ├── mussar
 *       ├── yahrzeit-calc
 *       ├── prayer-board
 *       └── translation-editor
 *
 * ─── Auth Guard ───────────────────────────────────────────────────────────────
 *
 *  Implemented in app/(tabs)/_layout.tsx:
 *    useAuth().isSignedIn → if false, router.replace("/sign-in")
 *
 *  This is the SINGLE auth gate. Never add additional guards.
 *  (See mobile-auth-guard.md in .agents/memory/)
 */

export const ROOT_NAVIGATOR_DOCS = "See app/_layout.tsx for the live implementation.";

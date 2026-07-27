/**
 * SPR-M001 Phase 3 — Navigation: Bottom Tabs (stub)
 *
 * The live implementation is in app/(tabs)/_layout.tsx.
 * This file documents the tab configuration contract so future
 * tab changes have a clear spec to follow.
 *
 * ─── Tab Configuration ────────────────────────────────────────────────────────
 *
 *  Tab order (left → right):
 *   1. Home       (index.tsx)   icon: feather/home
 *   2. Calendar   (calendar)    icon: feather/calendar
 *   3. Zmanim     (zmanim)      icon: feather/clock
 *   4. Community  (community)   icon: feather/users
 *   5. Torah      (torah)       icon: feather/book-open
 *   6. Settings   (settings)    icon: feather/settings
 *
 * ─── Tab Bar Style ────────────────────────────────────────────────────────────
 *
 *  iOS:    BlurView (expo-blur) with transparency — tint follows theme
 *  Android: Solid background color from theme palette
 *  Web:    Solid background, height 68dp
 *  Native: Height 64dp
 *
 *  Active tint:   colors.primary
 *  Inactive tint: colors.mutedForeground
 *  Border top:    colors.border, width 1
 *  Label size:    10px, weight 600, tracking 0.3
 */

export const BOTTOM_TABS_DOCS = "See app/(tabs)/_layout.tsx for the live implementation.";

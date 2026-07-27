/**
 * SPR-M001 — Mobile Architecture Root
 *
 * Top-level barrel export for the entire mobile architecture layer.
 * Import from here whenever you need cross-cutting mobile utilities.
 *
 * ─── Architecture tree ────────────────────────────────────────────────────────
 *
 *  src/mobile/
 *  ├── index.ts              ← THIS FILE — top-level barrel
 *  │
 *  ├── types/
 *  │   ├── screens.ts        ← SCREEN_REGISTRY, ScreenName, ScreenMeta
 *  │   └── index.ts
 *  │
 *  ├── theme/
 *  │   ├── colors.ts         ← PALETTES, GLASS, ELEVATION, getPalette()
 *  │   ├── typography.ts     ← FONT_FAMILY, TEXT, LINE_HEIGHT, TYPE_STYLES
 *  │   ├── animation.ts      ← DURATION, EASE, SPRING, TRANSITION
 *  │   └── index.ts
 *  │
 *  ├── navigation/
 *  │   ├── types.ts          ← RootStackParamList, TabParamList, NavigationEvent
 *  │   ├── deepLinks.ts      ← DEEP_LINKS, buildDeepLink()
 *  │   ├── RootNavigator.ts  ← Stack structure docs
 *  │   ├── BottomTabs.ts     ← Tab bar docs
 *  │   └── index.ts
 *  │
 *  ├── utils/
 *  │   ├── platform.ts       ← isIOS, isAndroid, isWeb, isMobile, select()
 *  │   ├── responsive.ts     ← BREAKPOINTS, rv(), useSafeInsets(), getTabBarHeight()
 *  │   ├── performance.ts    ← Performance contracts + stubs
 *  │   └── index.ts
 *  │
 *  ├── providers/
 *  │   └── index.ts          ← Provider composition docs + hook re-exports
 *  │
 *  ├── hooks/
 *  │   └── index.ts          ← useColors, useApp, useLanguage
 *  │
 *  ├── components/
 *  │   └── index.ts          ← ErrorBoundary, ErrorFallback
 *  │
 *  ├── layouts/
 *  │   └── index.ts          ← Layout stubs
 *  │
 *  ├── features/
 *  │   └── index.ts          ← Feature module map
 *  │
 *  ├── assets/
 *  │   └── index.ts          ← ASSETS registry
 *  │
 *  └── design-system/        ← SPR-M002: MMDL full design system
 *      ├── tokens/           ← colors, typography, spacing, radius, elevation,
 *      │                        glass, motion, iconography, layout
 *      ├── specs/            ← 21 component specifications (types only)
 *      ├── accessibility/    ← A11Y standards + useReducedMotion + useScreenReader
 *      └── hooks/            ← useThemeTokens() — primary consumer hook
 *
 * ─── Shared layer (lib/shared-core) ──────────────────────────────────────────
 *
 *  @workspace/shared-core provides platform-agnostic business logic:
 *    • Hebrew calendar  (@workspace/shared-core/calendar)
 *    • Zmanim           (@workspace/shared-core/zmanim)
 *    • Locations        (@workspace/shared-core/locations)
 *    • Translations     (@workspace/shared-core/translations)
 *    • Parasha          (@workspace/shared-core/parasha)
 *
 *  DO NOT duplicate any of this in the mobile layer.
 */

export * from "./types";
export * from "./theme";
export * from "./navigation";
export * from "./utils";
export * from "./design-system";

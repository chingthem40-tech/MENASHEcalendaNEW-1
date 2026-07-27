/**
 * SPR-M001 Phase 6 — Mobile Provider Composition
 *
 * MobileAppProvider is the single provider tree for the mobile app.
 * It composes all context providers in the correct dependency order.
 *
 * ─── Current provider stack (in app/_layout.tsx) ─────────────────────────────
 *
 *   ClerkProvider           → Auth (Clerk)
 *   └── ClerkLoaded
 *       └── SafeAreaProvider     → Safe area insets (react-native-safe-area-context)
 *           └── ErrorBoundary    → Runtime error recovery
 *               └── QueryClientProvider  → Server state (TanStack Query)
 *                   └── GestureHandlerRootView  → Gesture engine
 *                       └── AppProvider    → Theme, Location, Notifications
 *                           └── LanguageProvider  → EN / TK bilingual
 *
 * ─── Provider ownership ───────────────────────────────────────────────────────
 *
 *  Provider              | Source file                        | Shared?
 *  ──────────────────────┼────────────────────────────────────┼────────
 *  ClerkProvider         | @clerk/expo                        | Yes (auth)
 *  SafeAreaProvider      | react-native-safe-area-context     | Yes
 *  QueryClientProvider   | @tanstack/react-query              | Yes (API)
 *  GestureHandlerRootView| react-native-gesture-handler       | Yes
 *  AppProvider           | @/context/AppContext               | Mobile
 *  LanguageProvider      | @/context/LanguageContext          | Mobile (wraps shared-core translations)
 *
 * ─── Rules ───────────────────────────────────────────────────────────────────
 *
 *  1. DO NOT duplicate any provider already in _layout.tsx.
 *  2. New providers must be added to _layout.tsx at the correct nesting level.
 *  3. The order above is load-order-sensitive — Clerk must be outermost,
 *     GestureHandlerRootView must wrap all gesture consumers.
 *  4. All providers that need theme access must be nested inside AppProvider.
 *  5. All providers that need translation access must be inside LanguageProvider.
 *
 * ─── Adding a new provider ────────────────────────────────────────────────────
 *
 *  1. Create it in @/context/YourContext.tsx (keep context next to its provider).
 *  2. Add it to _layout.tsx at the appropriate nesting depth.
 *  3. Document it in the table above.
 *  4. If it wraps shared-core logic, re-export the hook from this file.
 */

export const PROVIDER_DOCS = "See app/_layout.tsx for the live provider composition.";

/**
 * Re-export provider hooks for convenience — import from here in future
 * mobile screens instead of hunting for the source file.
 */
export { useApp }      from "@/context/AppContext";
export { useLanguage } from "@/context/LanguageContext";

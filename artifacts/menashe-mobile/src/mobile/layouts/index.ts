/**
 * SPR-M001 Phase 1 — Mobile Layout Stubs
 *
 * Layout components provide consistent screen chrome (safe area padding,
 * scroll containers, keyboard avoidance) so screen implementors don't
 * have to repeat boilerplate.
 *
 * ─── Planned layouts ─────────────────────────────────────────────────────────
 *
 *  ScreenLayout          — Full-screen safe-area wrapper with status bar
 *  ScrollScreenLayout    — ScreenLayout + KeyboardAwareScrollView
 *  TabScreenLayout       — ScreenLayout with tab bar bottom inset
 *  ModalLayout           — Sheet-style modal with drag handle + close button
 *  SectionListLayout     — Performance-optimised SectionList wrapper
 *
 * ─── Implementation notes ────────────────────────────────────────────────────
 *
 *  • Use useSafeInsets() from @/src/mobile/utils/responsive for insets
 *  • Use KeyboardAwareScrollViewCompat for forms
 *  • Never hardcode top/bottom padding — always derive from insets
 */

export const LAYOUTS_DOCS = "Layout components are scaffolded in a future Mobile SPR.";

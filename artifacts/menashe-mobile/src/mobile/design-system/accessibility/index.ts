/**
 * MMDL — Accessibility Standards
 * SPR-M002 | Menashe Mobile Design Language
 *
 * All components MUST comply with these standards.
 * Reference WCAG 2.1 AA as the baseline.
 */

import { AccessibilityInfo, Platform } from "react-native";
import { useEffect, useState } from "react";

// ─── Touch targets ────────────────────────────────────────────────────────────

export const A11Y_TOUCH = {
  /**
   * Minimum touch target per platform HIG.
   * Android Material: 48dp | iOS HIG: 44dp | WCAG 2.5.5: 44×44px
   * We use 44dp as the minimum for cross-platform consistency.
   */
  minTargetSize: 44,
  /** Recommended comfortable target size */
  comfortTarget: 48,
} as const;

// ─── Contrast ratios ──────────────────────────────────────────────────────────

export const A11Y_CONTRAST = {
  /** WCAG AA normal text (< 18pt) */
  normalText:   4.5,
  /** WCAG AA large text (≥ 18pt or ≥ 14pt bold) */
  largeText:    3.0,
  /** WCAG AAA normal text */
  normalTextAAA: 7.0,
  /** WCAG AAA large text */
  largeTextAAA:  4.5,
  /** Non-text UI components (icons, borders on state) */
  uiComponent:   3.0,
} as const;

/**
 * Color pairs that satisfy AA contrast in each MMDL theme.
 * Verified pairs — do NOT use other combinations without checking contrast.
 *
 * Format: [foreground token, background token]
 */
export const VERIFIED_CONTRAST_PAIRS = {
  dark: [
    ["textPrimary",   "background"],       // ≈ 17:1 ✅
    ["textSecondary", "background"],       // ≈ 7:1  ✅
    ["primary",       "background"],       // ≈ 5:1  ✅ (gold on navy)
    ["textPrimary",   "card"],             // ≈ 14:1 ✅
    ["primary",       "card"],             // ≈ 5:1  ✅
  ],
  light: [
    ["textPrimary",   "background"],       // ≈ 14:1 ✅
    ["textSecondary", "background"],       // ≈ 6:1  ✅
    ["primary",       "background"],       // ≈ 4.7:1 ✅ (gold-deep on parchment)
    ["textPrimary",   "card"],             // ≈ 12:1 ✅
  ],
  sapphire: [
    ["textPrimary",   "background"],       // ≈ 16:1 ✅
    ["textSecondary", "background"],       // ≈ 7:1  ✅
    ["primary",       "background"],       // ≈ 4.8:1 ✅ (sapphire blue on deep)
    ["accentGold",    "background"],       // ≈ 5:1  ✅
  ],
} as const;

// ─── Dynamic text ─────────────────────────────────────────────────────────────

export const A11Y_TEXT = {
  /**
   * Minimum font scale the app supports.
   * Users setting larger text via accessibility settings will scale
   * up to MAX_FONT_SCALE (defined in typography.ts).
   */
  minFontScale: 0.85,
  maxFontScale: 1.4,

  /**
   * allowFontScaling=false should ONLY be used on:
   * - Decorative/ornamental text (Hebrew date headers, splash logo text)
   * - Tab bar labels (fixed height container)
   *
   * All body text, captions, labels MUST allow font scaling.
   */
  neverScaleList: [
    "tabLabel",
    "hebrewDecorativeDisplay",
    "splashLogo",
  ],
} as const;

// ─── Reduced motion ───────────────────────────────────────────────────────────

/**
 * Hook: returns true when the user has enabled "Reduce Motion" in
 * accessibility settings. All animated components must honour this.
 *
 * Usage:
 *   const reduceMotion = useReducedMotion();
 *   const duration = reduceMotion ? 0 : MOTION_DURATION.normal;
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => sub.remove();
  }, []);

  return reduced;
}

// ─── Screen reader detection ──────────────────────────────────────────────────

/**
 * Hook: returns true when VoiceOver (iOS) or TalkBack (Android) is active.
 * Use to provide additional accessibility context or skip decorative animations.
 */
export function useScreenReader(): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setActive);
    const sub = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setActive,
    );
    return () => sub.remove();
  }, []);

  return active;
}

// ─── Semantic role helpers ────────────────────────────────────────────────────

/**
 * Standard accessibilityRole values used in MMDL components.
 * Import from here instead of using string literals.
 */
export const A11Y_ROLE = {
  button:    "button",
  link:      "link",
  header:    "header",
  tab:       "tab",
  tablist:   "tablist",
  image:     "image",
  text:      "text",
  none:      "none",
  menuitem:  "menuitem",
  checkbox:  "checkbox",
  radio:     "radio",
  switch_:   "switch",
  search:    "search",
  alert:     "alert",
  dialog:    "progressBar",
} as const satisfies Record<string, string>;

// ─── Focus management ─────────────────────────────────────────────────────────

export const A11Y_FOCUS = {
  /**
   * When a modal opens, focus must move to the first interactive element.
   * When it closes, focus must return to the trigger element.
   * Implement via AccessibilityInfo.setAccessibilityFocus(reactTag).
   */
  modalFocusManagement: true,

  /**
   * Tab order must follow visual order.
   * Use accessibilityViewIsModal={true} on modal root views.
   */
  modalViewIsModal: true,

  /**
   * Skip-navigation: provide an accessible "Skip to main content" mechanism
   * for keyboard/switch-access users on complex screens.
   */
  skipNavigation: Platform.OS === "web",
} as const;

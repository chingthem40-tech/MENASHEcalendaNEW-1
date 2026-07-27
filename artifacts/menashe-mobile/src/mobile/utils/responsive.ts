/**
 * SPR-M001 Phase 5 — Responsive Foundation
 *
 * Breakpoint system, safe-area helpers, and keyboard/inset utilities
 * for the Menashe Calendar mobile app.
 *
 * Uses react-native-safe-area-context (already installed).
 */

import { Dimensions, Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Breakpoints (dp widths) ─────────────────────────────────────────────────

export const BREAKPOINTS = {
  phone:       0,     // < 400dp — small phones (SE, Galaxy A)
  phoneLarge:  400,   // 400–599dp — standard phones (iPhone 14 Pro, Pixel 7)
  foldable:    600,   // 600–767dp — folded foldables, narrow tablets
  tablet:      768,   // 768–1023dp — tablets (iPad Mini, Galaxy Tab)
  tabletLarge: 1024,  // 1024dp+ — large tablets / desktop preview
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** Returns the current window width. Re-subscribe to Dimensions for live updates. */
export function getWindowWidth(): number {
  return Dimensions.get("window").width;
}

export function getWindowHeight(): number {
  return Dimensions.get("window").height;
}

/** Returns the current active breakpoint name. */
export function getBreakpoint(): Breakpoint {
  const w = getWindowWidth();
  if (w >= BREAKPOINTS.tabletLarge) return "tabletLarge";
  if (w >= BREAKPOINTS.tablet)      return "tablet";
  if (w >= BREAKPOINTS.foldable)    return "foldable";
  if (w >= BREAKPOINTS.phoneLarge)  return "phoneLarge";
  return "phone";
}

export function isLandscape(): boolean {
  const { width, height } = Dimensions.get("window");
  return width > height;
}

export function isTablet(): boolean {
  const bp = getBreakpoint();
  return bp === "tablet" || bp === "tabletLarge";
}

// ─── Responsive value selector ────────────────────────────────────────────────

type ResponsiveConfig<T> = Partial<Record<Breakpoint, T>> & { phone: T };

/**
 * Returns the value matching the current breakpoint, falling back to
 * the next smaller breakpoint if no exact match is found.
 *
 * Example:
 *   const cols = rv({ phone: 1, tablet: 2 });
 */
export function rv<T>(config: ResponsiveConfig<T>): T {
  const bp = getBreakpoint();
  const order: Breakpoint[] = ["tabletLarge", "tablet", "foldable", "phoneLarge", "phone"];
  const idx = order.indexOf(bp);
  for (let i = idx; i < order.length; i++) {
    const key = order[i];
    if (key && key in config) return config[key]!;
  }
  return config.phone;
}

// ─── Safe Area ────────────────────────────────────────────────────────────────

/**
 * Hook: returns safe-area insets augmented with device-specific adjustments.
 * Always use this instead of raw useSafeAreaInsets.
 */
export function useSafeInsets() {
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";
  const statusBarHeight = isAndroid ? (StatusBar.currentHeight ?? 0) : 0;

  return {
    top:    insets.top    + (isAndroid ? statusBarHeight : 0),
    bottom: insets.bottom,
    left:   insets.left,
    right:  insets.right,
    /** Minimum bottom padding so content clears the home indicator / nav bar. */
    safeBottom: Math.max(insets.bottom, 8),
  };
}

// ─── Content width helpers ────────────────────────────────────────────────────

/** Max content width — keeps text readable on large screens. */
export const MAX_CONTENT_WIDTH = 680;

/** Returns constrained content width for the current screen. */
export function getContentWidth(): number {
  return Math.min(getWindowWidth(), MAX_CONTENT_WIDTH);
}

// ─── Tab Bar height ───────────────────────────────────────────────────────────

/** Consistent tab bar height across platforms. */
export function getTabBarHeight(): number {
  return Platform.OS === "web" ? 68 : 64;
}

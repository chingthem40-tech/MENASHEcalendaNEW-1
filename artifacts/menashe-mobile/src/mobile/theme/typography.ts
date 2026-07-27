/**
 * SPR-M001 Phase 4 — Theme: Typography
 *
 * Font families, weights, sizes, and line heights for the mobile app.
 * Complements TEXT scale from constants/colors.ts.
 */

import { Platform } from "react-native";
import { TEXT } from "@/constants/colors";

export { TEXT };

// ─── Font Families ────────────────────────────────────────────────────────────
// Inter is loaded via @expo-google-fonts/inter in _layout.tsx on native only.
// On web we skip the font loader (avoids fontfaceobserver timeout) and use a
// CSS stack — browsers have Inter cached or fall back to system-ui gracefully.

const WEB_SANS = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const isWeb    = Platform.OS === "web";

export const FONT_FAMILY = {
  regular:    isWeb ? WEB_SANS : "Inter_400Regular",
  medium:     isWeb ? WEB_SANS : "Inter_500Medium",
  semiBold:   isWeb ? WEB_SANS : "Inter_600SemiBold",
  bold:       isWeb ? WEB_SANS : "Inter_700Bold",
  /** Fallback for Hebrew text — uses system default (generally supports Unicode). */
  hebrew:     undefined,
  /** System default — used as emergency fallback. */
  system:     undefined,
} as const;

export type FontFamily = keyof typeof FONT_FAMILY;

// ─── Line Heights ─────────────────────────────────────────────────────────────

export const LINE_HEIGHT = {
  tight:    1.2,
  snug:     1.35,
  normal:   1.5,
  relaxed:  1.65,
  loose:    2.0,
} as const;

// ─── Letter Spacing ───────────────────────────────────────────────────────────

export const TRACKING = {
  tighter: -0.5,
  tight:   -0.25,
  normal:   0,
  wide:     0.3,
  wider:    0.6,
  widest:   1.2,
} as const;

// ─── Pre-composed text style recipes ─────────────────────────────────────────

export const TYPE_STYLES = {
  /** Primary display — section headers */
  displayLg: {
    fontSize:       TEXT["3xl"],
    fontFamily:     FONT_FAMILY.bold,
    letterSpacing:  TRACKING.tight,
    lineHeight:     TEXT["3xl"] * LINE_HEIGHT.tight,
  },
  displayMd: {
    fontSize:       TEXT["2xl"],
    fontFamily:     FONT_FAMILY.bold,
    letterSpacing:  TRACKING.tight,
    lineHeight:     TEXT["2xl"] * LINE_HEIGHT.tight,
  },
  heading: {
    fontSize:       TEXT.xl,
    fontFamily:     FONT_FAMILY.semiBold,
    letterSpacing:  TRACKING.tight,
    lineHeight:     TEXT.xl * LINE_HEIGHT.snug,
  },
  subheading: {
    fontSize:       TEXT.lg,
    fontFamily:     FONT_FAMILY.medium,
    letterSpacing:  TRACKING.normal,
    lineHeight:     TEXT.lg * LINE_HEIGHT.snug,
  },
  body: {
    fontSize:       TEXT.base,
    fontFamily:     FONT_FAMILY.regular,
    letterSpacing:  TRACKING.normal,
    lineHeight:     TEXT.base * LINE_HEIGHT.normal,
  },
  bodyMd: {
    fontSize:       TEXT.md,
    fontFamily:     FONT_FAMILY.regular,
    letterSpacing:  TRACKING.normal,
    lineHeight:     TEXT.md * LINE_HEIGHT.normal,
  },
  label: {
    fontSize:       TEXT.sm,
    fontFamily:     FONT_FAMILY.medium,
    letterSpacing:  TRACKING.wide,
    lineHeight:     TEXT.sm * LINE_HEIGHT.snug,
  },
  caption: {
    fontSize:       TEXT.xs,
    fontFamily:     FONT_FAMILY.regular,
    letterSpacing:  TRACKING.normal,
    lineHeight:     TEXT.xs * LINE_HEIGHT.normal,
  },
  tabLabel: {
    fontSize:       10,
    fontFamily:     FONT_FAMILY.semiBold,
    letterSpacing:  TRACKING.wide,
    lineHeight:     10 * LINE_HEIGHT.snug,
  },
} as const;

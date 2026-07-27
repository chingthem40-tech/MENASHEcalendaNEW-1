/**
 * SPR-M001 Phase 4 — Theme: Colors
 *
 * Re-exports the canonical mobile palette from constants/colors.ts and
 * extends it with Glass and Sanctuary-specific tokens.
 * The web app uses its own theme — this file is mobile-only.
 */

import baseColors, { SPACE, TEXT, RADIUS, type ThemeKey } from "@/constants/colors";

export { SPACE, TEXT, RADIUS };
export type { ThemeKey };

// ─── Glass Tokens ─────────────────────────────────────────────────────────────
// Used for frosted-glass UI surfaces (BlurView overlays, bottom tabs on iOS).

export const GLASS = {
  dark: {
    background:    "rgba(8, 14, 26, 0.75)",
    border:        "rgba(212, 168, 67, 0.15)",
    highlight:     "rgba(212, 168, 67, 0.08)",
    blur:          90,
    tint:          "dark" as const,
  },
  light: {
    background:    "rgba(245, 239, 224, 0.80)",
    border:        "rgba(139, 105, 20, 0.20)",
    highlight:     "rgba(139, 105, 20, 0.06)",
    blur:          80,
    tint:          "light" as const,
  },
  sapphire: {
    background:    "rgba(6, 14, 30, 0.78)",
    border:        "rgba(99, 130, 255, 0.18)",
    highlight:     "rgba(99, 130, 255, 0.08)",
    blur:          90,
    tint:          "dark" as const,
  },
} satisfies Record<ThemeKey, {
  background: string;
  border: string;
  highlight: string;
  blur: number;
  tint: "dark" | "light";
}>;

// ─── Elevation (Android shadow) ───────────────────────────────────────────────

export const ELEVATION = {
  none:   0,
  sm:     2,
  md:     4,
  lg:     8,
  xl:     16,
  modal:  24,
} as const;

export type ElevationKey = keyof typeof ELEVATION;

// ─── Re-export base palettes ──────────────────────────────────────────────────

export const PALETTES = baseColors;

export type ColorPalette = typeof baseColors.dark;

/** Returns the full color palette for a given theme key. */
export function getPalette(theme: ThemeKey): ColorPalette {
  return (baseColors as Record<ThemeKey, ColorPalette>)[theme] ?? baseColors.dark;
}

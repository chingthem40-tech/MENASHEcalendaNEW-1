/**
 * MMDL — Glass System
 * SPR-M002 | Menashe Mobile Design Language
 *
 * Six glass variants for frosted/translucent surfaces.
 * Each token is a StyleSheet-ready object.
 * Use with expo-blur's <BlurView> on iOS; fallback to solid color on Android.
 *
 * Usage:
 *   import { GLASS_SPEC } from "@/src/mobile/design-system";
 *   const glass = GLASS_SPEC.navigation.dark;
 *
 * Rendering pattern:
 *   {Platform.OS === "ios"
 *     ? <BlurView intensity={glass.blur} tint={glass.tint} style={glass.style} />
 *     : <View style={{ backgroundColor: glass.solidFallback }} />
 *   }
 */

import type { ThemeKey } from "@/constants/colors";

interface GlassVariant {
  /** Background color (semi-transparent) for the glass layer */
  background:    string;
  /** Border color for the glass edge */
  border:        string;
  /** Inner highlight / sheen color */
  highlight:     string;
  /** BlurView intensity (0–100) */
  blur:          number;
  /** BlurView tint */
  tint:          "dark" | "light" | "default";
  /** Solid fallback for Android or web */
  solidFallback: string;
  /** Border width for glass edges */
  borderWidth:   number;
}

type GlassTheme = Record<ThemeKey, GlassVariant>;

// ─── 1. Light Glass — general content surfaces ────────────────────────────────

export const GLASS_LIGHT: GlassTheme = {
  dark: {
    background:    "rgba(17, 24, 39, 0.65)",
    border:        "rgba(255,255,255,0.08)",
    highlight:     "rgba(255,255,255,0.04)",
    blur:          60,
    tint:          "dark",
    solidFallback: "#111827",
    borderWidth:   1,
  },
  light: {
    background:    "rgba(245, 239, 224, 0.70)",
    border:        "rgba(255,255,255,0.60)",
    highlight:     "rgba(255,255,255,0.40)",
    blur:          50,
    tint:          "light",
    solidFallback: "#ede4d3",
    borderWidth:   1,
  },
  sapphire: {
    background:    "rgba(12, 24, 48, 0.65)",
    border:        "rgba(99,130,255,0.12)",
    highlight:     "rgba(99,130,255,0.05)",
    blur:          60,
    tint:          "dark",
    solidFallback: "#0c1830",
    borderWidth:   1,
  },
};

// ─── 2. Dark Glass — overlays and deep surfaces ───────────────────────────────

export const GLASS_DARK: GlassTheme = {
  dark: {
    background:    "rgba(5, 8, 16, 0.82)",
    border:        "rgba(212,168,67,0.15)",
    highlight:     "rgba(212,168,67,0.06)",
    blur:          80,
    tint:          "dark",
    solidFallback: "#080e1a",
    borderWidth:   1,
  },
  light: {
    background:    "rgba(15, 24, 41, 0.75)",
    border:        "rgba(139,105,20,0.20)",
    highlight:     "rgba(139,105,20,0.08)",
    blur:          80,
    tint:          "dark",
    solidFallback: "#1e1a14",
    borderWidth:   1,
  },
  sapphire: {
    background:    "rgba(4, 10, 24, 0.84)",
    border:        "rgba(99,130,255,0.18)",
    highlight:     "rgba(99,130,255,0.07)",
    blur:          90,
    tint:          "dark",
    solidFallback: "#060e1e",
    borderWidth:   1,
  },
};

// ─── 3. Navigation Glass — bottom tab bar ─────────────────────────────────────

export const GLASS_NAVIGATION: GlassTheme = {
  dark: {
    background:    "rgba(8, 14, 26, 0.88)",
    border:        "rgba(30, 45, 74, 0.80)",
    highlight:     "rgba(212,168,67,0.05)",
    blur:          90,
    tint:          "dark",
    solidFallback: "#111827",
    borderWidth:   0.5,
  },
  light: {
    background:    "rgba(245, 239, 224, 0.90)",
    border:        "rgba(212, 201, 176, 0.60)",
    highlight:     "rgba(255,255,255,0.50)",
    blur:          80,
    tint:          "light",
    solidFallback: "#ede4d3",
    borderWidth:   0.5,
  },
  sapphire: {
    background:    "rgba(6, 14, 30, 0.92)",
    border:        "rgba(26, 46, 88, 0.80)",
    highlight:     "rgba(99,130,255,0.05)",
    blur:          90,
    tint:          "dark",
    solidFallback: "#0c1830",
    borderWidth:   0.5,
  },
};

// ─── 4. Header Glass — screen headers ────────────────────────────────────────

export const GLASS_HEADER: GlassTheme = {
  dark: {
    background:    "rgba(8, 14, 26, 0.80)",
    border:        "rgba(30, 45, 74, 0.60)",
    highlight:     "rgba(212,168,67,0.04)",
    blur:          70,
    tint:          "dark",
    solidFallback: "#111827",
    borderWidth:   0.5,
  },
  light: {
    background:    "rgba(245, 239, 224, 0.85)",
    border:        "rgba(212, 201, 176, 0.50)",
    highlight:     "rgba(255,255,255,0.45)",
    blur:          65,
    tint:          "light",
    solidFallback: "#ede4d3",
    borderWidth:   0.5,
  },
  sapphire: {
    background:    "rgba(6, 14, 30, 0.85)",
    border:        "rgba(26, 46, 88, 0.60)",
    highlight:     "rgba(99,130,255,0.04)",
    blur:          70,
    tint:          "dark",
    solidFallback: "#0c1830",
    borderWidth:   0.5,
  },
};

// ─── 5. Card Glass — premium card surfaces ────────────────────────────────────

export const GLASS_CARD: GlassTheme = {
  dark: {
    background:    "rgba(17, 24, 39, 0.70)",
    border:        "rgba(212,168,67,0.12)",
    highlight:     "rgba(212,168,67,0.05)",
    blur:          40,
    tint:          "dark",
    solidFallback: "#111827",
    borderWidth:   1,
  },
  light: {
    background:    "rgba(237, 228, 211, 0.75)",
    border:        "rgba(212, 201, 176, 0.60)",
    highlight:     "rgba(255,255,255,0.50)",
    blur:          30,
    tint:          "light",
    solidFallback: "#ede4d3",
    borderWidth:   1,
  },
  sapphire: {
    background:    "rgba(12, 24, 48, 0.72)",
    border:        "rgba(99,130,255,0.14)",
    highlight:     "rgba(99,130,255,0.05)",
    blur:          40,
    tint:          "dark",
    solidFallback: "#0c1830",
    borderWidth:   1,
  },
};

// ─── 6. Overlay Glass — modal backdrops ───────────────────────────────────────

export const GLASS_OVERLAY: GlassTheme = {
  dark: {
    background:    "rgba(0, 0, 0, 0.70)",
    border:        "transparent",
    highlight:     "transparent",
    blur:          10,
    tint:          "dark",
    solidFallback: "rgba(0,0,0,0.70)",
    borderWidth:   0,
  },
  light: {
    background:    "rgba(15, 24, 41, 0.55)",
    border:        "transparent",
    highlight:     "transparent",
    blur:          8,
    tint:          "dark",
    solidFallback: "rgba(15,24,41,0.55)",
    borderWidth:   0,
  },
  sapphire: {
    background:    "rgba(0, 0, 0, 0.75)",
    border:        "transparent",
    highlight:     "transparent",
    blur:          10,
    tint:          "dark",
    solidFallback: "rgba(0,0,0,0.75)",
    borderWidth:   0,
  },
};

// ─── Named export map ─────────────────────────────────────────────────────────

export const GLASS_SPEC = {
  light:      GLASS_LIGHT,
  dark:       GLASS_DARK,
  navigation: GLASS_NAVIGATION,
  header:     GLASS_HEADER,
  card:       GLASS_CARD,
  overlay:    GLASS_OVERLAY,
} as const;

export type GlassVariantName = keyof typeof GLASS_SPEC;

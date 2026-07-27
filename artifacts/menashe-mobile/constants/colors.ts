/* ═══════════════════════════════════════════════════════════════════════════
   MENASHE CALENDAR — Mobile Design Tokens
   Canonical source of truth for the React Native / Expo frontend.
   The web app uses artifacts/menashe-calendar/src/lib/theme.ts.

   GOLD: #d4a843 (warm amber — primary brand gold, consistent with web)
   ════════════════════════════════════════════════════════════════════════════ */

const colors = {
  light: {
    text: "#0F1829",
    tint: "#8B6914",
    background: "#F5EFE0",
    foreground: "#1e1a14",
    card: "#EDE4D3",
    cardForeground: "#1e1a14",
    primary: "#8B6914",
    primaryForeground: "#ffffff",
    secondary: "#E2D9C8",
    secondaryForeground: "#1e1a14",
    muted: "#D4C9B0",
    mutedForeground: "#7a6a58",
    accent: "#8B6914",
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#D4C9B0",
    input: "#EDE4D3",
    success: "#166534",
  },
  dark: {
    text: "#f8fafc",
    tint: "#d4a843",
    background: "#080e1a",
    foreground: "#f8fafc",
    card: "#111827",
    cardForeground: "#f8fafc",
    primary: "#d4a843",
    primaryForeground: "#1a0f00",
    secondary: "#1a2540",
    secondaryForeground: "#f8fafc",
    muted: "#1e2d4a",
    mutedForeground: "#64748b",
    accent: "#d4a843",
    accentForeground: "#1a0f00",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#1e2d4a",
    input: "#1a2540",
    success: "#22c55e",
  },
  sapphire: {
    text: "#e8f0ff",
    tint: "#6382FF",
    background: "#060e1e",
    foreground: "#e8f0ff",
    card: "#0c1830",
    cardForeground: "#e8f0ff",
    primary: "#6382FF",
    primaryForeground: "#ffffff",
    secondary: "#111f3c",
    secondaryForeground: "#e8f0ff",
    muted: "#1a2e58",
    mutedForeground: "#4a6090",
    accent: "#6382FF",
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#1a2e58",
    input: "#111f3c",
    success: "#22c55e",
  },
  radius: 12,
};

/* ── Spacing Scale (React Native dp) ─────────────────────────────────────── */
export const SPACE = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
} as const;

/* ── Typography Scale ────────────────────────────────────────────────────── */
export const TEXT = {
  xs:   10,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   22,
  "2xl": 26,
  "3xl": 32,
} as const;

/* ── Border Radii ────────────────────────────────────────────────────────── */
export const RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  full: 9999,
} as const;

export type ThemeKey = "dark" | "light" | "sapphire";

export default colors;

/**
 * MMDL — Semantic Color Tokens
 * SPR-M002 | Menashe Mobile Design Language
 *
 * Three themes: dark (default), light (parchment), sapphire (blue-night).
 * All screen components MUST consume tokens from this file.
 * Never reference raw hex values directly in components.
 *
 * Philosophy: calm · spiritual · premium · timeless · never busy
 */

import type { ThemeKey } from "@/constants/colors";

// ─── Raw palette (referenced ONLY within this file) ───────────────────────────

const RAW = {
  // Warm neutrals
  parchment:    "#F5EFE0",
  warmCream:    "#EDE4D3",
  ivory:        "#E2D9C8",
  stone:        "#D4C9B0",
  stoneDeep:    "#7a6a58",

  // Navy & charcoal
  deepNavy:     "#080e1a",
  navyMid:      "#111827",
  navyLight:    "#1a2540",
  navyMuted:    "#1e2d4a",
  charcoal:     "#0F1829",

  // Sapphire
  sapphireDeep: "#060e1e",
  sapphireMid:  "#0c1830",
  sapphireFull: "#111f3c",
  sapphireMute: "#1a2e58",
  sapphireBlue: "#6382FF",
  sapphireDim:  "#4a6090",
  sapphireText: "#e8f0ff",

  // Gold
  goldWarm:     "#d4a843",  // dark/sapphire primary — GOLD in memory
  goldDeep:     "#8B6914",  // light primary
  goldOnDark:   "#1a0f00",  // text on gold buttons

  // Semantic
  white:        "#ffffff",
  offWhite:     "#f8fafc",
  red:          "#ef4444",
  green:        "#22c55e",
  greenDark:    "#166534",
  amber:        "#f59e0b",
  blue:         "#3b82f6",

  // Olive accent
  oliveLight:   "#4a5e2a",
  oliveDark:    "#a3b56a",

  // Transparent
  transparent:  "transparent",
} as const;

// ─── Semantic token shape ─────────────────────────────────────────────────────

export interface ColorTokens {
  // Backgrounds
  background:        string;
  backgroundSubtle:  string;
  surface:           string;
  surfaceRaised:     string;

  // Cards
  card:              string;
  cardHover:         string;
  cardBorder:        string;

  // Borders & Dividers
  border:            string;
  borderStrong:      string;
  divider:           string;

  // Primary (Gold / Brand)
  primary:           string;
  primaryForeground: string;
  primaryMuted:      string;

  // Secondary
  secondary:         string;
  secondaryForeground: string;

  // Accents
  accentGold:        string;
  accentGoldMuted:   string;
  accentOlive:       string;
  accentOliveMuted:  string;
  accentStone:       string;

  // Text
  textPrimary:       string;
  textSecondary:     string;
  textMuted:         string;
  textDisabled:      string;
  textInverse:       string;
  textOnPrimary:     string;

  // Semantic states
  success:           string;
  successMuted:      string;
  warning:           string;
  warningMuted:      string;
  error:             string;
  errorMuted:        string;
  info:              string;
  infoMuted:         string;

  // Interactive
  interactive:       string;
  interactiveHover:  string;
  interactiveActive: string;
  disabled:          string;
  disabledForeground: string;

  // Overlay & Glass
  overlay:           string;
  overlayStrong:     string;
  glassBg:           string;
  glassBorder:       string;

  // Shadows
  shadow:            string;
  shadowStrong:      string;

  // Input
  input:             string;
  inputBorder:       string;
  inputFocusBorder:  string;

  // Tab bar
  tabActive:         string;
  tabInactive:       string;
  tabBackground:     string;

  // ── Backward-compatible aliases (match constants/colors.ts palette shape) ──
  // Many screen components use these names from the older palette API.
  foreground:        string;  // alias → textPrimary
  mutedForeground:   string;  // alias → textSecondary
  muted:             string;  // alias → surface

  // ── Extended surface / border / text aliases used by newer screens ──────────
  surfacePrimary:    string;  // alias → surface
  surfaceTertiary:   string;  // alias → surfaceRaised
  surfaceInteractive: string; // alias → card (pressable surfaces)
  backgroundElevated: string; // alias → backgroundSubtle
  backgroundOverlay:  string; // alias → overlay
  borderDefault:     string;  // alias → border
  borderSoft:        string;  // alias → divider
  textHigh:          string;  // alias → textPrimary
}

// ─── Theme definitions ────────────────────────────────────────────────────────

const DARK_TOKENS: ColorTokens = {
  background:          RAW.deepNavy,
  backgroundSubtle:    "#0a1020",
  surface:             "#141e32",
  surfaceRaised:       "#1a2745",

  card:                "#14203a",
  cardHover:           "#1c2d4e",
  cardBorder:          "#253558",

  border:              "#243050",
  borderStrong:        "#2e4070",
  divider:             "rgba(36, 48, 80, 0.7)",

  primary:             RAW.goldWarm,
  primaryForeground:   RAW.goldOnDark,
  primaryMuted:        "rgba(212, 168, 67, 0.15)",

  secondary:           RAW.navyLight,
  secondaryForeground: RAW.offWhite,

  accentGold:          RAW.goldWarm,
  accentGoldMuted:     "rgba(212, 168, 67, 0.12)",
  accentOlive:         RAW.oliveDark,
  accentOliveMuted:    "rgba(163, 181, 106, 0.12)",
  accentStone:         "#64748b",

  textPrimary:         RAW.offWhite,
  textSecondary:       "#a8b8cc",
  textMuted:           "#7a8fa8",
  textDisabled:        "#3a4a62",
  textInverse:         RAW.deepNavy,
  textOnPrimary:       RAW.goldOnDark,

  success:             RAW.green,
  successMuted:        "rgba(34, 197, 94, 0.12)",
  warning:             RAW.amber,
  warningMuted:        "rgba(245, 158, 11, 0.12)",
  error:               RAW.red,
  errorMuted:          "rgba(239, 68, 68, 0.12)",
  info:                RAW.blue,
  infoMuted:           "rgba(59, 130, 246, 0.12)",

  interactive:         RAW.goldWarm,
  interactiveHover:    "#e0b850",
  interactiveActive:   "#b88e38",
  disabled:            RAW.navyMuted,
  disabledForeground:  "#3a4a62",

  overlay:             "rgba(0, 0, 0, 0.55)",
  overlayStrong:       "rgba(0, 0, 0, 0.80)",
  glassBg:             "rgba(8, 14, 26, 0.75)",
  glassBorder:         "rgba(212, 168, 67, 0.15)",

  shadow:              "rgba(0, 0, 0, 0.35)",
  shadowStrong:        "rgba(0, 0, 0, 0.60)",

  input:               "#1a2745",
  inputBorder:         "#243050",
  inputFocusBorder:    RAW.goldWarm,

  tabActive:           RAW.goldWarm,
  tabInactive:         "#7a8fa8",
  tabBackground:       "#14203a",

  // Backward-compatible aliases
  foreground:          RAW.offWhite,
  mutedForeground:     "#a8b8cc",
  muted:               "#141e32",

  // Extended aliases
  surfacePrimary:      "#141e32",
  surfaceTertiary:     "#1a2745",
  surfaceInteractive:  "#14203a",
  backgroundElevated:  "#0a1020",
  backgroundOverlay:   "rgba(0, 0, 0, 0.55)",
  borderDefault:       "#243050",
  borderSoft:          "rgba(36, 48, 80, 0.7)",
  textHigh:            RAW.offWhite,
};

const LIGHT_TOKENS: ColorTokens = {
  background:          RAW.parchment,
  backgroundSubtle:    "#faf6ee",
  surface:             RAW.warmCream,
  surfaceRaised:       "#f0e8d5",

  card:                RAW.warmCream,
  cardHover:           "#e6dcca",
  cardBorder:          RAW.stone,

  border:              RAW.stone,
  borderStrong:        "#bfb4a0",
  divider:             "rgba(212, 201, 176, 0.6)",

  primary:             RAW.goldDeep,
  primaryForeground:   RAW.white,
  primaryMuted:        "rgba(139, 105, 20, 0.10)",

  secondary:           RAW.ivory,
  secondaryForeground: "#1e1a14",

  accentGold:          RAW.goldDeep,
  accentGoldMuted:     "rgba(139, 105, 20, 0.08)",
  accentOlive:         RAW.oliveLight,
  accentOliveMuted:    "rgba(74, 94, 42, 0.08)",
  accentStone:         RAW.stoneDeep,

  textPrimary:         RAW.charcoal,
  textSecondary:       "#3d3228",
  textMuted:           RAW.stoneDeep,
  textDisabled:        "#b5a896",
  textInverse:         RAW.white,
  textOnPrimary:       RAW.white,

  success:             RAW.greenDark,
  successMuted:        "rgba(22, 101, 52, 0.08)",
  warning:             "#92400e",
  warningMuted:        "rgba(146, 64, 14, 0.08)",
  error:               "#b91c1c",
  errorMuted:          "rgba(185, 28, 28, 0.08)",
  info:                "#1e40af",
  infoMuted:           "rgba(30, 64, 175, 0.08)",

  interactive:         RAW.goldDeep,
  interactiveHover:    "#a07820",
  interactiveActive:   "#6b5010",
  disabled:            RAW.stone,
  disabledForeground:  "#b5a896",

  overlay:             "rgba(15, 24, 41, 0.45)",
  overlayStrong:       "rgba(15, 24, 41, 0.72)",
  glassBg:             "rgba(245, 239, 224, 0.82)",
  glassBorder:         "rgba(139, 105, 20, 0.20)",

  shadow:              "rgba(15, 24, 41, 0.12)",
  shadowStrong:        "rgba(15, 24, 41, 0.28)",

  input:               RAW.warmCream,
  inputBorder:         RAW.stone,
  inputFocusBorder:    RAW.goldDeep,

  tabActive:           RAW.goldDeep,
  tabInactive:         RAW.stoneDeep,
  tabBackground:       RAW.warmCream,

  // Backward-compatible aliases
  foreground:          RAW.charcoal,
  mutedForeground:     RAW.stoneDeep,
  muted:               RAW.ivory,

  // Extended aliases
  surfacePrimary:      RAW.warmCream,
  surfaceTertiary:     "#f0e8d5",
  surfaceInteractive:  RAW.warmCream,
  backgroundElevated:  "#faf6ee",
  backgroundOverlay:   "rgba(15, 24, 41, 0.45)",
  borderDefault:       RAW.stone,
  borderSoft:          "rgba(212, 201, 176, 0.6)",
  textHigh:            RAW.charcoal,
};

const SAPPHIRE_TOKENS: ColorTokens = {
  background:          RAW.sapphireDeep,
  backgroundSubtle:    "#040c1a",
  surface:             RAW.sapphireMid,
  surfaceRaised:       "#101e38",

  card:                RAW.sapphireMid,
  cardHover:           "#142040",
  cardBorder:          RAW.sapphireMute,

  border:              RAW.sapphireMute,
  borderStrong:        "#223660",
  divider:             "rgba(26, 46, 88, 0.6)",

  primary:             RAW.sapphireBlue,
  primaryForeground:   RAW.white,
  primaryMuted:        "rgba(99, 130, 255, 0.15)",

  secondary:           RAW.sapphireFull,
  secondaryForeground: RAW.sapphireText,

  accentGold:          RAW.goldWarm,
  accentGoldMuted:     "rgba(212, 168, 67, 0.12)",
  accentOlive:         RAW.oliveDark,
  accentOliveMuted:    "rgba(163, 181, 106, 0.10)",
  accentStone:         RAW.sapphireDim,

  textPrimary:         RAW.sapphireText,
  textSecondary:       "#a0b4d8",
  textMuted:           RAW.sapphireDim,
  textDisabled:        "#283a58",
  textInverse:         RAW.sapphireDeep,
  textOnPrimary:       RAW.white,

  success:             RAW.green,
  successMuted:        "rgba(34, 197, 94, 0.12)",
  warning:             RAW.amber,
  warningMuted:        "rgba(245, 158, 11, 0.12)",
  error:               RAW.red,
  errorMuted:          "rgba(239, 68, 68, 0.12)",
  info:                "#60a5fa",
  infoMuted:           "rgba(96, 165, 250, 0.12)",

  interactive:         RAW.sapphireBlue,
  interactiveHover:    "#7a96ff",
  interactiveActive:   "#4d68e0",
  disabled:            RAW.sapphireMute,
  disabledForeground:  "#283a58",

  overlay:             "rgba(0, 0, 0, 0.60)",
  overlayStrong:       "rgba(0, 0, 0, 0.82)",
  glassBg:             "rgba(6, 14, 30, 0.78)",
  glassBorder:         "rgba(99, 130, 255, 0.18)",

  shadow:              "rgba(0, 0, 0, 0.40)",
  shadowStrong:        "rgba(0, 0, 0, 0.65)",

  input:               RAW.sapphireFull,
  inputBorder:         RAW.sapphireMute,
  inputFocusBorder:    RAW.sapphireBlue,

  tabActive:           RAW.sapphireBlue,
  tabInactive:         RAW.sapphireDim,
  tabBackground:       RAW.sapphireMid,

  // Backward-compatible aliases
  foreground:          RAW.sapphireText,
  mutedForeground:     "#a0b4d8",
  muted:               RAW.sapphireFull,

  // Extended aliases
  surfacePrimary:      RAW.sapphireMid,
  surfaceTertiary:     "#101e38",
  surfaceInteractive:  RAW.sapphireMid,
  backgroundElevated:  "#040c1a",
  backgroundOverlay:   "rgba(0, 0, 0, 0.60)",
  borderDefault:       RAW.sapphireMute,
  borderSoft:          "rgba(26, 46, 88, 0.6)",
  textHigh:            RAW.sapphireText,
};

// ─── Theme map ────────────────────────────────────────────────────────────────

export const COLOR_TOKENS: Record<ThemeKey, ColorTokens> = {
  dark:     DARK_TOKENS,
  light:    LIGHT_TOKENS,
  sapphire: SAPPHIRE_TOKENS,
};

/** Returns the full semantic color token set for a given theme. */
export function getColorTokens(theme: ThemeKey): ColorTokens {
  return COLOR_TOKENS[theme];
}

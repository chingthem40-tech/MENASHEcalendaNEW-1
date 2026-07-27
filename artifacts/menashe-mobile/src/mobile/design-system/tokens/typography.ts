/**
 * MMDL — Typography Scale
 * SPR-M002 | Menashe Mobile Design Language
 *
 * Full type scale from DisplayXL down to Overline.
 * Built on Inter (loaded in _layout.tsx).
 * Hebrew text uses system font fallback.
 *
 * Usage:
 *   import { TYPE } from "@/src/mobile/design-system";
 *   <Text style={TYPE.heading}>...</Text>
 */

import { PixelRatio, Platform } from "react-native";

// ─── Font families ────────────────────────────────────────────────────────────

// On web the Expo Google Fonts package is skipped (to avoid fontfaceobserver
// timeouts), so use a CSS font stack that includes Inter for browsers.
const WEB_SANS = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const FONT = {
  thin:       Platform.OS === "web" ? WEB_SANS : "Inter_300Light",
  regular:    Platform.OS === "web" ? WEB_SANS : "Inter_400Regular",
  medium:     Platform.OS === "web" ? WEB_SANS : "Inter_500Medium",
  semiBold:   Platform.OS === "web" ? WEB_SANS : "Inter_600SemiBold",
  bold:       Platform.OS === "web" ? WEB_SANS : "Inter_700Bold",
  extraBold:  Platform.OS === "web" ? WEB_SANS : "Inter_800ExtraBold",
  /** System default — Hebrew, Aramaic, fallback. */
  system:     Platform.select({ ios: "System", android: "sans-serif", default: WEB_SANS }),
} as const;

export type FontKey = keyof typeof FONT;

// ─── Raw size scale (dp) ──────────────────────────────────────────────────────

export const FONT_SIZE = {
  "2xs":  9,
  xs:     11,
  sm:     13,
  base:   15,
  md:     17,
  lg:     19,
  xl:     22,
  "2xl":  26,
  "3xl":  30,
  "4xl":  36,
  "5xl":  44,
  "6xl":  52,
} as const;

// ─── Line height multipliers ───────────────────────────────────────────────────

const LH = {
  tightest: 1.1,
  tight:    1.2,
  snug:     1.35,
  normal:   1.5,
  relaxed:  1.65,
  loose:    1.8,
} as const;

// ─── Letter spacing ───────────────────────────────────────────────────────────

export const FONT_TRACKING = {
  tightest: -1.0,
  tighter:  -0.5,
  tight:    -0.25,
  normal:    0,
  wide:      0.3,
  wider:     0.6,
  widest:    1.2,
  caps:      2.0,
} as const;

// ─── Accessibility: font scale cap ───────────────────────────────────────────
// Prevents extreme system font scales from breaking layout.
// Screens should set allowFontScaling={false} on decorative text only.

export const MAX_FONT_SCALE   = 1.4;
export const MIN_FONT_SCALE   = 0.85;

function scaled(size: number): number {
  const scale = Math.min(Math.max(PixelRatio.getFontScale(), MIN_FONT_SCALE), MAX_FONT_SCALE);
  return Math.round(size * scale);
}

// ─── Type step factory ────────────────────────────────────────────────────────

interface TypeStep {
  fontSize:       number;
  fontFamily:     string;
  fontWeight:     "300" | "400" | "500" | "600" | "700" | "800";
  letterSpacing:  number;
  lineHeight:     number;
}

function step(
  size:    number,
  family:  string,
  weight:  TypeStep["fontWeight"],
  tracking: number,
  lhRatio: number,
): TypeStep {
  return {
    fontSize:      size,
    fontFamily:    family,
    fontWeight:    weight,
    letterSpacing: tracking,
    lineHeight:    Math.round(size * lhRatio),
  };
}

// ─── Complete MMDL type scale ──────────────────────────────────────────────────

export const TYPE = {
  /** Largest display text — hero headers, splash screens */
  displayXL: step(FONT_SIZE["5xl"], FONT.bold,     "700", FONT_TRACKING.tighter,  LH.tightest),

  /** Display — section heroes, feature intros */
  display:   step(FONT_SIZE["4xl"], FONT.bold,     "700", FONT_TRACKING.tighter,  LH.tight),

  /** Heading — page titles, modal headers */
  heading:   step(FONT_SIZE["3xl"], FONT.bold,     "700", FONT_TRACKING.tight,    LH.tight),

  /** Title — card titles, section headers */
  title:     step(FONT_SIZE["2xl"], FONT.semiBold, "600", FONT_TRACKING.tight,    LH.snug),

  /** Subtitle — sub-sections, list group headers */
  subtitle:  step(FONT_SIZE.xl,    FONT.semiBold, "600", FONT_TRACKING.normal,   LH.snug),

  /** Body Large — lead paragraphs, prominent descriptions */
  bodyLg:    step(FONT_SIZE.lg,    FONT.regular,  "400", FONT_TRACKING.normal,   LH.relaxed),

  /** Body — standard reading text */
  body:      step(FONT_SIZE.base,  FONT.regular,  "400", FONT_TRACKING.normal,   LH.normal),

  /** Body Small — secondary descriptions, list subtitles */
  bodySm:    step(FONT_SIZE.sm,    FONT.regular,  "400", FONT_TRACKING.normal,   LH.normal),

  /** Caption — metadata, timestamps, helper text */
  caption:   step(FONT_SIZE.xs,    FONT.regular,  "400", FONT_TRACKING.normal,   LH.snug),

  /** Label — form labels, button text, chips */
  label:     step(FONT_SIZE.sm,    FONT.medium,   "500", FONT_TRACKING.wide,     LH.snug),

  /** Overline — category labels, section eyebrows */
  overline:  step(FONT_SIZE["2xs"],FONT.semiBold, "600", FONT_TRACKING.caps,     LH.snug),

  /** Tab label — bottom navigation */
  tabLabel:  step(10,              FONT.semiBold, "600", FONT_TRACKING.wide,     LH.snug),

  /** Hebrew display — special Hebrew text headers */
  hebrewLg:  {
    fontSize:      FONT_SIZE.xl,
    fontFamily:    FONT.system,
    fontWeight:    "700" as const,
    letterSpacing: FONT_TRACKING.normal,
    lineHeight:    Math.round(FONT_SIZE.xl * LH.relaxed),
  },

  /** Hebrew body — inline Hebrew text */
  hebrewBody: {
    fontSize:      FONT_SIZE.md,
    fontFamily:    FONT.system,
    fontWeight:    "400" as const,
    letterSpacing: FONT_TRACKING.normal,
    lineHeight:    Math.round(FONT_SIZE.md * LH.relaxed),
  },
} as const;

export type TypeKey = keyof typeof TYPE;

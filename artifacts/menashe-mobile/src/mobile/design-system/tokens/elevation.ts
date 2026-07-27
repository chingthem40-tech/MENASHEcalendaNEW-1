/**
 * MMDL — Elevation & Shadow System
 * SPR-M002 | Menashe Mobile Design Language
 *
 * iOS uses shadowColor + shadowOffset + shadowOpacity + shadowRadius.
 * Android uses the `elevation` prop.
 * This file provides both in a single token.
 *
 * Usage:
 *   import { SHADOW } from "@/src/mobile/design-system";
 *   <View style={SHADOW.level2} />
 */

import { Platform } from "react-native";

interface ShadowToken {
  // iOS
  shadowColor:   string;
  shadowOffset:  { width: number; height: number };
  shadowOpacity: number;
  shadowRadius:  number;
  // Android
  elevation:     number;
}

function shadow(
  color:    string,
  offsetY:  number,
  opacity:  number,
  radius:   number,
  android:  number,
): ShadowToken {
  return {
    shadowColor:   color,
    shadowOffset:  { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius:  radius,
    elevation:     android,
  };
}

const BASE_SHADOW = "#000000";

// ─── Elevation levels ─────────────────────────────────────────────────────────

export const SHADOW = {
  /** Level 0 — no elevation, flat surface */
  none: shadow(BASE_SHADOW, 0, 0, 0, 0),

  /** Level 1 — subtle lift: list items, inline cards */
  level1: shadow(BASE_SHADOW, 1, 0.08, 2, 2),

  /** Level 2 — standard card elevation */
  level2: shadow(BASE_SHADOW, 2, 0.12, 4, 4),

  /** Level 3 — raised card, action sheet handle */
  level3: shadow(BASE_SHADOW, 4, 0.16, 8, 8),

  /** Floating — FABs, popovers, tooltips */
  floating: shadow(BASE_SHADOW, 6, 0.20, 12, 12),

  /** Modal — dialogs, bottom sheets */
  modal: shadow(BASE_SHADOW, 12, 0.28, 20, 20),

  /** Overlay — full-screen overlays */
  overlay: shadow(BASE_SHADOW, 20, 0.40, 32, 24),
} as const;

export type ShadowKey = keyof typeof SHADOW;

// ─── Blur values (for BlurView / glassmorphism) ───────────────────────────────

export const BLUR = {
  none:   0,
  sm:     10,
  md:     20,
  lg:     40,
  xl:     60,
  glass:  80,
  heavy:  100,
} as const;

export type BlurKey = keyof typeof BLUR;

// ─── Platform-safe shadow helper ──────────────────────────────────────────────
// On Android, only `elevation` is honoured; shadow* props are ignored.
// This helper strips iOS-only props on Android to avoid lint noise.

export function platformShadow(key: ShadowKey): Partial<ShadowToken> {
  if (Platform.OS === "android") {
    return { elevation: SHADOW[key].elevation };
  }
  const { elevation: _elev, ...iosShadow } = SHADOW[key];
  return iosShadow;
}

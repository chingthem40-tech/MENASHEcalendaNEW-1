/**
 * SPR-M001 Phase 4 — Theme: Animation Tokens
 *
 * Duration, easing, and spring presets.
 * Reanimated-compatible: use withTiming(val, { duration: DURATION.fast }) etc.
 */

import { Easing } from "react-native";

// ─── Duration (ms) ────────────────────────────────────────────────────────────

export const DURATION = {
  instant:    0,
  fastest:    80,
  fast:       150,
  normal:     250,
  slow:       350,
  slower:     500,
  slowest:    800,
} as const;

export type DurationKey = keyof typeof DURATION;

// ─── Easing curves ────────────────────────────────────────────────────────────

export const EASE = {
  /** Standard iOS-like ease */
  standard:   Easing.bezier(0.4, 0.0, 0.2, 1),
  /** Accelerate into screen exits */
  accelerate: Easing.bezier(0.4, 0.0, 1.0, 1),
  /** Decelerate into screen entries */
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
  /** Bounce feel for modals */
  elastic:    Easing.elastic(1.2),
  linear:     Easing.linear,
} as const;

// ─── Spring presets (react-native-reanimated withSpring) ──────────────────────

export const SPRING = {
  gentle: {
    damping:   20,
    stiffness: 180,
    mass:      1,
  },
  bouncy: {
    damping:   12,
    stiffness: 200,
    mass:      0.8,
  },
  stiff: {
    damping:   30,
    stiffness: 400,
    mass:      1,
  },
  snappy: {
    damping:   25,
    stiffness: 600,
    mass:      0.5,
  },
} as const;

export type SpringPreset = keyof typeof SPRING;

// ─── Screen transition presets ────────────────────────────────────────────────

export const TRANSITION = {
  /** Expo Router stack slide (default) */
  slideFromRight: "slide_from_right",
  /** Modal-style sheet from bottom */
  slideFromBottom: "slide_from_bottom",
  /** Fade crossfade */
  fade: "fade",
  /** No animation */
  none: "none",
} as const;

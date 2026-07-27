/**
 * MMDL — Motion System
 * SPR-M002 | Menashe Mobile Design Language
 *
 * Canonical animation tokens for the entire mobile app.
 * Extends the M001 foundation stubs with named, semantic motion recipes.
 *
 * Guiding principle: motion serves clarity, not decoration.
 * Short durations for feedback; slower for emphasis only.
 *
 * Works with react-native-reanimated (installed) and Animated API.
 */

import { Easing } from "react-native";

// ─── Duration scale (ms) ───────────────────────────────────────────────────────

export const MOTION_DURATION = {
  /** 0ms — no transition (programmatic state changes) */
  instant:   0,
  /** 80ms — micro-interactions (icon state, checkbox) */
  micro:     80,
  /** 150ms — quick feedback (press ripple, hover) */
  fast:      150,
  /** 250ms — standard transitions (tab switch, card expand) */
  normal:    250,
  /** 350ms — deliberate transitions (modal enter) */
  slow:      350,
  /** 500ms — cinematic emphasis (hero reveal, splash) */
  slower:    500,
  /** 800ms — very slow (loading shimmer, decorative) */
  verySlow:  800,
} as const;

export type MotionDurationKey = keyof typeof MOTION_DURATION;

// ─── Easing curves ────────────────────────────────────────────────────────────

export const MOTION_EASE = {
  /** iOS-like standard ease — most transitions */
  standard:    Easing.bezier(0.4, 0.0, 0.2, 1),
  /** Accelerate out — elements leaving the screen */
  accelerate:  Easing.bezier(0.4, 0.0, 1.0, 1),
  /** Decelerate in — elements entering the screen */
  decelerate:  Easing.bezier(0.0, 0.0, 0.2, 1),
  /** Sharp — quick, precise movements */
  sharp:       Easing.bezier(0.4, 0.0, 0.6, 1),
  /** Linear — progress bars, loops */
  linear:      Easing.linear,
} as const;

// ─── Spring presets (react-native-reanimated withSpring config) ───────────────

export const MOTION_SPRING = {
  /** Gentle — modals, sheets, cards unfolding */
  gentle: {
    damping:    20,
    stiffness:  180,
    mass:       1.0,
    overshootClamping: false,
  },
  /** Snappy — tab switches, quick confirmations */
  snappy: {
    damping:    25,
    stiffness:  500,
    mass:       0.7,
    overshootClamping: false,
  },
  /** Bouncy — playful elements, success states */
  bouncy: {
    damping:    12,
    stiffness:  200,
    mass:       0.8,
    overshootClamping: false,
  },
  /** Stiff — precise UI controls, no overshoot */
  stiff: {
    damping:    40,
    stiffness:  600,
    mass:       1.0,
    overshootClamping: true,
  },
} as const;

export type MotionSpringPreset = keyof typeof MOTION_SPRING;

// ─── Named interaction animations ─────────────────────────────────────────────

export const MOTION_RECIPE = {
  /** Scale-down on press — physical press feel */
  press: {
    scaleDown:   0.96,
    duration:    MOTION_DURATION.micro,
    easing:      MOTION_EASE.sharp,
    releaseScale: 1.0,
    releaseDuration: MOTION_DURATION.fast,
  },

  /** Card tap expand — card grows to fill or opens detail */
  cardExpand: {
    spring:   MOTION_SPRING.gentle,
    duration: MOTION_DURATION.slow,
  },

  /** Screen push — slide in from right (Expo Router default) */
  navigationPush: {
    duration:  MOTION_DURATION.normal,
    easing:    MOTION_EASE.decelerate,
  },

  /** Screen pop — slide out to right */
  navigationPop: {
    duration:  MOTION_DURATION.normal,
    easing:    MOTION_EASE.accelerate,
  },

  /** Bottom sheet entrance — spring up from bottom */
  bottomSheetEnter: {
    spring:   MOTION_SPRING.gentle,
  },

  /** Bottom sheet exit — slide down */
  bottomSheetExit: {
    duration: MOTION_DURATION.normal,
    easing:   MOTION_EASE.accelerate,
  },

  /** Fade in — overlays, toasts, tooltips */
  fadeIn: {
    duration: MOTION_DURATION.fast,
    easing:   MOTION_EASE.decelerate,
    from:     0,
    to:       1,
  },

  /** Fade out */
  fadeOut: {
    duration: MOTION_DURATION.fast,
    easing:   MOTION_EASE.accelerate,
    from:     1,
    to:       0,
  },

  /** Entrance — element slides up + fades in */
  entrance: {
    duration:     MOTION_DURATION.normal,
    easing:       MOTION_EASE.decelerate,
    translateY:   { from: 16, to: 0 },
    opacity:      { from: 0,  to: 1 },
  },

  /** Exit — element slides down + fades out */
  exit: {
    duration:     MOTION_DURATION.fast,
    easing:       MOTION_EASE.accelerate,
    translateY:   { from: 0,  to: 16 },
    opacity:      { from: 1,  to: 0  },
  },

  /** Shared element transition placeholder */
  sharedElement: {
    spring:   MOTION_SPRING.gentle,
  },
} as const;

// ─── Reduced motion ───────────────────────────────────────────────────────────
// All animated components MUST check this before animating.
// See accessibility/index.ts for the useReducedMotion hook reference.

export const REDUCED_MOTION_FALLBACK = {
  duration: MOTION_DURATION.instant,
  spring:   MOTION_SPRING.stiff,
} as const;

/**
 * ShellTransitions
 * SPR-M004 — Menashe Mobile Shell
 *
 * Reusable animation hooks and configs for screen-level transitions.
 * All durations/easings come from MMDL motion tokens — no magic numbers.
 *
 * Exported hooks:
 *   useFadeTransition   — opacity fade in/out
 *   useSlideTransition  — horizontal or vertical slide + fade
 *   useScaleTransition  — scale up from 0.95 + fade (modal entrance)
 *   useSheetTransition  — bottom sheet slide up
 *
 * Exported configs:
 *   SCREEN_TRANSITION_FADE   — Expo Router compatible screen animation config
 *   SCREEN_TRANSITION_SLIDE  — Expo Router compatible slide config
 *
 * Shared-element:
 *   sharedElementTag(id)  — returns a stable tag for future shared transitions
 *
 * Gesture-ready:
 *   useSwipeBack()  — prepares pan gesture handler state for future swipe-back
 *
 * Future extension:
 *   - Plug into react-native-shared-element when the library is added
 *   - Add hero transition configs for Memorial Sanctuary screen
 *
 * @platform ios, android, web
 */

import { useEffect, useRef } from "react";
import { Animated, Platform } from "react-native";
import { useReducedMotion } from "@/src/mobile/design-system/accessibility";
import {
  MOTION_DURATION,
  MOTION_EASE,
} from "@/src/mobile/design-system/tokens/motion";

// ─── useFadeTransition ────────────────────────────────────────────────────────

export interface FadeTransition {
  opacity:   Animated.Value;
  fadeIn:    () => void;
  fadeOut:   (onDone?: () => void) => void;
  style:     { opacity: Animated.Value };
}

export function useFadeTransition(initialVisible = false): FadeTransition {
  const reducedMotion = useReducedMotion();
  const opacity       = useRef(new Animated.Value(initialVisible ? 1 : 0)).current;

  const fadeIn = () => {
    if (reducedMotion) { opacity.setValue(1); return; }
    Animated.timing(opacity, {
      toValue:         1,
      duration:        MOTION_DURATION.normal,
      easing:          MOTION_EASE.decelerate,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = (onDone?: () => void) => {
    if (reducedMotion) { opacity.setValue(0); onDone?.(); return; }
    Animated.timing(opacity, {
      toValue:         0,
      duration:        MOTION_DURATION.fast,
      easing:          MOTION_EASE.accelerate,
      useNativeDriver: true,
    }).start(() => onDone?.());
  };

  return { opacity, fadeIn, fadeOut, style: { opacity } };
}

// ─── useSlideTransition ───────────────────────────────────────────────────────

export type SlideDirection = "right" | "left" | "up" | "down";

export interface SlideTransition {
  translateX: Animated.Value;
  translateY: Animated.Value;
  opacity:    Animated.Value;
  enter:      () => void;
  exit:       (direction?: SlideDirection, onDone?: () => void) => void;
  style:      { opacity: Animated.Value; transform: Array<{ translateX: Animated.Value } | { translateY: Animated.Value }> };
}

export function useSlideTransition(
  direction: SlideDirection = "right",
  distance   = 32,
): SlideTransition {
  const reducedMotion = useReducedMotion();
  const translateX    = useRef(new Animated.Value(direction === "right" ? distance : direction === "left" ? -distance : 0)).current;
  const translateY    = useRef(new Animated.Value(direction === "down" ? distance : direction === "up" ? -distance : 0)).current;
  const opacity       = useRef(new Animated.Value(0)).current;

  const enter = () => {
    if (reducedMotion) {
      translateX.setValue(0); translateY.setValue(0); opacity.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: MOTION_DURATION.normal,
        easing: MOTION_EASE.decelerate, useNativeDriver: true,
      }),
      Animated.timing(direction === "right" || direction === "left" ? translateX : translateY, {
        toValue: 0, duration: MOTION_DURATION.normal,
        easing: MOTION_EASE.decelerate, useNativeDriver: true,
      }),
    ]).start();
  };

  const exit = (exitDir: SlideDirection = direction, onDone?: () => void) => {
    if (reducedMotion) { opacity.setValue(0); onDone?.(); return; }
    const targetX = exitDir === "right" ? distance : exitDir === "left" ? -distance : 0;
    const targetY = exitDir === "down"  ? distance : exitDir === "up"   ? -distance : 0;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0, duration: MOTION_DURATION.fast,
        easing: MOTION_EASE.accelerate, useNativeDriver: true,
      }),
      Animated.timing(exitDir === "right" || exitDir === "left" ? translateX : translateY, {
        toValue: exitDir === "right" || exitDir === "left" ? targetX : targetY,
        duration: MOTION_DURATION.fast,
        easing: MOTION_EASE.accelerate, useNativeDriver: true,
      }),
    ]).start(() => onDone?.());
  };

  return {
    translateX, translateY, opacity, enter, exit,
    style: { opacity, transform: [{ translateX }, { translateY }] },
  };
}

// ─── useScaleTransition ───────────────────────────────────────────────────────

export interface ScaleTransition {
  scale:   Animated.Value;
  opacity: Animated.Value;
  enter:   () => void;
  exit:    (onDone?: () => void) => void;
  style:   { opacity: Animated.Value; transform: Array<{ scale: Animated.Value }> };
}

export function useScaleTransition(): ScaleTransition {
  const reducedMotion = useReducedMotion();
  const scale         = useRef(new Animated.Value(0.96)).current;
  const opacity       = useRef(new Animated.Value(0)).current;

  const enter = () => {
    if (reducedMotion) { scale.setValue(1); opacity.setValue(1); return; }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: MOTION_DURATION.slow,
        easing: MOTION_EASE.decelerate, useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1, damping: 20, stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const exit = (onDone?: () => void) => {
    if (reducedMotion) { opacity.setValue(0); onDone?.(); return; }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0, duration: MOTION_DURATION.fast,
        easing: MOTION_EASE.accelerate, useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.96, duration: MOTION_DURATION.fast,
        easing: MOTION_EASE.accelerate, useNativeDriver: true,
      }),
    ]).start(() => onDone?.());
  };

  return { scale, opacity, enter, exit, style: { opacity, transform: [{ scale }] } };
}

// ─── useSheetTransition ───────────────────────────────────────────────────────

export interface SheetTransition {
  translateY: Animated.Value;
  overlayOpacity: Animated.Value;
  enter:      () => void;
  exit:       (onDone?: () => void) => void;
}

export function useSheetTransition(sheetHeight: number): SheetTransition {
  const reducedMotion    = useReducedMotion();
  const translateY       = useRef(new Animated.Value(sheetHeight)).current;
  const overlayOpacity   = useRef(new Animated.Value(0)).current;

  const enter = () => {
    if (reducedMotion) { translateY.setValue(0); overlayOpacity.setValue(1); return; }
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0, damping: 20, stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1, duration: MOTION_DURATION.slow,
        easing: MOTION_EASE.decelerate, useNativeDriver: true,
      }),
    ]).start();
  };

  const exit = (onDone?: () => void) => {
    if (reducedMotion) { translateY.setValue(sheetHeight); overlayOpacity.setValue(0); onDone?.(); return; }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: sheetHeight, duration: MOTION_DURATION.normal,
        easing: MOTION_EASE.accelerate, useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0, duration: MOTION_DURATION.fast,
        easing: MOTION_EASE.accelerate, useNativeDriver: true,
      }),
    ]).start(() => onDone?.());
  };

  return { translateY, overlayOpacity, enter, exit };
}

// ─── Auto-enter on mount ──────────────────────────────────────────────────────

/** Calls `enter()` once after the component mounts. */
export function useEnterOnMount(enter: () => void, delay = 0) {
  useEffect(() => {
    const t = delay > 0 ? setTimeout(enter, delay) : (enter(), undefined);
    return () => { if (t !== undefined) clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─── Expo Router screen animation configs ─────────────────────────────────────

/** Pass to <Stack.Screen options={{ animation: ... }}> */
export const SCREEN_TRANSITION_SLIDE =
  Platform.OS === "ios" ? "ios" : "slide_from_right" as const;

export const SCREEN_TRANSITION_FADE =
  "fade" as const;

// ─── Shared element tagging ───────────────────────────────────────────────────

/**
 * Returns a stable shared-element transition tag for a given ID.
 * Plug into react-native-shared-element when the library is added.
 *
 * @param namespace  — e.g. "memorial", "prayer-card"
 * @param id         — unique entity ID
 */
export function sharedElementTag(namespace: string, id: string | number): string {
  return `shell-shared-${namespace}-${id}`;
}

// ─── Gesture scaffolding ──────────────────────────────────────────────────────

/**
 * Returns gesture-ready swipe-back state.
 * Integrate with react-native-gesture-handler PanGestureHandler
 * when implementing swipe-back navigation.
 */
export function useSwipeBack(onBack: () => void) {
  const enabled = Platform.OS === "ios"; // Android uses system gesture nav
  const threshold = 60; // dp before triggering back
  return { enabled, threshold, onBack };
}

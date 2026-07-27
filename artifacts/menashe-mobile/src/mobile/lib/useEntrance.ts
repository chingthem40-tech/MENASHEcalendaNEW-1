/**
 * MEP-005 — Shared Entrance Animation Hook
 *
 * All major cards and sections use this single entrance recipe:
 *   Fade (opacity 0 → 1) + TranslateY (16dp → 0) + 420ms + configurable delay
 *
 * Respects iOS/Android Reduce Motion — when enabled, duration and offset are 0.
 *
 * Usage:
 *   import { useEntrance, useReducedMotion } from "@/src/mobile/lib/useEntrance";
 *
 *   const style = useEntrance(0);    // section 1
 *   const style = useEntrance(40);   // section 2 (+40ms stagger)
 *   const style = useEntrance(80);   // section 3 (+80ms stagger)
 *
 * Apply to Animated.View:
 *   <Animated.View style={[yourStyles, style]}>...</Animated.View>
 */

import { useRef, useEffect, useState } from "react";
import { Animated, AccessibilityInfo } from "react-native";

// ─── Reduce Motion ────────────────────────────────────────────────────────────

/**
 * Subscribes to the system Reduce Motion accessibility setting.
 * Returns true when the user has enabled "Reduce Motion" on their device.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduced)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

// ─── Entrance Animation ───────────────────────────────────────────────────────

/**
 * Returns an Animated style object that drives a fade + slide-up entrance.
 *
 * @param delay - ms delay before the animation starts (default 0).
 *                Use 40ms increments for stagger: 0, 40, 80, 120, …
 */
export function useEntrance(delay = 0): {
  opacity: Animated.Value;
  transform: Array<{ translateY: Animated.Value }>;
} {
  const reducedMotion = useReducedMotion();
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : 16)).current;

  useEffect(() => {
    const duration = reducedMotion ? 0 : 420;
    const actualDelay = reducedMotion ? 0 : delay;

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue:         1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue:         0,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, actualDelay);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, reducedMotion]);

  return { opacity, transform: [{ translateY }] };
}

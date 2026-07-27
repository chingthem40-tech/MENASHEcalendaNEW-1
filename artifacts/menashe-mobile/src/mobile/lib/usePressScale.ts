/**
 * MEP-005 — Shared Press Scale Hook
 *
 * The one and only press interaction for the Menashe Platform:
 *   Press in  → scale to 0.96 over 80ms
 *   Press out → scale to 1.00 over 150ms
 *
 * Never duplicate this logic in a component. Import and reuse.
 *
 * Usage with Pressable (preferred):
 *   const { scale, onPressIn, onPressOut } = usePressScale();
 *   <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
 *     <Animated.View style={{ transform: [{ scale }] }}>...</Animated.View>
 *   </Pressable>
 *
 * To override the target scale (rare — use 0.96 for cards, 0.94 for buttons):
 *   const { scale, onPressIn, onPressOut } = usePressScale(0.94);
 */

import { useRef, useCallback } from "react";
import { Animated } from "react-native";

export function usePressScale(toValue = 0.96): {
  scale:       Animated.Value;
  onPressIn:   () => void;
  onPressOut:  () => void;
} {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(
    () =>
      Animated.timing(scale, {
        toValue,
        duration:        80,
        useNativeDriver: true,
      }).start(),
    [scale, toValue],
  );

  const onPressOut = useCallback(
    () =>
      Animated.timing(scale, {
        toValue:         1,
        duration:        150,
        useNativeDriver: true,
      }).start(),
    [scale],
  );

  return { scale, onPressIn, onPressOut };
}

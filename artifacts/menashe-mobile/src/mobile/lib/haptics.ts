/**
 * MEP-005 — Shared Haptics Helper
 *
 * Single source for all haptic feedback across the Menashe Platform.
 * Never call expo-haptics directly in components — use these helpers instead.
 *
 * Usage:
 *   import { hapticLight, hapticSelection, hapticSuccess, hapticWarning } from "@/src/mobile/lib/haptics";
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** Navigation, card tap, list row — the most common touch feedback. */
export function hapticLight(): void {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/** Picker selection, toggle, segmented control change. */
export function hapticSelection(): void {
  if (Platform.OS !== "web") {
    Haptics.selectionAsync();
  }
}

/** Amen, form submit, action completed successfully. */
export function hapticSuccess(): void {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/** Validation error, destructive action, warning confirmation. */
export function hapticWarning(): void {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

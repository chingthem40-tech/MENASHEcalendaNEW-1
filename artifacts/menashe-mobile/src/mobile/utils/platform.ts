/**
 * SPR-M001 Phase 7 — Platform Detection
 *
 * Single source of truth for all platform branching.
 * Import from here — never scatter `Platform.OS === "ios"` checks across the app.
 *
 * Usage:
 *   import { isIOS, isAndroid, isMobile, isWeb } from "@/src/mobile/utils/platform";
 *   if (isIOS) { ... }
 */

import { Platform } from "react-native";

export const isIOS     = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const isWeb     = Platform.OS === "web";
export const isMobile  = !isWeb;
export const isNative  = isMobile;

/** True on iOS or Android physical/simulator; false on web. */
export const isDevice = isMobile;

/** Resolved platform string — use for logging / analytics. */
export const platformName: "ios" | "android" | "web" = Platform.OS as "ios" | "android" | "web";

/**
 * Run a callback on native only (no-op on web).
 * Useful for native-only APIs that would throw on web.
 */
export function onNative<T>(fn: () => T): T | undefined {
  return isMobile ? fn() : undefined;
}

/**
 * Returns one of two values depending on platform.
 *
 * Example:
 *   const height = select({ native: 64, web: 68 });
 */
export function select<T>(options: { native: T; web: T }): T;
export function select<T>(options: { ios: T; android: T; web: T }): T;
export function select<T>(options: Partial<{ ios: T; android: T; native: T; web: T }> & { default: T }): T;
export function select<T>(options: Record<string, T>): T {
  if ("ios" in options && isIOS)     return options["ios"]!;
  if ("android" in options && isAndroid) return options["android"]!;
  if ("web" in options && isWeb)     return options["web"]!;
  if ("native" in options && isMobile) return options["native"]!;
  return options["default"]!;
}

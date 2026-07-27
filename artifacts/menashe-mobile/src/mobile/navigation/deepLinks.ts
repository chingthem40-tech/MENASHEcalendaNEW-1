/**
 * SPR-M001 Phase 3 — Navigation: Deep Links
 *
 * Central registry of deep-link paths.
 * Expo Router resolves these via expo-linking — this file documents them.
 *
 * All paths must match the file names under artifacts/menashe-mobile/app/.
 * Future screens: add an entry here AND create the corresponding app/xxx.tsx file.
 */

import { SCREEN_REGISTRY } from "@/src/mobile/types/screens";
import type { DeepLinkMap } from "./types";

/** Full deep-link path map derived from the screen registry. */
export const DEEP_LINKS: DeepLinkMap = Object.fromEntries(
  Object.entries(SCREEN_REGISTRY).map(([name, meta]) => [name, meta.deepLinkPath ?? `/${name.toLowerCase()}`])
);

/**
 * Builds a full deep-link URL for the Menashe Calendar app scheme.
 *
 * Example: buildDeepLink("DafYomi") → "menashe://daf-yomi"
 */
export function buildDeepLink(screen: keyof typeof SCREEN_REGISTRY): string {
  const path = DEEP_LINKS[screen] ?? `/${screen.toLowerCase()}`;
  return `menashe:/${path}`;
}

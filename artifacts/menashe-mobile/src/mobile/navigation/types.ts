/**
 * SPR-M001 Phase 3 — Navigation: Types
 *
 * All navigation-related TypeScript contracts live here.
 * Expo Router uses file-based routing, so these types complement it rather
 * than replace it — they are used for programmatic navigation helpers and
 * deep-link construction.
 */

import type { ScreenName } from "@/src/mobile/types/screens";

// ─── Route params ─────────────────────────────────────────────────────────────

export type RootStackParamList = {
  "(tabs)":           undefined;
  "sign-in":          undefined;
  "sign-up":          undefined;
  "forgot-password":  undefined;
  "torah-tracker":    undefined;
  "siddur":           undefined;
  "daf-yomi":         undefined;
  "mussar":           undefined;
  "yahrzeit-calc":    undefined;
  "prayer-board":     undefined;
  "translation-editor": undefined;
};

export type TabParamList = {
  index:     undefined;
  calendar:  undefined;
  zmanim:    undefined;
  community: undefined;
  torah:     undefined;
  settings:  undefined;
};

// ─── Deep link map ────────────────────────────────────────────────────────────

/** Maps a ScreenName to its Expo Router href. */
export type DeepLinkMap = Partial<Record<ScreenName, string>>;

// ─── Navigation event types ───────────────────────────────────────────────────

export type NavigationDirection = "push" | "replace" | "back" | "reset";

export interface NavigationEvent {
  screen:    ScreenName;
  direction: NavigationDirection;
  params?:   Record<string, unknown>;
}

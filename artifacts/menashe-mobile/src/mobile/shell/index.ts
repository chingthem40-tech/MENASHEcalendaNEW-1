/**
 * src/mobile/shell — Menashe Mobile Shell (MOS)
 * SPR-M004
 *
 * Public API for the Mobile Shell.
 *
 * Primary import:
 *   import { MobileShell, useShell } from "@/src/mobile/shell";
 *
 * Secondary imports (for building custom shell-aware layouts):
 *   import { ShellHeader, ShellNavigation, ShellHosts } from "@/src/mobile/shell";
 *   import { ShellProvider, useShell, SHELL_TABS } from "@/src/mobile/shell";
 *
 * Transition utilities:
 *   import {
 *     useFadeTransition, useSlideTransition, useScaleTransition,
 *     useSheetTransition, useEnterOnMount,
 *     SCREEN_TRANSITION_SLIDE, SCREEN_TRANSITION_FADE,
 *     sharedElementTag, useSwipeBack,
 *   } from "@/src/mobile/shell";
 */

// Main shell component
export { MobileShell, ShellScreen, useShellLayout } from "./MobileShell";
export type { MobileShellProps, ShellLayout }        from "./MobileShell";

// Context + state
export { ShellProvider, useShell, SHELL_TABS } from "./ShellContext";
export type {
  TabKey,
  TabConfig,
  ShellHeaderConfig,
  ShellContextValue,
  ToastVariant,
  ToastConfig,
  DialogConfig,
  DialogAction,
  BottomSheetConfig,
  OverlayConfig,
}                                         from "./ShellContext";

// Shell layers (for custom layouts)
export { ShellHeader, useHeaderScrollY }  from "./ShellHeader";
export { ShellNavigation }                from "./ShellNavigation";
export { ShellHosts }                     from "./ShellHosts";

// Transition utilities
export {
  useFadeTransition,
  useSlideTransition,
  useScaleTransition,
  useSheetTransition,
  useEnterOnMount,
  SCREEN_TRANSITION_SLIDE,
  SCREEN_TRANSITION_FADE,
  sharedElementTag,
  useSwipeBack,
}                                         from "./ShellTransitions";
export type {
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  SheetTransition,
  SlideDirection,
}                                         from "./ShellTransitions";

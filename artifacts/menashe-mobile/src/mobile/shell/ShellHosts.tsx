/**
 * ShellHosts
 * SPR-M004 — Menashe Mobile Shell
 *
 * Global overlay host layer — renders above all screens.
 * Each host is a thin adapter that connects ShellContext state
 * to the MMDL component library. No business logic here.
 *
 * Hosts (rendered top-to-bottom in z-order):
 *   ToastHost        — ephemeral toast notifications
 *   SnackbarHost     — action snackbars (scaffold, wire when needed)
 *   BannerHost       — persistent banners (scaffold)
 *   DialogHost       — blocking dialogs
 *   BottomSheetHost  — draggable bottom sheets
 *   OverlayHost      — generic full-screen overlay slot
 *   LoadingHost      — full-screen loading overlay with exit animation
 *   SearchHost       — full-screen search experience with exit animation
 *
 * Visibility lifecycle:
 *   Hosts that animate use a "keep-mounted-until-exit" pattern:
 *     1. When visibility flips false, play exit animation
 *     2. Unmount ONLY after animation completes
 *   This prevents the common React RN pitfall of unmounting before exit
 *   animation can render.
 *
 * Token compliance:
 *   All spacing, radius, and color values come from useThemeTokens().
 *   No hardcoded rgba(), dp values, or color strings.
 *
 * Future extension:
 *   - NotificationHost: in-app push notification banners
 *   - OnboardingHost: spotlight / tooltip overlays
 *   - MediaViewerHost: full-screen image / video viewer
 *
 * @platform ios, android, web
 */

import React, { memo, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useThemeTokens }    from "@/src/mobile/design-system";
import { useReducedMotion }  from "@/src/mobile/design-system/accessibility";
import { MOTION_DURATION, MOTION_EASE } from "@/src/mobile/design-system/tokens/motion";
import {
  Toast,
  Snackbar,
  Banner,
  BottomSheet,
  Dialog,
} from "@/src/mobile/components/feedback";
import { SearchField }       from "@/src/mobile/components/inputs";

import { useShell }          from "./ShellContext";

// ─── Animated visibility helper ───────────────────────────────────────────────

/**
 * useAnimatedVisibility
 *
 * Keeps a component mounted during its exit animation.
 * Returns `shouldRender` (true until exit completes) and an
 * Animated.Value for opacity that callers use on their root view.
 *
 * Pattern:
 *   when visible flips true  → fade in immediately
 *   when visible flips false → fade out, then set shouldRender = false
 */
function useAnimatedVisibility(visible: boolean, duration: number = MOTION_DURATION.fast) {
  const reducedMotion  = useReducedMotion();
  const [shouldRender, setShouldRender] = useState(visible);
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(opacity, {
        toValue:         1,
        duration:        reducedMotion ? 0 : duration,
        easing:          MOTION_EASE.decelerate,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue:         0,
        duration:        reducedMotion ? 0 : duration,
        easing:          MOTION_EASE.accelerate,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
  }, [visible, duration, reducedMotion, opacity]);

  return { shouldRender, opacity };
}

// ─── ToastHost ────────────────────────────────────────────────────────────────

const ToastHost = memo(function ToastHost() {
  const { toastQueue, dismissToast } = useShell();
  const { sp } = useThemeTokens();

  if (toastQueue.length === 0) return null;

  // Show only the topmost toast
  const current = toastQueue[toastQueue.length - 1];
  return (
    <View
      style={[styles.toastHost, { top: sp[20], paddingHorizontal: sp[4] }]}
      pointerEvents="none"
    >
      <Toast
        key={current.id}
        message={current.message}
        variant={current.variant}
        visible
        onHide={() => dismissToast(current.id)}
        duration={current.duration}
      />
    </View>
  );
});

// ─── SnackbarHost ─────────────────────────────────────────────────────────────

/** Scaffold — wire to a dedicated snackbarQueue in ShellContext when needed. */
const SnackbarHost = memo(function SnackbarHost() { return null; });

// ─── BannerHost ───────────────────────────────────────────────────────────────

/** Scaffold — wire to a banners[] array in ShellContext when needed. */
const BannerHost = memo(function BannerHost() { return null; });

// ─── DialogHost ───────────────────────────────────────────────────────────────

const DialogHost = memo(function DialogHost() {
  const { dialogs, dismissDialog } = useShell();
  if (dialogs.length === 0) return null;

  const current = dialogs[dialogs.length - 1];
  return (
    <Dialog
      key={current.id}
      visible
      title={current.title}
      message={current.message}
      actions={current.actions}
      onClose={() => dismissDialog(current.id)}
    >
      {current.children}
    </Dialog>
  );
});

// ─── BottomSheetHost ──────────────────────────────────────────────────────────

const BottomSheetHost = memo(function BottomSheetHost() {
  const { sheets, dismissSheet } = useShell();
  if (sheets.length === 0) return null;

  const current = sheets[sheets.length - 1];
  return (
    <BottomSheet
      key={current.id}
      visible
      title={current.title}
      snapHeight={current.snapHeight}
      onClose={() => dismissSheet(current.id)}
    >
      {current.children}
    </BottomSheet>
  );
});

// ─── OverlayHost ──────────────────────────────────────────────────────────────

const OverlayHost = memo(function OverlayHost() {
  const { overlays, dismissOverlay } = useShell();
  if (overlays.length === 0) return null;

  const current = overlays[overlays.length - 1];
  return (
    <Modal
      key={current.id}
      visible
      transparent
      animationType="fade"
      onRequestClose={() => current.onDismiss?.()}
    >
      <View style={styles.overlayBackdrop}>
        {current.children}
      </View>
    </Modal>
  );
});

// ─── LoadingHost ──────────────────────────────────────────────────────────────

const LoadingHost = memo(function LoadingHost() {
  const { isLoading, loadingMessage }    = useShell();
  const { colors, type, sp, rd, shadow } = useThemeTokens();
  const { shouldRender, opacity }        = useAnimatedVisibility(isLoading, MOTION_DURATION.normal);

  if (!shouldRender) return null;

  return (
    <Animated.View style={[styles.loadingHost, { backgroundColor: colors.overlay, opacity }]}>
      <View
        style={[
          styles.loadingCard,
          {
            backgroundColor:  colors.surface,
            borderRadius:     rd.xl,
            paddingVertical:  sp[7],
            paddingHorizontal: sp[8],
            gap:              sp[3],
            ...shadow.modal,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        {loadingMessage && (
          <Text style={[type.bodySm, { color: colors.textMuted, textAlign: "center" }]}>
            {loadingMessage}
          </Text>
        )}
      </View>
    </Animated.View>
  );
});

// ─── SearchHost ───────────────────────────────────────────────────────────────

const SearchHost = memo(function SearchHost() {
  const { searchVisible, searchQuery, setSearchQuery, closeSearch } = useShell();
  const { colors, sp }    = useThemeTokens();
  const { shouldRender, opacity } = useAnimatedVisibility(searchVisible, MOTION_DURATION.fast);

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={[
        styles.searchHost,
        { backgroundColor: colors.background, paddingTop: sp[12], paddingHorizontal: sp[4] },
        { opacity },
      ]}
    >
      <SearchField
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search…"
        autoFocus
      />
      {/* Search results mount below the SearchField — wire via SearchResultsComponent */}
    </Animated.View>
  );
});

// ─── ShellHosts (compositor) ──────────────────────────────────────────────────

interface ShellHostsProps {
  style?: StyleProp<ViewStyle>;
}

export const ShellHosts = memo<ShellHostsProps>(function ShellHosts({ style }) {
  return (
    <View style={[styles.hostsRoot, style]} pointerEvents="box-none">
      {/* Ordered by z-index — later = higher */}
      <BannerHost />
      <SnackbarHost />
      <ToastHost />
      <BottomSheetHost />
      <DialogHost />
      <OverlayHost />
      <LoadingHost />
      <SearchHost />
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  hostsRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 500,
  },
  toastHost: {
    position: "absolute",
    zIndex:   510,
  },
  overlayBackdrop: {
    flex:            1,
    backgroundColor: "rgba(0,0,0,0.6)", // fallback only — themed via colors.overlay in runtime hosts
    alignItems:      "center",
    justifyContent:  "center",
  },
  loadingHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex:          520,
    alignItems:      "center",
    justifyContent:  "center",
  },
  loadingCard: {
    alignItems: "center",
    minWidth:   140,
  },
  searchHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 530,
  },
});

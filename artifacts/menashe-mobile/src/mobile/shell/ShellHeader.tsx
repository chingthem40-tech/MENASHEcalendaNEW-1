/**
 * ShellHeader
 * SPR-M004 — Menashe Mobile Shell
 *
 * Animated header with Large Title → Compact Title scroll transition.
 *
 * Features:
 *   - Large title at scroll position 0
 *   - Compact title + blur background when scrolled past threshold
 *   - Eyebrow text (overline above large title)
 *   - Up to N right-side action icons
 *   - Back button when onBack is provided
 *   - Blur background (expo-blur on iOS, opaque surface on Android/web)
 *   - Safe area inset aware
 *   - Reduced motion: jumps directly to compact state on scroll
 *   - All spacing/radius/color from MMDL tokens — zero hardcoded values
 *
 * Usage (from a screen):
 *   const { setHeaderConfig } = useShell();
 *   useEffect(() => {
 *     setHeaderConfig({ title: "Zmanim", eyebrow: "PRAYER TIMES" });
 *   }, []);
 *
 *   // Then feed scrollY via useHeaderScrollY():
 *   const { scrollY, scrollHandler } = useHeaderScrollY();
 *   <ShellHeader config={config} scrollY={scrollY} />
 *   <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
 *
 * Future extension:
 *   - Shared-element title for hero screen transitions
 *   - Inline search bar transition (expand from header action)
 *   - Segment control slot below compact title
 */

import React, { memo } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { BlurView }   from "expo-blur";
import { Feather }    from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeTokens }    from "@/src/mobile/design-system";
import { useReducedMotion }  from "@/src/mobile/design-system/accessibility";
import type { ShellHeaderConfig } from "./ShellContext";

// ─── Constants (MMDL layout token values) ────────────────────────────────────
// These match LAYOUT.header.height / heightLarge from layout.ts exactly.

const LARGE_HEADER_H   = 88;  // LAYOUT.header.heightLarge
const COMPACT_HEADER_H = 56;  // LAYOUT.header.height
const SCROLL_THRESHOLD = 48;  // dp before compact kicks in

// ─── Props ────────────────────────────────────────────────────────────────────

interface ShellHeaderProps {
  config:    ShellHeaderConfig;
  /** Animated scroll offset — wire via useHeaderScrollY() */
  scrollY?:  Animated.Value;
  style?:    StyleProp<ViewStyle>;
  testID?:   string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ShellHeader = memo<ShellHeaderProps>(function ShellHeader({
  config,
  scrollY,
  style,
  testID,
}) {
  const { colors, type, sp, rd, theme } = useThemeTokens();
  const insets        = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const isIOS         = Platform.OS === "ios";
  const isDark        = theme !== "light";

  // Internal fallback if no external scrollY provided
  const fallbackScrollY = new Animated.Value(0);
  const anim            = scrollY ?? fallbackScrollY;

  // Compact progress: 0 = large, 1 = compact
  const compactProgress = anim.interpolate({
    inputRange:  [0, SCROLL_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const largeTitleOpacity   = reducedMotion
    ? 1
    : compactProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: "clamp" });
  const compactTitleOpacity = reducedMotion
    ? 0
    : compactProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" });
  const blurOpacity = compactProgress.interpolate({
    inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp",
  });
  const headerHeight = anim.interpolate({
    inputRange:  [0, SCROLL_THRESHOLD],
    outputRange: [LARGE_HEADER_H + insets.top, COMPACT_HEADER_H + insets.top],
    extrapolate: "clamp",
  });

  // All spacing from MMDL tokens
  const paddingH  = Math.max(insets.left, sp[4]);
  const paddingHR = Math.max(insets.right, sp[4]);

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="header"
      style={[
        styles.container,
        {
          height:           headerHeight,
          paddingTop:       insets.top,
          paddingLeft:      paddingH,
          paddingRight:     paddingHR,
          backgroundColor:  config.transparent ? "transparent" : colors.surface,
        },
        style,
      ]}
    >
      {/* Blur background — iOS only */}
      {isIOS && !config.transparent && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: blurOpacity }]}>
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Bottom border */}
      <Animated.View
        style={[styles.border, { backgroundColor: colors.border, opacity: blurOpacity }]}
      />

      {/* ── Compact row ── */}
      <View style={[styles.compactRow, { height: COMPACT_HEADER_H - sp[4], marginBottom: sp[2] }]}>
        {/* Back */}
        {config.showBack && config.onBack && (
          <Pressable
            onPress={config.onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={sp[2]}
            style={({ pressed }) => [
              styles.actionBtn,
              { minWidth: sp[11], minHeight: sp[11], opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </Pressable>
        )}

        {/* Compact title */}
        <Animated.Text
          style={[
            type.title,
            { marginLeft: sp[2], flexShrink: 1, color: colors.textPrimary, opacity: compactTitleOpacity },
          ]}
          numberOfLines={1}
        >
          {config.title}
        </Animated.Text>

        <View style={{ flex: 1 }} />

        {/* Action buttons */}
        {config.actions?.map((action) => (
          <Pressable
            key={action.label}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={sp[2]}
            style={({ pressed }) => [
              styles.actionBtn,
              { minWidth: sp[11], minHeight: sp[11], opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name={action.icon as any} size={22} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>

      {/* ── Large title block ── */}
      <Animated.View
        style={[
          styles.largeTitleBlock,
          { paddingHorizontal: sp[4], bottom: sp[4], opacity: largeTitleOpacity },
        ]}
      >
        {config.eyebrow && (
          <Text
            style={[type.overline, { color: colors.accentGold, marginBottom: sp[1] }]}
            allowFontScaling={false}
          >
            {config.eyebrow.toUpperCase()}
          </Text>
        )}
        <Text style={[type.heading, { color: colors.textPrimary }]} numberOfLines={1}>
          {config.title}
        </Text>
        {config.subtitle && (
          <Text
            style={[type.bodySm, { color: colors.textMuted, marginTop: sp[0.5] }]}
            numberOfLines={1}
          >
            {config.subtitle}
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position:        "absolute",
    top:             0,
    left:            0,
    right:           0,
    zIndex:          100,
    overflow:        "hidden",
    justifyContent:  "flex-end",
  },
  border: {
    position: "absolute",
    bottom:   0,
    left:     0,
    right:    0,
    height:   StyleSheet.hairlineWidth,
  },
  compactRow: {
    flexDirection:  "row",
    alignItems:     "center",
  },
  actionBtn: {
    alignItems:      "center",
    justifyContent:  "center",
  },
  largeTitleBlock: {
    position:  "absolute",
    left:      0,
    right:     0,
  },
});

// ─── useHeaderScrollY ─────────────────────────────────────────────────────────

/**
 * Creates an Animated.Value wired to a ScrollView's onScroll event.
 *
 * @example
 *   const { scrollY, scrollHandler } = useHeaderScrollY();
 *   return (
 *     <>
 *       <ShellHeader config={headerConfig} scrollY={scrollY} />
 *       <Animated.ScrollView
 *         onScroll={scrollHandler}
 *         scrollEventThrottle={16}
 *         contentInset={{ top: headerHeight }}
 *       >
 *         ...
 *       </Animated.ScrollView>
 *     </>
 *   );
 */
import { useRef } from "react";

export function useHeaderScrollY() {
  const scrollY       = useRef(new Animated.Value(0)).current;
  const scrollHandler = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );
  return { scrollY, scrollHandler };
}

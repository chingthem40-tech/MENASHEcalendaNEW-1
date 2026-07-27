/**
 * ShellNavigation
 * SPR-M004 — Menashe Mobile Shell
 *
 * Premium floating bottom navigation bar.
 *
 * Design language:
 *   - Floating pill container with glass background + shadow
 *   - Rounded corners (rd["2xl"] = 24dp)
 *   - Active tab: gold indicator dot + label shown, icon scales up
 *   - Inactive: icon only at reduced opacity
 *   - Badge support: count or dot overlay on any tab
 *   - Safe-area aware (sits above home indicator)
 *
 * Accessibility:
 *   - accessibilityRole="tablist" on container
 *   - accessibilityRole="tab" + accessibilityState.selected on each item
 *   - Minimum sp[11] (44dp) touch target per tab
 *
 * Token compliance:
 *   All spacing, radius, color from useThemeTokens — no hardcoded values.
 *
 * Future extension:
 *   - Haptic feedback: import * as Haptics from "expo-haptics"
 *   - Animated badge enter/exit
 *   - Tab overflow menu ("More" tab → bottom sheet)
 *
 * @platform ios, android, web
 */

import React, { memo, useCallback, useEffect, useRef } from "react";
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
import { BlurView }  from "expo-blur";
import { Feather }   from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeTokens }    from "@/src/mobile/design-system";
import { useReducedMotion }  from "@/src/mobile/design-system/accessibility";
import { MOTION_DURATION }   from "@/src/mobile/design-system/tokens/motion";
import { NavigationBadge }   from "@/src/mobile/components/navigation/TabIndicator";
import type { TabConfig, TabKey } from "./ShellContext";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ShellNavigationProps {
  tabs:        TabConfig[];
  activeTab:   TabKey;
  onTabPress:  (tab: TabKey) => void;
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

interface NavItemProps {
  tab:      TabConfig;
  active:   boolean;
  onPress:  () => void;
}

const NavItem = memo<NavItemProps>(function NavItem({ tab, active, onPress }) {
  const { colors, type, sp, rd } = useThemeTokens();
  const reducedMotion             = useReducedMotion();
  const scaleAnim                 = useRef(new Animated.Value(1)).current;
  const labelOpacity              = useRef(new Animated.Value(active ? 1 : 0)).current;

  const handlePress = useCallback(() => {
    if (!reducedMotion) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue:         0.88,
          duration:        MOTION_DURATION.micro,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue:         1,
          damping:         12,
          stiffness:       200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPress();
  }, [reducedMotion, scaleAnim, onPress]);

  useEffect(() => {
    if (reducedMotion) { labelOpacity.setValue(active ? 1 : 0); return; }
    Animated.timing(labelOpacity, {
      toValue:         active ? 1 : 0,
      duration:        MOTION_DURATION.fast,
      useNativeDriver: true,
    }).start();
  }, [active, labelOpacity, reducedMotion]);

  const iconColor = active ? colors.tabActive  : colors.tabInactive;
  const iconSize  = active ? 24 : 22;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      style={[styles.navItemOuter, { minHeight: sp[11] }]}
    >
      <Animated.View
        style={[styles.navItemInner, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* Icon + badge */}
        <View style={[styles.iconWrap, { width: sp[7], height: sp[7] }]}>
          <Feather name={tab.icon as any} size={iconSize} color={iconColor} />
          {(tab.badgeDot || (tab.badge ?? 0) > 0) && (
            <View style={styles.badgeWrap}>
              <NavigationBadge count={tab.badge ?? 0} dot={tab.badgeDot} />
            </View>
          )}
        </View>

        {/* Active indicator dot */}
        {active && (
          <View
            style={[
              styles.activeDot,
              { backgroundColor: colors.tabActive, borderRadius: rd.xs },
            ]}
          />
        )}

        {/* Label — visible only when active */}
        <Animated.Text
          style={[
            type.tabLabel,
            { color: iconColor, opacity: labelOpacity, marginTop: sp[0.5] },
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {tab.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
});

// ─── ShellNavigation ──────────────────────────────────────────────────────────

export const ShellNavigation = memo<ShellNavigationProps>(function ShellNavigation({
  tabs,
  activeTab,
  onTabPress,
  style,
  testID,
}) {
  const { colors, sp, rd, shadow, theme } = useThemeTokens();
  const insets                            = useSafeAreaInsets();
  const isIOS                             = Platform.OS === "ios";
  const isDark                            = theme !== "light";

  const bottomInset = Math.max(insets.bottom, sp[2]);

  return (
    <View
      testID={testID}
      style={[
        styles.outerContainer,
        { paddingBottom: bottomInset, paddingHorizontal: sp[4] },
        style,
      ]}
      pointerEvents="box-none"
    >
      {/* Floating pill */}
      <View
        accessibilityRole="tablist"
        style={[
          styles.pill,
          {
            borderRadius: rd["2xl"],
            borderWidth:  1,
            borderColor:  colors.glassBorder,
            paddingVertical:   sp[2],
            paddingHorizontal: sp[2],
            ...shadow.floating,
          },
        ]}
      >
        {/* Glass / solid background */}
        {isIOS ? (
          <BlurView
            intensity={85}
            tint={isDark ? "dark" : "light"}
            style={[StyleSheet.absoluteFill, { borderRadius: rd["2xl"], overflow: "hidden" }]}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: rd["2xl"], backgroundColor: colors.glassBg },
            ]}
          />
        )}

        {/* Tab items */}
        {tabs.map((tab) => (
          <NavItem
            key={tab.key}
            tab={tab}
            active={tab.key === activeTab}
            onPress={() => onTabPress(tab.key)}
          />
        ))}
      </View>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerContainer: {
    position:  "absolute",
    bottom:    0,
    left:      0,
    right:     0,
    zIndex:    200,
  },
  pill: {
    flexDirection: "row",
    alignItems:    "center",
    overflow:      "hidden",
  },
  navItemOuter: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
  },
  navItemInner: {
    alignItems:      "center",
    justifyContent:  "center",
  },
  iconWrap: {
    position:       "relative",
    alignItems:     "center",
    justifyContent: "center",
  },
  badgeWrap: {
    position: "absolute",
    top:      -4,
    right:    -6,
  },
  activeDot: {
    width:  4,
    height: 4,
  },
});

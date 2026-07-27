/**
 * TabIndicator + NavigationBadge + NavigationContainer
 * MMDL navigation — tab underline indicator, overlay badge, container.
 */

import React, { memo } from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

// ─── TabIndicator ─────────────────────────────────────────────────────────────

interface TabIndicatorProps {
  active?: boolean;
  width?:  number;
  style?:  StyleProp<ViewStyle>;
}

export const TabIndicator = memo<TabIndicatorProps>(function TabIndicator({
  active = false,
  width  = 24,
  style,
}) {
  const { colors, rd } = useThemeTokens();
  if (!active) return null;

  return (
    <View
      style={[
        {
          width,
          height:          3,
          borderRadius:    rd.pill,
          backgroundColor: colors.tabActive,
          alignSelf:       "center",
          marginTop:       2,
        },
        style,
      ]}
    />
  );
});

// ─── NavigationBadge ──────────────────────────────────────────────────────────

interface NavigationBadgeProps {
  count?:  number;
  dot?:    boolean;
  style?:  StyleProp<ViewStyle>;
}

export const NavigationBadge = memo<NavigationBadgeProps>(function NavigationBadge({
  count = 0,
  dot   = false,
  style,
}) {
  const { colors, type, rd } = useThemeTokens();

  if (!dot && count <= 0) return null;

  if (dot) {
    return (
      <View
        style={[
          { width: 8, height: 8, borderRadius: rd.circle, backgroundColor: colors.error },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          minWidth:        18,
          height:          18,
          borderRadius:    rd.pill,
          backgroundColor: colors.error,
          alignItems:      "center",
          justifyContent:  "center",
          paddingHorizontal: 4,
        },
        style,
      ]}
    >
      <Text
        style={[type.overline, { color: "#ffffff", fontSize: 9, lineHeight: 11 }]}
        allowFontScaling={false}
      >
        {count > 99 ? "99+" : String(count)}
      </Text>
    </View>
  );
});

// ─── NavigationContainer ──────────────────────────────────────────────────────

interface NavigationContainerProps {
  style?:    StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const NavigationContainer = memo<NavigationContainerProps>(function NavigationContainer({
  style,
  children,
}) {
  const { colors } = useThemeTokens();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
});

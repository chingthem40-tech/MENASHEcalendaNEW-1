/**
 * BottomNavigation
 * MMDL navigation — tab bar container with glass effect.
 * Wraps BottomNavigationItem children.
 */

import React, { memo } from "react";
import { View, type StyleProp, type ViewStyle, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@/src/mobile/design-system";

interface BottomNavigationProps {
  style?:    StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?:   string;
}

export const BottomNavigation = memo<BottomNavigationProps>(function BottomNavigation({
  style,
  children,
  testID,
}) {
  const { colors, layout } = useThemeTokens();
  const insets             = useSafeAreaInsets();

  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      style={[
        {
          flexDirection:   "row",
          backgroundColor: colors.tabBackground,
          borderTopWidth:  0.5,
          borderTopColor:  colors.border,
          paddingBottom:   insets.bottom,
          height:          layout.bottomNav.height + insets.bottom,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});

/**
 * ScreenLayout
 * MMDL layout — base wrapper for every screen.
 * Applies theme background and safe-area padding.
 */

import React, { memo } from "react";
import { View, StatusBar, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@/src/mobile/design-system";

interface ScreenLayoutProps {
  /** Extra padding at top (on top of safe area) */
  topOffset?:    number;
  /** Extra padding at bottom (on top of safe area) */
  bottomOffset?: number;
  style?:        StyleProp<ViewStyle>;
  children?:     React.ReactNode;
  testID?:       string;
}

export const ScreenLayout = memo<ScreenLayoutProps>(function ScreenLayout({
  topOffset    = 0,
  bottomOffset = 0,
  style,
  children,
  testID,
}) {
  const { colors, theme } = useThemeTokens();
  const insets            = useSafeAreaInsets();

  return (
    <View
      testID={testID}
      style={[
        {
          flex:            1,
          backgroundColor: colors.background,
          paddingTop:      insets.top + topOffset,
          paddingBottom:   insets.bottom + bottomOffset,
          paddingLeft:     insets.left,
          paddingRight:    insets.right,
        },
        style,
      ]}
    >
      <StatusBar
        barStyle={theme === "light" ? "dark-content" : "light-content"}
        backgroundColor={colors.background}
        translucent
      />
      {children}
    </View>
  );
});

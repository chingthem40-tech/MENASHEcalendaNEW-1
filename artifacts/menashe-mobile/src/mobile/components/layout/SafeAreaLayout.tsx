/**
 * SafeAreaLayout
 * MMDL layout — insets safe area edges with theme background.
 */

import React, { memo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@/src/mobile/design-system";

type Edge = "top" | "bottom" | "left" | "right";

interface SafeAreaLayoutProps {
  edges?:    Edge[];
  style?:    StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?:   string;
}

export const SafeAreaLayout = memo<SafeAreaLayoutProps>(function SafeAreaLayout({
  edges    = ["top", "bottom", "left", "right"],
  style,
  children,
  testID,
}) {
  const { colors } = useThemeTokens();
  const insets     = useSafeAreaInsets();

  return (
    <View
      testID={testID}
      style={[
        {
          flex:            1,
          backgroundColor: colors.background,
          paddingTop:    edges.includes("top")    ? insets.top    : 0,
          paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
          paddingLeft:   edges.includes("left")   ? insets.left   : 0,
          paddingRight:  edges.includes("right")  ? insets.right  : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});

/**
 * MenasheDivider
 * MMDL foundation — horizontal / vertical separator.
 */

import React, { memo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

interface MenasheDividerProps {
  direction?: "horizontal" | "vertical";
  /** Override color with a token key from ColorTokens */
  variant?:   "default" | "strong" | "gold";
  thickness?: number;
  style?:     StyleProp<ViewStyle>;
}

export const MenasheDivider = memo<MenasheDividerProps>(function MenasheDivider({
  direction = "horizontal",
  variant   = "default",
  thickness = 1,
  style,
}) {
  const { colors } = useThemeTokens();

  const color =
    variant === "gold"   ? colors.accentGold :
    variant === "strong" ? colors.borderStrong :
    colors.divider;

  return (
    <View
      style={[
        direction === "horizontal"
          ? { height: thickness, width: "100%", backgroundColor: color }
          : { width: thickness, alignSelf: "stretch", backgroundColor: color },
        style,
      ]}
      accessibilityRole="none"
      importantForAccessibility="no"
    />
  );
});

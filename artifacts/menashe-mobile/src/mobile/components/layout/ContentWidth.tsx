/**
 * ContentWidth
 * MMDL layout — max-width constraint for readability on large screens.
 */

import React, { memo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

interface ContentWidthProps {
  /** Max width in dp (default: layout.screen.maxContentWidth = 680) */
  maxWidth?: number;
  style?:    StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const ContentWidth = memo<ContentWidthProps>(function ContentWidth({
  maxWidth,
  style,
  children,
}) {
  const { layout } = useThemeTokens();
  return (
    <View
      style={[
        {
          width:      "100%",
          maxWidth:   maxWidth ?? layout.screen.maxContentWidth,
          alignSelf:  "center",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});

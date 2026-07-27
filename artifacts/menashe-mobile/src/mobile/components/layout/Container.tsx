/**
 * Container
 * MMDL layout — horizontal-padding content wrapper.
 */

import React, { memo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

interface ContainerProps {
  /** Use screen-edge padding (default true) */
  padded?: boolean;
  style?:  StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
}

export const Container = memo<ContainerProps>(function Container({
  padded = true,
  style,
  children,
  testID,
}) {
  const { sp } = useThemeTokens();
  return (
    <View
      testID={testID}
      style={[padded ? { paddingHorizontal: sp[4] } : {}, style]}
    >
      {children}
    </View>
  );
});

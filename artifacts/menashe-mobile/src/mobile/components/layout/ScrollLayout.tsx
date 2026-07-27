/**
 * ScrollLayout
 * MMDL layout — screen wrapper with scroll + keyboard avoidance.
 */

import React, { memo, type ReactNode } from "react";
import {
  ScrollView, KeyboardAvoidingView, Platform,
  type StyleProp, type ViewStyle, type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@/src/mobile/design-system";

interface ScrollLayoutProps extends ScrollViewProps {
  /** Horizontal screen padding */
  paddingX?:     boolean;
  /** Bottom safe area + optional extra padding */
  bottomOffset?: number;
  style?:        StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?:     ReactNode;
  testID?:       string;
}

export const ScrollLayout = memo<ScrollLayoutProps>(function ScrollLayout({
  paddingX     = true,
  bottomOffset = 0,
  style,
  contentStyle,
  children,
  testID,
  ...scrollProps
}) {
  const { colors, sp } = useThemeTokens();
  const insets         = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        testID={testID}
        style={[{ flex: 1, backgroundColor: colors.background }, style]}
        contentContainerStyle={[
          {
            paddingHorizontal: paddingX ? sp[4] : 0,
            paddingBottom:     insets.bottom + bottomOffset + sp[6],
          },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

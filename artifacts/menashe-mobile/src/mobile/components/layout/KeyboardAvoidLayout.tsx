/**
 * KeyboardAvoidLayout
 * MMDL layout — KeyboardAvoidingView wrapper with sane defaults.
 */

import React, { memo } from "react";
import {
  KeyboardAvoidingView, Platform,
  type StyleProp, type ViewStyle,
} from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

interface KeyboardAvoidLayoutProps {
  style?:     StyleProp<ViewStyle>;
  children?:  React.ReactNode;
  testID?:    string;
}

export const KeyboardAvoidLayout = memo<KeyboardAvoidLayoutProps>(function KeyboardAvoidLayout({
  style,
  children,
  testID,
}) {
  const { colors } = useThemeTokens();

  return (
    <KeyboardAvoidingView
      testID={testID}
      style={[{ flex: 1, backgroundColor: colors.background }, style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      {children}
    </KeyboardAvoidingView>
  );
});

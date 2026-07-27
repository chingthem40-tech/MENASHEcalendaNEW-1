/**
 * Section
 * MMDL layout — named content section with title and optional trailing action.
 */

import React, { memo } from "react";
import { View, Text, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

interface SectionProps {
  title?:       string;
  actionLabel?: string;
  onAction?:    () => void;
  /** Vertical gap above this section (default: true = full sectionGap) */
  topGap?:      boolean;
  style?:       StyleProp<ViewStyle>;
  children?:    React.ReactNode;
  testID?:      string;
}

export const Section = memo<SectionProps>(function Section({
  title,
  actionLabel,
  onAction,
  topGap  = false,
  style,
  children,
  testID,
}) {
  const { colors, type, sp, layout } = useThemeTokens();

  return (
    <View
      testID={testID}
      style={[
        { marginTop: topGap ? layout.section.gap : 0 },
        style,
      ]}
    >
      {title && (
        <View
          style={{
            flexDirection:  "row",
            alignItems:     "center",
            justifyContent: "space-between",
            marginBottom:   sp[3],
          }}
        >
          <Text style={[type.subtitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
          {actionLabel && onAction && (
            <Pressable
              onPress={onAction}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              hitSlop={8}
            >
              <Text style={[type.label, { color: colors.primary }]}>
                {actionLabel}
              </Text>
            </Pressable>
          )}
        </View>
      )}
      {children}
    </View>
  );
});

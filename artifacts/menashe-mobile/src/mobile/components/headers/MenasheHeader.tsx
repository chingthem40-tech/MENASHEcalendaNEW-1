/**
 * MenasheHeader
 * MMDL header — standard screen header with back, title, and actions.
 *
 * Variants: standard · large · transparent · glass
 */

import React, { memo } from "react";
import { View, Text, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

export type HeaderVariant = "standard" | "large" | "transparent" | "glass";

interface MenasheHeaderProps {
  title?:              string;
  subtitle?:           string;
  variant?:            HeaderVariant;
  onBack?:             () => void;
  /** Up to 3 action icons on the right */
  actions?:            Array<{
    icon:  React.ComponentProps<typeof Feather>["name"];
    label: string;
    onPress: () => void;
  }>;
  /** Whether to add top inset padding */
  safeTop?:            boolean;
  style?:              StyleProp<ViewStyle>;
  testID?:             string;
  accessibilityLabel?: string;
}

export const MenasheHeader = memo<MenasheHeaderProps>(function MenasheHeader({
  title,
  subtitle,
  variant    = "standard",
  onBack,
  actions    = [],
  safeTop    = false,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, type, sp } = useThemeTokens();
  const insets               = useSafeAreaInsets();

  const bg =
    variant === "transparent" ? "transparent" :
    variant === "glass"       ? colors.glassBg :
    colors.surface;

  const borderBottom =
    variant === "standard" ? { borderBottomWidth: 1, borderBottomColor: colors.border } :
    {};

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          flexDirection:     "row",
          alignItems:        "center",
          height:            56,
          paddingTop:        safeTop ? insets.top : 0,
          paddingHorizontal: sp[4],
          backgroundColor:   bg,
          gap:               sp[2],
          ...borderBottom,
        },
        style,
      ]}
    >
      {onBack && (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
      )}

      <View style={{ flex: 1 }}>
        {title && (
          <Text style={[type.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[type.caption, { color: colors.textMuted, marginTop: 1 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          hitSlop={8}
          style={({ pressed }) => ({
            padding: sp[2],
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Feather name={action.icon} size={22} color={colors.textSecondary} />
        </Pressable>
      ))}
    </View>
  );
});

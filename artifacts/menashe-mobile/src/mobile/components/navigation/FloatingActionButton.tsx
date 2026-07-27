/**
 * FloatingActionButton
 * MMDL navigation — FAB for the primary screen action.
 *
 * Variants: standard(56dp) · mini(40dp) · extended(with label)
 */

import React, { memo } from "react";
import { Pressable, View, Text, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

export type FabVariant = "standard" | "mini" | "extended";

interface FloatingActionButtonProps {
  icon:                React.ComponentProps<typeof Feather>["name"];
  label?:              string;
  variant?:            FabVariant;
  onPress?:            () => void;
  disabled?:           boolean;
  style?:              StyleProp<ViewStyle>;
  testID?:             string;
  accessibilityLabel:  string;
}

export const FloatingActionButton = memo<FloatingActionButtonProps>(function FloatingActionButton({
  icon,
  label,
  variant  = "standard",
  onPress,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, type, sp, rd, shadow } = useThemeTokens();

  const size     = variant === "mini" ? 40 : 56;
  const iconSize = variant === "mini" ? 18 : 24;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          flexDirection:   variant === "extended" ? "row" : "column",
          alignItems:      "center",
          justifyContent:  "center",
          gap:             sp[2],
          backgroundColor: colors.primary,
          borderRadius:    variant === "extended" ? rd.pill : rd.circle,
          width:           variant === "extended" ? undefined : size,
          height:          variant === "extended" ? size : size,
          paddingHorizontal: variant === "extended" ? sp[5] : undefined,
          opacity:         disabled ? 0.5 : pressed ? 0.82 : 1,
          transform:       [{ scale: pressed && !disabled ? 0.94 : 1 }],
          ...shadow.floating,
        },
        style,
      ]}
    >
      <Feather name={icon} size={iconSize} color={colors.primaryForeground} />
      {variant === "extended" && label && (
        <Text
          style={[type.label, { color: colors.primaryForeground }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
});

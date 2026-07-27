/**
 * MenasheIconButton
 * MMDL foundation — icon-only pressable with minimum 44dp touch target.
 *
 * Variants: ghost · filled · outlined · gold
 * Sizes:    sm · md · lg
 */

import React, { memo } from "react";
import {
  Pressable,
  type StyleProp, type ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

export type IconButtonVariant = "ghost" | "filled" | "outlined" | "gold";
export type IconButtonSize    = "sm" | "md" | "lg";

interface MenasheIconButtonProps {
  name:                React.ComponentProps<typeof Feather>["name"];
  onPress?:            () => void;
  variant?:            IconButtonVariant;
  size?:               IconButtonSize;
  disabled?:           boolean;
  loading?:            boolean;
  style?:              StyleProp<ViewStyle>;
  testID?:             string;
  accessibilityLabel:  string;
}

const ICON_SZ  = { sm: 18, md: 22, lg: 26 } as const;
const TOUCH_SZ = { sm: 44, md: 44, lg: 44 } as const;

export const MenasheIconButton = memo<MenasheIconButtonProps>(function MenasheIconButton({
  name,
  onPress,
  variant  = "ghost",
  size     = "md",
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, rd } = useThemeTokens();

  const iconColor =
    variant === "gold"     ? colors.accentGold :
    variant === "filled"   ? colors.primaryForeground :
    variant === "outlined"  ? colors.primary :
    colors.textSecondary;

  const bg =
    variant === "filled"  ? colors.primary :
    variant === "gold"    ? colors.accentGoldMuted :
    "transparent";

  const borderColor =
    variant === "outlined" ? colors.primary : "transparent";

  const touchSize = TOUCH_SZ[size];
  const iconSize  = ICON_SZ[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          width:           touchSize,
          height:          touchSize,
          alignItems:      "center",
          justifyContent:  "center",
          borderRadius:    variant !== "ghost" ? rd.sm : 0,
          backgroundColor: bg,
          borderWidth:     variant === "outlined" ? 1 : 0,
          borderColor,
          opacity:         disabled ? 0.4 : pressed ? 0.7 : 1,
          transform:       [{ scale: pressed && !disabled ? 0.92 : 1 }],
        },
        style,
      ]}
    >
      <Feather name={name} size={iconSize} color={iconColor} />
    </Pressable>
  );
});

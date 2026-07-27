/**
 * MenasheCard
 * MMDL foundation — themed card container.
 *
 * Purpose: General-purpose content container.
 * Variants: default · glass · bordered · elevated · flat
 */

import React, { memo } from "react";
import {
  Pressable, View,
  type StyleProp, type ViewStyle, type PressableProps,
} from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

export type CardVariant = "default" | "bordered" | "elevated" | "flat";

interface MenasheCardProps {
  variant?:            CardVariant;
  /** If provided, the card is pressable */
  onPress?:            () => void;
  disabled?:           boolean;
  style?:              StyleProp<ViewStyle>;
  contentStyle?:       StyleProp<ViewStyle>;
  testID?:             string;
  accessibilityLabel?: string;
  children?:           React.ReactNode;
}

export const MenasheCard = memo<MenasheCardProps>(function MenasheCard({
  variant = "default",
  onPress,
  disabled = false,
  style,
  contentStyle,
  testID,
  accessibilityLabel,
  children,
}) {
  const { colors, rd, shadow, sp } = useThemeTokens();

  const baseStyle: ViewStyle = {
    backgroundColor: colors.surfacePrimary,
    borderRadius:    rd.lg,
    paddingHorizontal: sp[4],
    paddingVertical:   sp[3],
    opacity: disabled ? 0.5 : 1,
  };

  // MMDS-005: semantic roles only — no raw colors, no opacity hacks, no
  // duplicated card colors. Each variant expresses depth through the
  // surface/border scale, not through ad-hoc shades.
  const variantStyle: ViewStyle =
    variant === "bordered"  ? { borderWidth: 1, borderColor: colors.borderDefault } :
    variant === "elevated"  ? { backgroundColor: colors.surfaceTertiary, ...shadow.level2 } :
    variant === "flat"      ? { backgroundColor: colors.backgroundElevated } :
    { borderWidth: 1, borderColor: colors.borderSoft, ...shadow.level1 };

  const inner = (
    <View style={[baseStyle, variantStyle, contentStyle]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View testID={testID} style={style}>{inner}</View>;
});

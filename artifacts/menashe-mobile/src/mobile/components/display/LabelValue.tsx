/**
 * LabelValue
 * MMDL display — label + value row, used in detail lists and info panels.
 */

import React, { memo } from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

type Direction = "row" | "column";

interface LabelValueProps {
  label:       string;
  value:       string;
  direction?:  Direction;
  /** Muted label, prominent value (default) */
  emphasis?:   "value" | "label" | "equal";
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
  accessibilityLabel?: string;
}

export const LabelValue = memo<LabelValueProps>(function LabelValue({
  label,
  value,
  direction = "row",
  emphasis  = "value",
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, type, sp } = useThemeTokens();

  const labelStyle = [
    type.label,
    {
      color:
        emphasis === "label" ? colors.textPrimary :
        colors.textMuted,
      fontSize: 13 as const,
    },
  ];

  const valueStyle = [
    type.body,
    {
      color:
        emphasis === "value" ? colors.textPrimary :
        emphasis === "label" ? colors.textSecondary :
        colors.textPrimary,
    },
  ];

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
      style={[
        direction === "row"
          ? { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }
          : { gap: sp[0.5] },
        style,
      ]}
    >
      <Text style={labelStyle}>{label}</Text>
      <Text style={valueStyle} numberOfLines={direction === "row" ? 1 : 3}>
        {value}
      </Text>
    </View>
  );
});

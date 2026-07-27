/**
 * MenasheChip
 * MMDL foundation — filter chip, tag, and category pill.
 *
 * Variants: filter · tag · status · selectable
 */

import React, { memo } from "react";
import {
  Pressable, Text, View,
  type StyleProp, type ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

export type ChipVariant = "filter" | "tag" | "status" | "selectable";

interface MenasheChipProps {
  label:               string;
  variant?:            ChipVariant;
  selected?:           boolean;
  disabled?:           boolean;
  onPress?:            () => void;
  onRemove?:           () => void;
  leadingIcon?:        React.ComponentProps<typeof Feather>["name"];
  style?:              StyleProp<ViewStyle>;
  testID?:             string;
  accessibilityLabel?: string;
}

export const MenasheChip = memo<MenasheChipProps>(function MenasheChip({
  label,
  variant   = "filter",
  selected  = false,
  disabled  = false,
  onPress,
  onRemove,
  leadingIcon,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, type, sp, rd } = useThemeTokens();

  const bg =
    selected ? colors.primaryMuted :
    colors.surface;

  const borderColor =
    selected ? colors.primary :
    colors.border;

  const textColor =
    selected ? colors.primary :
    colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        {
          flexDirection:   "row",
          alignItems:      "center",
          gap:             sp[1],
          paddingHorizontal: sp[3],
          paddingVertical:   sp[1],
          borderRadius:    rd.pill,
          backgroundColor: bg,
          borderWidth:     1,
          borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
          minHeight: 32,
        },
        style,
      ]}
    >
      {leadingIcon && (
        <Feather name={leadingIcon} size={14} color={textColor} />
      )}
      <Text style={[type.label, { color: textColor, fontSize: 13 }]} numberOfLines={1}>
        {label}
      </Text>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityLabel={`Remove ${label}`}
        >
          <Feather name="x" size={12} color={textColor} />
        </Pressable>
      )}
    </Pressable>
  );
});

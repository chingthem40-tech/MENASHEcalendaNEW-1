/**
 * Checkbox + Radio
 * MMDL input — checkbox and radio button with label.
 */

import React, { memo } from "react";
import { Pressable, View, Text, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

// ─── Checkbox ─────────────────────────────────────────────────────────────────

interface CheckboxProps {
  value:        boolean;
  onChange:     (value: boolean) => void;
  label?:       string;
  disabled?:    boolean;
  indeterminate?: boolean;
  style?:       StyleProp<ViewStyle>;
  testID?:      string;
  accessibilityLabel?: string;
}

export const Checkbox = memo<CheckboxProps>(function Checkbox({
  value,
  onChange,
  label,
  disabled       = false,
  indeterminate  = false,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, type, sp, rd } = useThemeTokens();

  const bg =
    value || indeterminate ? colors.primary : "transparent";

  const iconName: React.ComponentProps<typeof Feather>["name"] =
    indeterminate ? "minus" : "check";

  return (
    <Pressable
      testID={testID}
      onPress={() => !disabled && onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label ?? "Checkbox"}
      accessibilityState={{ checked: indeterminate ? "mixed" : value, disabled }}
      style={[
        {
          flexDirection: "row",
          alignItems:    "center",
          gap:           sp[3],
          minHeight:     44,
          opacity:       disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View
        style={{
          width:           22,
          height:          22,
          borderRadius:    rd.xs,
          borderWidth:     1.5,
          borderColor:     value || indeterminate ? colors.primary : colors.border,
          backgroundColor: bg,
          alignItems:      "center",
          justifyContent:  "center",
        }}
      >
        {(value || indeterminate) && (
          <Feather name={iconName} size={14} color={colors.primaryForeground} />
        )}
      </View>
      {label && (
        <Text style={[type.body, { flex: 1, color: colors.textPrimary }]}>{label}</Text>
      )}
    </Pressable>
  );
});

// ─── Radio ────────────────────────────────────────────────────────────────────

interface RadioProps {
  selected:    boolean;
  onSelect:    () => void;
  label?:      string;
  disabled?:   boolean;
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
  accessibilityLabel?: string;
}

export const Radio = memo<RadioProps>(function Radio({
  selected,
  onSelect,
  label,
  disabled   = false,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, type, sp } = useThemeTokens();

  return (
    <Pressable
      testID={testID}
      onPress={() => !disabled && onSelect()}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? label ?? "Radio"}
      accessibilityState={{ checked: selected, disabled }}
      style={[
        {
          flexDirection: "row",
          alignItems:    "center",
          gap:           sp[3],
          minHeight:     44,
          opacity:       disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {/* Outer ring */}
      <View
        style={{
          width:           22,
          height:          22,
          borderRadius:    11,
          borderWidth:     1.5,
          borderColor:     selected ? colors.primary : colors.border,
          alignItems:      "center",
          justifyContent:  "center",
        }}
      >
        {selected && (
          <View
            style={{
              width:           12,
              height:          12,
              borderRadius:    6,
              backgroundColor: colors.primary,
            }}
          />
        )}
      </View>
      {label && (
        <Text style={[type.body, { flex: 1, color: colors.textPrimary }]}>{label}</Text>
      )}
    </Pressable>
  );
});

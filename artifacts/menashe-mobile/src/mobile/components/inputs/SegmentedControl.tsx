/**
 * SegmentedControl
 * MMDL input — multi-option horizontal picker (like iOS UISegmentedControl).
 */

import React, { memo } from "react";
import { View, Text, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

interface Segment {
  label:  string;
  value:  string;
}

interface SegmentedControlProps {
  segments:   Segment[];
  value:      string;
  onChange:   (value: string) => void;
  disabled?:  boolean;
  style?:     StyleProp<ViewStyle>;
  testID?:    string;
}

export const SegmentedControl = memo<SegmentedControlProps>(function SegmentedControl({
  segments,
  value,
  onChange,
  disabled = false,
  style,
  testID,
}) {
  const { colors, type, sp, rd } = useThemeTokens();

  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection:   "row",
          backgroundColor: colors.surface,
          borderRadius:    rd.md,
          padding:         3,
          opacity:         disabled ? 0.5 : 1,
        },
        style,
      ]}
      accessibilityRole="tablist"
    >
      {segments.map((seg) => {
        const isActive = seg.value === value;
        return (
          <Pressable
            key={seg.value}
            onPress={() => !disabled && onChange(seg.value)}
            accessibilityRole="tab"
            accessibilityLabel={seg.label}
            accessibilityState={{ selected: isActive }}
            style={{
              flex:            1,
              paddingVertical: sp[1.5],
              borderRadius:    rd.sm,
              backgroundColor: isActive ? colors.card : "transparent",
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <Text
              style={[
                type.label,
                {
                  fontSize: 13,
                  color:    isActive ? colors.textPrimary : colors.textMuted,
                  fontWeight: isActive ? "600" : "400",
                },
              ]}
              numberOfLines={1}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

/**
 * QuickToolCard
 * MMDL display card — quick-access shortcut tile for a 2-column grid.
 */

import React, { memo } from "react";
import { Pressable, View, Text, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

interface QuickToolCardProps {
  iconName:            React.ComponentProps<typeof Feather>["name"];
  label:               string;
  sub?:                string;
  onPress?:            () => void;
  disabled?:           boolean;
  style?:              StyleProp<ViewStyle>;
  testID?:             string;
  accessibilityLabel?: string;
}

export const QuickToolCard = memo<QuickToolCardProps>(function QuickToolCard({
  iconName,
  label,
  sub,
  onPress,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, type, sp, rd, shadow } = useThemeTokens();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        {
          backgroundColor: colors.card,
          borderRadius:    rd.lg,
          padding:         sp[4],
          alignItems:      "center",
          justifyContent:  "center",
          gap:             sp[2],
          borderWidth:     1,
          borderColor:     colors.cardBorder,
          opacity:         disabled ? 0.5 : pressed ? 0.8 : 1,
          transform:       [{ scale: pressed && !disabled ? 0.96 : 1 }],
          ...shadow.level1,
          aspectRatio: 1,
        },
        style,
      ]}
    >
      <View
        style={{
          width:           52,
          height:          52,
          borderRadius:    rd.md,
          backgroundColor: colors.primaryMuted,
          alignItems:      "center",
          justifyContent:  "center",
        }}
      >
        <Feather name={iconName} size={26} color={colors.primary} />
      </View>
      <Text style={[type.label, { color: colors.textPrimary, textAlign: "center" }]}>
        {label}
      </Text>
      {sub && (
        <Text style={[type.caption, { color: colors.textMuted, textAlign: "center" }]}>
          {sub}
        </Text>
      )}
    </Pressable>
  );
});

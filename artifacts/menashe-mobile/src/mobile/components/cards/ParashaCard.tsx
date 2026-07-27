/**
 * ParashaCard
 * MMDL display card — weekly Torah portion.
 * Accepts all values as props — no business logic.
 */

import React, { memo } from "react";
import { View, Text, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

interface ParashaCardProps {
  label?:      string;      // e.g. "This Week's Parasha"
  name:        string;      // e.g. "Korach"
  hebrewName?: string;      // e.g. "קֹרַח"
  summary?:    string;
  onPress?:    () => void;
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
}

export const ParashaCard = memo<ParashaCardProps>(function ParashaCard({
  label   = "Weekly Parasha",
  name,
  hebrewName,
  summary,
  onPress,
  style,
  testID,
}) {
  const { colors, type, sp, rd, shadow } = useThemeTokens();

  const content = (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius:    rd.lg,
        paddingHorizontal: sp[4],
        paddingVertical:   sp[4],
        flexDirection:   "row",
        gap:             sp[3],
        ...shadow.level1,
      }}
    >
      {/* Gold left bar */}
      <View
        style={{
          width:           3,
          borderRadius:    2,
          backgroundColor: colors.accentGold,
          alignSelf:       "stretch",
        }}
      />

      <View style={{ flex: 1 }}>
        <Text style={[type.overline, { color: colors.accentGold }]}>
          {label.toUpperCase()}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "baseline", gap: sp[2], marginTop: sp[1] }}>
          <Text style={[type.title, { color: colors.textPrimary }]}>{name}</Text>
          {hebrewName && (
            <Text style={[type.hebrewBody, { color: colors.textMuted }]}>{hebrewName}</Text>
          )}
        </View>

        {summary && (
          <Text
            style={[type.bodySm, { color: colors.textSecondary, marginTop: sp[1] }]}
            numberOfLines={2}
          >
            {summary}
          </Text>
        )}
      </View>

      {onPress && (
        <Feather name="chevron-right" size={18} color={colors.textMuted} style={{ alignSelf: "center" }} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Parasha: ${name}`}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View testID={testID} style={style}>{content}</View>;
});

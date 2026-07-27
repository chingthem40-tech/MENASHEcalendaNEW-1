/**
 * HolidayCard
 * MMDL display card — upcoming Jewish holiday or event.
 */

import React, { memo } from "react";
import { View, Text, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

interface HolidayCardProps {
  name:        string;
  hebrewName?: string;
  date:        string;
  daysAway?:   number;
  category?:   "major" | "minor" | "fast" | "special";
  onPress?:    () => void;
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
}

const CATEGORY_COLOR: Record<string, string> = {};

export const HolidayCard = memo<HolidayCardProps>(function HolidayCard({
  name,
  hebrewName,
  date,
  daysAway,
  category = "major",
  onPress,
  style,
  testID,
}) {
  const { colors, type, sp, rd } = useThemeTokens();

  const accentColor =
    category === "major"   ? colors.accentGold :
    category === "fast"    ? colors.textMuted :
    category === "special" ? colors.primary :
    colors.accentOlive;

  const content = (
    <View
      style={{
        flexDirection:   "row",
        alignItems:      "center",
        paddingHorizontal: sp[4],
        paddingVertical:   sp[3],
        backgroundColor: colors.card,
        borderRadius:    rd.md,
        gap:             sp[3],
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[type.label, { color: colors.textPrimary }]} numberOfLines={1}>
          {name}
        </Text>
        {hebrewName && (
          <Text style={[type.hebrewBody, { color: colors.textMuted, fontSize: 13 }]}>
            {hebrewName}
          </Text>
        )}
        <Text style={[type.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {date}
        </Text>
      </View>
      {daysAway !== undefined && (
        <View style={{ alignItems: "center" }}>
          <Text style={[type.title, { color: accentColor, lineHeight: 28 }]}>
            {daysAway}
          </Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>
            {daysAway === 1 ? "day" : "days"}
          </Text>
        </View>
      )}
      {onPress && (
        <Feather name="chevron-right" size={16} color={colors.textMuted} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${name} — ${date}`}
        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View testID={testID} style={style}>{content}</View>;
});

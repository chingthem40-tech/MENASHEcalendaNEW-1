/**
 * DateCard
 * MMDL display card — Hebrew + Gregorian date hero card.
 * Accepts all values as props — no business logic.
 */

import React, { memo } from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

interface DateCardProps {
  hebrewDate:    string;   // e.g. "כ״ח בְּסִיוָן"
  hebrewMonth?:  string;   // e.g. "סִיוָן"
  gregorianDate: string;   // e.g. "July 1, 2026"
  dayOfWeek:     string;   // e.g. "Wednesday"
  style?:        StyleProp<ViewStyle>;
  testID?:       string;
}

export const DateCard = memo<DateCardProps>(function DateCard({
  hebrewDate,
  hebrewMonth,
  gregorianDate,
  dayOfWeek,
  style,
  testID,
}) {
  const { colors, type, sp, rd, shadow } = useThemeTokens();

  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius:    rd.xl,
          paddingHorizontal: sp[5],
          paddingVertical:   sp[5],
          alignItems:      "center",
          ...shadow.level2,
        },
        style,
      ]}
    >
      <Text style={[type.overline, { color: colors.accentGold, letterSpacing: 2 }]}>
        {dayOfWeek.toUpperCase()}
      </Text>

      <Text
        style={[
          type.hebrewLg,
          { color: colors.textPrimary, marginTop: sp[2], textAlign: "center" },
        ]}
      >
        {hebrewDate}
      </Text>

      {hebrewMonth && (
        <Text style={[type.bodySm, { color: colors.textMuted, marginTop: sp[0.5] }]}>
          {hebrewMonth}
        </Text>
      )}

      {/* Gold divider */}
      <View
        style={{
          width:           40,
          height:          1,
          backgroundColor: colors.accentGold,
          marginVertical:  sp[3],
          opacity:         0.6,
        }}
      />

      <Text style={[type.body, { color: colors.textSecondary }]}>
        {gregorianDate}
      </Text>
    </View>
  );
});

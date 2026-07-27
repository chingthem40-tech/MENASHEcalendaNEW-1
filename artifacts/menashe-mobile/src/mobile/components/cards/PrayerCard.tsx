/**
 * PrayerCard
 * MMDL display card — single Zmanim prayer time row.
 * Accepts all values as props — no business logic.
 */

import React, { memo } from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

interface PrayerCardProps {
  name:          string;
  time:          string;
  /** "next" | "passed" | "future" */
  status?:       "next" | "passed" | "future";
  /** Relative time label, e.g. "in 23 min" */
  relative?:     string;
  showIcon?:     boolean;
  style?:        StyleProp<ViewStyle>;
  testID?:       string;
  accessibilityLabel?: string;
}

export const PrayerCard = memo<PrayerCardProps>(function PrayerCard({
  name,
  time,
  status   = "future",
  relative,
  showIcon = true,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, type, sp, rd } = useThemeTokens();

  const isNext   = status === "next";
  const isPassed = status === "passed";

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? `${name}: ${time}`}
      style={[
        {
          flexDirection:   "row",
          alignItems:      "center",
          paddingHorizontal: sp[4],
          paddingVertical:   sp[2.5],
          borderRadius:    rd.md,
          backgroundColor: isNext ? colors.primaryMuted : "transparent",
          opacity:         isPassed ? 0.55 : 1,
          gap:             sp[3],
        },
        style,
      ]}
    >
      {showIcon && (
        <View
          style={{
            width:           36,
            height:          36,
            borderRadius:    rd.sm,
            backgroundColor: isNext ? colors.primary : colors.surface,
            alignItems:      "center",
            justifyContent:  "center",
          }}
        >
          <Feather
            name="sun"
            size={16}
            color={isNext ? colors.primaryForeground : colors.textMuted}
          />
        </View>
      )}

      <Text
        style={[
          type.body,
          {
            flex:       1,
            color:      isNext ? colors.primary : colors.textPrimary,
            fontWeight: isNext ? "600" : "400",
          },
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>

      <View style={{ alignItems: "flex-end" }}>
        <Text
          style={[
            type.body,
            {
              color:      isNext ? colors.primary : colors.textSecondary,
              fontWeight: isNext ? "600" : "400",
            },
          ]}
        >
          {time}
        </Text>
        {relative && (
          <Text style={[type.caption, { color: colors.accentGold }]}>{relative}</Text>
        )}
      </View>
    </View>
  );
});

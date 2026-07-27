/**
 * StatisticCard
 * MMDL display card — KPI metric with label and optional trend.
 */

import React, { memo } from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

interface StatisticCardProps {
  value:       string;
  label:       string;
  trend?:      "up" | "down" | "flat";
  trendLabel?: string;
  iconName?:   React.ComponentProps<typeof Feather>["name"];
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
}

export const StatisticCard = memo<StatisticCardProps>(function StatisticCard({
  value,
  label,
  trend,
  trendLabel,
  iconName,
  style,
  testID,
}) {
  const { colors, type, sp, rd, shadow } = useThemeTokens();

  const trendColor =
    trend === "up"   ? colors.success :
    trend === "down" ? colors.error :
    colors.textMuted;

  const trendIcon: React.ComponentProps<typeof Feather>["name"] =
    trend === "up"   ? "trending-up" :
    trend === "down" ? "trending-down" :
    "minus";

  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius:    rd.lg,
          padding:         sp[4],
          gap:             sp[2],
          ...shadow.level1,
        },
        style,
      ]}
    >
      {iconName && (
        <View
          style={{
            width:  36,
            height: 36,
            borderRadius: rd.sm,
            backgroundColor: colors.primaryMuted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={iconName} size={18} color={colors.primary} />
        </View>
      )}
      <Text style={[type.display, { color: colors.textPrimary, lineHeight: 40 }]}>
        {value}
      </Text>
      <Text style={[type.label, { color: colors.textMuted }]}>{label}</Text>
      {trend && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: sp[1] }}>
          <Feather name={trendIcon} size={13} color={trendColor} />
          {trendLabel && (
            <Text style={[type.caption, { color: trendColor }]}>{trendLabel}</Text>
          )}
        </View>
      )}
    </View>
  );
});

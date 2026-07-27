/**
 * CountdownCard
 * MMDL display card — time countdown to an event.
 */

import React, { memo } from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

interface CountdownUnit {
  value: number;
  label: string;
}

interface CountdownCardProps {
  title:   string;
  units:   CountdownUnit[];  // e.g. [{ value: 2, label: "days" }, { value: 14, label: "hours" }]
  sub?:    string;
  style?:  StyleProp<ViewStyle>;
  testID?: string;
}

export const CountdownCard = memo<CountdownCardProps>(function CountdownCard({
  title,
  units,
  sub,
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
          padding:         sp[5],
          alignItems:      "center",
          gap:             sp[3],
          ...shadow.level2,
        },
        style,
      ]}
    >
      <Text style={[type.overline, { color: colors.accentGold, letterSpacing: 2 }]}>
        {title.toUpperCase()}
      </Text>

      <View style={{ flexDirection: "row", gap: sp[4] }}>
        {units.map((unit) => (
          <View key={unit.label} style={{ alignItems: "center", minWidth: 52 }}>
            <Text style={[type.display, { color: colors.textPrimary, lineHeight: 42 }]}>
              {String(unit.value).padStart(2, "0")}
            </Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>{unit.label}</Text>
          </View>
        ))}
      </View>

      {sub && (
        <Text style={[type.caption, { color: colors.textSecondary }]}>{sub}</Text>
      )}
    </View>
  );
});

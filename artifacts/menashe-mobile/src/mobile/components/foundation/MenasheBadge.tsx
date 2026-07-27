/**
 * MenasheBadge
 * MMDL foundation — notification count, dot, or label badge.
 *
 * Variants: count · dot · label · status
 */

import React, { memo } from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

export type BadgeVariant = "count" | "dot" | "label" | "status";
export type BadgeColor   = "default" | "error" | "success" | "gold" | "warning";

interface MenasheBadgeProps {
  variant?:  BadgeVariant;
  color?:    BadgeColor;
  count?:    number;
  label?:    string;
  size?:     "sm" | "md";
  style?:    StyleProp<ViewStyle>;
  testID?:   string;
  /** Wrap children — badge appears as overlay */
  children?: React.ReactNode;
}

const MAX_COUNT = 99;

export const MenasheBadge = memo<MenasheBadgeProps>(function MenasheBadge({
  variant  = "count",
  color    = "error",
  count    = 0,
  label    = "",
  size     = "md",
  style,
  testID,
  children,
}) {
  const { colors, type, rd } = useThemeTokens();

  const bg =
    color === "gold"    ? colors.accentGold :
    color === "success" ? colors.success :
    color === "warning" ? colors.warning :
    color === "default" ? colors.surface :
    colors.error;

  const textColor =
    color === "gold" ? colors.primaryForeground :
    "#ffffff";

  const dotSize = size === "sm" ? 8 : 10;
  const badgeH  = size === "sm" ? 18 : 22;

  const badge =
    variant === "dot" ? (
      <View
        testID={testID}
        style={[
          { width: dotSize, height: dotSize, borderRadius: rd.circle, backgroundColor: bg },
          style,
        ]}
      />
    ) : (
      <View
        testID={testID}
        style={[
          {
            minWidth:        badgeH,
            height:          badgeH,
            borderRadius:    rd.pill,
            backgroundColor: bg,
            alignItems:      "center",
            justifyContent:  "center",
            paddingHorizontal: 5,
          },
          style,
        ]}
      >
        <Text
          style={[type.overline, { color: textColor, fontSize: size === "sm" ? 9 : 10, lineHeight: 13 }]}
          allowFontScaling={false}
        >
          {variant === "count" ? (count > MAX_COUNT ? `${MAX_COUNT}+` : String(count)) : label}
        </Text>
      </View>
    );

  if (!children) return badge;

  return (
    <View style={{ position: "relative" }}>
      {children}
      <View style={{ position: "absolute", top: -4, right: -4 }}>
        {badge}
      </View>
    </View>
  );
});

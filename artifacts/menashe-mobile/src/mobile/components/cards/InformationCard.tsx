/**
 * InformationCard
 * MMDL display card — general informational block with title, body, optional CTA.
 */

import React, { memo } from "react";
import { View, Text, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

type InfoVariant = "default" | "info" | "warning" | "success" | "gold";

interface InformationCardProps {
  title?:      string;
  body:        string;
  variant?:    InfoVariant;
  iconName?:   React.ComponentProps<typeof Feather>["name"];
  ctaLabel?:   string;
  onCta?:      () => void;
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
}

export const InformationCard = memo<InformationCardProps>(function InformationCard({
  title,
  body,
  variant   = "default",
  iconName,
  ctaLabel,
  onCta,
  style,
  testID,
}) {
  const { colors, type, sp, rd } = useThemeTokens();

  const accentColor =
    variant === "info"    ? colors.info :
    variant === "warning" ? colors.warning :
    variant === "success" ? colors.success :
    variant === "gold"    ? colors.accentGold :
    colors.primary;

  const bgColor =
    variant === "info"    ? colors.infoMuted :
    variant === "warning" ? colors.warningMuted :
    variant === "success" ? colors.successMuted :
    variant === "gold"    ? colors.accentGoldMuted :
    colors.primaryMuted;

  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: bgColor,
          borderRadius:    rd.lg,
          padding:         sp[4],
          gap:             sp[2],
          borderWidth:     1,
          borderColor:     accentColor + "30",
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2] }}>
        {iconName && <Feather name={iconName} size={18} color={accentColor} />}
        {title && (
          <Text style={[type.label, { color: accentColor, flex: 1 }]} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
      <Text style={[type.bodySm, { color: colors.textSecondary }]}>{body}</Text>
      {ctaLabel && onCta && (
        <Pressable onPress={onCta} accessibilityRole="button" accessibilityLabel={ctaLabel}>
          <Text style={[type.label, { color: accentColor }]}>{ctaLabel}</Text>
        </Pressable>
      )}
    </View>
  );
});

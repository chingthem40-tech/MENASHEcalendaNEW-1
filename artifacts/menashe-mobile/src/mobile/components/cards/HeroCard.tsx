/**
 * HeroCard
 * MMDL display card — large hero banner for feature highlights.
 */

import React, { memo } from "react";
import { View, Text, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";
import { MenasheButton } from "../foundation/MenasheButton";

interface HeroCardProps {
  eyebrow?:    string;
  title:       string;
  subtitle?:   string;
  ctaLabel?:   string;
  onCta?:      () => void;
  onDismiss?:  () => void;
  /** Feather icon for decorative background */
  decorIcon?:  React.ComponentProps<typeof Feather>["name"];
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
}

export const HeroCard = memo<HeroCardProps>(function HeroCard({
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  onCta,
  onDismiss,
  decorIcon,
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
          gap:             sp[3],
          overflow:        "hidden",
          borderWidth:     1,
          borderColor:     colors.accentGoldMuted,
          ...shadow.level2,
        },
        style,
      ]}
    >
      {/* Decorative background icon */}
      {decorIcon && (
        <View
          style={{
            position:  "absolute",
            right:     -12,
            top:       -12,
            opacity:   0.05,
          }}
          pointerEvents="none"
        >
          <Feather name={decorIcon} size={100} color={colors.accentGold} />
        </View>
      )}

      {onDismiss && (
        <Pressable
          onPress={onDismiss}
          style={{ position: "absolute", top: sp[3], right: sp[3] }}
          accessibilityLabel="Dismiss"
          hitSlop={8}
        >
          <Feather name="x" size={18} color={colors.textMuted} />
        </Pressable>
      )}

      {eyebrow && (
        <Text style={[type.overline, { color: colors.accentGold }]}>
          {eyebrow.toUpperCase()}
        </Text>
      )}

      <Text style={[type.title, { color: colors.textPrimary }]}>{title}</Text>

      {subtitle && (
        <Text style={[type.body, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}

      {ctaLabel && onCta && (
        <MenasheButton
          label={ctaLabel}
          onPress={onCta}
          variant="gold-outline"
          size="sm"
        />
      )}
    </View>
  );
});

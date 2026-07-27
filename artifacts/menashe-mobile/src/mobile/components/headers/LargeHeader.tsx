/**
 * LargeHeader
 * MMDL header — large display header for top-level screens.
 * Features display-size title with gold accent underline.
 */

import React, { memo } from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

interface LargeHeaderProps {
  title:       string;
  subtitle?:   string;
  /** Overline label above the title (e.g. "Today") */
  eyebrow?:    string;
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
}

export const LargeHeader = memo<LargeHeaderProps>(function LargeHeader({
  title,
  subtitle,
  eyebrow,
  style,
  testID,
}) {
  const { colors, type, sp } = useThemeTokens();

  return (
    <View testID={testID} style={[{ paddingHorizontal: sp[4], paddingVertical: sp[4] }, style]}>
      {eyebrow && (
        <Text
          style={[type.overline, { color: colors.accentGold, marginBottom: sp[1] }]}
          allowFontScaling={false}
        >
          {eyebrow.toUpperCase()}
        </Text>
      )}
      <Text style={[type.heading, { color: colors.textPrimary }]} numberOfLines={2}>
        {title}
      </Text>
      {/* Gold accent underline */}
      <View
        style={{
          width:           40,
          height:          2,
          backgroundColor: colors.accentGold,
          borderRadius:    2,
          marginTop:       sp[2],
        }}
      />
      {subtitle && (
        <Text style={[type.bodyLg, { color: colors.textSecondary, marginTop: sp[2] }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
});

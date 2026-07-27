/**
 * MenasheAvatar
 * MMDL foundation — user avatar: image, initials, or icon fallback.
 *
 * Sizes: xs(24) · sm(32) · md(40) · lg(56) · xl(72)
 */

import React, { memo, useState } from "react";
import { View, Text, Image, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 24, sm: 32, md: 40, lg: 56, xl: 72,
};

interface MenasheAvatarProps {
  /** Remote image URI */
  uri?:                string;
  /** Initials to display when no image */
  initials?:           string;
  size?:               AvatarSize;
  /** Show online indicator dot */
  online?:             boolean;
  /** Border around avatar */
  bordered?:           boolean;
  style?:              StyleProp<ViewStyle>;
  testID?:             string;
  accessibilityLabel?: string;
}

export const MenasheAvatar = memo<MenasheAvatarProps>(function MenasheAvatar({
  uri,
  initials,
  size     = "md",
  online   = false,
  bordered = false,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, type, rd } = useThemeTokens();
  const [imgError, setImgError] = useState(false);

  const px        = SIZE_PX[size];
  const fontSizes: Record<AvatarSize, number> = { xs: 9, sm: 11, md: 14, lg: 18, xl: 22 };
  const fontSize  = fontSizes[size];

  const content =
    uri && !imgError ? (
      <Image
        source={{ uri }}
        style={{ width: px, height: px, borderRadius: rd.circle }}
        onError={() => setImgError(true)}
        accessible={false}
      />
    ) : initials ? (
      <Text
        style={[
          type.label,
          { fontSize, color: colors.primary, lineHeight: px * 0.38 },
        ]}
        allowFontScaling={false}
      >
        {initials.slice(0, 2).toUpperCase()}
      </Text>
    ) : (
      <Feather name="user" size={px * 0.45} color={colors.textMuted} />
    );

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width:           px,
          height:          px,
          borderRadius:    rd.circle,
          backgroundColor: colors.surface,
          alignItems:      "center",
          justifyContent:  "center",
          borderWidth:     bordered ? 1.5 : 0,
          borderColor:     colors.border,
        },
        style,
      ]}
    >
      {content}
      {online && (
        <View
          style={{
            position:        "absolute",
            bottom:           0,
            right:            0,
            width:            px * 0.28,
            height:           px * 0.28,
            borderRadius:    rd.circle,
            backgroundColor: colors.success,
            borderWidth:     2,
            borderColor:     colors.background,
          }}
        />
      )}
    </View>
  );
});

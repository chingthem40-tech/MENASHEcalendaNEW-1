/**
 * MenasheSurface
 * MMDL foundation primitive — themed background surface.
 *
 * Purpose: The outermost opaque surface for panels, sections, screens.
 * Variants: screen · section · panel · inset · card
 */

import React, { memo } from "react";
import { View, type ViewProps, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

export type SurfaceVariant = "screen" | "section" | "panel" | "inset" | "card";

interface MenasheSurfaceProps extends ViewProps {
  variant?: SurfaceVariant;
  /** Extra style overrides */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const BG_MAP: Record<SurfaceVariant, "background" | "surface" | "surfaceRaised" | "backgroundSubtle" | "card"> = {
  screen:  "background",
  section: "surface",
  panel:   "surfaceRaised",
  inset:   "backgroundSubtle",
  card:    "card",
};

export const MenasheSurface = memo<MenasheSurfaceProps>(function MenasheSurface({
  variant = "screen",
  style,
  children,
  ...rest
}) {
  const { colors, rd } = useThemeTokens();
  const bgKey = BG_MAP[variant];

  return (
    <View
      style={[
        {
          backgroundColor: colors[bgKey],
          borderRadius: variant === "panel" || variant === "inset" ? rd.lg : 0,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
});

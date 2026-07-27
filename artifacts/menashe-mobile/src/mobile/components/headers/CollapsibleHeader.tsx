/**
 * CollapsibleHeader
 * MMDL header — foundation for scroll-driven collapsing header.
 * Full animation wired in future SPR; this file is the structural scaffold.
 *
 * Usage: pass animatedValue from parent ScrollView and provide both
 * compact and expanded children. The parent drives the opacity/height.
 */

import React, { memo } from "react";
import { View, Animated, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";
import { MenasheHeader } from "./MenasheHeader";
import { LargeHeader }   from "./LargeHeader";

interface CollapsibleHeaderProps {
  title:         string;
  subtitle?:     string;
  eyebrow?:      string;
  onBack?:       () => void;
  actions?:      React.ComponentProps<typeof MenasheHeader>["actions"];
  /** Animated.Value from parent ScrollView (0 = top, >X = scrolled) */
  scrollY?:      Animated.Value;
  /** Scroll offset at which compact header fully appears */
  collapseAt?:   number;
  style?:        StyleProp<ViewStyle>;
  testID?:       string;
}

export const CollapsibleHeader = memo<CollapsibleHeaderProps>(function CollapsibleHeader({
  title,
  subtitle,
  eyebrow,
  onBack,
  actions,
  // scrollY and collapseAt reserved for animation wiring in future SPR
  style,
  testID,
}) {
  const { colors } = useThemeTokens();

  return (
    <View
      testID={testID}
      style={[{ backgroundColor: colors.background }, style]}
    >
      {/* Compact row always present (shown when scrolled) */}
      <MenasheHeader
        title={title}
        onBack={onBack}
        actions={actions}
        variant="transparent"
      />
      {/* Expanded large header (hidden when scrolled — animation pending) */}
      <LargeHeader title={title} subtitle={subtitle} eyebrow={eyebrow} />
    </View>
  );
});

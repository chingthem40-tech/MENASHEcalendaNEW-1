/**
 * Spacer
 * MMDL layout — flexible or fixed spacer.
 */

import React, { memo } from "react";
import { View } from "react-native";
import { SP } from "@/src/mobile/design-system";

interface SpacerProps {
  /** Fixed size in dp — uses SP scale values */
  size?: keyof typeof SP;
  /** Flex spacer (takes remaining space) */
  flex?: number;
  /** Horizontal spacer (default: vertical) */
  horizontal?: boolean;
}

export const Spacer = memo<SpacerProps>(function Spacer({
  size,
  flex  = size ? 0 : 1,
  horizontal = false,
}) {
  const px = size !== undefined ? SP[size] : undefined;
  return (
    <View
      style={{
        flex,
        width:  horizontal ? px : undefined,
        height: !horizontal ? px : undefined,
      }}
      pointerEvents="none"
      importantForAccessibility="no"
      accessibilityRole="none"
    />
  );
});

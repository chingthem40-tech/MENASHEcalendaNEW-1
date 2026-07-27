/**
 * HeaderTitle · HeaderSubtitle · HeaderAction
 * MMDL header — composable header primitives.
 *
 * Purpose:
 *   Small building blocks for custom header layouts.
 *   MenasheHeader is the "batteries-included" header;
 *   these primitives let screens compose bespoke headers without
 *   reimplementing typography or touch-target rules.
 *
 * Components:
 *
 *   HeaderTitle
 *     The primary heading text inside a header row.
 *     Props: title (string), centered?, style?
 *
 *   HeaderSubtitle
 *     Secondary/contextual line beneath the title.
 *     Props: subtitle (string), style?
 *
 *   HeaderAction
 *     A single right-aligned icon button for header actions.
 *     Props: icon, label, onPress, badge?, style?
 *
 * Accessibility:
 *   - HeaderAction has accessibilityRole="button" and minimum 44dp touch target
 *   - HeaderTitle/Subtitle are presentational (no role)
 *
 * Usage:
 *   <View style={{ flexDirection: "row", alignItems: "center", height: 56 }}>
 *     <HeaderTitle title="Zmanim" />
 *     <HeaderAction icon="settings" label="Settings" onPress={openSettings} />
 *   </View>
 *
 * Future extension:
 *   - Add HeaderBackButton primitive that mirrors MenasheHeader back affordance
 *   - Add animation hooks (Animated.Value) for collapsible header integration
 */

import React, { memo } from "react";
import {
  Text, Pressable, View,
  type StyleProp, type ViewStyle, type TextStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";
import { NavigationBadge } from "../navigation/TabIndicator";

// ─── HeaderTitle ──────────────────────────────────────────────────────────────

interface HeaderTitleProps {
  title:    string;
  centered?: boolean;
  style?:   StyleProp<TextStyle>;
}

export const HeaderTitle = memo<HeaderTitleProps>(function HeaderTitle({
  title,
  centered = false,
  style,
}) {
  const { colors, type } = useThemeTokens();
  return (
    <Text
      style={[
        type.title,
        {
          color:     colors.textPrimary,
          textAlign: centered ? "center" : "left",
          flex:      1,
        },
        style,
      ]}
      numberOfLines={1}
    >
      {title}
    </Text>
  );
});

// ─── HeaderSubtitle ───────────────────────────────────────────────────────────

interface HeaderSubtitleProps {
  subtitle: string;
  style?:   StyleProp<TextStyle>;
}

export const HeaderSubtitle = memo<HeaderSubtitleProps>(function HeaderSubtitle({
  subtitle,
  style,
}) {
  const { colors, type, sp } = useThemeTokens();
  return (
    <Text
      style={[type.caption, { color: colors.textMuted, marginTop: sp[0.5] }, style]}
      numberOfLines={1}
    >
      {subtitle}
    </Text>
  );
});

// ─── HeaderAction ─────────────────────────────────────────────────────────────

interface HeaderActionProps {
  icon:                React.ComponentProps<typeof Feather>["name"];
  label:               string;
  onPress:             () => void;
  /** Optional notification badge count */
  badge?:              number;
  /** Dot badge (takes priority if true) */
  badgeDot?:           boolean;
  style?:              StyleProp<ViewStyle>;
  testID?:             string;
}

export const HeaderAction = memo<HeaderActionProps>(function HeaderAction({
  icon,
  label,
  onPress,
  badge    = 0,
  badgeDot = false,
  style,
  testID,
}) {
  const { colors, sp } = useThemeTokens();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        {
          minWidth:        44,
          minHeight:       44,
          alignItems:      "center",
          justifyContent:  "center",
          padding:         sp[2],
          opacity:         pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <View>
        <Feather name={icon} size={22} color={colors.textSecondary} />
        {(badgeDot || badge > 0) && (
          <View style={{ position: "absolute", top: -sp[1], right: -sp[1] }}>
            <NavigationBadge count={badge} dot={badgeDot} />
          </View>
        )}
      </View>
    </Pressable>
  );
});

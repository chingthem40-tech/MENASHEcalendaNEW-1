/**
 * BottomNavigationItem
 * MMDL navigation — single tab bar item (icon + label).
 */

import React, { memo } from "react";
import { Pressable, View, Text, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";
import { MenasheBadge } from "../foundation/MenasheBadge";

interface BottomNavigationItemProps {
  icon:                React.ComponentProps<typeof Feather>["name"];
  label:               string;
  active?:             boolean;
  badgeCount?:         number;
  onPress?:            () => void;
  style?:              StyleProp<ViewStyle>;
  testID?:             string;
  accessibilityLabel?: string;
}

export const BottomNavigationItem = memo<BottomNavigationItemProps>(function BottomNavigationItem({
  icon,
  label,
  active     = false,
  badgeCount = 0,
  onPress,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, type, sp } = useThemeTokens();

  const iconColor  = active ? colors.tabActive   : colors.tabInactive;
  const labelColor = active ? colors.tabActive   : colors.tabInactive;
  const iconSize   = active ? 23 : 21;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        {
          flex:            1,
          alignItems:      "center",
          justifyContent:  "center",
          paddingTop:      sp[2],
          paddingBottom:   sp[2],
          gap:             sp[0.5],
          opacity:         pressed ? 0.7 : 1,
          transform:       [{ scale: pressed ? 0.94 : 1 }],
        },
        style,
      ]}
    >
      <View>
        <Feather name={icon} size={iconSize} color={iconColor} />
        {badgeCount > 0 && (
          <View style={{ position: "absolute", top: -4, right: -8 }}>
            <MenasheBadge variant="count" count={badgeCount} size="sm" />
          </View>
        )}
      </View>
      <Text
        style={[type.tabLabel, { color: labelColor }]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </Pressable>
  );
});

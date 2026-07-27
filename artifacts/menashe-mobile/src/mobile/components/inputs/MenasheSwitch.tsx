/**
 * MenasheSwitch
 * MMDL input — themed toggle switch (avoids naming conflict with RN Switch).
 */

import React, { memo, useRef, useEffect } from "react";
import {
  Pressable, Animated, View, Text,
  type StyleProp, type ViewStyle,
} from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

interface MenasheSwitchProps {
  value:        boolean;
  onChange:     (value: boolean) => void;
  label?:       string;
  disabled?:    boolean;
  style?:       StyleProp<ViewStyle>;
  testID?:      string;
  accessibilityLabel?: string;
}

export const MenasheSwitch = memo<MenasheSwitchProps>(function MenasheSwitch({
  value,
  onChange,
  label,
  disabled  = false,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, type, sp } = useThemeTokens();
  const translateX = useRef(new Animated.Value(value ? 20 : 0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue:         value ? 20 : 0,
      duration:        150,
      useNativeDriver: true,
    }).start();
  }, [value, translateX]);

  const trackBg = value ? colors.primary : colors.surface;

  return (
    <Pressable
      testID={testID}
      onPress={() => !disabled && onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel ?? label ?? "Toggle"}
      accessibilityState={{ checked: value, disabled }}
      style={[
        {
          flexDirection: "row",
          alignItems:    "center",
          gap:           sp[3],
          opacity:       disabled ? 0.5 : 1,
          minHeight:     44,
        },
        style,
      ]}
    >
      {label && (
        <Text style={[type.body, { flex: 1, color: colors.textPrimary }]}>{label}</Text>
      )}

      {/* Track */}
      <View
        style={{
          width:           50,
          height:          30,
          borderRadius:    15,
          backgroundColor: trackBg,
          justifyContent:  "center",
          paddingHorizontal: 3,
          borderWidth:     1,
          borderColor:     value ? colors.primary : colors.border,
        }}
      >
        {/* Thumb */}
        <Animated.View
          style={{
            width:           24,
            height:          24,
            borderRadius:    12,
            backgroundColor: "#ffffff",
            transform:       [{ translateX }],
            shadowColor:     "#000",
            shadowOffset:    { width: 0, height: 1 },
            shadowOpacity:   0.15,
            shadowRadius:    2,
            elevation:       2,
          }}
        />
      </View>
    </Pressable>
  );
});

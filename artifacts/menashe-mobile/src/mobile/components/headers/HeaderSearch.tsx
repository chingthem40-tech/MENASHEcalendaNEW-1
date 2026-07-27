/**
 * HeaderSearch
 * MMDL header — inline search bar inside a header row.
 */

import React, { memo } from "react";
import { View, TextInput, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

interface HeaderSearchProps {
  value:       string;
  onChange:    (text: string) => void;
  placeholder?: string;
  onCancel?:   () => void;
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
}

export const HeaderSearch = memo<HeaderSearchProps>(function HeaderSearch({
  value,
  onChange,
  placeholder = "Search…",
  onCancel,
  style,
  testID,
}) {
  const { colors, type, sp, rd } = useThemeTokens();

  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection:  "row",
          alignItems:     "center",
          gap:            sp[2],
          paddingHorizontal: sp[4],
          paddingVertical:   sp[2],
        },
        style,
      ]}
    >
      <View
        style={{
          flex:            1,
          flexDirection:   "row",
          alignItems:      "center",
          backgroundColor: colors.input,
          borderRadius:    rd.xl,
          paddingHorizontal: sp[3],
          height:          40,
          gap:             sp[2],
          borderWidth:     1,
          borderColor:     colors.inputBorder,
        }}
      >
        <Feather name="search" size={16} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={[type.body, { flex: 1, color: colors.textPrimary, paddingVertical: 0 }]}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChange("")} hitSlop={6} accessibilityLabel="Clear search">
            <Feather name="x" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {onCancel && (
        <Pressable onPress={onCancel} accessibilityLabel="Cancel search" hitSlop={8}>
          <Feather name="x" size={20} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
});

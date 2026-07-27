/**
 * SearchBar / SearchField
 * MMDL input — full-width search with icon, clear, and cancel.
 */

import React, { memo, useRef } from "react";
import {
  View, TextInput, Pressable, Animated,
  type StyleProp, type ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

interface SearchBarProps {
  value:        string;
  onChange:     (text: string) => void;
  placeholder?: string;
  onFocus?:     () => void;
  onBlur?:      () => void;
  onCancel?:    () => void;
  showCancel?:  boolean;
  autoFocus?:   boolean;
  style?:       StyleProp<ViewStyle>;
  testID?:      string;
}

export const SearchBar = memo<SearchBarProps>(function SearchBar({
  value,
  onChange,
  placeholder  = "Search…",
  onFocus,
  onBlur,
  onCancel,
  showCancel   = false,
  autoFocus    = false,
  style,
  testID,
}) {
  const { colors, type, sp, rd } = useThemeTokens();
  const inputRef = useRef<TextInput>(null);

  return (
    <View
      testID={testID}
      style={[
        { flexDirection: "row", alignItems: "center", gap: sp[2] },
        style,
      ]}
    >
      <View
        style={{
          flex:              1,
          flexDirection:     "row",
          alignItems:        "center",
          backgroundColor:   colors.input,
          borderRadius:      rd.xl,
          paddingHorizontal: sp[3],
          height:            44,
          gap:               sp[2],
          borderWidth:       1,
          borderColor:       colors.inputBorder,
        }}
      >
        <Feather name="search" size={16} color={colors.textMuted} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={[type.body, { flex: 1, color: colors.textPrimary, paddingVertical: 0 }]}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus={autoFocus}
          onFocus={onFocus}
          onBlur={onBlur}
          accessibilityLabel="Search input"
          accessibilityRole="search"
          clearButtonMode="never"
        />
        {value.length > 0 && (
          <Pressable
            onPress={() => { onChange(""); inputRef.current?.focus(); }}
            hitSlop={8}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Feather name="x-circle" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {showCancel && onCancel && (
        <Pressable
          onPress={() => { onChange(""); onCancel(); }}
          accessibilityLabel="Cancel"
          accessibilityRole="button"
          hitSlop={8}
        >
          <Feather name="x" size={20} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
});

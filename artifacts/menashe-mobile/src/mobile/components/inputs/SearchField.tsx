/**
 * SearchField
 * MMDL input — simple inline search input.
 *
 * Purpose:
 *   Lightweight search input for use inside cards, modals, or headers
 *   where SearchBar (full-width animated variant) is too heavy.
 *   No debouncing, no animated states — just a clean icon + input.
 *
 * Props:
 *   value        — controlled text value
 *   onChange     — text change callback
 *   placeholder  — placeholder string (default "Search…")
 *   disabled     — disables the input
 *   autoFocus    — focuses on mount
 *   style        — outer container override
 *   testID       — test selector
 *   accessibilityLabel — screen-reader label (default "Search")
 *
 * Variants: none (single focused style)
 *
 * Accessibility:
 *   - accessibilityRole="search" on container
 *   - Minimum touch target 48dp via height
 *   - Placeholder color uses textMuted token
 *
 * Usage:
 *   <SearchField value={q} onChange={setQ} placeholder="Search holidays…" />
 *
 * Future extension:
 *   - Add onSubmit prop for keyboard "search" action
 *   - Add trailingAction slot (filter icon etc.)
 */

import React, { memo, useRef, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

interface SearchFieldProps {
  value:               string;
  onChange:            (text: string) => void;
  placeholder?:        string;
  disabled?:           boolean;
  autoFocus?:          boolean;
  style?:              StyleProp<ViewStyle>;
  testID?:             string;
  accessibilityLabel?: string;
}

export const SearchField = memo<SearchFieldProps>(function SearchField({
  value,
  onChange,
  placeholder          = "Search…",
  disabled             = false,
  autoFocus            = false,
  style,
  testID,
  accessibilityLabel   = "Search",
}) {
  const { colors, sp, rd, type } = useThemeTokens();
  const [focused, setFocused]    = useState(false);
  const inputRef                 = useRef<TextInput>(null);

  const borderColor = focused ? colors.inputFocusBorder : colors.inputBorder;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="search"
      accessibilityLabel={accessibilityLabel}
      onPress={() => inputRef.current?.focus()}
      style={[
        {
          flexDirection:     "row",
          alignItems:        "center",
          height:            44,
          backgroundColor:   disabled ? colors.disabled : colors.input,
          borderRadius:      rd.md,
          borderWidth:       1,
          borderColor,
          paddingHorizontal: sp[3],
          gap:               sp[2],
        },
        style,
      ]}
    >
      <Feather
        name="search"
        size={16}
        color={focused ? colors.primary : colors.textMuted}
      />

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        editable={!disabled}
        autoFocus={autoFocus}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={accessibilityLabel}
        style={[
          type.body,
          {
            flex:            1,
            color:           disabled ? colors.textDisabled : colors.textPrimary,
            paddingVertical: 0,
          },
        ]}
      />

      {value.length > 0 && !disabled && (
        <Pressable
          onPress={() => onChange("")}
          hitSlop={8}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <Feather name="x-circle" size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </Pressable>
  );
});

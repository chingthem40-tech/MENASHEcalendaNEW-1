/**
 * TextField / SelectField / InputRow
 * MMDL input — standard text input with label, helper, and error states.
 */

import React, { memo, useState } from "react";
import {
  View, Text, TextInput, Pressable,
  type StyleProp, type ViewStyle, type TextInputProps,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label?:       string;
  helper?:      string;
  error?:       string;
  disabled?:    boolean;
  leadingIcon?: React.ComponentProps<typeof Feather>["name"];
  trailingIcon?: React.ComponentProps<typeof Feather>["name"];
  onTrailingPress?: () => void;
  style?:       StyleProp<ViewStyle>;
  testID?:      string;
}

export const TextField = memo<TextFieldProps>(function TextField({
  label,
  helper,
  error,
  disabled  = false,
  leadingIcon,
  trailingIcon,
  onTrailingPress,
  style,
  testID,
  ...textInputProps
}) {
  const { colors, type, sp, rd } = useThemeTokens();
  const [focused, setFocused] = useState(false);

  const borderColor =
    error   ? colors.error :
    focused ? colors.inputFocusBorder :
    colors.inputBorder;

  return (
    <View testID={testID} style={[{ gap: sp[1] }, style]}>
      {label && (
        <Text style={[type.label, { color: colors.textSecondary, fontSize: 13 }]}>
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection:     "row",
          alignItems:        "center",
          backgroundColor:   disabled ? colors.disabled : colors.input,
          borderRadius:      rd.md,
          borderWidth:       1,
          borderColor,
          paddingHorizontal: sp[3],
          height:            48,
          gap:               sp[2],
        }}
      >
        {leadingIcon && (
          <Feather name={leadingIcon} size={18} color={colors.textMuted} />
        )}

        <TextInput
          style={[
            type.body,
            {
              flex:           1,
              color:          disabled ? colors.textDisabled : colors.textPrimary,
              paddingVertical: 0,
            },
          ]}
          placeholderTextColor={colors.textMuted}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          accessibilityLabel={label}
          {...textInputProps}
        />

        {trailingIcon && (
          <Pressable
            onPress={onTrailingPress}
            disabled={!onTrailingPress}
            hitSlop={8}
            accessibilityLabel={`${label ?? "field"} action`}
          >
            <Feather
              name={trailingIcon}
              size={18}
              color={onTrailingPress ? colors.primary : colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      {(helper || error) && (
        <Text
          style={[
            type.caption,
            { color: error ? colors.error : colors.textMuted, paddingHorizontal: sp[1] },
          ]}
        >
          {error ?? helper}
        </Text>
      )}
    </View>
  );
});

// ─── SelectField ──────────────────────────────────────────────────────────────

interface SelectFieldProps {
  label?:       string;
  value?:       string;
  placeholder?: string;
  onPress?:     () => void;
  disabled?:    boolean;
  error?:       string;
  style?:       StyleProp<ViewStyle>;
  testID?:      string;
}

export const SelectField = memo<SelectFieldProps>(function SelectField({
  label,
  value,
  placeholder = "Select…",
  onPress,
  disabled    = false,
  error,
  style,
  testID,
}) {
  const { colors, type, sp, rd } = useThemeTokens();

  return (
    <View testID={testID} style={[{ gap: sp[1] }, style]}>
      {label && (
        <Text style={[type.label, { color: colors.textSecondary, fontSize: 13 }]}>
          {label}
        </Text>
      )}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? "select"}: ${value ?? placeholder}`}
        style={({ pressed }) => ({
          flexDirection:     "row",
          alignItems:        "center",
          backgroundColor:   disabled ? colors.disabled : colors.input,
          borderRadius:      rd.md,
          borderWidth:       1,
          borderColor:       error ? colors.error : colors.inputBorder,
          paddingHorizontal: sp[3],
          height:            48,
          opacity:           disabled ? 0.6 : pressed ? 0.75 : 1,
        })}
      >
        <Text
          style={[
            type.body,
            {
              flex:  1,
              color: value ? colors.textPrimary : colors.textMuted,
            },
          ]}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error && (
        <Text style={[type.caption, { color: colors.error, paddingHorizontal: sp[1] }]}>
          {error}
        </Text>
      )}
    </View>
  );
});

// ─── InputRow ─────────────────────────────────────────────────────────────────

interface InputRowProps {
  label:        string;
  value?:       string;
  placeholder?: string;
  onPress?:     () => void;
  trailingIcon?: React.ComponentProps<typeof Feather>["name"];
  style?:       StyleProp<ViewStyle>;
  testID?:      string;
}

export const InputRow = memo<InputRowProps>(function InputRow({
  label,
  value,
  placeholder,
  onPress,
  trailingIcon = "chevron-right",
  style,
  testID,
}) {
  const { colors, type, sp } = useThemeTokens();

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? placeholder ?? ""}`}
      style={({ pressed }) => [
        {
          flexDirection:     "row",
          alignItems:        "center",
          paddingHorizontal: sp[4],
          paddingVertical:   sp[3],
          backgroundColor:   pressed ? colors.cardHover : "transparent",
          gap:               sp[3],
        },
        style,
      ]}
    >
      <Text style={[type.body, { flex: 1, color: colors.textPrimary }]}>
        {label}
      </Text>
      <Text style={[type.body, { color: colors.textMuted }]} numberOfLines={1}>
        {value ?? placeholder}
      </Text>
      <Feather name={trailingIcon} size={16} color={colors.textMuted} />
    </Pressable>
  );
});

/**
 * EmptyState + ErrorState
 * MMDL feedback — illustrated empty and error placeholders.
 */

import React, { memo } from "react";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";
import { MenasheButton } from "../foundation/MenasheButton";

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?:       React.ComponentProps<typeof Feather>["name"];
  title:       string;
  subtitle?:   string;
  ctaLabel?:   string;
  onCta?:      () => void;
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
}

export const EmptyState = memo<EmptyStateProps>(function EmptyState({
  icon     = "inbox",
  title,
  subtitle,
  ctaLabel,
  onCta,
  style,
  testID,
}) {
  const { colors, type, sp } = useThemeTokens();

  return (
    <View
      testID={testID}
      accessibilityLabel={title}
      style={[
        {
          alignItems:      "center",
          justifyContent:  "center",
          paddingVertical: sp[12],
          paddingHorizontal: sp[6],
          gap:             sp[3],
        },
        style,
      ]}
    >
      <View
        style={{
          width:           80,
          height:          80,
          borderRadius:    40,
          backgroundColor: colors.primaryMuted,
          alignItems:      "center",
          justifyContent:  "center",
          marginBottom:    sp[1],
        }}
      >
        <Feather name={icon} size={36} color={colors.primary} />
      </View>

      <Text style={[type.title, { color: colors.textPrimary, textAlign: "center" }]}>
        {title}
      </Text>

      {subtitle && (
        <Text style={[type.body, { color: colors.textMuted, textAlign: "center" }]}>
          {subtitle}
        </Text>
      )}

      {ctaLabel && onCta && (
        <MenasheButton
          label={ctaLabel}
          onPress={onCta}
          variant="primary"
          size="md"
        />
      )}
    </View>
  );
});

// ─── ErrorState ───────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title?:     string;
  message?:   string;
  onRetry?:   () => void;
  style?:     StyleProp<ViewStyle>;
  testID?:    string;
}

export const ErrorState = memo<ErrorStateProps>(function ErrorState({
  title    = "Something went wrong",
  message,
  onRetry,
  style,
  testID,
}) {
  const { colors, type, sp } = useThemeTokens();

  return (
    <View
      testID={testID}
      style={[
        {
          alignItems:      "center",
          justifyContent:  "center",
          paddingVertical: sp[12],
          paddingHorizontal: sp[6],
          gap:             sp[3],
        },
        style,
      ]}
    >
      <View
        style={{
          width:           80,
          height:          80,
          borderRadius:    40,
          backgroundColor: colors.errorMuted,
          alignItems:      "center",
          justifyContent:  "center",
        }}
      >
        <Feather name="alert-circle" size={36} color={colors.error} />
      </View>

      <Text style={[type.title, { color: colors.textPrimary, textAlign: "center" }]}>
        {title}
      </Text>

      {message && (
        <Text style={[type.body, { color: colors.textMuted, textAlign: "center" }]}>
          {message}
        </Text>
      )}

      {onRetry && (
        <MenasheButton
          label="Try Again"
          onPress={onRetry}
          variant="secondary"
          size="md"
        />
      )}
    </View>
  );
});

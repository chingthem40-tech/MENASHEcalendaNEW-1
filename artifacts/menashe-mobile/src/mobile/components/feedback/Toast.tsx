/**
 * Toast + Banner + Snackbar
 * MMDL feedback — transient notifications and persistent banners.
 */

import React, { memo, useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, type StyleProp, type ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message:     string;
  variant?:    ToastVariant;
  visible:     boolean;
  onHide?:     () => void;
  duration?:   number;
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
}

export const Toast = memo<ToastProps>(function Toast({
  message,
  variant  = "default",
  visible,
  onHide,
  duration = 2500,
  style,
  testID,
}) {
  const { colors, type, sp, rd, shadow } = useThemeTokens();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  const iconName: React.ComponentProps<typeof Feather>["name"] =
    variant === "success" ? "check-circle" :
    variant === "error"   ? "x-circle" :
    variant === "warning" ? "alert-triangle" :
    variant === "info"    ? "info" :
    "bell";

  const iconColor =
    variant === "success" ? colors.success :
    variant === "error"   ? colors.error :
    variant === "warning" ? colors.warning :
    variant === "info"    ? colors.info :
    colors.primary;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity,     { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY,  { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity,    { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 16, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, opacity, translateY, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel={message}
      style={[
        {
          flexDirection:   "row",
          alignItems:      "center",
          gap:             sp[2],
          backgroundColor: colors.card,
          borderRadius:    rd.md,
          paddingHorizontal: sp[4],
          paddingVertical:   sp[3],
          opacity,
          transform:       [{ translateY }],
          ...shadow.floating,
        },
        style,
      ]}
    >
      <Feather name={iconName} size={18} color={iconColor} />
      <Text style={[type.body, { flex: 1, color: colors.textPrimary }]} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
});

// ─── Banner ───────────────────────────────────────────────────────────────────

interface BannerProps {
  message:     string;
  variant?:    ToastVariant;
  onDismiss?:  () => void;
  ctaLabel?:   string;
  onCta?:      () => void;
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
}

export const Banner = memo<BannerProps>(function Banner({
  message,
  variant    = "info",
  onDismiss,
  ctaLabel,
  onCta,
  style,
  testID,
}) {
  const { colors, type, sp } = useThemeTokens();

  const bg =
    variant === "success" ? colors.successMuted :
    variant === "error"   ? colors.errorMuted :
    variant === "warning" ? colors.warningMuted :
    colors.infoMuted;

  const accent =
    variant === "success" ? colors.success :
    variant === "error"   ? colors.error :
    variant === "warning" ? colors.warning :
    colors.info;

  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      style={[
        {
          flexDirection:   "row",
          alignItems:      "flex-start",
          gap:             sp[3],
          backgroundColor: bg,
          paddingHorizontal: sp[4],
          paddingVertical:   sp[3],
          borderLeftWidth:   3,
          borderLeftColor:   accent,
        },
        style,
      ]}
    >
      <Text style={[type.body, { flex: 1, color: colors.textPrimary }]}>{message}</Text>
      {ctaLabel && onCta && (
        <Pressable onPress={onCta} accessibilityRole="button" accessibilityLabel={ctaLabel}>
          <Text style={[type.label, { color: accent }]}>{ctaLabel}</Text>
        </Pressable>
      )}
      {onDismiss && (
        <Pressable onPress={onDismiss} accessibilityLabel="Dismiss" hitSlop={8}>
          <Feather name="x" size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
});

// ─── Snackbar ─────────────────────────────────────────────────────────────────

interface SnackbarProps {
  message:    string;
  visible:    boolean;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?:  () => void;
  style?:     StyleProp<ViewStyle>;
  testID?:    string;
}

export const Snackbar = memo<SnackbarProps>(function Snackbar({
  message,
  visible,
  onDismiss,
  actionLabel,
  onAction,
  style,
  testID,
}) {
  const { colors, type, sp, rd } = useThemeTokens();

  if (!visible) return null;

  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      style={[
        {
          flexDirection:     "row",
          alignItems:        "center",
          backgroundColor:   colors.textPrimary,
          borderRadius:      rd.md,
          paddingHorizontal: sp[4],
          paddingVertical:   sp[3],
          gap:               sp[3],
        },
        style,
      ]}
    >
      <Text style={[type.body, { flex: 1, color: colors.textInverse }]} numberOfLines={2}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text style={[type.label, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      )}
      {onDismiss && (
        <Pressable onPress={onDismiss} accessibilityLabel="Dismiss" hitSlop={8}>
          <Feather name="x" size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
});

/**
 * MMDS Button — Menashe Mobile Design System
 * ─────────────────────────────────────────────────────────────────────────────
 * The single reusable button primitive for the Menashe mobile platform.
 *
 * Variants:  primary · secondary · outline · ghost · destructive
 * Sizes:     sm · md (default) · lg
 * Features:  icon (left/right) · loading spinner · disabled state ·
 *            full-width · press-scale animation · MMDL spacing/radius ·
 *            theme-aware colours · accessibility labels
 *
 * MMDL RULE: StyleSheet.create() contains ONLY numeric literals and
 * SPACE/TEXT/RADIUS constants — never theme tokens (injected inline).
 *
 * Usage:
 *   <Button label="Submit" onPress={handleSubmit} />
 *   <Button variant="outline" label="Cancel" onPress={onCancel} />
 *   <Button variant="destructive" label="Delete" icon="trash-2" loading={busy} />
 *   <Button variant="ghost" label="Skip" size="sm" fullWidth />
 */

import React, { useRef, useCallback, memo } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { SPACE, TEXT, RADIUS } from "@/constants/colors";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  /** Visible button label and default accessibility name */
  label: string;
  /** Press handler */
  onPress?: () => void;
  /** Visual/semantic variant (default: "primary") */
  variant?: ButtonVariant;
  /** Height tier (default: "md") */
  size?: ButtonSize;
  /** Feather icon name rendered beside the label */
  icon?: keyof typeof Feather.glyphMap;
  /** Side the icon appears on (default: "left") */
  iconPosition?: "left" | "right";
  /** Replaces content with a spinner and blocks interaction */
  loading?: boolean;
  /** Visually dims and blocks interaction */
  disabled?: boolean;
  /** Stretches button to fill its parent container (alignSelf: "stretch") */
  fullWidth?: boolean;
  /** Overrides the auto-derived accessibility label */
  accessibilityLabel?: string;
  /** Extra container styles — e.g. flex: 1, marginTop */
  style?: StyleProp<ViewStyle>;
}

// ── Static styles ─────────────────────────────────────────────────────────────
// Only numeric literals + SPACE / TEXT / RADIUS constants.
// Theme tokens must NEVER appear here — see MMDL StyleSheet guard rule.

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[2],
  },
  // ── Size tiers ──────────────────────────────────────────────────────────────
  sizeSm: {
    minHeight: 36,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[2],          // 8
    borderRadius: RADIUS.sm,
  },
  sizeMd: {
    minHeight: 44,
    paddingHorizontal: SPACE[4],
    paddingVertical: 10,                // SPACE[2] + 2
    borderRadius: RADIUS.md,
  },
  sizeLg: {
    minHeight: 52,
    paddingHorizontal: SPACE[5],
    paddingVertical: 14,                // SPACE[3] + 2
    borderRadius: RADIUS.md,
  },
  label: {
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
});

// ── Size map (after styles to avoid forward reference) ────────────────────────

type SizeSpec = { container: StyleProp<ViewStyle>; fontSize: number; iconSize: number };

const SIZE_MAP: Record<ButtonSize, SizeSpec> = {
  sm: { container: styles.sizeSm, fontSize: TEXT.sm,   iconSize: 12 },
  md: { container: styles.sizeMd, fontSize: TEXT.base, iconSize: 14 },
  lg: { container: styles.sizeLg, fontSize: TEXT.md,   iconSize: 16 },
};

// ── Variant colours (live theme tokens — injected inline, not in StyleSheet) ──

type VariantColors = {
  bg: string;
  bgPressed: string;
  fg: string;
  border: string;
  borderWidth: number;
};

function useVariantColors(variant: ButtonVariant): VariantColors {
  const c = useColors();
  switch (variant) {
    case "primary":
      return { bg: c.primary,    bgPressed: c.primary    + "CC", fg: c.primaryForeground,    border: "transparent", borderWidth: 0 };
    case "secondary":
      return { bg: c.secondary,  bgPressed: c.secondary  + "CC", fg: c.secondaryForeground,  border: "transparent", borderWidth: 0 };
    case "outline":
      return { bg: c.primary + "0C", bgPressed: c.primary + "1E", fg: c.primary, border: c.primary + "55", borderWidth: 1 };
    case "ghost":
      return { bg: "transparent", bgPressed: c.foreground + "12", fg: c.foreground, border: "transparent", borderWidth: 0 };
    case "destructive":
      return { bg: c.destructive, bgPressed: c.destructive + "CC", fg: c.destructiveForeground, border: "transparent", borderWidth: 0 };
  }
}

// ── Press-scale hook (80 ms in / 150 ms out — matches platform convention) ───

function usePressScale(toValue = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn  = useCallback(
    () => Animated.timing(scale, { toValue,    duration: 80,  useNativeDriver: true }).start(),
    [scale, toValue],
  );
  const onPressOut = useCallback(
    () => Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start(),
    [scale],
  );
  return { scale, onPressIn, onPressOut };
}

// ── Button ────────────────────────────────────────────────────────────────────

const Button = memo(function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const vc = useVariantColors(variant);
  const { fontSize, iconSize, container: sizeContainer } = SIZE_MAP[size];
  const { scale, onPressIn, onPressOut } = usePressScale();

  const isDisabled = disabled || loading;

  const iconEl = icon ? (
    <Feather name={icon} size={iconSize} color={vc.fg} />
  ) : null;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={isDisabled ? undefined : onPressIn}
      onPressOut={isDisabled ? undefined : onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeContainer,
        {
          backgroundColor: pressed && !isDisabled ? vc.bgPressed : vc.bg,
          borderColor:     vc.border,
          borderWidth:     vc.borderWidth,
          opacity:         isDisabled ? 0.48 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <Animated.View style={[styles.inner, { transform: [{ scale }] }]}>
        {loading ? (
          <ActivityIndicator size="small" color={vc.fg} />
        ) : (
          <>
            {iconEl && iconPosition === "left"  && iconEl}
            <Text
              style={[styles.label, { fontSize, color: vc.fg, lineHeight: fontSize * 1.3 }]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {iconEl && iconPosition === "right" && iconEl}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
});

export default Button;

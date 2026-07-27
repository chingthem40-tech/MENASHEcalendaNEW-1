/**
 * MenasheButton — MMDS Button System
 * MMDL foundation — the single reusable button primitive for the whole app.
 *
 * Variants: primary · secondary · outline · ghost · destructive
 * Sizes:    sm · md · lg
 *
 * Legacy variant names "gold-outline" and "danger" are still accepted for
 * backward compatibility with existing call sites (HeroCard, Dialog, dev
 * gallery) and are normalized to "outline" / "destructive" internally.
 * New call sites should use the current names.
 */

import React, { memo } from "react";
import {
  Pressable, Text, ActivityIndicator,
  type StyleProp, type ViewStyle, type TextStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens, useReducedMotion } from "@/src/mobile/design-system";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  /** @deprecated use "outline" */
  | "gold-outline"
  /** @deprecated use "destructive" */
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface MenasheButtonProps {
  variant?:            ButtonVariant;
  size?:               ButtonSize;
  label:               string;
  onPress?:            () => void;
  disabled?:           boolean;
  loading?:            boolean;
  /** Feather icon name rendered beside the label. */
  icon?:               FeatherName;
  /** Which side `icon` renders on. Default "left". */
  iconPosition?:       "left" | "right";
  /** @deprecated use `icon` (always renders on the left) */
  leadingIcon?:        FeatherName;
  /** Stretches the button to fill its container's width. */
  fullWidth?:          boolean;
  style?:              StyleProp<ViewStyle>;
  labelStyle?:         StyleProp<TextStyle>;
  testID?:             string;
  accessibilityLabel?: string;
  accessibilityHint?:  string;
}

const SIZE_H    = { sm: 36, md: 44, lg: 52 } as const;
const SIZE_ICON = { sm: 14, md: 16, lg: 18 } as const;

/** Normalizes legacy variant names to their current MMDS equivalents. */
function normalizeVariant(
  variant: ButtonVariant,
): "primary" | "secondary" | "outline" | "ghost" | "destructive" {
  if (variant === "gold-outline") return "outline";
  if (variant === "danger") return "destructive";
  return variant;
}

export const MenasheButton = memo<MenasheButtonProps>(function MenasheButton({
  variant  = "primary",
  size     = "md",
  label,
  onPress,
  disabled = false,
  loading  = false,
  icon,
  iconPosition = "left",
  leadingIcon,
  fullWidth = false,
  style,
  labelStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) {
  const { colors, type, rd, sp, motion } = useThemeTokens();
  const reduceMotion = useReducedMotion();

  const v = normalizeVariant(variant);
  // `leadingIcon` is deprecated but still honored; `icon` takes precedence.
  const resolvedIcon = icon ?? leadingIcon;
  const resolvedIconPosition = icon ? iconPosition : "left";
  const isInteractive = !disabled && !loading;

  const bg =
    v === "primary"     ? colors.primary :
    v === "secondary"   ? colors.secondary :
    v === "destructive" ? colors.error :
    "transparent"; // outline & ghost

  const textColor =
    v === "primary"     ? colors.primaryForeground :
    v === "secondary"   ? colors.secondaryForeground :
    v === "destructive" ? colors.textInverse :
    colors.primary; // outline & ghost read as brand-colored text

  const borderColor = v === "outline" ? colors.primary : "transparent";

  // MMDL press feedback: scale from the shared motion recipe, skipped
  // entirely when the user has "Reduce Motion" enabled system-wide.
  const pressedScale = reduceMotion ? 1 : motion.recipe.press.scaleDown;

  return (
    <Pressable
      onPress={onPress}
      disabled={!isInteractive}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={({ pressed }) => [
        {
          flexDirection:      "row" as const,
          alignItems:         "center" as const,
          justifyContent:     "center" as const,
          gap:                sp[2],
          backgroundColor:    bg,
          borderRadius:       rd.md,
          borderWidth:        v === "outline" ? 1.5 : 0,
          borderColor,
          height:             SIZE_H[size],
          paddingHorizontal:  size === "sm" ? sp[4] : size === "md" ? sp[5] : sp[6],
          opacity:            disabled ? 0.5 : pressed ? 0.85 : 1,
          transform:          [{ scale: pressed && isInteractive ? pressedScale : 1 }],
          alignSelf:          fullWidth ? "stretch" as const : "flex-start" as const,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {resolvedIcon && resolvedIconPosition === "left" && (
            <Feather name={resolvedIcon} size={SIZE_ICON[size]} color={textColor} />
          )}
          <Text
            style={[type.label, { color: textColor, letterSpacing: 0.3 }, labelStyle]}
            allowFontScaling={false}
            numberOfLines={1}
          >
            {label}
          </Text>
          {resolvedIcon && resolvedIconPosition === "right" && (
            <Feather name={resolvedIcon} size={SIZE_ICON[size]} color={textColor} />
          )}
        </>
      )}
    </Pressable>
  );
});


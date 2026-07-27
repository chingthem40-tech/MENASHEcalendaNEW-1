/**
 * LoadingState + SkeletonCard + ProgressIndicator
 * MMDL feedback — loading indicators and skeleton placeholders.
 */

import React, { memo, useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, Animated, type StyleProp, type ViewStyle } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

// ─── LoadingState ─────────────────────────────────────────────────────────────

interface LoadingStateProps {
  message?:   string;
  size?:      "small" | "large";
  fullScreen?: boolean;
  style?:     StyleProp<ViewStyle>;
  testID?:    string;
}

export const LoadingState = memo<LoadingStateProps>(function LoadingState({
  message,
  size       = "large",
  fullScreen = false,
  style,
  testID,
}) {
  const { colors, type, sp } = useThemeTokens();

  return (
    <View
      testID={testID}
      accessibilityLabel={message ?? "Loading"}
      accessibilityRole="progressbar"
      style={[
        {
          alignItems:      "center",
          justifyContent:  "center",
          gap:             sp[3],
          paddingVertical: sp[8],
          flex:            fullScreen ? 1 : 0,
        },
        style,
      ]}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text style={[type.bodySm, { color: colors.textMuted }]}>{message}</Text>
      )}
    </View>
  );
});

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

interface SkeletonCardProps {
  lines?:  number;
  style?:  StyleProp<ViewStyle>;
  testID?: string;
}

function SkeletonLine({ width, height = 12 }: { width: number | `${number}%`; height?: number }) {
  const { colors, rd } = useThemeTokens();
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius:    rd.xs,
        backgroundColor: colors.surface,
        opacity:         anim,
      }}
    />
  );
}

export const SkeletonCard = memo<SkeletonCardProps>(function SkeletonCard({
  lines   = 3,
  style,
  testID,
}) {
  const { colors, sp, rd, shadow } = useThemeTokens();

  return (
    <View
      testID={testID}
      accessibilityLabel="Loading content"
      style={[
        {
          backgroundColor: colors.card,
          borderRadius:    rd.lg,
          padding:         sp[4],
          gap:             sp[3],
          ...shadow.level1,
        },
        style,
      ]}
    >
      <SkeletonLine width="60%" height={14} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 1 ? "40%" : "100%"}
          height={11}
        />

      ))}
    </View>
  );
});

// ─── ProgressIndicator ────────────────────────────────────────────────────────

interface ProgressIndicatorProps {
  value?:       number;   // 0–1, undefined = indeterminate
  color?:       string;
  trackColor?:  string;
  height?:      number;
  style?:       StyleProp<ViewStyle>;
  testID?:      string;
  accessibilityLabel?: string;
}

export const ProgressIndicator = memo<ProgressIndicatorProps>(function ProgressIndicator({
  value,
  height = 4,
  style,
  testID,
  accessibilityLabel,
}) {
  const { colors, rd } = useThemeTokens();

  const isIndeterminate = value === undefined;
  const clampedValue    = Math.min(1, Math.max(0, value ?? 0));

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? "Progress"}
      accessibilityValue={isIndeterminate ? undefined : { min: 0, max: 100, now: Math.round(clampedValue * 100) }}
      style={[
        {
          height,
          width:           "100%",
          backgroundColor: colors.border,
          borderRadius:    rd.pill,
          overflow:        "hidden",
        },
        style,
      ]}
    >
      <View
        style={{
          height:          "100%",
          width:           isIndeterminate ? "40%" : `${clampedValue * 100}%`,
          backgroundColor: colors.primary,
          borderRadius:    rd.pill,
        }}
      />
    </View>
  );
});

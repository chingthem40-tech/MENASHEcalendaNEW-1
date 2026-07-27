/**
 * SectionTitle
 * MMDS display — section eyebrow + title + optional subtitle +
 * optional leading icon + optional trailing action.
 *
 * Anatomy (all parts optional except at least one must be present):
 *
 *   [marginTop: sectionGap]
 *   EYEBROW TEXT            ← type.overline, accentGold
 *   [icon]  Title text  [See All →]
 *   Subtitle text
 *   [marginBottom: sp[3]]
 */

import React, { memo } from "react";
import {
  View,
  Text,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

export interface SectionTitleProps {
  /** Main section heading — rendered at type.subtitle weight. */
  title?:       string;
  /** Small uppercase overline displayed above the title row. */
  eyebrow?:     string;
  /** Optional descriptive line shown below the title row. */
  subtitle?:    string;
  /**
   * Optional element shown to the left of the title.
   * Typically a small icon: <Feather name="clock" size={13} color={colors.primary} />
   */
  leadingIcon?: React.ReactNode;
  /** Label for the trailing action link (e.g. "See All"). */
  actionLabel?: string;
  onAction?:    () => void;
  style?:       StyleProp<ViewStyle>;
  testID?:      string;
}

export const SectionTitle = memo<SectionTitleProps>(function SectionTitle({
  title,
  eyebrow,
  subtitle,
  leadingIcon,
  actionLabel,
  onAction,
  style,
  testID,
}) {
  const { colors, type, sp } = useThemeTokens();

  const hasTitleRow =
    leadingIcon != null || title != null || (actionLabel != null && onAction != null);

  return (
    <View
      testID={testID}
      style={[
        {
          // Canonical section gap above (LAYOUT_SPACE.sectionGap = 32dp).
          // Screens that manage their own outer spacing should pass marginTop: 0 via style.
          marginTop:    sp[8],
          marginBottom: sp[3],
          gap:          sp[1],
        },
        style,
      ]}
    >
      {eyebrow != null ? (
        <Text style={[type.overline, { color: colors.accentGold }]}>
          {eyebrow.toUpperCase()}
        </Text>
      ) : null}

      {hasTitleRow ? (
        <View style={{ flexDirection: "row", alignItems: "stretch" }}>
          {/* Web-parity gold accent bar — 3 dp left border matching web section headers */}
          <View
            style={{
              width:        3,
              borderRadius: 2,
              backgroundColor: colors.accentGold,
              marginRight:  sp[2],
              alignSelf:    "stretch",
              minHeight:    22,
            }}
          />

          {/* Title row */}
          <View
            style={{
              flexDirection: "row",
              alignItems:    "center",
              justifyContent: "space-between",
              flex:          1,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems:    "center",
                gap:           sp[2],
                flex:          1,
              }}
            >
              {leadingIcon != null ? leadingIcon : null}
              {title != null ? (
                <Text
                  style={[
                    type.subtitle,
                    { color: colors.textPrimary, flexShrink: 1 },
                  ]}
                >
                  {title}
                </Text>
              ) : null}
            </View>

            {actionLabel != null && onAction != null ? (
              <Pressable
                onPress={onAction}
                accessibilityRole="button"
                accessibilityLabel={actionLabel}
                hitSlop={8}
              >
                <Text style={[type.label, { color: colors.primary, fontSize: 13 }]}>
                  {actionLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {subtitle != null ? (
        <Text
          style={{
            fontSize:   13,
            lineHeight: 18,
            color:      colors.textSecondary,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
});

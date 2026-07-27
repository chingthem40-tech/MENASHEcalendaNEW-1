/**
 * Dialog
 * MMDL feedback — alert/confirmation dialog with overlay backdrop.
 */

import React, { memo } from "react";
import {
  Modal, View, Text, Pressable,
  type StyleProp, type ViewStyle,
} from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";
import { MenasheButton } from "../foundation/MenasheButton";

interface DialogAction {
  label:     string;
  onPress:   () => void;
  variant?:  "primary" | "secondary" | "ghost" | "danger";
}

interface DialogProps {
  visible:     boolean;
  title:       string;
  message?:    string;
  actions?:    DialogAction[];
  onClose?:    () => void;
  style?:      StyleProp<ViewStyle>;
  testID?:     string;
  children?:   React.ReactNode;
}

export const Dialog = memo<DialogProps>(function Dialog({
  visible,
  title,
  message,
  actions   = [],
  onClose,
  style,
  testID,
  children,
}) {
  const { colors, type, sp, rd, shadow } = useThemeTokens();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
      accessibilityViewIsModal
    >
      {/* Backdrop */}
      <Pressable
        style={{
          flex:            1,
          backgroundColor: colors.overlayStrong,
          alignItems:      "center",
          justifyContent:  "center",
          padding:         sp[5],
        }}
        onPress={onClose}
        accessibilityLabel="Close dialog"
      >
        {/* Card — stopPropagation so tapping inside doesn't close */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="none"
          style={[
            {
              width:             "100%",
              maxWidth:          360,
              backgroundColor:   colors.card,
              borderRadius:      rd.xl,
              overflow:          "hidden",
              ...shadow.modal,
            },
            style,
          ]}
        >
          {/* Content */}
          <View style={{ padding: sp[5], gap: sp[2] }}>
            <Text
              style={[type.title, { color: colors.textPrimary }]}
              accessibilityRole="header"
            >
              {title}
            </Text>
            {message && (
              <Text style={[type.body, { color: colors.textSecondary }]}>
                {message}
              </Text>
            )}
            {children}
          </View>

          {/* Divider */}
          {actions.length > 0 && (
            <View style={{ height: 1, backgroundColor: colors.divider }} />
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <View
              style={{
                flexDirection:     actions.length > 2 ? "column" : "row",
                padding:           sp[4],
                gap:               sp[2],
                justifyContent:    "flex-end",
              }}
            >
              {actions.map((action) => (
                <MenasheButton
                  key={action.label}
                  label={action.label}
                  onPress={action.onPress}
                  variant={action.variant ?? "ghost"}
                  size="md"
                />
              ))}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
});

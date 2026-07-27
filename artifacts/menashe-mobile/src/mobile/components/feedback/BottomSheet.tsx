/**
 * BottomSheet
 * MMDL feedback — draggable bottom sheet modal.
 * Animation driven by Animated + PanResponder (no external lib required).
 */

import React, { memo, useRef, useEffect, useCallback } from "react";
import {
  View, Text, Pressable, Modal, Animated, PanResponder,
  Dimensions, type StyleProp, type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@/src/mobile/design-system";

const SCREEN_H = Dimensions.get("window").height;

interface BottomSheetProps {
  visible:     boolean;
  onClose:     () => void;
  title?:      string;
  /** Sheet height as fraction of screen (default 0.5) */
  snapHeight?: number;
  style?:      StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?:     string;
  children?:   React.ReactNode;
}

export const BottomSheet = memo<BottomSheetProps>(function BottomSheet({
  visible,
  onClose,
  title,
  snapHeight = 0.5,
  style,
  contentStyle,
  testID,
  children,
}) {
  const { colors, type, sp, rd } = useThemeTokens();
  const insets                   = useSafeAreaInsets();

  const sheetH  = SCREEN_H * snapHeight;
  const translateY = useRef(new Animated.Value(sheetH)).current;
  const overlayOp  = useRef(new Animated.Value(0)).current;

  const open = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
      Animated.timing(overlayOp,  { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [translateY, overlayOp]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: sheetH, duration: 220, useNativeDriver: true }),
      Animated.timing(overlayOp,  { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }, [translateY, overlayOp, sheetH, onClose]);

  useEffect(() => {
    if (visible) open(); else close();
  }, [visible, open, close]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && g.dy > 0,
      onPanResponderMove: (_, g) => translateY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > sheetH * 0.3 || g.vy > 0.5) { close(); }
        else { open(); }
      },
    }),
  ).current;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={close}
      testID={testID}
    >
      {/* Overlay */}
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.overlay,
          opacity: overlayOp,
        }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={close}
          accessibilityLabel="Close sheet"
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          {
            position:        "absolute",
            bottom:           0,
            left:             0,
            right:            0,
            height:           sheetH,
            backgroundColor: colors.surface,
            borderTopLeftRadius:  rd["2xl"],
            borderTopRightRadius: rd["2xl"],
            transform: [{ translateY }],
            paddingBottom: insets.bottom,
          },
          style,
        ]}
        {...pan.panHandlers}
      >
        {/* Handle */}
        <View style={{ alignItems: "center", paddingTop: sp[2] }}>
          <View
            style={{
              width:           40,
              height:          4,
              borderRadius:    rd.pill,
              backgroundColor: colors.border,
            }}
          />
        </View>

        {title && (
          <Text
            style={[
              type.title,
              {
                color:          colors.textPrimary,
                paddingHorizontal: sp[5],
                paddingTop:     sp[3],
                paddingBottom:  sp[2],
              },
            ]}
          >
            {title}
          </Text>
        )}

        <View style={[{ flex: 1, paddingHorizontal: sp[4] }, contentStyle]}>
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
});

// Inline StyleSheet reference
const StyleSheet = { absoluteFillObject: { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 } };

/**
 * RavMenasheFAB — Global floating "Rav Menashe" AI button.
 *
 * Small, clean, always-visible shortcut to the Sacred Wisdom chat.
 * Designed to match the reference: purple gradient speech-bubble icon
 * with a label below. Sits bottom-right, safe-area aware.
 */

import React, { useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

export function RavMenasheFAB() {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function onPressIn() {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  }

  function onPressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 10,
    }).start();
  }

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: Math.max(insets.bottom, 16) + 12,
        right: 18,
        alignItems: "center",
        transform: [{ scale: scaleAnim }],
        // Lift above content
        zIndex: 999,
        elevation: 14,
      }}
    >
      <Pressable
        onPress={() => router.push("/sacred-wisdom" as any)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityLabel="Ask Rav Menashe AI"
        accessibilityHint="Opens the Sacred Wisdom AI guide"
        accessibilityRole="button"
        style={{ alignItems: "center", gap: 5 }}
      >
        {/* Purple gradient speech-bubble button */}
        <View
          style={{
            shadowColor: "#7B2FF7",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.55,
            shadowRadius: 14,
          }}
        >
          <LinearGradient
            colors={["#8B5CF6", "#7C3AED", "#6D28D9"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.18)",
            }}
          >
            {/* Dot indicator inside — suggests "typing / ask" */}
            <Feather name="message-circle" size={26} color="#ffffff" />
          </LinearGradient>
        </View>

        {/* Label below */}
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: "#a78bfa",
            letterSpacing: 0.3,
            textAlign: "center",
          }}
        >
          Rav Menashe
        </Text>
      </Pressable>
    </Animated.View>
  );
}

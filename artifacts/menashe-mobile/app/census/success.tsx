/**
 * Census — Success — SPR-P006F
 *
 * Lightweight confirmation screen shown after a successful census submission.
 * Navigated to via router.replace() so the user cannot go back to submit.
 */

import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { SPACE, TEXT, RADIUS } from "@/constants/colors";

const GOLD  = "#d4a843";
const GREEN = "#4a9e6b";

function haptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

const NEXT_STEPS = [
  {
    icon: "clock" as const,
    title: "Processing",
    body: "Community administrators will review your submission within a few days.",
  },
  {
    icon: "mail" as const,
    title: "Confirmation",
    body: "You may be contacted if additional information is required.",
  },
  {
    icon: "users" as const,
    title: "Community Record",
    body: "Once approved, your family will be part of the official Bnei Menashe census.",
  },
];

export default function CensusSuccessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={[styles.checkCircle, { backgroundColor: GREEN + "18", borderColor: GREEN + "44" }]}>
          <Feather name="check" size={44} color={GREEN} />
        </View>

        <Text style={[styles.overline, { color: GREEN }]}>SUBMISSION RECEIVED</Text>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Thank You!
        </Text>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your census has been successfully submitted.{"\n"}
          The Bnei Menashe community thanks you.
        </Text>
      </View>

      {/* ── Next steps ── */}
      <View style={styles.steps}>
        {NEXT_STEPS.map(({ icon, title, body }, i) => (
          <View
            key={i}
            style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.stepIcon, { backgroundColor: GOLD + "18", borderColor: GOLD + "38" }]}>
              <Feather name={icon} size={18} color={GOLD} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>{title}</Text>
              <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>{body}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── CTA ── */}
      <View style={[styles.cta, { paddingBottom: SPACE[4] }]}>
        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: GOLD }]}
          onPress={() => {
            haptic();
            // Return to community tab root
            router.replace("/(tabs)/community" as never);
          }}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Done — return to community"
        >
          <Feather name="home" size={17} color="#1a1100" />
          <Text style={styles.doneBtnText}>Back to Community</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACE[8],
    gap: SPACE[3],
  },
  checkCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACE[2],
  },
  overline: {
    fontSize: TEXT.xs,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  title: {
    fontSize: TEXT["3xl"],
    fontWeight: "800",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: TEXT.base,
    textAlign: "center",
    lineHeight: 24,
    marginTop: SPACE[1],
  },

  steps: {
    paddingHorizontal: SPACE[4],
    gap: SPACE[3],
    marginBottom: SPACE[4],
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[3],
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACE[4],
  },
  stepIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepTitle: { fontSize: TEXT.sm, fontWeight: "700" },
  stepBody:  { fontSize: TEXT.sm, lineHeight: 19 },

  cta: {
    paddingHorizontal: SPACE[5],
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[2],
    borderRadius: RADIUS.full,
    paddingVertical: SPACE[4],
  },
  doneBtnText: {
    fontSize: TEXT.md,
    fontWeight: "800",
    color: "#1a1100",
    letterSpacing: -0.3,
  },
});

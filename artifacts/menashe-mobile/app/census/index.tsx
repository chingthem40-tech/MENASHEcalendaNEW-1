/**
 * Census Registration — Introduction Screen
 *
 * Entry point for the community member census submission flow.
 * Navigates to /census/family-head when user taps Begin.
 *
 * Design system: useColors() + SPACE/TEXT/RADIUS — matches every other
 * census form screen (family-head, family-members, review, submit, success).
 * No MenasheButton, no useThemeTokens.
 */

import React, { useState, useEffect } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { SPACE, TEXT, RADIUS } from "@/constants/colors";
import { useLanguage } from "@/context/LanguageContext";
import { hasDraft, clearDraft } from "@/lib/censusStore";

const GOLD = "#d4a843";

function haptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/* ── Static step definitions ─────────────────────────────────────────────── */
const STEPS = [
  { icon: "user"     as const, label: "Family Head",    desc: "Your personal details"          },
  { icon: "users"    as const, label: "Members",        desc: "Household members"               },
  { icon: "eye"      as const, label: "Review",         desc: "Verify all entries"              },
  { icon: "send"     as const, label: "Submit",         desc: "Send to local admin"             },
];

/* ── Info card ───────────────────────────────────────────────────────────── */
function InfoCard({
  icon, title, body, colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  body: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconBox, {
        backgroundColor: colors.primary + "18",
        borderColor:     colors.primary + "38",
      }]}>
        <Feather name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.infoBody,  { color: colors.mutedForeground }]}>{body}</Text>
      </View>
    </View>
  );
}

/* ── Screen ──────────────────────────────────────────────────────────────── */
export default function CensusIntroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t }  = useLanguage();

  const [draftExists, setDraftExists] = useState(false);
  const [discarding,  setDiscarding]  = useState(false);

  useEffect(() => { hasDraft().then(setDraftExists); }, []);

  function handleBegin() {
    haptic();
    router.push("/census/family-head");
  }

  function handleDiscardDraft() {
    haptic();
    Alert.alert(
      t.censusDiscardDraftTitle,
      t.censusDiscardDraftBody,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: t.censusDiscardDraftConfirm,
          style: "destructive",
          onPress: async () => {
            setDiscarding(true);
            await clearDraft();
            setDraftExists(false);
            setDiscarding(false);
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Nav bar ── */}
      <View style={[styles.nav, {
        paddingTop: insets.top + SPACE[2],
        borderBottomColor: colors.border,
      }]}>
        <TouchableOpacity
          onPress={() => { haptic(); router.back(); }}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          Census Registration
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero header ── */}
        <View style={[styles.hero, { backgroundColor: GOLD + "0D" }]}>
          <View style={[styles.heroIcon, { backgroundColor: GOLD + "18", borderColor: GOLD + "44" }]}>
            <Text style={styles.heroEmoji}>📋</Text>
          </View>
          <Text style={[styles.heroOverline, { color: GOLD }]}>BNEI MENASHE COUNCIL INDIA</Text>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Official Census{"\n"}2026–2027
          </Text>
          <Text style={[styles.heroTagline, { color: colors.mutedForeground }]}>
            Know your community · Build your future
          </Text>
        </View>

        {/* ── Progress chips ── */}
        <View style={styles.chipRow}>
          {[
            { icon: "clock"  as const, label: "~10 minutes" },
            { icon: "shield" as const, label: "Private & secure" },
            { icon: "save"   as const, label: "Draft saved" },
          ].map(c => (
            <View key={c.label} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={c.icon} size={12} color={colors.mutedForeground} />
              <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Step flow preview ── */}
        <View style={[styles.stepRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.label}>
              <View style={styles.stepItem}>
                <View style={[styles.stepIcon, {
                  backgroundColor: GOLD + "18",
                  borderColor:     GOLD + "44",
                }]}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {s.label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepConnector, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* ── Info cards ── */}
        <View style={styles.cards}>
          <InfoCard
            icon="help-circle"
            title="What is Community Census?"
            body="A structured registration of every Bnei Menashe family — recording names, locations, family size, and Aliyah status to build an accurate picture of the global community."
            colors={colors}
          />
          <InfoCard
            icon="trending-up"
            title="Why does it matter?"
            body="Accurate census data helps Shavei Israel plan Aliyah, allocate resources, and advocate on behalf of our community. Every family counted strengthens our voice."
            colors={colors}
          />
          <InfoCard
            icon="lock"
            title="Your privacy is protected"
            body="All data is held securely by community administrators and never shared publicly without consent. Only your local admin and the BMC council can view your entry."
            colors={colors}
          />
          <InfoCard
            icon="save"
            title="Draft auto-saved"
            body="Your progress is automatically saved as you type. You can close the app and return at any time — your data will be right where you left off."
            colors={colors}
          />
        </View>

        {/* ── Official notice ── */}
        <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
            Completed census forms require signature by: (1) Head of Family, (2) Community Chairman / Secretary,
            and (3) BMC(I) Chairman / Secretary before official submission.
          </Text>
        </View>

        {/* ── Draft warning ── */}
        {draftExists && (
          <View style={[styles.draftBanner, { backgroundColor: GOLD + "0D", borderColor: GOLD + "33" }]}>
            <Feather name="alert-circle" size={15} color={GOLD} />
            <Text style={[styles.draftBannerText, { color: GOLD }]}>
              You have an in-progress census draft saved. Tap Begin to continue where you left off.
            </Text>
          </View>
        )}

        {/* ── CTA ── */}
        <View style={styles.cta}>
          <TouchableOpacity
            style={[styles.beginBtn, { backgroundColor: colors.primary }]}
            onPress={handleBegin}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Begin Census Registration"
          >
            <Feather name="edit-3" size={17} color={colors.primaryForeground} />
            <Text style={[styles.beginBtnText, { color: colors.primaryForeground }]}>
              {draftExists ? "Continue Census" : "Begin Census"}
            </Text>
          </TouchableOpacity>

          {draftExists && (
            <TouchableOpacity
              onPress={handleDiscardDraft}
              style={[styles.discardBtn, { borderColor: "#c0392b44" }]}
              activeOpacity={0.75}
              disabled={discarding}
              accessibilityRole="button"
              accessibilityLabel={t.censusDiscardDraft}
            >
              {discarding
                ? <ActivityIndicator size="small" color="#c0392b" />
                : <>
                    <Feather name="trash-2" size={13} color="#c0392b" />
                    <Text style={[styles.discardBtnText, { color: "#c0392b" }]}>
                      {t.censusDiscardDraft}
                    </Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1 },

  /* Nav */
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACE[4],
    paddingBottom: SPACE[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn:   { width: 40, height: 40, justifyContent: "center" },
  navTitle: { fontSize: TEXT.md, fontWeight: "700", letterSpacing: -0.3 },

  scroll: { gap: 0 },

  /* Hero */
  hero: {
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  heroIcon: {
    width: 88, height: 88, borderRadius: 22,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  heroEmoji:   { fontSize: 48 },
  heroOverline: {
    fontSize: 10, fontWeight: "800", letterSpacing: 2.2, textAlign: "center",
  },
  heroTitle: {
    fontSize: 28, fontWeight: "800", letterSpacing: -0.7,
    textAlign: "center", lineHeight: 34,
  },
  heroTagline: {
    fontSize: TEXT.base, textAlign: "center", lineHeight: 22, marginTop: 4,
  },

  /* Chips */
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[4],
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontSize: 11, fontWeight: "600" },

  /* Step flow preview */
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: SPACE[4],
    marginBottom: SPACE[5],
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    paddingVertical: SPACE[4],
    paddingHorizontal: SPACE[3],
  },
  stepItem: { flex: 1, alignItems: "center", gap: 6 },
  stepIcon: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  stepNum:  { fontSize: 14, fontWeight: "800", color: GOLD },
  stepLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.2, textAlign: "center" },
  stepConnector: { width: 1, height: 24, borderRadius: 1, marginBottom: 14 },

  /* Info cards */
  cards: {
    paddingHorizontal: SPACE[4],
    gap: 10,
    marginBottom: SPACE[5],
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[4],
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACE[4],
  },
  iconBox: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  infoTitle: { fontSize: TEXT.sm, fontWeight: "700", marginBottom: 3 },
  infoBody:  { fontSize: 12, lineHeight: 18 },

  /* Official notice */
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[2],
    marginHorizontal: SPACE[4],
    marginBottom: SPACE[4],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE[3],
  },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 17 },

  /* Draft banner */
  draftBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[2],
    marginHorizontal: SPACE[4],
    marginBottom: SPACE[4],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE[3],
  },
  draftBannerText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: "600" },

  /* CTA */
  cta: {
    alignItems: "center",
    paddingHorizontal: SPACE[4],
    paddingBottom: SPACE[4],
    gap: SPACE[3],
  },
  beginBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[2],
    borderRadius: RADIUS.full,
    paddingVertical: SPACE[4],
  },
  beginBtnText: { fontSize: TEXT.md, fontWeight: "800", letterSpacing: -0.3 },

  discardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[2],
  },
  discardBtnText: { fontSize: 12, fontWeight: "600" },
});

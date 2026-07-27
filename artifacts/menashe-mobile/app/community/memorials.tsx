/**
 * Community · Memorials — full yahrzeit board screen
 * Deep screen navigated to from the Community Hub.
 * Displays community yahrzeit candles with animated BurningCandleRN.
 * Also contains the "Light a Candle" submission form.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Platform,
  ActivityIndicator, StyleSheet, Modal, TextInput,
  RefreshControl, KeyboardAvoidingView, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { SPACE, TEXT, RADIUS } from "@/constants/colors";
import { useLanguage } from "@/context/LanguageContext";
// Dark candlelit palette is intentional for the memorial atmosphere; useColors()
// is used for nav/form elements so they adapt to the user's selected theme.
const CANDLE_BG = "#0e0b1e";
import BurningCandleRN from "@/components/BurningCandleRN";
import {
  fetchCommunityYahrzeit,
  createCommunityYahrzeit,
  dedicateLearning,
  type CommunityYahrzeitEntry,
} from "@/lib/communityApi";

// Hebrew month names for the date picker
const HEBREW_MONTHS = [
  { value: 1,  label: "Nissan" },
  { value: 2,  label: "Iyar" },
  { value: 3,  label: "Sivan" },
  { value: 4,  label: "Tammuz" },
  { value: 5,  label: "Av" },
  { value: 6,  label: "Elul" },
  { value: 7,  label: "Tishrei" },
  { value: 8,  label: "Cheshvan" },
  { value: 9,  label: "Kislev" },
  { value: 10, label: "Tevet" },
  { value: 11, label: "Shvat" },
  { value: 12, label: "Adar" },
  { value: 13, label: "Adar II" },
];

function haptic(style: "light" | "medium" = "light") {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(
      style === "medium"
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );
  }
}

export default function MemorialsScreen() {
  const colors = useColors(); // used for modal/form areas so they respect the user's selected theme
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  const [entries, setEntries] = useState<CommunityYahrzeitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Dedicate learning modal state
  const [dedicateTarget, setDedicateTarget] = useState<CommunityYahrzeitEntry | null>(null);
  const [learnerName, setLearnerName] = useState("");
  const [studySubject, setStudySubject] = useState("Daily Mishnah");
  const [dedicating, setDedicating] = useState(false);

  // New memorial form state
  const [deceasedName, setDeceasedName] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [hebrewDay, setHebrewDay] = useState(1);
  const [hebrewMonth, setHebrewMonth] = useState(7); // Tishrei default
  const [passingYear, setPassingYear] = useState("");
  const [message, setMessage] = useState("");
  const [donorName, setDonorName] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const data = await fetchCommunityYahrzeit();
    setEntries(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(() => load(), 60_000);
    return () => clearInterval(iv);
  }, [load]);

  const candleCount = entries.length;
  const learnerCount = entries.reduce((s, e) => s + e.learners.length, 0);

  async function handleSubmit() {
    if (!deceasedName.trim()) return;
    haptic("medium");
    setSubmitting(true);
    try {
      await createCommunityYahrzeit({
        id: `yahrzeit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        deceasedName: deceasedName.trim(),
        hebrewDay,
        hebrewMonth,
        displayDate: displayDate.trim() || `${hebrewDay} ${HEBREW_MONTHS.find(m => m.value === hebrewMonth)?.label}`,
        passingYear: passingYear ? parseInt(passingYear) : null,
        message: message.trim(),
        donorDisplayName: donorName.trim(),
      });
      // Reset form
      setDeceasedName(""); setDisplayDate(""); setHebrewDay(1); setHebrewMonth(7);
      setPassingYear(""); setMessage(""); setDonorName("");
      setShowForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
      load();
    } catch {
      Alert.alert("Error", "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDedicate() {
    if (!dedicateTarget || !learnerName.trim()) return;
    haptic("medium");
    setDedicating(true);
    try {
      await dedicateLearning(dedicateTarget.id, learnerName.trim(), studySubject.trim() || "Daily Mishnah");
      setDedicateTarget(null); setLearnerName(""); setStudySubject("Daily Mishnah");
      load();
    } catch {
      Alert.alert("Error", "Could not dedicate learning. Please try again.");
    } finally {
      setDedicating(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0e0b1e" }}>
      {/* ── Nav bar ── */}
      <View style={[styles.navBar, { paddingTop: topPad, borderBottomColor: "rgba(212,175,55,0.2)" }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)" }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={20} color="#e8d4a0" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.navTitle, { color: "#F5D982" }]}>
            🕯  {t.commMemorialsTitle}
          </Text>
          <Text style={[styles.navSub, { color: "rgba(212,175,55,0.65)" }]}>
            {t.commMemorialsInLovingMemory}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.lightBtn, { backgroundColor: "#d4a843" }]}
          onPress={() => { haptic(); setShowForm(true); }}
          accessibilityRole="button"
          accessibilityLabel={t.commLightCandle}
        >
          <Text style={{ fontSize: TEXT.sm }}>🕯</Text>
          <Text style={[styles.lightBtnText, { color: "#0e0b1e" }]}>{t.commLightCandle}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Success banner ── */}
      {success && (
        <View style={styles.successBanner}>
          <Feather name="check-circle" size={16} color="#4ade80" />
          <Text style={{ fontSize: TEXT.sm, color: "#4ade80", fontWeight: "600" }}>
            {t.commMemorialsAddedBanner}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#d4a843" size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#d4a843"
              colors={["#d4a843"]}
            />
          }
        >
          {/* ── Stats ── */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{candleCount}</Text>
              <Text style={styles.statLabel}>{t.commMemorialsCandlesLit.toUpperCase()}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: "#4ade80" }]}>{learnerCount}</Text>
              <Text style={styles.statLabel}>{t.commMemorialsLearning.toUpperCase()}</Text>
            </View>
          </View>

          {/* ── Empty state ── */}
          {entries.length === 0 && (
            <View style={styles.center}>
              <Text style={{ fontSize: 48, marginBottom: SPACE[3] }}>🕯</Text>
              <Text style={[styles.emptyTitle, { color: "#F5D982" }]}>
                {t.commMemorialsEmpty}
              </Text>
              <Text style={[styles.emptyBody, { color: "rgba(212,175,55,0.55)" }]}>
                {t.commMemorialsAddFirst}
              </Text>
              <TouchableOpacity
                style={[styles.lightBtn, { backgroundColor: "#d4a843", marginTop: SPACE[4] }]}
                onPress={() => setShowForm(true)}
              >
                <Text style={{ fontSize: TEXT.sm }}>🕯</Text>
                <Text style={[styles.lightBtnText, { color: "#0e0b1e" }]}>{t.commLightCandle}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Candle grid ── */}
          {entries.length > 0 && (
            <View style={styles.grid}>
              {entries.map((entry) => (
                <View key={entry.id} style={styles.gridItem}>
                  <BurningCandleRN
                    deceasedName={entry.deceasedName}
                    donorName={entry.donorDisplayName || undefined}
                    learners={entry.learners}
                    isLit={entry.candleLit}
                    compact
                  />
                  {/* Date tag */}
                  <View style={styles.datePill}>
                    <Text style={styles.datePillText}>{entry.displayDate}</Text>
                  </View>
                  {/* Dedicate learning button */}
                  <TouchableOpacity
                    style={styles.dedicateBtn}
                    onPress={() => {
                      haptic();
                      setDedicateTarget(entry);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Dedicate learning"
                  >
                    <Text style={styles.dedicateBtnText}>📖 Dedicate</Text>
                  </TouchableOpacity>
                  {/* Message snippet */}
                  {!!entry.message && (
                    <Text style={styles.candleMessage} numberOfLines={2}>
                      "{entry.message}"
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ══ Light a Candle Modal ══ */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalHeader, { paddingTop: insets.top + SPACE[4], borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>🕯 {t.commMemorialsLightTitle}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)} accessibilityRole="button" accessibilityLabel="Close">
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: SPACE[4], paddingBottom: 60 }}>
            <Text style={[styles.formSubtitle, { color: colors.mutedForeground }]}>
              {t.commMemorialsLightDesc}
            </Text>

            <FieldLabel color={colors.mutedForeground}>DEPARTED NAME *</FieldLabel>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="Full name of the departed"
              placeholderTextColor={colors.mutedForeground}
              value={deceasedName}
              onChangeText={setDeceasedName}
              autoCapitalize="words"
            />

            <FieldLabel color={colors.mutedForeground}>HEBREW DATE OF PASSING</FieldLabel>
            <View style={styles.dateRow}>
              <TextInput
                style={[styles.input, { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="Day (1–30)"
                placeholderTextColor={colors.mutedForeground}
                value={hebrewDay.toString()}
                onChangeText={(v) => { const n = parseInt(v); if (!isNaN(n) && n >= 1 && n <= 30) setHebrewDay(n); }}
                keyboardType="number-pad"
              />
              <View style={{ flex: 2 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}
                >
                  {HEBREW_MONTHS.map(m => (
                    <TouchableOpacity
                      key={m.value}
                      style={[styles.monthPill, {
                        borderColor: hebrewMonth === m.value ? "#d4a843" : "rgba(212,175,55,0.25)",
                        backgroundColor: hebrewMonth === m.value ? "rgba(212,175,55,0.18)" : "transparent",
                      }]}
                      onPress={() => { haptic(); setHebrewMonth(m.value); }}
                    >
                      <Text style={[styles.monthPillText, {
                        color: hebrewMonth === m.value ? "#d4a843" : "rgba(212,175,55,0.5)",
                      }]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <FieldLabel color={colors.mutedForeground}>YEAR OF PASSING (OPTIONAL)</FieldLabel>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="e.g. 2022"
              placeholderTextColor={colors.mutedForeground}
              value={passingYear}
              onChangeText={setPassingYear}
              keyboardType="number-pad"
            />

            <FieldLabel color={colors.mutedForeground}>YOUR NAME (DONOR)</FieldLabel>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="Shown on the candle as 'lit by…'"
              placeholderTextColor={colors.mutedForeground}
              value={donorName}
              onChangeText={setDonorName}
              autoCapitalize="words"
            />

            <FieldLabel color={colors.mutedForeground}>MEMORIAL MESSAGE (OPTIONAL)</FieldLabel>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="A memory, prayer, or message of love…"
              placeholderTextColor={colors.mutedForeground}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitBtn, {
                backgroundColor: deceasedName.trim() ? "#d4a843" : colors.muted,
              }]}
              onPress={handleSubmit}
              disabled={!deceasedName.trim() || submitting}
              accessibilityRole="button"
              accessibilityLabel={t.commMemorialsSubmitBtn}
            >
              {submitting ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Text style={{ fontSize: TEXT.base }}>🕯</Text>
                  <Text style={[styles.submitBtnText, { color: deceasedName.trim() ? colors.background : colors.mutedForeground }]}>
                    {t.commMemorialsSubmitBtn}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ Dedicate Learning Modal ══ */}
      <Modal visible={!!dedicateTarget} animationType="slide" presentationStyle="formSheet">
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalHeader, { paddingTop: insets.top + SPACE[4], borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              📖 {t.commMemorialsDedicateTitle}
            </Text>
            <TouchableOpacity
              onPress={() => { setDedicateTarget(null); setLearnerName(""); }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: SPACE[4], paddingBottom: 60 }}>
            {dedicateTarget && (
              <Text style={[styles.formSubtitle, { color: colors.mutedForeground, marginBottom: SPACE[4] }]}>
                {t.commMemorialsDedicateDesc}{" "}
                <Text style={{ fontWeight: "700", color: colors.foreground }}>
                  {dedicateTarget.deceasedName}
                </Text>.
              </Text>
            )}

            <FieldLabel color={colors.mutedForeground}>YOUR NAME *</FieldLabel>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="Your full name"
              placeholderTextColor={colors.mutedForeground}
              value={learnerName}
              onChangeText={setLearnerName}
              autoCapitalize="words"
            />

            <FieldLabel color={colors.mutedForeground}>STUDY SUBJECT</FieldLabel>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE[2], marginBottom: SPACE[4] }}>
              {["Daily Mishnah", "Daily Talmud", "Parashat HaShavua", "Tehillim", "Halacha", "Mussar"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.subjectPill, {
                    borderColor: studySubject === s ? "#d4a843" : colors.border,
                    backgroundColor: studySubject === s ? "#d4a84318" : colors.card,
                  }]}
                  onPress={() => { haptic(); setStudySubject(s); }}
                >
                  <Text style={[styles.subjectPillText, {
                    color: studySubject === s ? "#d4a843" : colors.mutedForeground,
                  }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, {
                backgroundColor: learnerName.trim() ? "#d4a843" : colors.muted,
              }]}
              onPress={handleDedicate}
              disabled={!learnerName.trim() || dedicating}
              accessibilityRole="button"
              accessibilityLabel={t.commMemorialsDedicateBtn}
            >
              {dedicating ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Text style={{ fontSize: TEXT.base }}>📖</Text>
                  <Text style={[styles.submitBtnText, { color: learnerName.trim() ? colors.background : colors.mutedForeground }]}>
                    {t.commMemorialsDedicateBtn}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      {/* ── Continue: visit Sacred Memory ─────────────────────────────── */}
      <TouchableOpacity
        onPress={() => router.push("/sacred-memory" as any)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE[2],
          marginHorizontal: SPACE[4], marginTop: SPACE[2], marginBottom: insets.bottom + SPACE[5],
          borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border,
          paddingVertical: SPACE[3], backgroundColor: colors.card,
        }}
      >
        <Text style={{ fontSize: TEXT.sm, fontWeight: "600", color: colors.mutedForeground }}>Sacred Memory</Text>
        <Feather name="arrow-right" size={15} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

function FieldLabel({ children, color = "rgba(212,175,55,0.6)" }: { children: React.ReactNode; color?: string }) {
  return (
    <Text style={{ fontSize: TEXT.xs, fontWeight: "700", letterSpacing: 1.2, color, marginBottom: SPACE[2] }}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACE[3],
    paddingHorizontal: SPACE[4],
    paddingBottom: SPACE[3],
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navTitle: {
    fontSize: TEXT.md,
    fontWeight: "700",
    lineHeight: 22,
  },
  navSub: {
    fontSize: TEXT.xs,
  },
  lightBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[2],
    borderRadius: RADIUS.full,
  },
  lightBtnText: {
    fontSize: TEXT.sm,
    fontWeight: "700",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[2],
    padding: SPACE[3],
    backgroundColor: "rgba(74,222,128,0.12)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(74,222,128,0.25)",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[10],
    paddingVertical: SPACE[5],
  },
  stat: {
    alignItems: "center",
    gap: 2,
  },
  statNum: {
    fontSize: TEXT["3xl"],
    fontWeight: "900",
    color: "#d4a843",
  },
  statLabel: {
    fontSize: TEXT.xs,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(212,175,55,0.6)",
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: "rgba(212,175,55,0.2)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACE[8],
    gap: SPACE[3],
  },
  emptyTitle: {
    fontSize: TEXT.lg,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: TEXT.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACE[3],
    gap: SPACE[3],
    justifyContent: "flex-start",
  },
  gridItem: {
    width: "47%",
    alignItems: "center",
    paddingVertical: SPACE[3],
    paddingHorizontal: SPACE[2],
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
  },
  datePill: {
    marginTop: SPACE[2],
    backgroundColor: "rgba(212,175,55,0.12)",
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[2],
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
  },
  datePillText: {
    fontSize: TEXT.xs,
    fontWeight: "600",
    color: "rgba(212,175,55,0.75)",
  },
  dedicateBtn: {
    marginTop: SPACE[2],
    paddingHorizontal: SPACE[2],
    paddingVertical: 4,
  },
  dedicateBtnText: {
    fontSize: TEXT.xs,
    color: "rgba(212,175,55,0.65)",
    fontWeight: "600",
  },
  candleMessage: {
    fontSize: TEXT.xs,
    color: "rgba(212,175,55,0.5)",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: SPACE[1],
    lineHeight: 16,
    paddingHorizontal: SPACE[1],
  },
  // Modal
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACE[4],
    paddingBottom: SPACE[4],
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: TEXT.lg,
    fontWeight: "700",
  },
  formSubtitle: {
    fontSize: TEXT.sm,
    color: "rgba(212,175,55,0.55)",
    lineHeight: 20,
    marginBottom: SPACE[5],
  },
  input: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACE[3],
    fontSize: TEXT.base,
    marginBottom: SPACE[4],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top" as const,
  },
  dateRow: {
    flexDirection: "row",
    gap: SPACE[3],
    marginBottom: SPACE[4],
    alignItems: "center",
  },
  monthPill: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[1],
  },
  monthPillText: {
    fontSize: TEXT.xs,
    fontWeight: "600",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[2],
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[4],
    marginTop: SPACE[2],
  },
  submitBtnText: {
    fontSize: TEXT.base,
    fontWeight: "700",
  },
  subjectPill: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[1],
  },
  subjectPillText: {
    fontSize: TEXT.xs,
    fontWeight: "600",
  },
});

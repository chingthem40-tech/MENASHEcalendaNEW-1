import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  Platform, Alert, ActivityIndicator, Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useThemeTokens } from "@/src/mobile/design-system";

import { storageGet, storageSet } from "@/lib/storageUtils";

const STORAGE_KEY = "menashe-torah-tracker-v2";
const GOAL_KEY = "menashe-torah-goal-v2";

export interface StudyEntry {
  id: string;
  date: string;
  subject: string;
  duration: number;
  notes: string;
}

const SUBJECTS = ["Parasha", "Gemara", "Mishna", "Halacha", "Tanach", "Mussar", "Prayer", "Other"];

const SUBJECT_META: Record<string, { color: string; emoji: string }> = {
  Parasha:  { color: "#d4a843", emoji: "📜" },
  Gemara:   { color: "#a78bfa", emoji: "📖" },
  Mishna:   { color: "#818cf8", emoji: "📚" },
  Halacha:  { color: "#4ade80", emoji: "⚖️" },
  Tanach:   { color: "#fbbf24", emoji: "✡" },
  Mussar:   { color: "#f472b6", emoji: "🌱" },
  Prayer:   { color: "#34d399", emoji: "🙏" },
  Other:    { color: "#94a3b8", emoji: "📝" },
};

const BADGES = [
  { id: "streak3",    emoji: "🌿", label: "First Fruits",   sub: "3-day streak",     earned: (s: number) => s >= 3 },
  { id: "streak7",    emoji: "⭐", label: "Sheva",          sub: "7-day streak",     earned: (s: number) => s >= 7 },
  { id: "streak30",   emoji: "🏆", label: "Chodesh",        sub: "30-day streak",    earned: (s: number) => s >= 30 },
  { id: "sessions10", emoji: "🎯", label: "First Steps",    sub: "10 sessions",      earned: (_: number, n: number) => n >= 10 },
  { id: "sessions50", emoji: "🥇", label: "Talmid",         sub: "50 sessions",      earned: (_: number, n: number) => n >= 50 },
  { id: "hours10",    emoji: "📖", label: "10 Hours",       sub: "600 min total",    earned: (_: number, _n: number, m: number) => m >= 600 },
  { id: "hours50",    emoji: "🌟", label: "50 Hours",       sub: "3,000 min total",  earned: (_: number, _n: number, m: number) => m >= 3000 },
  { id: "hours100",   emoji: "🎓", label: "Torah Scholar",  sub: "6,000 min total",  earned: (_: number, _n: number, m: number) => m >= 6000 },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

function todayStr() { return new Date().toISOString().slice(0, 10); }

function computeStreak(entries: StudyEntry[]): number {
  const days = new Set(entries.map(e => e.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function TorahTrackerScreen() {
  const { colors } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  const [entries, setEntries] = useState<StudyEntry[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState(210);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [subject, setSubject] = useState("Parasha");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([
      storageGet<StudyEntry[]>(STORAGE_KEY, []),
      storageGet<number>(GOAL_KEY, 210),
    ]).then(([e, g]) => {
      setEntries(e);
      setWeeklyGoal(g);
      setLoading(false);
    });
  }, []);

  const streak = useMemo(() => computeStreak(entries), [entries]);
  const totalMins = useMemo(() => entries.reduce((a, e) => a + e.duration, 0), [entries]);
  const totalSessions = entries.length;

  const weekMins = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    cutoff.setHours(0, 0, 0, 0);
    return entries.filter(e => new Date(e.date) >= cutoff).reduce((a, e) => a + e.duration, 0);
  }, [entries]);

  const todayMins = useMemo(() => {
    const today = todayStr();
    return entries.filter(e => e.date === today).reduce((a, e) => a + e.duration, 0);
  }, [entries]);

  const earnedBadges = useMemo(
    () => BADGES.filter(b => b.earned(streak, totalSessions, totalMins)),
    [streak, totalSessions, totalMins],
  );

  const weekProgress = Math.min(weekMins / weeklyGoal, 1);

  async function saveEntry() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const entry: StudyEntry = {
      id: Date.now().toString(),
      date: todayStr(),
      subject,
      duration,
      notes: notes.trim(),
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    await storageSet(STORAGE_KEY, updated);
    setNotes("");
    setShowForm(false);
  }

  async function deleteEntry(id: string) {
    Alert.alert("Delete Session", "Remove this study session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const updated = entries.filter(e => e.id !== id);
          setEntries(updated);
          await storageSet(STORAGE_KEY, updated);
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="chevron-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Torah Tracker</Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>Log your daily Torah study</Text>
          </View>
          <TouchableOpacity
            style={[styles.logBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowForm(true)}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={[styles.logBtnText, { color: colors.primaryForeground }]}>Log</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: "Day Streak", value: `${streak}`, icon: "zap" as const, color: "#fbbf24" },
            { label: "Today", value: `${todayMins}m`, icon: "clock" as const, color: colors.primary },
            { label: "All Time", value: totalMins >= 60 ? `${Math.floor(totalMins/60)}h` : `${totalMins}m`, icon: "book-open" as const, color: "#a78bfa" },
          ].map(s => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={s.icon} size={16} color={s.color} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Weekly progress */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Weekly Goal</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              {weekMins}/{weeklyGoal} min
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
            <View style={[styles.progressFill, { width: `${weekProgress * 100}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 6 }}>
            {weekProgress >= 1 ? "🎉 Goal reached this week!" : `${weeklyGoal - weekMins} min remaining`}
          </Text>
        </View>

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Badges Earned</Text>
            <View style={styles.badgeRow}>
              {earnedBadges.map(b => (
                <View key={b.id} style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                  <Text style={[styles.badgeLabel, { color: colors.foreground }]}>{b.label}</Text>
                  <Text style={[styles.badgeSub, { color: colors.mutedForeground }]}>{b.sub}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* History */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Sessions</Text>
        </View>
        {entries.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📖</Text>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>No sessions yet</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: "center" }}>
              Tap the Log button to record your first Torah study session.
            </Text>
          </View>
        ) : (
          entries.slice(0, 30).map(entry => {
            const meta = SUBJECT_META[entry.subject] ?? SUBJECT_META.Other;
            return (
              <TouchableOpacity
                key={entry.id}
                style={[styles.entryRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onLongPress={() => deleteEntry(entry.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.entryIcon, { backgroundColor: meta.color + "18" }]}>
                  <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.entrySubject, { color: colors.foreground }]}>{entry.subject}</Text>
                  {entry.notes ? (
                    <Text style={[styles.entryNotes, { color: colors.mutedForeground }]} numberOfLines={1}>{entry.notes}</Text>
                  ) : null}
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.entryDuration, { color: meta.color }]}>{entry.duration}m</Text>
                  <Text style={[styles.entryDate, { color: colors.mutedForeground }]}>{entry.date.slice(5)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* ── Continue: go to daily Daf ──────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.push("/daf-yomi" as any)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            marginHorizontal: 16, marginTop: 8, marginBottom: insets.bottom + 24,
            borderRadius: 14, borderWidth: 1, borderColor: colors.border,
            paddingVertical: 14, backgroundColor: colors.card,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.mutedForeground }}>Today's Daf Yomi</Text>
          <Feather name="arrow-right" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>

      {/* Log Session Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log Study Session</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>SUBJECT</Text>
            <View style={styles.subjectGrid}>
              {SUBJECTS.map(s => {
                const meta = SUBJECT_META[s] ?? SUBJECT_META.Other;
                const active = s === subject;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.subjectBtn,
                      { borderColor: active ? meta.color : colors.border, backgroundColor: active ? meta.color + "18" : colors.card },
                    ]}
                    onPress={() => setSubject(s)}
                  >
                    <Text style={{ fontSize: 14 }}>{meta.emoji}</Text>
                    <Text style={[styles.subjectLabel, { color: active ? meta.color : colors.foreground }]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 20 }]}>DURATION</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durationBtn,
                    { borderColor: d === duration ? colors.primary : colors.border, backgroundColor: d === duration ? colors.primary : colors.card },
                  ]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.durationText, { color: d === duration ? colors.primaryForeground : colors.foreground }]}>
                    {d}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 20 }]}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="What did you study?"
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
              onPress={saveEntry}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Session</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 20, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  logBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  logBtnText: { fontSize: 14, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 10, fontWeight: "600" },
  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 14, borderWidth: 1, padding: 16 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  sectionSub: { fontSize: 12 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center", minWidth: 80 },
  badgeEmoji: { fontSize: 20, marginBottom: 4 },
  badgeLabel: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  badgeSub: { fontSize: 9, textAlign: "center" },
  emptyCard: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, padding: 32, alignItems: "center" },
  entryRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  entryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  entrySubject: { fontSize: 14, fontWeight: "600" },
  entryNotes: { fontSize: 12, marginTop: 2 },
  entryDuration: { fontSize: 15, fontWeight: "700" },
  entryDate: { fontSize: 11, marginTop: 2 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.1, marginBottom: 8 },
  subjectGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  subjectBtn: { borderRadius: 10, borderWidth: 1.5, paddingVertical: 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  subjectLabel: { fontSize: 13, fontWeight: "600" },
  durationRow: { flexDirection: "row", gap: 8 },
  durationBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 10, alignItems: "center" },
  durationText: { fontSize: 13, fontWeight: "700" },
  notesInput: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: "top" as const },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "700" },
});

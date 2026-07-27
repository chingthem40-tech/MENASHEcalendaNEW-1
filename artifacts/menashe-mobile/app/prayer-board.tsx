/**
 * Prayer Board screen
 * Upgraded to use the real /api/prayer-requests backend.
 * Non-admin users see approved requests only; new submissions go to pending
 * and appear after admin approval.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Switch, Modal, ActivityIndicator, RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useThemeTokens } from "@/src/mobile/design-system";

import { useLanguage } from "@/context/LanguageContext";
import { fetchPrayerRequests, submitPrayerRequest, amenPrayerRequest, type PrayerRequest } from "@/lib/prayerBoardApi";

const CATEGORIES = [
  "Healing", "Blessing", "Aliyah", "Family",
  "Livelihood", "Community", "Gratitude", "Protection", "Other",
];

const CAT_META: Record<string, { color: string; emoji: string }> = {
  Healing:     { color: "#4ade80", emoji: "💚" },
  Blessing:    { color: "#d4a843", emoji: "✨" },
  Aliyah:      { color: "#4ade80", emoji: "🇮🇱" },
  Family:      { color: "#f472b6", emoji: "👨‍👩‍👧‍👦" },
  Livelihood:  { color: "#818cf8", emoji: "🌾" },
  Community:   { color: "#fb923c", emoji: "🫂" },
  Gratitude:   { color: "#fbbf24", emoji: "🙏" },
  Protection:  { color: "#a78bfa", emoji: "🛡️" },
  Other:       { color: "#94a3b8", emoji: "✡" },
};

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(ms / 3_600_000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(ms / 86_400_000);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PrayerBoardScreen() {
  const { colors } = useThemeTokens();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  /** IDs this session's user has amen'd (optimistic, not persisted) */
  const [amens, setAmens] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Blessing");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const data = await fetchPrayerRequests();
    setRequests(data.filter((r) => r.status === "approved"));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(() => load(), 60_000);
    return () => clearInterval(iv);
  }, [load]);

  const displayed = filter === "All"
    ? requests
    : requests.filter((r) => r.category === filter);

  async function toggleAmen(id: string) {
    // Backend is increment-only — one amen per session, no un-amen
    if (amens.has(id)) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = new Set(amens);
    next.add(id);
    setAmens(next);
    setRequests((prev) =>
      prev.map((r) => r.id !== id ? r : { ...r, amens: r.amens + 1 })
    );
    amenPrayerRequest(id).catch(() => {});
  }

  async function submitRequest() {
    if (!text.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      await submitPrayerRequest({
        id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: isAnon ? "Anonymous" : (name.trim() || "Anonymous"),
        isAnonymous: isAnon,
        text: text.trim(),
        category,
      });
      setName(""); setText(""); setIsAnon(false); setCategory("Blessing");
      setShowForm(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      // Show inline error — keep form open so user doesn't lose their text
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="chevron-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>Prayer Board</Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
              Community prayer requests
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowForm(true)}
            accessibilityRole="button"
            accessibilityLabel="Add request"
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={[styles.newBtnText, { color: colors.primaryForeground }]}>Request</Text>
          </TouchableOpacity>
        </View>

        {/* Submission confirmation */}
        {submitted && (
          <View style={[styles.submittedBanner, { backgroundColor: colors.success + "18", borderColor: colors.success + "44" }]}>
            <Feather name="check-circle" size={15} color={colors.success} />
            <Text style={[styles.submittedText, { color: colors.success }]}>
              {t.commPrayerSubmittedNotice}
            </Text>
          </View>
        )}

        {/* ── Category filter ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}
        >
          {["All", ...CATEGORIES].map((cat) => {
            const active = cat === filter;
            const meta = CAT_META[cat];
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.pill,
                  {
                    borderColor: active ? (meta?.color ?? colors.primary) : colors.border,
                    backgroundColor: active ? ((meta?.color ?? colors.primary) + "18") : colors.card,
                  },
                ]}
                onPress={() => setFilter(cat)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${cat}`}
              >
                {meta && <Text style={{ fontSize: 12 }}>{meta.emoji} </Text>}
                <Text style={[styles.pillText, {
                  color: active ? (meta?.color ?? colors.primary) : colors.mutedForeground,
                }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Requests ── */}
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : displayed.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🙏</Text>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>No requests yet</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>
              {filter === "All"
                ? "Be the first to share a prayer request."
                : `No ${filter} requests yet.`}
            </Text>
          </View>
        ) : displayed.map((req) => {
          const meta = CAT_META[req.category] ?? CAT_META.Other;
          const hasAmen = amens.has(req.id);
          return (
            <View
              key={req.id}
              style={[styles.reqCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.reqHeader}>
                <View style={[styles.catBadge, { backgroundColor: meta.color + "18", borderColor: meta.color + "44" }]}>
                  <Text style={{ fontSize: 11 }}>{meta.emoji} </Text>
                  <Text style={[styles.catText, { color: meta.color }]}>{req.category}</Text>
                </View>
                <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                  {fmtRelative(req.submittedAt)}
                </Text>
              </View>
              <Text style={[styles.reqName, { color: colors.foreground }]}>
                {req.isAnonymous ? "Anonymous" : req.name}
              </Text>
              <Text style={[styles.reqText, { color: colors.mutedForeground }]}>{req.text}</Text>
              <TouchableOpacity
                style={[
                  styles.amenBtn,
                  {
                    borderColor: hasAmen ? meta.color : colors.border,
                    backgroundColor: hasAmen ? meta.color + "12" : "transparent",
                  },
                ]}
                onPress={() => toggleAmen(req.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Amen · ${req.amens}`}
              >
                <Text style={{ fontSize: 14 }}>{hasAmen ? "🙏" : "🤲"}</Text>
                <Text style={[styles.amenText, { color: hasAmen ? meta.color : colors.mutedForeground }]}>
                  Amen · {req.amens}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* ── Continue: back to community ───────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/community" as any)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            marginHorizontal: 16, marginTop: 8, marginBottom: insets.bottom + 24,
            borderRadius: 14, borderWidth: 1, borderColor: colors.border,
            paddingVertical: 14, backgroundColor: colors.card,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.mutedForeground }}>Community Hub</Text>
          <Feather name="arrow-right" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>

      {/* ══ Submit Request Modal ══ */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, {
            paddingTop: insets.top + 16,
            borderBottomColor: colors.border,
          }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t.commPrayerSubmitTitle}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)} accessibilityRole="button" accessibilityLabel="Close">
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Pending-review notice */}
            <View style={[styles.noticeBox, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "33" }]}>
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
                {t.commPrayerPendingNotice}
              </Text>
            </View>

            <View style={[styles.anonRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>Submit anonymously</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Your name will not be shown</Text>
              </View>
              <Switch
                value={isAnon}
                onValueChange={setIsAnon}
                trackColor={{ false: colors.border, true: colors.primary + "88" }}
                thumbColor={isAnon ? colors.primary : colors.mutedForeground}
              />
            </View>

            {!isAnon && (
              <>
                <Text style={[styles.fLabel, { color: colors.mutedForeground }]}>YOUR NAME</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </>
            )}

            <Text style={[styles.fLabel, { color: colors.mutedForeground }]}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
              {CATEGORIES.map((cat) => {
                const meta = CAT_META[cat];
                const active = cat === category;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catBtn, {
                      borderColor: active ? meta.color : colors.border,
                      backgroundColor: active ? meta.color + "18" : colors.card,
                    }]}
                    onPress={() => setCategory(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={cat}
                  >
                    <Text style={{ fontSize: 13 }}>{meta.emoji} </Text>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: active ? meta.color : colors.mutedForeground }}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.fLabel, { color: colors.mutedForeground }]}>YOUR PRAYER REQUEST</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Share your prayer request with the community…"
              placeholderTextColor={colors.mutedForeground}
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={5}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: text.trim() && !submitting ? 1 : 0.5 }]}
              onPress={submitRequest}
              disabled={!text.trim() || submitting}
              accessibilityRole="button"
              accessibilityLabel="Submit prayer request"
            >
              {submitting ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primaryForeground }}>
                  🙏 Submit Prayer Request
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newBtnText: { fontSize: 14, fontWeight: "700" },
  submittedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  submittedText: { fontSize: 12, fontWeight: "600", flex: 1 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontSize: 12, fontWeight: "600" },
  emptyCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
  },
  reqCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  reqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catText: { fontSize: 11, fontWeight: "700" },
  timeText: { fontSize: 11 },
  reqName: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  reqText: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  amenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  amenText: { fontSize: 13, fontWeight: "700" },
  // Modal
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
  },
  noticeText: { fontSize: 12, flex: 1 },
  anonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  fLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top" as const,
  },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
});

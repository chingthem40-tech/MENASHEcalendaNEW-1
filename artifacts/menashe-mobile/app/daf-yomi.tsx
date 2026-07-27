import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useThemeTokens } from "@/src/mobile/design-system";
import * as WebBrowser from "expo-web-browser";

import { HDate } from "@hebcal/core";
import { formatHebrewDate } from "@/lib/hebrewCalendar";
import { TRACTATES, DAF_TOTAL_PAGES as TOTAL_PAGES, getTodayDaf, getSefariaDafUrl as getSefariaUrl } from "@/lib/dafYomi";

export default function DafYomiScreen() {
  const { colors } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  today.setDate(today.getDate() + offset);
  const hdate = new HDate(today);
  const hebrewStr = formatHebrewDate(hdate);
  const gregStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const daf = useMemo(() => getTodayDaf(offset), [offset]);
  const currentTractate = TRACTATES.find(t => t.name === daf.tractate);
  const tractateProgress = currentTractate ? ((daf.daf - 2) / (currentTractate.pages - 1)) : 0;
  const cycleProgress = daf.total > 0 ? (TRACTATES.slice(0, TRACTATES.findIndex(t => t.name === daf.tractate)).reduce((a, t) => a + t.pages, 0) + (daf.daf - 2)) / TOTAL_PAGES : 0;

  async function openInSefaria() {
    setLoading(true);
    await WebBrowser.openBrowserAsync(getSefariaUrl(daf.tractate, daf.daf));
    setLoading(false);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Daf Yomi</Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>Daily Talmud study cycle</Text>
        </View>
        {offset !== 0 && (
          <TouchableOpacity
            style={[styles.todayBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "15" }]}
            onPress={() => setOffset(0)}
          >
            <Text style={[{ fontSize: 12, fontWeight: "600", color: colors.primary }]}>Today</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Date picker */}
      <View style={[styles.datePicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => setOffset(o => o - 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.dateGreg, { color: colors.foreground }]}>
            {offset === 0 ? "Today — " : ""}{today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </Text>
          <Text style={[styles.dateHeb, { color: colors.primary }]}>{hebrewStr}</Text>
        </View>
        <TouchableOpacity onPress={() => setOffset(o => o + 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="chevron-right" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Main Daf Card */}
      <View style={[styles.dafCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cycleRow}>
          <View style={[styles.cycleBadge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "44" }]}>
            <Text style={[styles.cycleText, { color: colors.primary }]}>Cycle {daf.cycle}</Text>
          </View>
          <Text style={[styles.dafSubLabel, { color: colors.mutedForeground }]}>Babylonian Talmud</Text>
        </View>
        <Text style={[styles.dafTractate, { color: colors.foreground }]}>{daf.tractate}</Text>
        <Text style={[styles.dafNum, { color: colors.primary }]}>Daf {daf.daf}</Text>

        <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
          <View style={[styles.progressFill, { width: `${tractateProgress * 100}%`, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
          Page {daf.daf - 1} of {currentTractate?.pages ?? "?"} in {daf.tractate}
        </Text>

        <TouchableOpacity
          style={[styles.sefariaBtn, { backgroundColor: "#2d6030" }]}
          onPress={openInSefaria}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Text style={styles.sefariaBtnText}>Open in Sefaria</Text>
              <Feather name="external-link" size={15} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Cycle Progress */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Current Cycle Progress</Text>
        <View style={[styles.progressBar, { backgroundColor: colors.background, marginTop: 10 }]}>
          <View style={[styles.progressFill, { width: `${cycleProgress * 100}%`, backgroundColor: "#a78bfa" }]} />
        </View>
        <Text style={[styles.progressLabel, { color: colors.mutedForeground, marginTop: 6 }]}>
          {Math.round(cycleProgress * 100)}% of cycle {daf.cycle} complete
        </Text>
      </View>

      {/* Tractate List */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tractates</Text>
      </View>
      {TRACTATES.map(t => {
        const isCurrent = t.name === daf.tractate;
        return (
          <View
            key={t.name}
            style={[
              styles.tractateRow,
              {
                backgroundColor: isCurrent ? colors.primary + "10" : colors.card,
                borderColor: isCurrent ? colors.primary + "44" : colors.border,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.tractateName, { color: isCurrent ? colors.primary : colors.foreground }]}>{t.name}</Text>
              <Text style={[styles.tractatePages, { color: colors.mutedForeground }]}>{t.pages} pages</Text>
            </View>
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: colors.primaryForeground }}>NOW</Text>
              </View>
            )}
          </View>
        );
      })}

      {/* ── Continue: log what you just studied ─────────────────────────── */}
      <TouchableOpacity
        onPress={() => router.push("/torah-tracker" as any)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
          marginHorizontal: 16, marginTop: 8, marginBottom: insets.bottom + 24,
          borderRadius: 14, borderWidth: 1, borderColor: colors.border,
          paddingVertical: 14, backgroundColor: colors.card,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.mutedForeground }}>Log Your Study</Text>
        <Feather name="arrow-right" size={15} color={colors.mutedForeground} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 16, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  todayBtn: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  datePicker: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 16, marginBottom: 16, borderRadius: 14, borderWidth: 1, padding: 14,
  },
  dateGreg: { fontSize: 14, fontWeight: "600" },
  dateHeb: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  dafCard: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16 },
  cycleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cycleBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  cycleText: { fontSize: 11, fontWeight: "700" },
  dafSubLabel: { fontSize: 12 },
  dafTractate: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5, marginBottom: 4 },
  dafNum: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabel: { fontSize: 11, marginTop: 6, marginBottom: 16 },
  sefariaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 12, paddingVertical: 14,
  },
  sefariaBtnText: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
  section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 14, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  tractateRow: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginBottom: 6,
    borderRadius: 10, borderWidth: 1, padding: 12,
  },
  tractateName: { fontSize: 14, fontWeight: "600" },
  tractatePages: { fontSize: 11, marginTop: 2 },
  currentBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
});

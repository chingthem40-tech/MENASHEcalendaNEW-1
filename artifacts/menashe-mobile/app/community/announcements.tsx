/**
 * Community · Announcements — full list screen
 * Deep screen navigated to from the Community Hub.
 * Shows all sent announcements, pinned items first.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Platform,
  ActivityIndicator, StyleSheet, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { SPACE, TEXT, RADIUS } from "@/constants/colors";
import { useLanguage } from "@/context/LanguageContext";
import { fetchAnnouncements, type MobileAnnouncement } from "@/lib/announcementsApi";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(ms / 3_600_000);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(ms / 86_400_000);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AnnouncementsScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  const [announcements, setAnnouncements] = useState<MobileAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const data = await fetchAnnouncements();
    setAnnouncements(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pinned = announcements.filter((a) => a.pinned);
  const regular = announcements.filter((a) => !a.pinned);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Nav bar ── */}
      <View style={[styles.navBar, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>
            📢  {t.commAnnouncementsTitle}
          </Text>
          {announcements.length > 0 && (
            <Text style={[styles.navSub, { color: colors.mutedForeground }]}>
              {announcements.length} {announcements.length === 1 ? "announcement" : "announcements"}
            </Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : announcements.length === 0 ? (
        <View style={styles.center}>
          <Feather name="bell-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t.commAnnouncementsNoneTitle}</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            {t.commAnnouncementsNoneDesc}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: SPACE[4],
            paddingBottom: insets.bottom + 60,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Pinned section */}
          {pinned.length > 0 && (
            <>
              <View style={[styles.sectionRow, { marginBottom: SPACE[3] }]}>
                <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
                <Text style={[styles.sectionLabel, { color: colors.primary }]}>
                  📌 {t.commAnnouncementsPinnedSection}
                </Text>
              </View>
              {pinned.map((ann) => (
                <AnnouncementCard key={ann.id} ann={ann} pinned colors={colors} t={t} />
              ))}
              {regular.length > 0 && (
                <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: SPACE[4] }]} />
              )}
            </>
          )}

          {/* Regular section */}
          {regular.length > 0 && (
            <>
              {pinned.length > 0 && (
                <View style={[styles.sectionRow, { marginBottom: SPACE[3] }]}>
                  <View style={[styles.sectionBar, { backgroundColor: colors.mutedForeground }]} />
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                    {t.commAnnouncementsRecentSection}
                  </Text>
                </View>
              )}
              {regular.map((ann) => (
                <AnnouncementCard key={ann.id} ann={ann} pinned={false} colors={colors} t={t} />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function AnnouncementCard({
  ann, pinned, colors, t,
}: {
  ann: MobileAnnouncement;
  pinned: boolean;
  colors: ReturnType<typeof useColors>;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: pinned ? colors.primary + "0D" : colors.card,
          borderColor: pinned ? colors.primary + "44" : colors.border,
        },
      ]}
      accessibilityLabel={ann.title}
      accessibilityRole="text"
    >
      {/* Left: emoji badge */}
      <View style={[styles.emojiBadge, {
        backgroundColor: pinned ? colors.primary + "20" : colors.muted,
        borderColor: pinned ? colors.primary + "44" : colors.border,
      }]}>
        <Text style={{ fontSize: TEXT["2xl"] }}>{ann.emoji}</Text>
      </View>

      {/* Right: content */}
      <View style={{ flex: 1 }}>
        {pinned && (
          <Text style={[styles.pinnedLabel, { color: colors.primary }]}>
            📌 {t.commAnnouncementsPinned}
          </Text>
        )}
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          {ann.title}
        </Text>
        {!!ann.body && (
          <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>
            {ann.body}
          </Text>
        )}
        {!!ann.sentAt && (
          <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>
            {fmtDate(ann.sentAt)}
          </Text>
        )}
      </View>
    </View>
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
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[2],
  },
  sectionBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  sectionLabel: {
    fontSize: TEXT.xs,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  divider: {
    height: 1,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE[4],
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[3],
    marginBottom: SPACE[3],
  },
  emojiBadge: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pinnedLabel: {
    fontSize: TEXT.xs,
    fontWeight: "700",
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: TEXT.base,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 22,
  },
  cardBody: {
    fontSize: TEXT.sm,
    lineHeight: 20,
    marginBottom: SPACE[2],
  },
  cardTime: {
    fontSize: TEXT.xs,
  },
});

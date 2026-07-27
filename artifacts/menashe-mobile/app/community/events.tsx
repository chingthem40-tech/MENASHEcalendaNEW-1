/**
 * Community · Upcoming Events — full list screen
 * Deep screen navigated to from the Community Hub (§4).
 */

import React, { useState, useEffect, useCallback, memo } from "react";
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
import { fetchCommunityEvents, type CommunityEvent } from "@/lib/eventsApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtEventDate(iso: string, time?: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month   = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const timeStr = time ? ` · ${time}` : "";
  return `${weekday}, ${month}${timeStr}`;
}

function isToday(iso: string): boolean {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return iso === today;
}

function isTomorrow(iso: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tom = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return iso === tom;
}

// dayTag returns a key into t.* — resolved at render time
type DayTag = "today" | "tomorrow" | null;
function getDayTag(iso: string): DayTag {
  if (isToday(iso)) return "today";
  if (isTomorrow(iso)) return "tomorrow";
  return null;
}

const TYPE_COLORS: Record<string, string> = {
  shabbat:   "#d4a843",
  holiday:   "#818cf8",
  community: "#fb923c",
  learning:  "#4ade80",
};

// ── Event card ─────────────────────────────────────────────────────────────────

const EventCard = memo(function EventCard({
  event,
  colors,
  lang,
  t,
}: {
  event: CommunityEvent;
  colors: ReturnType<typeof useColors>;
  lang: string;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const accentColor = TYPE_COLORS[event.type] ?? colors.primary;
  const title = lang === "tk" && event.titleTK ? event.titleTK : event.title;
  const desc  = lang === "tk" && event.descriptionTK ? event.descriptionTK : event.description;
  const rawTag = getDayTag(event.date);
  const tag    = rawTag === "today" ? t.commEventsToday : rawTag === "tomorrow" ? t.commEventsTomorrow : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: accentColor,
        },
      ]}
      accessibilityLabel={`${title}, ${fmtEventDate(event.date, event.time)}`}
    >
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={[styles.emojiBox, { backgroundColor: accentColor + "1A" }]}>
          <Text style={{ fontSize: TEXT.xl }}>{event.emoji}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
              {title}
            </Text>
            {tag && (
              <View style={[styles.todayBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
                <Text style={[styles.todayBadgeText, { color: colors.primary }]}>{tag}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDate, { color: accentColor }]}>
            {fmtEventDate(event.date, event.time)}
          </Text>
        </View>
      </View>

      {/* Description */}
      {!!desc && (
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{desc}</Text>
      )}

      {/* Footer row */}
      <View style={styles.cardFooter}>
        {event.location && (
          <View style={styles.footerItem}>
            <Feather name={event.virtual ? "video" : "map-pin"} size={12} color={colors.mutedForeground} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}
        {event.recurring && (
          <View style={[styles.recurringBadge, { backgroundColor: accentColor + "15", borderColor: accentColor + "44" }]}>
            <Feather name="repeat" size={10} color={accentColor} />
            <Text style={[styles.recurringText, { color: accentColor }]}>
              {event.recurring === "weekly" ? t.commEventsWeekly : t.commEventsMonthly}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const colors = useColors();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  const [events, setEvents]       = useState<CommunityEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const data = await fetchCommunityEvents();
    setEvents(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group by date
  const grouped = events.reduce<Record<string, CommunityEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + SPACE[2] }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t.commBack}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.screenEyebrow, { color: colors.primary }]}>COMMUNITY</Text>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            {t.commEventsTitle}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACE[4], paddingBottom: insets.bottom + 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.primary}
            />
          }
          accessibilityLabel="Upcoming events list"
        >
          {dates.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="calendar" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {t.commEventsEmpty}
              </Text>
            </View>
          ) : (
            dates.map((date) => (
              <View key={date} style={styles.dateGroup}>
                {/* Date header */}
                <View style={styles.dateHeader}>
                  {getDayTag(date) ? (
                    <View style={[styles.dateHighlight, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.dateHighlightText, { color: colors.primaryForeground }]}>
                        {getDayTag(date) === "today" ? t.commEventsToday : t.commEventsTomorrow}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                      {(() => {
                        const [y, m, d] = date.split("-").map(Number);
                        return new Date(y, m - 1, d).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "long",
                          day: "numeric",
                        });
                      })()}
                    </Text>
                  )}
                  <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                </View>

                {grouped[date].map((ev) => (
                  <EventCard key={ev.id} event={ev} colors={colors} lang={lang} t={t} />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACE[4],
    paddingBottom: SPACE[4],
    gap: SPACE[3],
  },
  backBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  screenEyebrow: {
    fontSize: TEXT.xs,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: TEXT["2xl"],
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyCard: {
    marginTop: SPACE[8],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE[8],
    alignItems: "center",
    gap: SPACE[3],
  },
  emptyText: { fontSize: TEXT.sm, textAlign: "center" },
  dateGroup: { marginBottom: SPACE[4] },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[3],
    marginBottom: SPACE[3],
    marginTop: SPACE[4],
  },
  dateHighlight: {
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[1],
    borderRadius: RADIUS.full,
  },
  dateHighlightText: { fontSize: TEXT.xs, fontWeight: "700" },
  dateLabel: { fontSize: TEXT.sm, fontWeight: "600" },
  dateLine: { flex: 1, height: 1 },

  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: SPACE[4],
    marginBottom: SPACE[2],
    gap: SPACE[2],
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[3],
  },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[2],
    flexWrap: "wrap",
  },
  todayBadge: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayBadgeText: { fontSize: TEXT.xs, fontWeight: "700" },
  cardTitle: { fontSize: TEXT.base, fontWeight: "700", flex: 1 },
  cardDate:  { fontSize: TEXT.sm, fontWeight: "600" },
  cardDesc:  { fontSize: TEXT.sm, lineHeight: 18 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACE[2],
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  footerText: { fontSize: TEXT.xs },
  recurringBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recurringText: { fontSize: TEXT.xs, fontWeight: "600" },
});

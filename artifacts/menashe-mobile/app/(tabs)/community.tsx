/**
 * Community Hub — SPR-M009
 * Central hub for all Bnei Menashe community features:
 *   Prayer Requests · Memorials · Events · Organizations · Learning · Synagogue
 *
 * Design: warm, organised, peaceful — large cards, generous whitespace, premium typography.
 * Reuses: existing community APIs, MMDL color tokens, bilingual t.* strings.
 * Does NOT: duplicate web logic, create social features, add likes/feeds.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Animated, View, Text, ScrollView, TouchableOpacity, Platform, RefreshControl,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useThemeTokens } from "@/src/mobile/design-system";
import { SectionTitle } from "@/src/mobile/components/display";
import { MenasheButton } from "@/src/mobile/components/foundation/MenasheButton";
import { hapticLight } from "@/src/mobile/lib/haptics";
import { useEntrance } from "@/src/mobile/lib/useEntrance";
import { SkeletonCard } from "@/src/mobile/components/feedback/LoadingState";
import { EmptyState } from "@/src/mobile/components/feedback";
import { useLanguage } from "@/context/LanguageContext";
import { fetchPrayerRequests, amenPrayerRequest, type PrayerRequest } from "@/lib/prayerBoardApi";
import { fetchCommunityYahrzeit, type CommunityYahrzeitEntry } from "@/lib/communityApi";
import { fetchCommunityEvents, type CommunityEvent } from "@/lib/eventsApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Named semantic palette for prayer request categories.
 *  These are category-identity constants — not inline hex, not theme-coupled.
 *  Blessing and Other resolve at runtime from live design tokens (see CommunityScreen). */
const PRAYER_PALETTE = {
  emerald: "#4ade80",
  pink:    "#f472b6",
  indigo:  "#818cf8",
  orange:  "#fb923c",
  amber:   "#fbbf24",
  violet:  "#a78bfa",
} as const;

function fmtAgo(
  iso: string,
  justNow: string,
  minAgo: string,
  hourAgo: string,
  dayAgo: string,
): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return justNow;
  if (m < 60) return minAgo.replace("{n}", String(m));
  const h = Math.floor(ms / 3_600_000);
  if (h < 24) return hourAgo.replace("{n}", String(h));
  const d = Math.floor(ms / 86_400_000);
  if (d < 30) return dayAgo.replace("{n}", String(d));
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function navigate(path: string) {
  hapticLight();
  router.push(path as any);
}

// ── Other Features — Quick Access Card ────────────────────────────────────────

type QuickFeatureItem = {
  emoji: string;
  label: string;
  path: string;
  accent: string;
};

function OtherFeaturesCard({ colors }: { colors: ReturnType<typeof useThemeTokens>["colors"] }) {
  const features: QuickFeatureItem[] = [
    { emoji: "📅", label: "Events",        path: "/community/events",         accent: "#818cf8" },
    { emoji: "📚", label: "Learning",      path: "/community/learning-groups", accent: "#4ade80" },
    { emoji: "🕍", label: "Synagogues",    path: "/community/synagogues",      accent: "#d4a843" },
    { emoji: "🏛",  label: "Organisations", path: "/community/organizations",   accent: "#fb923c" },
    { emoji: "👥", label: "Directory",     path: "/community/directory",       accent: "#60a5fa" },
    { emoji: "📋", label: "Census",        path: "/census/demographics",       accent: "#a78bfa" },
  ];

  return (
    <View style={[otherCardStyles.wrapper, {
      backgroundColor: colors.card,
      borderColor: colors.border,
    }]}>
      {/* Header */}
      <View style={otherCardStyles.cardHeader}>
        <View style={[otherCardStyles.headerIcon, { backgroundColor: colors.primary + "18" }]}>
          <Text style={{ fontSize: 15 }}>✨</Text>
        </View>
        <View>
          <Text style={[otherCardStyles.overline, { color: colors.primary }]}>COMMUNITY</Text>
          <Text style={[otherCardStyles.headerTitle, { color: colors.textPrimary }]}>Quick Access</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={[otherCardStyles.divider, { backgroundColor: colors.border }]} />

      {/* 2-column grid */}
      <View style={otherCardStyles.grid}>
        {features.map((f) => (
          <TouchableOpacity
            key={f.path}
            activeOpacity={0.78}
            onPress={() => navigate(f.path)}
            accessibilityRole="button"
            accessibilityLabel={f.label}
            style={[otherCardStyles.gridBtn, {
              backgroundColor: f.accent + "12",
              borderColor: f.accent + "30",
            }]}
          >
            <View style={[otherCardStyles.gridIconBox, {
              backgroundColor: f.accent + "20",
              shadowColor: f.accent,
            }]}>
              <Text style={{ fontSize: 20 }}>{f.emoji}</Text>
            </View>
            <Text style={[otherCardStyles.gridLabel, { color: colors.textPrimary }]} numberOfLines={1}>
              {f.label}
            </Text>
            <Feather name="arrow-right" size={11} color={f.accent} style={{ marginTop: 2 }} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// EmptyCard and ComingSoonCard removed — replaced by shared <EmptyState /> component.

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const { colors, sp, type: ty, rd } = useThemeTokens();

  /** Runtime prayer category map — Blessing uses brand primary, Other uses muted token */
  const PRAYER_CAT: Record<string, { color: string; emoji: string }> = {
    Healing:    { color: PRAYER_PALETTE.emerald,  emoji: "💚" },
    Blessing:   { color: colors.primary,          emoji: "✨" },
    Aliyah:     { color: PRAYER_PALETTE.emerald,  emoji: "🇮🇱" },
    Family:     { color: PRAYER_PALETTE.pink,     emoji: "👨‍👩‍👧‍👦" },
    Livelihood: { color: PRAYER_PALETTE.indigo,   emoji: "🌾" },
    Community:  { color: PRAYER_PALETTE.orange,   emoji: "🫂" },
    Gratitude:  { color: PRAYER_PALETTE.amber,    emoji: "🙏" },
    Protection: { color: PRAYER_PALETTE.violet,   emoji: "🛡️" },
    Other:      { color: colors.mutedForeground,  emoji: "✡" },
  };
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  /** Localized relative-time formatter for prayer requests. */
  const ago = (iso: string) => fmtAgo(iso, t.commJustNow, t.commMinAgo, t.commHourAgo, t.commDayAgo);
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [memorials, setMemorials] = useState<CommunityYahrzeitEntry[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hubAmens, setHubAmens]   = useState<Set<string>>(new Set());

  // MEP-005: content entrance animation
  const cEnter = useEntrance(40);

  function handleHubAmen(id: string) {
    if (hubAmens.has(id)) return;
    hapticLight();
    setHubAmens((prev) => new Set(prev).add(id));
    setPrayers((prev) =>
      prev.map((r) => r.id === id ? { ...r, amens: r.amens + 1 } : r)
    );
    amenPrayerRequest(id).catch(() => {});
  }

  const refresh = useCallback(async () => {
    const [prays, mems, evs] = await Promise.allSettled([
      fetchPrayerRequests(),
      fetchCommunityYahrzeit(),
      fetchCommunityEvents(),
    ]);
    if (prays.status === "fulfilled") setPrayers(prays.value);
    if (mems.status === "fulfilled") setMemorials(mems.value);
    if (evs.status === "fulfilled") setEvents(evs.value);
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 60_000);
    return () => clearInterval(iv);
  }, [refresh]);

  const approvedPrayers = prayers.filter((p) => p.status === "approved").slice(0, 3);
  const candleCount = memorials.length;
  const learnerCount = memorials.reduce((s, e) => s + e.learners.length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        accessibilityLabel="Community hub"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* ── Community Hero ── */}
        <View style={[styles.hero, { paddingTop: topPad + sp[4] }]}>
          {/* Eyebrow */}
          <View style={[styles.heroBadge, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "35" }]}>
            <Text style={{ fontSize: 12 }}>✡</Text>
            <Text style={[styles.heroBadgeText, { color: colors.primary }]}>BNEI MENASHE WORLDWIDE</Text>
          </View>

          {/* Hebrew title */}
          <Text style={[styles.heroHebrew, { color: colors.primary }]} accessibilityLabel="Bnei Menashe">בְּנֵי מְנַשֶּׁה</Text>

          {/* English title */}
          <Text style={[styles.hubTitle, { color: colors.textPrimary }]}>{t.commHubTitle}</Text>
          <View style={[styles.goldBar, { backgroundColor: colors.primary }]} />
          <Text style={[styles.hubSubtitle, { color: colors.textSecondary }]}>{t.commHubSubtitle}</Text>

          {/* Community stats */}
          <View style={[styles.heroStats, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { val: "10,000+", labelKey: "commStatPopulation" as const },
              { val: "5,000+",  labelKey: "commStatAliyah" as const },
              { val: "54",      labelKey: "commStatParshiyot" as const },
            ].map((s, i) => (
              <View
                key={s.labelKey}
                style={[
                  styles.heroStatItem,
                  i < 2 && { borderRightWidth: 1, borderRightColor: colors.border },
                ]}
              >
                <Text style={[styles.heroStatVal, { color: colors.primary }]}>{s.val}</Text>
                <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>{t[s.labelKey]}</Text>
              </View>
            ))}
          </View>

          {/* Isaiah quote */}
          <View style={[styles.heroQuote, { borderLeftColor: colors.primary + "55" }]}>
            <Text style={[styles.heroQuoteText, { color: colors.textSecondary }]}>
              "{t.commIsaiahQuote}"
            </Text>
            <Text style={[styles.heroQuoteRef, { color: colors.primary }]}>— {t.commIsaiahRef}</Text>
          </View>
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: sp[4], gap: 16, marginTop: 8 }}>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </View>
        ) : (
          <Animated.View style={[{ paddingHorizontal: sp[4] }, cEnter]}>

            {/* ═══ 1. PRAYER REQUESTS ═══ */}
            <SectionTitle
              leadingIcon={<Text style={{ fontSize: 16 }}>🙏</Text>}
              title={t.commPrayerTitle}
              actionLabel={t.commPrayerSeeAll}
              onAction={() => navigate("/prayer-board")}
            />
            {approvedPrayers.length === 0 ? (
              <EmptyState icon="heart" title={t.commPrayerEmpty} style={{ paddingVertical: 20 }} />
            ) : approvedPrayers.map((pr) => {
              const meta = PRAYER_CAT[pr.category] ?? PRAYER_CAT.Other;
              return (
                <TouchableOpacity
                  key={pr.id}
                  activeOpacity={0.82}
                  onPress={() => navigate("/prayer-board")}
                  accessibilityRole="button"
                  accessibilityLabel={pr.text}
                  style={[styles.prayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.prayCardHeader}>
                    <View style={[styles.catBadge, {
                      backgroundColor: meta.color + "1A",
                      borderColor: meta.color + "44",
                    }]}>
                      <Text style={{ fontSize: ty.caption.fontSize }}>{meta.emoji} </Text>
                      <Text style={[styles.catText, { color: meta.color }]}>{pr.category}</Text>
                    </View>
                    <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>
                      {ago(pr.submittedAt)}
                    </Text>
                  </View>
                  <Text style={[styles.prayName, { color: colors.foreground }]}>
                    {pr.isAnonymous ? t.journeyAnonymous : pr.name}
                  </Text>
                  <Text style={[styles.prayText, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {pr.text}
                  </Text>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); handleHubAmen(pr.id); }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.commPrayerAmen} ${pr.amens}`}
                    accessibilityState={{ selected: hubAmens.has(pr.id) }}
                    hitSlop={{ top: 11, bottom: 11, left: 8, right: 8 }}
                    style={[
                      styles.amenRow,
                      {
                        borderTopColor: colors.border,
                        borderRadius: rd.md,
                        paddingHorizontal: sp[2],
                        paddingVertical: sp[1],
                        backgroundColor: hubAmens.has(pr.id) ? (meta.color + "12") : "transparent",
                      },
                    ]}
                  >
                    <Text style={{ fontSize: ty.bodySm.fontSize }}>{hubAmens.has(pr.id) ? "🙏" : "🤲"}</Text>
                    <Text style={[styles.amenText, {
                      color: hubAmens.has(pr.id) ? meta.color : colors.mutedForeground,
                    }]}>
                      {t.commPrayerAmen} · {pr.amens}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
            {/* MMDS Button System (Outline, POC) */}
            <MenasheButton
              label={t.commPrayerSubmit}
              variant="outline"
              size="md"
              icon="plus-circle"
              fullWidth
              onPress={() => navigate("/prayer-board")}
              style={styles.dashedCtaSpacing}
            />

            {/* ═══ 3. COMMUNITY MEMORIALS ═══ */}
            <SectionTitle
              leadingIcon={<Text style={{ fontSize: 16 }}>🕯</Text>}
              title={t.commMemorialsTitle}
              actionLabel={t.commMemorialsSeeAll}
              onAction={() => navigate("/community/memorials")}
            />
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigate("/community/memorials")}
              accessibilityRole="button"
              accessibilityLabel={t.commMemorialsTitle}
              style={[styles.memSummary, {
                backgroundColor: colors.primary + "0A",
                borderColor: colors.primary + "33",
              }]}
            >
              {/* Stats row */}
              <View style={styles.memStatsRow}>
                <View style={styles.memStat} accessibilityLabel={`${candleCount} ${t.commMemorialsCandlesLit}`}>
                  <Text style={[styles.memStatNum, { color: colors.primary }]}>{candleCount}</Text>
                  <Text style={[styles.memStatLabel, { color: colors.mutedForeground }]}>
                    {t.commMemorialsCandlesLit.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.memStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.memStat} accessibilityLabel={`${learnerCount} ${t.commMemorialsLearning}`}>
                  <Text style={[styles.memStatNum, { color: colors.success }]}>{learnerCount}</Text>
                  <Text style={[styles.memStatLabel, { color: colors.mutedForeground }]}>
                    {t.commMemorialsLearning.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Recent names */}
              {memorials.length > 0 ? (
                <View style={[styles.memNames, { borderTopColor: colors.primary + "22" }]}>
                  {memorials.slice(0, 4).map((m) => (
                    <Text key={m.id} style={[styles.memName, { color: colors.foreground }]} numberOfLines={1}>
                      🕯 {m.deceasedName}
                    </Text>
                  ))}
                  {memorials.length > 4 && (
                    <Text style={[styles.memMore, { color: colors.mutedForeground }]}>
                      +{memorials.length - 4} more
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.memEmpty, { color: colors.mutedForeground }]}>
                  {t.commMemorialsEmpty}
                </Text>
              )}

              {/* CTAs row */}
              <View style={styles.memCtaRow}>
                <View style={[styles.memCta, { backgroundColor: colors.primary, flex: 1 }]}>
                  <Text style={{ fontSize: ty.bodySm.fontSize }}>🕯</Text>
                  <Text style={[styles.memCtaText, { color: colors.primaryForeground }]}>
                    {t.commLightCandle}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation?.(); navigate("/sacred-memory"); }}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={t.commEnterSanctuary}
                  style={[styles.memSanctuaryCta, { borderColor: colors.primary + "55" }]}
                >
                  <Text style={{ fontSize: ty.bodySm.fontSize }}>✨</Text>
                  <Text style={[styles.memCtaText, { color: colors.primary }]}>
                    {t.commEnterSanctuary}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* ═══ 4. UPCOMING EVENTS ═══ */}
            <SectionTitle
              leadingIcon={<Text style={{ fontSize: 16 }}>📅</Text>}
              title={t.commEventsTitle}
              actionLabel={events.length > 0 ? t.commEventsSeeAll : undefined}
              onAction={() => navigate("/community/events")}
            />
            {events.length === 0 ? (
              <TouchableOpacity
                onPress={() => navigate("/community/events")}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="View upcoming events"
                style={[styles.comingSoonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.comingSoonIcon, { backgroundColor: colors.primary + "16" }]}>
                  <Feather name="calendar" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.comingSoonTitle, { color: colors.foreground }]}>
                    {t.commEventsTitle}
                  </Text>
                  <Text style={[styles.comingSoonHint, { color: colors.mutedForeground }]}>
                    {t.commEventsComingSoonHint}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ) : (
              <>
                {events.slice(0, 3).map((ev) => {
                  const EVENT_COLORS: Record<string, string> = {
                    shabbat: "#d4a843", holiday: "#818cf8",
                    community: "#fb923c", learning: "#4ade80",
                  };
                  const accentColor = EVENT_COLORS[ev.type] ?? colors.primary;
                  const [y, m, d] = ev.date.split("-").map(Number);
                  const dateObj = new Date(y, m - 1, d);
                  const dayNum  = dateObj.toLocaleDateString("en-US", { day: "numeric" });
                  const month   = dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                  const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });

                  return (
                    <TouchableOpacity
                      key={ev.id}
                      activeOpacity={0.82}
                      onPress={() => navigate("/community/events")}
                      accessibilityRole="button"
                      accessibilityLabel={ev.title}
                      style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      {/* Date column */}
                      <View style={[styles.eventDateBox, { backgroundColor: accentColor + "18" }]}>
                        <Text style={[styles.eventMonth, { color: accentColor }]}>{month}</Text>
                        <Text style={[styles.eventDay, { color: colors.foreground }]}>{dayNum}</Text>
                        <Text style={[styles.eventWeekday, { color: colors.mutedForeground }]}>{weekday}</Text>
                      </View>
                      {/* Content */}
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={[styles.eventEmoji]}>{ev.emoji}</Text>
                        <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>
                          {ev.title}
                        </Text>
                        {ev.location ? (
                          <View style={styles.eventLocRow}>
                            <Feather name={ev.virtual ? "video" : "map-pin"} size={11} color={colors.mutedForeground} />
                            <Text style={[styles.eventLoc, { color: colors.mutedForeground }]} numberOfLines={1}>
                              {ev.location}
                            </Text>
                          </View>
                        ) : null}
                        {ev.time ? (
                          <Text style={[styles.eventTime, { color: accentColor }]}>{ev.time}</Text>
                        ) : null}
                      </View>
                      {ev.recurring && (
                        <View style={[styles.recBadge, { backgroundColor: accentColor + "16", borderColor: accentColor + "44" }]}>
                          <Feather name="repeat" size={10} color={accentColor} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[styles.dashedCta, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "0C" }]}
                  onPress={() => navigate("/community/events")}
                  accessibilityRole="button"
                  accessibilityLabel={t.commEventsSeeAll}
                  activeOpacity={0.75}
                >
                  <Feather name="calendar" size={16} color={colors.primary} />
                  <Text style={[styles.dashedCtaText, { color: colors.primary }]}>{t.commEventsSeeAll}</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ═══ 5. ORGANIZATIONS ═══ */}
            <SectionTitle
              leadingIcon={<Text style={{ fontSize: 16 }}>🏛</Text>}
              title={t.commOrgsTitle}
              actionLabel={t.commOrgsSeeAll}
              onAction={() => navigate("/community/organizations")}
            />
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => navigate("/community/organizations")}
              accessibilityRole="button"
              accessibilityLabel="Shavei Israel"
              style={[styles.orgCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.orgBadge, { backgroundColor: "#1a3a22" }]}>
                <Text style={{ fontSize: ty.subtitle.fontSize }}>✡</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.orgName, { color: colors.foreground }]}>Shavei Israel</Text>
                <Text style={[styles.orgDesc, { color: colors.mutedForeground }]}>{t.commOrgShaveiDesc}</Text>
                <Text style={[styles.orgLink, { color: colors.primary }]}>shavei.org</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => navigate("/community/organizations")}
              accessibilityRole="button"
              accessibilityLabel="Bnei Menashe Federation"
              style={[styles.orgCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.orgBadge, { backgroundColor: "#1a2e4a" }]}>
                <Text style={{ fontSize: ty.subtitle.fontSize }}>🫂</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.orgName, { color: colors.foreground }]}>Bnei Menashe Federation</Text>
                <Text style={[styles.orgDesc, { color: colors.mutedForeground }]}>{t.commOrgFedDesc}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dashedCta, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "0C" }]}
              onPress={() => navigate("/community/organizations")}
              accessibilityRole="button"
              accessibilityLabel={t.commOrgsSeeAll}
              activeOpacity={0.75}
            >
              <Feather name="external-link" size={16} color={colors.primary} />
              <Text style={[styles.dashedCtaText, { color: colors.primary }]}>{t.commOrgsSeeAll}</Text>
            </TouchableOpacity>

            {/* ═══ 5.5 MEMBER DIRECTORY ═══ */}
            <SectionTitle
              leadingIcon={<Text style={{ fontSize: 16 }}>👥</Text>}
              title={t.dirTitle}
              actionLabel={t.dirSeeAll}
              onAction={() => navigate("/community/directory")}
            />
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => navigate("/community/directory")}
              accessibilityRole="button"
              accessibilityLabel={t.dirTitle}
              style={[styles.orgCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.orgBadge, { backgroundColor: "#1a2e4a" }]}>
                <Text style={{ fontSize: ty.subtitle.fontSize }}>👥</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.orgName, { color: colors.foreground }]}>{t.dirTitle}</Text>
                <Text style={[styles.orgDesc, { color: colors.mutedForeground }]}>{t.dirHubCardDesc}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dashedCta, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "0C" }]}
              onPress={() => navigate("/community/directory")}
              accessibilityRole="button"
              accessibilityLabel={t.dirSeeAll}
              activeOpacity={0.75}
            >
              <Feather name="users" size={16} color={colors.primary} />
              <Text style={[styles.dashedCtaText, { color: colors.primary }]}>{t.dirSeeAll}</Text>
            </TouchableOpacity>

            {/* ═══ 6. LEARNING GROUPS ═══ */}
            <SectionTitle
              leadingIcon={<Text style={{ fontSize: 16 }}>📚</Text>}
              title={t.commLearningTitle}
              actionLabel={t.commLearningSeeAll}
              onAction={() => navigate("/community/learning-groups")}
            />
            {/* Preview: 3 featured groups */}
            {[
              { emoji: "📖", name: "Daf Yomi Circle", nameTK: "Daf Yomi Kihilna", schedule: "Daily", scheduleTK: "Zingkhan", virtual: true },
              { emoji: "📜", name: "Weekly Parasha Study", nameTK: "Parasha Kihilna", schedule: "Shabbat · 09:30", scheduleTK: "Shabbat · 09:30", virtual: false },
              { emoji: "🕍", name: "Halacha for Bnei Menashe", nameTK: "Bnei Menashe Halacha", schedule: "Thu · 20:00", scheduleTK: "Kir · 20:00", virtual: true },
            ].map((g) => (
              <TouchableOpacity
                key={g.name}
                activeOpacity={0.82}
                onPress={() => navigate("/community/learning-groups")}
                accessibilityRole="button"
                accessibilityLabel={lang === "tk" ? g.nameTK : g.name}
                style={[styles.learnCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.learnEmoji, { backgroundColor: colors.primary + "16" }]}>
                  <Text style={{ fontSize: ty.subtitle.fontSize }}>{g.emoji}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.learnName, { color: colors.foreground }]} numberOfLines={1}>
                    {lang === "tk" ? g.nameTK : g.name}
                  </Text>
                  <View style={styles.learnMeta}>
                    <Feather name={g.virtual ? "video" : "map-pin"} size={11} color={colors.mutedForeground} />
                    <Text style={[styles.learnSchedule, { color: colors.mutedForeground }]}>
                      {lang === "tk" ? g.scheduleTK : g.schedule}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ alignSelf: "center" }} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.dashedCta, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "0C" }]}
              onPress={() => navigate("/community/learning-groups")}
              accessibilityRole="button"
              accessibilityLabel={t.commLearningSeeAll}
              activeOpacity={0.75}
            >
              <Feather name="book-open" size={16} color={colors.primary} />
              <Text style={[styles.dashedCtaText, { color: colors.primary }]}>{t.commLearningSeeAll}</Text>
            </TouchableOpacity>

            {/* ═══ 7. SYNAGOGUE ═══ */}
            <SectionTitle
              leadingIcon={<Text style={{ fontSize: 16 }}>🕍</Text>}
              title={t.commSynagogueTitle}
              actionLabel={t.commSynagogueSeeAll}
              onAction={() => navigate("/community/synagogues")}
            />
            {/* Preview: top 3 synagogues by country priority */}
            {[
              { id: "churachandpur", flag: "🇮🇳", name: "Beit Knesset Bnei Menashe", nameTK: "Beit Knesset Bnei Menashe", city: "Churachandpur, India", members: 220, type: "Beit Knesset" },
              { id: "jerusalem",     flag: "🇮🇱", name: "Bnei Menashe Olim Community", nameTK: "Jerusalem Bnei Menashe Olim", city: "Jerusalem, Israel", members: 310, type: "Community Center" },
              { id: "aizawl",        flag: "🇮🇳", name: "Bnei Menashe Community — Aizawl", nameTK: "Aizawl Bnei Menashe Mipil", city: "Aizawl, India", members: 140, type: "Prayer Group" },
            ].map((syn) => (
              <TouchableOpacity
                key={syn.id}
                activeOpacity={0.82}
                onPress={() => navigate("/community/synagogues")}
                accessibilityRole="button"
                accessibilityLabel={lang === "tk" ? syn.nameTK : syn.name}
                style={[styles.synPreviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.synFlagBox, { backgroundColor: colors.primary + "12" }]}>
                  <Text style={{ fontSize: ty.subtitle.fontSize }}>{syn.flag}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.synPreviewName, { color: colors.foreground }]} numberOfLines={1}>
                    {lang === "tk" ? syn.nameTK : syn.name}
                  </Text>
                  <Text style={[styles.synPreviewCity, { color: colors.mutedForeground }]}>{syn.city}</Text>
                  <View style={styles.synMeta}>
                    <Feather name="users" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.synMetaText, { color: colors.mutedForeground }]}>{syn.members} {t.commMembersCount}</Text>
                    <Text style={[styles.synType, { color: colors.primary }]}>· {syn.type}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ alignSelf: "center" }} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.dashedCta, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "0C" }]}
              onPress={() => navigate("/community/synagogues")}
              accessibilityRole="button"
              accessibilityLabel={t.commSynagogueSeeAll}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: ty.bodySm.fontSize }}>🕍</Text>
              <Text style={[styles.dashedCtaText, { color: colors.primary }]}>{t.commSynagogueSeeAll}</Text>
            </TouchableOpacity>

        {/* ── §8  Community Census ── */}
        <View style={{ paddingBottom: 16 }}>
          <SectionTitle
            leadingIcon={<Text style={{ fontSize: 16 }}>📋</Text>}
            title="Community Census"
            actionLabel={t.commSeeAll}
            onAction={() => navigate("/census/demographics")}
          />
          <TouchableOpacity
            style={[styles.censusEntryCard, {
              backgroundColor: (colors.primary as string) + "10",
              borderColor: (colors.primary as string) + "40",
            }]}
            onPress={() => navigate("/census/demographics")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Community Census — register your family"
          >
            <View style={[styles.censusEntryIconBox, {
              backgroundColor: (colors.primary as string) + "18",
              borderColor: (colors.primary as string) + "38",
            }]}>
              <Feather name="users" size={26} color={colors.primary as string} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.censusEntryOverline, { color: colors.primary }]}>
                BNEI MENASHE
              </Text>
              <Text style={[styles.censusEntryTitle, { color: colors.foreground }]}>
                Community Census
              </Text>
              <Text style={[styles.censusEntryDesc, { color: colors.mutedForeground }]}>
                Register your family and help build an accurate picture of our global community.
              </Text>
            </View>
            <Feather name="arrow-right" size={18} color={colors.primary as string} style={{ alignSelf: "center", marginLeft: sp[2] }} />
          </TouchableOpacity>
        </View>
            {/* ═══ OTHER — Quick Access Hub Card ═══ */}
            <View style={{ marginTop: 8, marginBottom: 8 }}>
              <SectionTitle
                leadingIcon={<Text style={{ fontSize: 16 }}>🗂</Text>}
                title="Other Features"
              />
              <OtherFeaturesCard colors={colors} />
            </View>

          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}

// ── Other Features — Quick Access Card styles ─────────────────────────────────

const otherCardStyles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  overline: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    marginBottom: 14,
    borderRadius: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridBtn: {
    width: "30.5%",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 6,
  },
  gridIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.1,
  },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: "flex-start",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  heroHebrew: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: "left",
  },
  heroStats: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 16,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 2,
  },
  heroStatVal: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    textAlign: "center",
  },
  heroQuote: {
    marginTop: 16,
    borderLeftWidth: 3,
    paddingLeft: 12,
    gap: 4,
  },
  heroQuoteText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
  },
  heroQuoteRef: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  hubTitle: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  goldBar: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 8,
  },
  hubSubtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 60,
  },

  // Coming-soon section cards (emptyCard/emptyText removed — replaced by EmptyState)
  comingSoonCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  comingSoonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  comingSoonTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  comingSoonHint: {
    fontSize: 13,
    lineHeight: 18,
  },

  timeLabel: {
    fontSize: 11,
  },

  // Prayer cards
  prayCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  prayCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catText: {
    fontSize: 11,
    fontWeight: "700",
  },
  prayName: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  prayText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  amenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  amenText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dashedCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  dashedCtaText: {
    fontSize: 13,
    fontWeight: "700",
  },
  dashedCtaSpacing: { marginBottom: 8 },

  // Memorials summary card
  memSummary: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  memStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    marginBottom: 16,
  },
  memStat: {
    alignItems: "center",
    gap: 2,
  },
  memStatNum: {
    fontSize: 24,
    fontWeight: "900",
  },
  memStatLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  memStatDivider: {
    width: 1,
    height: 36,
  },
  memNames: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginBottom: 12,
    gap: 4,
  },
  memName: {
    fontSize: 13,
    lineHeight: 22,
  },
  memMore: {
    fontSize: 11,
    fontStyle: "italic",
  },
  memEmpty: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  memCtaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  memCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  memSanctuaryCta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  memCtaText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Organizations
  orgCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  orgBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  orgName: {
    fontSize: 15,
    fontWeight: "700",
  },
  orgDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  orgLink: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Event cards
  eventCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  eventDateBox: {
    width: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    flexShrink: 0,
  },
  eventMonth: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  eventDay: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28,
  },
  eventWeekday: {
    fontSize: 11,
    fontWeight: "600",
  },
  eventEmoji: {
    fontSize: 15,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  eventLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventLoc: {
    fontSize: 11,
    flex: 1,
  },
  eventTime: {
    fontSize: 11,
    fontWeight: "700",
  },
  recBadge: {
    borderWidth: 1,
    borderRadius: 9999,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    flexShrink: 0,
  },

  // Learning group preview cards
  learnCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  learnEmoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  learnName: {
    fontSize: 15,
    fontWeight: "700",
  },
  learnMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  learnSchedule: {
    fontSize: 13,
  },

  // Synagogue preview cards
  synPreviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  synFlagBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  synPreviewName: {
    fontSize: 15,
    fontWeight: "700",
  },
  synPreviewCity: {
    fontSize: 13,
  },
  synMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  synMetaText: {
    fontSize: 11,
  },
  synType: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Community Census entry card (§8)
  censusEntryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  censusEntryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  censusEntryOverline: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  censusEntryTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  censusEntryDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
});

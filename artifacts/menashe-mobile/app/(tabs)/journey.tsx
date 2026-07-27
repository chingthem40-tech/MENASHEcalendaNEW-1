/**
 * Menashe Journey — SPR-X001 · Intelligent Journey Integration
 *
 * The Journey screen is the user's daily dashboard.
 * Surfaces existing information from existing modules — no new APIs, no AI, no duplicated logic.
 *
 * Sections:
 *   1. Today's Recommendation — priority engine (prayer → census → learning → holiday → memorial → parasha → daf)
 *   2. Today's Learning       — active learning group, next session, deep-link to Learning Detail
 *   3. Today's Sacred Time    — next prayer, countdown, open Zmanim
 *   4. Community Today        — next event, prayer request, announcement
 *   5. Family Journey         — census status + community memorials
 *   6. Today's Reflection     — day-context aware quote
 *
 * Rules:
 *   ✓ No new APIs        ✓ No AI              ✓ No duplicate logic
 *   ✓ No new data models ✓ Existing APIs only  ✓ Bilingual (EN + TK)
 *   ✓ No AsyncStorage    ✓ Web untouched
 */

import React, { useMemo, useState, useCallback } from "react";
import {
  Animated,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { hapticLight } from "@/src/mobile/lib/haptics";
import { useEntrance } from "@/src/mobile/lib/useEntrance";
import { useThemeTokens } from "@/src/mobile/design-system";
import { useLanguage } from "@/context/LanguageContext";
import { useApp } from "@/context/AppContext";
import { useUser } from "@clerk/expo";
import {
  getHebrewDate,
  formatHebrewDate,
  formatHebrewDateHebrew,
  formatGregorianDate,
  getDayOfWeek,
  getCurrentParasha,
  getCurrentParashaInfo,
  getUpcomingHolidays,
} from "@/lib/hebrewCalendar";
import { calculateZmanim, formatTime, type ZmanimTimes } from "@/lib/zmanim";
import type { Branch } from "@workspace/shared-core/census";
import { getBranch, branchStats } from "@workspace/shared-core/census";
import { SkeletonCard } from "@/src/mobile/components/feedback/LoadingState";
import { SectionTitle } from "@/src/mobile/components/display";

// Existing API clients — no new APIs
import { fetchCommunityEvents, type CommunityEvent } from "@/lib/eventsApi";
import { fetchPrayerRequests, type PrayerRequest } from "@/lib/prayerBoardApi";
import { fetchAnnouncements, type MobileAnnouncement } from "@/lib/announcementsApi";
import { fetchCommunityYahrzeit, type CommunityYahrzeitEntry } from "@/lib/communityApi";
import { getTodayDaf } from "@/lib/dafYomi";

// ── Today's Learning — minimal display summary (full data in learning-groups.tsx) ──

interface LearningSlot {
  id: string;
  emoji: string;
  name: string;
  nameTK: string;
  subject: string;
  subjectTK: string;
  schedule: "daily" | "weekly";
  /** UPPERCASE day of week — matches getDayOfWeek() output */
  day?: string;
  time?: string;
}

// Mirrors the schedule data from learning-groups.tsx; only display fields needed here.
const JOURNEY_LEARNING: LearningSlot[] = [
  {
    id: "daf-yomi",
    emoji: "📖",
    name: "Daf Yomi Circle",
    nameTK: "Daf Yomi Kihilna",
    subject: "Talmud Bavli",
    subjectTK: "Talmud Bavli",
    schedule: "daily",
    time: "06:30",
  },
  {
    id: "parasha",
    emoji: "📜",
    name: "Weekly Parasha Study",
    nameTK: "Parasha Kihilna",
    subject: "Torah · Weekly Portion",
    subjectTK: "Torah · Sunthal Parasha",
    schedule: "weekly",
    day: "SATURDAY",
    time: "09:30",
  },
  {
    id: "womens-torah",
    emoji: "🌸",
    name: "Women's Torah Study",
    nameTK: "Nu-te Torah Kihilna",
    subject: "Halacha · Jewish Home",
    subjectTK: "Halacha · Yudah Inn",
    schedule: "weekly",
    day: "WEDNESDAY",
    time: "17:00",
  },
  {
    id: "halacha-class",
    emoji: "🕍",
    name: "Halacha for Bnei Menashe",
    nameTK: "Bnei Menashe Halacha",
    subject: "Practical Halacha",
    subjectTK: "Halacha Ngaihdan",
    schedule: "weekly",
    day: "THURSDAY",
    time: "20:00",
  },
  {
    id: "youth-mishnah",
    emoji: "⭐",
    name: "Youth Mishnah Program",
    nameTK: "Sipai-te Mishnah",
    subject: "Mishnah · Youth",
    subjectTK: "Mishnah · Sipai-te",
    schedule: "weekly",
    day: "SUNDAY",
    time: "10:00",
  },
  {
    id: "hebrew",
    emoji: "🔤",
    name: "Hebrew Language Class",
    nameTK: "Hebrew Thu Kihilna",
    subject: "Modern & Liturgical Hebrew",
    subjectTK: "Hebrew Thu",
    schedule: "weekly",
    day: "TUESDAY",
    time: "18:30",
  },
];

/** Pick the most relevant learning group for today.
 *  Weekly groups take priority on their day; daf-yomi is always available. */
function getTodaysLearning(dayOfWeek: string): LearningSlot {
  const weeklyToday = JOURNEY_LEARNING.find(
    (g) => g.schedule === "weekly" && g.day === dayOfWeek,
  );
  if (weeklyToday) return weeklyToday;
  return JOURNEY_LEARNING.find((g) => g.id === "daf-yomi")!;
}

// ── Next Prayer — reuses calculateZmanim result ────────────────────────────────

interface NextPrayer {
  name: string;
  nameTK: string;
  time: Date;
}

function getNextPrayer(zm: ZmanimTimes | null, nowMs: number): NextPrayer | null {
  if (!zm) return null;
  const candidates: [string, string, Date | null][] = [
    ["Shacharit", "Shacharit", zm.sunrise],
    ["Mincha",    "Mincha",    zm.minchaGedolah],
    ["Ma'ariv",   "Ma'ariv",   zm.tzais],
  ];
  for (const [name, nameTK, time] of candidates) {
    if (time && time.getTime() > nowMs) return { name, nameTK, time };
  }
  return null; // All prayers passed for today
}

function formatCountdown(futureMs: number, nowMs: number): string {
  const diffMs = futureMs - nowMs;
  if (diffMs <= 0) return "Now";
  const totalMins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMins / 60);
  const mins  = totalMins % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// ── Priority Engine — Today's Recommendation ──────────────────────────────────

interface ContinueAction {
  overline: string;
  title: string;
  subtitle: string;
  cta: string;
  path: string;
  icon: string;
  gradientDark:  readonly [string, string, string];
  gradientLight: readonly [string, string, string];
  accent: string;
}

function getActivePrayerName(zm: ZmanimTimes | null, nowMs: number): string | null {
  if (!zm) return null;
  const sr = zm.sunrise?.getTime();
  const su = zm.sunset?.getTime();
  if (!sr || !su) return null;
  const latestS = zm.latestShacharit?.getTime() ?? (sr + 4 * 3_600_000);
  const minGed  = zm.minchaGedolah?.getTime()   ?? (sr + 6.5 * 3_600_000);
  if (nowMs < sr)      return "Shacharit";
  if (nowMs < latestS) return "Shacharit";
  if (nowMs < minGed)  return null;
  if (nowMs < su)      return "Mincha";
  return "Ma'ariv";
}

function buildContinueAction(
  dayOfWeek: string,
  todayHoliday: { name: string } | null,
  imminentHoliday: { name: string; daysAway: number } | null,
  zm: ZmanimTimes | null,
  parasha: string | null,
  daf: { tractate: string; daf: number },
  // New inputs for SPR-X001
  hasCensus: boolean | undefined,      // undefined = still loading
  todaysLearning: LearningSlot,
  hasUpcomingYahrzeit: boolean,
  lang: "en" | "tk",
): ContinueAction {
  const isTK = lang === "tk";
  const nowMs = Date.now();

  // P1 — Active prayer window
  const prayer = getActivePrayerName(zm, nowMs);
  if (prayer) {
    const meta: Record<string, { sub: string; icon: string; path: string }> = {
      Shacharit: { sub: "Begin the day with morning prayer",    icon: "sun",  path: "/(tabs)/zmanim" },
      Mincha:    { sub: "Pause and connect — afternoon prayer", icon: "wind", path: "/(tabs)/zmanim" },
      "Ma'ariv": { sub: "Evening prayer opens now",             icon: "moon", path: "/(tabs)/zmanim" },
    };
    const m = meta[prayer];
    return {
      overline: "TODAY'S PRAYER",
      title: `Time for ${prayer}`,
      subtitle: m.sub,
      cta: "View Prayer Times",
      path: m.path,
      icon: m.icon,
      gradientDark:  ["#1a0a00", "#5c3008", "#c8852a"],
      gradientLight: ["#5c2800", "#a06018", "#d4a030"],
      accent: "#f5c36a",
    };
  }

  // P2 — Shabbat day (Saturday)
  if (dayOfWeek === "SATURDAY") {
    return {
      overline: "SHABBAT SHALOM",
      title: "Rest and Reflect",
      subtitle: "Shabbat is a sanctuary in time — Torah, family, and peace",
      cta: "Study Parasha",
      path: "/(tabs)/torah",
      icon: "star",
      gradientDark:  ["#1a0a2e", "#2d1a5c", "#5c3a8a"],
      gradientLight: ["#2e1a4a", "#5c3a8a", "#8a5cbf"],
      accent: "#b48ad4",
    };
  }

  // P3 — Friday (Erev Shabbat)
  if (dayOfWeek === "FRIDAY") {
    return {
      overline: "EREV SHABBAT",
      title: "Shabbat Begins Tonight",
      subtitle: "Review the Parasha and prepare for candle lighting",
      cta: "Study This Week",
      path: "/(tabs)/torah",
      icon: "sunset",
      gradientDark:  ["#2a1500", "#7a3d08", "#c8852a"],
      gradientLight: ["#5c2800", "#a06018", "#c8952a"],
      accent: "#f5c36a",
    };
  }

  // P4 — No Census registered (high-priority community milestone)
  if (hasCensus === false) {
    return {
      overline: isTK ? "MIPIL MILESTONE" : "COMMUNITY MILESTONE",
      title: isTK ? "Mipil Census Zawh Zel" : "Complete Your Census",
      subtitle: isTK
        ? "Bnei Menashe mipil khawngaih turin in tanan census zawh pek rawh."
        : "Help strengthen Bnei Menashe — register your family today",
      cta: isTK ? "Census Tan" : "Start Census",
      path: "/census",
      icon: "users",
      gradientDark:  ["#0a1a0a", "#1a3a1a", "#3a6a3a"],
      gradientLight: ["#1a3a1a", "#2e6a2e", "#4a8a4a"],
      accent: "#80d880",
    };
  }

  // P5 — Today is a holiday
  if (todayHoliday) {
    return {
      overline: "TODAY'S HOLIDAY",
      title: todayHoliday.name,
      subtitle: "Observe and celebrate with your community",
      cta: "Open Calendar",
      path: "/(tabs)/calendar",
      icon: "gift",
      gradientDark:  ["#0a2a0a", "#1b5e20", "#2e7d32"],
      gradientLight: ["#1a4a1a", "#2e7d32", "#4caf50"],
      accent: "#80e080",
    };
  }

  // P6 — Imminent holiday (within 7 days)
  if (imminentHoliday) {
    const d = imminentHoliday.daysAway;
    return {
      overline: "UPCOMING HOLIDAY",
      title: imminentHoliday.name,
      subtitle: d === 1 ? "Tomorrow — begin your preparation" : `In ${d} days — prepare now`,
      cta: "View in Calendar",
      path: "/(tabs)/calendar",
      icon: "calendar",
      gradientDark:  ["#0a1a2e", "#0c2d5c", "#1a5c8a"],
      gradientLight: ["#1a3a5c", "#2e6da0", "#4a8fc0"],
      accent: "#7ac4f0",
    };
  }

  // P7 — Learning group scheduled today (non-Shabbat)
  if (todaysLearning.schedule === "weekly" && todaysLearning.day === dayOfWeek) {
    const learningName    = isTK ? todaysLearning.nameTK    : todaysLearning.name;
    const learningSubject = isTK ? todaysLearning.subjectTK : todaysLearning.subject;
    return {
      overline: isTK ? "ZIR TUN NI" : "LEARNING TODAY",
      title: learningName,
      subtitle: `${learningSubject}${todaysLearning.time ? ` · ${todaysLearning.time}` : ""}`,
      cta: isTK ? "Zir Zel →" : "Continue Study →",
      path: `/community/learning-detail/${todaysLearning.id}` as any,
      icon: "book-open",
      gradientDark:  ["#1a0a00", "#3a1a00", "#7a3200"],
      gradientLight: ["#3a1a00", "#7a3200", "#aa5820"],
      accent: "#d4a843",
    };
  }

  // P8 — Current Parashah study
  if (parasha) {
    return {
      overline: "CURRENT PARASHA",
      title: parasha,
      subtitle: "Study this week's Torah portion",
      cta: "Begin Study",
      path: "/(tabs)/torah",
      icon: "book-open",
      gradientDark:  ["#1a0a00", "#3a1a00", "#7a3200"],
      gradientLight: ["#3a1a00", "#7a3200", "#aa5820"],
      accent: "#d4a843",
    };
  }

  // P9 — Upcoming memorial / community yahrzeit
  if (hasUpcomingYahrzeit) {
    return {
      overline: isTK ? "THIANGLIM HRIATNA" : "SACRED MEMORY",
      title: isTK ? "Sanctuary En Rawh" : "Visit the Sanctuary",
      subtitle: isTK
        ? "Hriatna katni a mei a lang — an hriatna pawimawh rawh"
        : "A memorial candle burns — honor those remembered",
      cta: isTK ? "Sanctuary En →" : "Visit Sanctuary",
      path: "/sacred-memory",
      icon: "heart",
      gradientDark:  ["#1a0a1a", "#3a123a", "#6a2460"],
      gradientLight: ["#3a123a", "#6a2460", "#9a3a8a"],
      accent: "#d484c4",
    };
  }

  // P10 — Daf Yomi fallback
  return {
    overline: "DAF YOMI",
    title: `${daf.tractate} ${daf.daf}`,
    subtitle: "Continue your daily Talmud study",
    cta: "Study Today's Daf",
    path: "/(tabs)/torah",
    icon: "book",
    gradientDark:  ["#0a0a1e", "#12124a", "#2a2a7a"],
    gradientLight: ["#1a1a3a", "#2e2e6a", "#4a4a9a"],
    accent: "#8888d4",
  };
}

// ── Day-context Reflection ────────────────────────────────────────────────────

const REFLECTIONS = {
  shabbat: [
    { quote: "More than Israel has kept the Shabbat, the Shabbat has kept Israel.", source: "Ahad Ha'am" },
    { quote: "Remember the Shabbat day to keep it holy.", source: "Exodus 20:8" },
    { quote: "The Shabbat is a sanctuary in time.", source: "Abraham Joshua Heschel" },
    { quote: "On Shabbat we taste the world to come.", source: "Talmud, Berakhot 57b" },
    { quote: "Every Shabbat is a new world; its light renews creation.", source: "Sefat Emet" },
  ],
  friday: [
    { quote: "Prepare yourself on Erev Shabbat and you will eat on Shabbat.", source: "Talmud, Avodah Zarah 3a" },
    { quote: "The Shabbat candle is the symbol of peace in the home.", source: "Shulchan Aruch, OC 263" },
    { quote: "Welcome the Shabbat as a bride — with joy and preparation.", source: "Talmud, Shabbat 119a" },
  ],
  holiday: [
    { quote: "These are the appointed seasons of the Lord, holy gatherings.", source: "Leviticus 23:2" },
    { quote: "Rejoice in your festivals — you, your son, your daughter, your servant.", source: "Deuteronomy 16:14" },
    { quote: "A festival is not only a memory of the past but a promise of the future.", source: "Menashe Heritage" },
    { quote: "The holidays are milestones of memory and hope for our people.", source: "Menashe Heritage" },
  ],
  weekday: [
    { quote: "The Torah is a tree of life to those who hold fast to it.", source: "Proverbs 3:18" },
    { quote: "Who is wise? One who learns from every person.", source: "Pirkei Avot 4:1" },
    { quote: "Love your neighbor as yourself — the entire Torah stands on this.", source: "Leviticus 19:18" },
    { quote: "In the place where a penitent stands, the righteous cannot stand.", source: "Talmud, Berakhot 34b" },
    { quote: "G‑d is present in every place, in every moment, in every thought.", source: "Baal Shem Tov" },
    { quote: "Turn it over again, for everything is contained within it.", source: "Pirkei Avot 5:22" },
    { quote: "Every day one must say: the world was created for my sake.", source: "Sanhedrin 37a" },
    { quote: "A person should always study in a place his heart desires.", source: "Talmud, Avodah Zarah 19a" },
  ],
} as const;

function getContextualReflection(
  dayOfWeek: string,
  todayHoliday: { name: string } | null,
  dayOfYear: number,
): { quote: string; source: string; context: string } {
  if (dayOfWeek === "SATURDAY") {
    const r = REFLECTIONS.shabbat[dayOfYear % REFLECTIONS.shabbat.length];
    return { ...r, context: "Shabbat Reflection" };
  }
  if (dayOfWeek === "FRIDAY") {
    const r = REFLECTIONS.friday[dayOfYear % REFLECTIONS.friday.length];
    return { ...r, context: "Erev Shabbat" };
  }
  if (todayHoliday) {
    const r = REFLECTIONS.holiday[dayOfYear % REFLECTIONS.holiday.length];
    return { ...r, context: todayHoliday.name };
  }
  const r = REFLECTIONS.weekday[dayOfYear % REFLECTIONS.weekday.length];
  return { ...r, context: "Daily Reflection" };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function go(path: string) {
  hapticLight();
  router.push(path as any);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function formatEventDate(dateStr: string, lang: "en" | "tk"): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const today  = new Date();
  const diff   = daysBetween(today, d);
  if (diff === 0) return lang === "tk" ? "Nizan" : "Today";
  if (diff === 1) return lang === "tk" ? "Zani" : "Tomorrow";
  if (diff <= 7)  return lang === "tk" ? `Ni ${diff} a kal` : `In ${diff} days`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function JourneyScreen() {
  const { colors, sp } = useThemeTokens();
  const { t, lang } = useLanguage();
  const { location }  = useApp();
  const { user } = useUser();
  const insets   = useSafeAreaInsets();
  const topPad   = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  const isLight    = (colors.background as string).toLowerCase() === "#f5efe0";
  const isSapphire = (colors.background as string).toLowerCase() === "#060e1e";
  const GOLD       = colors.primary as string;

  const today      = useMemo(() => new Date(), []);
  const hdate      = useMemo(() => getHebrewDate(today), [today]);
  const hebrewStr  = useMemo(() => formatHebrewDate(hdate), [hdate]);
  const hebrewNum  = useMemo(() => { try { return formatHebrewDateHebrew(hdate); } catch { return ""; } }, [hdate]);
  const gregStr    = useMemo(() => formatGregorianDate(today), [today]);
  const dayOfWeek  = useMemo(() => getDayOfWeek(today), [today]);
  const parasha    = useMemo(() => getCurrentParasha(), []);
  const holidays   = useMemo(() => getUpcomingHolidays(30), []);
  const daf        = useMemo(() => getTodayDaf(), []);
  const zm         = useMemo(
    () => calculateZmanim(today, location.lat, location.lng, location.candleLightingMinutes ?? 18),
    [today, location],
  );
  const dayOfYear = useMemo(() => Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  ), []);

  // ── Census integration (SPR-P006A) ────────────────────────────────────────
  const [branch, setBranch] = React.useState<Branch | null | undefined>(undefined);
  const [censusError, setCensusError] = React.useState(false);

  React.useEffect(() => {
    const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
    getBranch({ baseUrl })
      .then((b) => setBranch(b ?? null))
      .catch(() => { setBranch(null); setCensusError(true); });
  }, []);

  const censusStats     = React.useMemo(() => branch ? branchStats(branch) : null, [branch]);
  const censusLoading   = branch === undefined && !censusError;
  const aliyahAwaiting  = (censusStats?.aliyahBreakdown.awaiting ?? 0) > 0;
  // hasCensus: undefined=loading, true=has record, false=no record
  const hasCensus: boolean | undefined = branch === undefined ? undefined : !!branch;

  // ── Community data (SPR-X001) — reuse existing API clients ────────────────
  const [events, setEvents]               = React.useState<CommunityEvent[]>([]);
  const [prayerRequests, setPrayerReqs]   = React.useState<PrayerRequest[]>([]);
  const [announcements, setAnnouncements] = React.useState<MobileAnnouncement[]>([]);
  const [yahrzeit, setYahrzeit]           = React.useState<CommunityYahrzeitEntry[]>([]);
  const [communityLoading, setCommunityLoading] = React.useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshCommunity = useCallback(async () => {
    const [evRes, prRes, anRes, yzRes] = await Promise.allSettled([
      fetchCommunityEvents(),
      fetchPrayerRequests(),
      fetchAnnouncements(),
      fetchCommunityYahrzeit(),
    ]);
    if (evRes.status === "fulfilled") setEvents(evRes.value);
    if (prRes.status === "fulfilled") setPrayerReqs(prRes.value);
    if (anRes.status === "fulfilled") setAnnouncements(anRes.value);
    if (yzRes.status === "fulfilled") setYahrzeit(yzRes.value);
    setCommunityLoading(false);
  }, []);

  React.useEffect(() => { refreshCommunity(); }, [refreshCommunity]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCommunity();
    setRefreshing(false);
  }, [refreshCommunity]);

  // ── Derived community values ───────────────────────────────────────────────
  const todayIso  = today.toISOString().slice(0, 10);
  const nextEvent = React.useMemo(
    () => events
      .filter((e) => e.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null,
    [events, todayIso],
  );
  const topPrayerRequest = React.useMemo(
    () => prayerRequests.find((r) => r.pinned) ?? prayerRequests[0] ?? null,
    [prayerRequests],
  );
  const latestAnnouncement = React.useMemo(
    () => announcements.find((a) => a.status === "sent" && a.pinned)
      ?? announcements.find((a) => a.status === "sent")
      ?? null,
    [announcements],
  );
  const hasYahrzeit = yahrzeit.length > 0;

  // ── Minute ticker — prayer windows change hourly ───────────────────────────
  const [nowMs, setNowMs] = React.useState(Date.now);
  React.useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Holiday context ────────────────────────────────────────────────────────
  const todayStr    = today.toDateString();
  const todayHoliday = React.useMemo(
    () => holidays.find((h: { name: string; date: string | Date }) =>
      new Date(h.date).toDateString() === todayStr) ?? null,
    [holidays, todayStr],
  );
  const imminentHoliday = React.useMemo(() => {
    const h = holidays.find((hol: { name: string; date: string | Date }) => {
      const d = daysBetween(today, new Date(hol.date));
      return d >= 1 && d <= 7;
    });
    if (!h) return null;
    return { name: h.name, daysAway: daysBetween(today, new Date(h.date)) };
  }, [holidays, today]);

  // ── Today's Learning ───────────────────────────────────────────────────────
  const todaysLearning = useMemo(() => getTodaysLearning(dayOfWeek), [dayOfWeek]);

  // ── Next Prayer + countdown ────────────────────────────────────────────────
  const nextPrayer  = useMemo(() => getNextPrayer(zm, nowMs), [zm, nowMs]);
  const countdown   = useMemo(
    () => nextPrayer ? formatCountdown(nextPrayer.time.getTime(), nowMs) : null,
    [nextPrayer, nowMs],
  );
  const prayerTimeStr = useMemo(
    () => nextPrayer ? formatTime(nextPrayer.time) : null,
    [nextPrayer],
  );

  // ── Priority action ────────────────────────────────────────────────────────
  const action = buildContinueAction(
    dayOfWeek, todayHoliday, imminentHoliday, zm, parasha ?? null, daf,
    hasCensus, todaysLearning, hasYahrzeit, lang,
  );
  const actionGradient = isLight ? action.gradientLight : action.gradientDark;

  // ── Reflection ─────────────────────────────────────────────────────────────
  const reflection = useMemo(
    () => getContextualReflection(dayOfWeek, todayHoliday, dayOfYear),
    [dayOfWeek, todayHoliday, dayOfYear],
  );

  const L = lang === "tk" ? "tk" : "en";

  // MEP-005: section entrance stagger — 40ms per section
  const j0 = useEntrance(0);
  const j1 = useEntrance(40);
  const j2 = useEntrance(80);
  const j3 = useEntrance(120);
  const j4 = useEntrance(160);
  const j5 = useEntrance(200);
  const j6 = useEntrance(240);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        accessibilityLabel="Menashe Journey"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >

        {/* ══ §1  GREETING ════════════════════════════════════════════════════ */}
        <Animated.View style={[styles.greetingSection, { paddingTop: topPad + sp[4] }, j0]}>
          <View
            style={[styles.starAccent, { backgroundColor: GOLD + "18", borderColor: GOLD + "38" }]}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <Text style={{ fontSize: 11 }}>✡</Text>
            <Text style={[styles.starLabel, { color: GOLD }]}>MENASHE JOURNEY</Text>
          </View>

          <Text style={[styles.shalomText, { color: colors.foreground }]}>
            {t.journeyGreeting}{user?.firstName ? `, ${user.firstName}` : ""}
          </Text>

          {/* ── Profile identity card ─────────────────────────────────────── */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/settings" as any)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Your profile — tap to edit"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: GOLD + "10",
              borderWidth: 1,
              borderColor: GOLD + "30",
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 20,
            }}
          >
            {/* Avatar */}
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: GOLD + "18",
              borderWidth: 2, borderColor: GOLD + "55",
              alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  accessibilityLabel="Your profile picture"
                />
              ) : (
                <Text style={{ fontSize: 20, fontWeight: "700", color: GOLD }}>
                  {user?.firstName?.charAt(0) ?? user?.primaryEmailAddress?.emailAddress?.charAt(0)?.toUpperCase() ?? "?"}
                </Text>
              )}
            </View>

            {/* Name + email */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, letterSpacing: -0.2 }} numberOfLines={1}>
                {user?.fullName ?? user?.firstName ?? "My Account"}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }} numberOfLines={1}>
                {user?.primaryEmailAddress?.emailAddress ?? ""}
              </Text>
            </View>

            {/* Edit arrow */}
            <View style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: GOLD + "18",
              alignItems: "center", justifyContent: "center",
            }}>
              <Feather name="edit-2" size={13} color={GOLD} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.hebrewDateText, { color: GOLD }]}>{hebrewStr}</Text>
          {hebrewNum ? (
            <Text style={[styles.hebrewNumText, { color: GOLD + "bb" }]}>{hebrewNum}</Text>
          ) : null}
          <Text style={[styles.gregDateText, { color: colors.mutedForeground }]}>{gregStr}</Text>

          <View style={[styles.greetingDivider, { backgroundColor: GOLD }]} />
        </Animated.View>

        <View style={{ paddingHorizontal: sp[4] }}>

          {/* ══ §5  TODAY'S RECOMMENDATION — priority engine ═════════════════ */}
          <Animated.View style={j1}>
          <SectionTitle title={t.journeyTodaysRecommendation} />

          <TouchableOpacity
            onPress={() => go(action.path)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`${action.title}. ${action.subtitle}`}
            style={styles.continueWrap}
          >
            <LinearGradient
              colors={actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueCard}
            >
              <View style={[styles.continueIcon, { backgroundColor: action.accent + "22" }]}>
                <Feather name={action.icon as any} size={20} color={action.accent} />
              </View>
              <Text style={[styles.continueOverline, { color: action.accent }]}>
                {action.overline}
              </Text>
              <Text style={styles.continueTitle} numberOfLines={2}>
                {action.title}
              </Text>
              <Text style={styles.continueSubtitle} numberOfLines={2}>
                {action.subtitle}
              </Text>
              <View style={[styles.continuePill, {
                backgroundColor: action.accent + "22",
                borderColor: action.accent + "55",
              }]}>
                <Text style={[styles.continuePillText, { color: action.accent }]}>
                  {action.cta}
                </Text>
                <Feather name="arrow-right" size={12} color={action.accent} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          </Animated.View>

          {/* ══ §1  TODAY'S LEARNING ═══════════════════════════════════════════ */}
          <Animated.View style={j2}>
          <SectionTitle title={t.journeyTodaysLearning} />

          <TouchableOpacity
            onPress={() => go(`/community/learning-detail/${todaysLearning.id}`)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${t.journeyTodaysLearning}: ${todaysLearning.name}`}
            style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {/* Header row */}
            <View style={styles.cardHeaderRow}>
              <View style={[styles.emojiBox, { backgroundColor: GOLD + "18" }]}>
                <Text style={styles.emojiText}>{todaysLearning.emoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: sp[3] }}>
                <Text style={[styles.cardOverline, { color: GOLD }]}>
                  {t.journeyLearningGroupLabel}
                </Text>
                <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {L === "tk" ? todaysLearning.nameTK : todaysLearning.name}
                </Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {L === "tk" ? todaysLearning.subjectTK : todaysLearning.subject}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </View>

            {/* Session info row */}
            {todaysLearning.time ? (
              <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
                <View style={styles.infoChip}>
                  <Feather name="clock" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.infoChipText, { color: colors.mutedForeground }]}>
                    {t.journeyNextSession}: {todaysLearning.time}
                  </Text>
                </View>
                <Text style={[styles.cardCTA, { color: GOLD }]}>
                  {t.journeyContinueLearning}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          </Animated.View>

          {/* ══ §2  TODAY'S SACRED TIME ════════════════════════════════════════ */}
          <Animated.View style={j3}>
          <SectionTitle title={t.journeyTodaysSacredTime} />

          <TouchableOpacity
            onPress={() => go("/(tabs)/zmanim")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t.journeyTodaysSacredTime}
            style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {nextPrayer ? (
              <>
                {/* Prayer name + countdown */}
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.emojiBox, { backgroundColor: GOLD + "18" }]}>
                    <Feather name="moon" size={20} color={GOLD} />
                  </View>
                  <View style={{ flex: 1, marginLeft: sp[3] }}>
                    <Text style={[styles.cardOverline, { color: GOLD }]}>
                      {t.journeyNextPrayer}
                    </Text>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                      {nextPrayer.name}
                    </Text>
                    {prayerTimeStr ? (
                      <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                        {prayerTimeStr}
                      </Text>
                    ) : null}
                  </View>
                  {/* Countdown badge */}
                  <View style={[styles.countdownBadge, { backgroundColor: GOLD + "18", borderColor: GOLD + "44" }]}>
                    <Text style={[styles.countdownText, { color: GOLD }]}>{countdown}</Text>
                  </View>
                </View>

                <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.cardCTA, { color: GOLD }]}>
                    {t.journeyOpenZmanim}
                  </Text>
                </View>
              </>
            ) : (
              /* All prayers done for today */
              <View style={styles.cardHeaderRow}>
                <View style={[styles.emojiBox, { backgroundColor: GOLD + "18" }]}>
                  <Feather name="star" size={20} color={GOLD} />
                </View>
                <View style={{ flex: 1, marginLeft: sp[3] }}>
                  <Text style={[styles.cardOverline, { color: GOLD }]}>ZMANIM</Text>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    {zm.sunrise ? t.journeyAllPrayersDone : t.journeyNoZmanim}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                    {t.journeyOpenZmanim}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
            )}
          </TouchableOpacity>

          </Animated.View>

          {/* ══ §3  COMMUNITY TODAY ════════════════════════════════════════════ */}
          <Animated.View style={j4}>
          <SectionTitle title={t.journeyCommunityToday} />

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, gap: 0 }]}>

            {/* Next event */}
            <TouchableOpacity
              onPress={() => go("/community/events")}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={t.journeyNextEvent}
            >
              <View style={styles.communityRow}>
                <View style={[styles.communityIconBox, { backgroundColor: GOLD + "14" }]}>
                  <Feather name="calendar" size={15} color={GOLD} />
                </View>
                <View style={{ flex: 1, marginLeft: sp[3] }}>
                  <Text style={[styles.communityRowLabel, { color: GOLD }]}>
                    {t.journeyNextEvent}
                  </Text>
                  {communityLoading ? (
                    <Text style={[styles.communityRowValue, { color: colors.mutedForeground }]}>—</Text>
                  ) : nextEvent ? (
                    <>
                      <Text style={[styles.communityRowValue, { color: colors.foreground }]} numberOfLines={1}>
                        {nextEvent.emoji} {L === "tk" ? nextEvent.titleTK : nextEvent.title}
                      </Text>
                      <Text style={[styles.communityRowSub, { color: colors.mutedForeground }]}>
                        {formatEventDate(nextEvent.date, lang)}
                        {nextEvent.time ? ` · ${nextEvent.time}` : ""}
                        {nextEvent.virtual ? " · Virtual" : nextEvent.location ? ` · ${nextEvent.location}` : ""}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.communityRowValue, { color: colors.mutedForeground }]}>
                      {t.journeyNoEvents}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

            {/* Top prayer request */}
            <TouchableOpacity
              onPress={() => go("/(tabs)/community")}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={t.journeyPrayerRequests}
            >
              <View style={styles.communityRow}>
                <View style={[styles.communityIconBox, { backgroundColor: GOLD + "14" }]}>
                  <Feather name="heart" size={15} color={GOLD} />
                </View>
                <View style={{ flex: 1, marginLeft: sp[3] }}>
                  <Text style={[styles.communityRowLabel, { color: GOLD }]}>
                    {t.journeyPrayerRequests}
                  </Text>
                  {communityLoading ? (
                    <Text style={[styles.communityRowValue, { color: colors.mutedForeground }]}>—</Text>
                  ) : topPrayerRequest ? (
                    <Text style={[styles.communityRowValue, { color: colors.foreground }]} numberOfLines={2}>
                      {topPrayerRequest.isAnonymous ? t.journeyAnonymous : topPrayerRequest.name} — "{topPrayerRequest.text}"
                    </Text>
                  ) : (
                    <Text style={[styles.communityRowValue, { color: colors.mutedForeground }]}>
                      {t.journeyNoPrayerRequests}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

            {/* Latest announcement */}
            <TouchableOpacity
              onPress={() => go("/community/announcements")}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel={t.journeyLatestAnnouncement}
            >
              <View style={styles.communityRow}>
                <View style={[styles.communityIconBox, { backgroundColor: GOLD + "14" }]}>
                  <Feather name="bell" size={15} color={GOLD} />
                </View>
                <View style={{ flex: 1, marginLeft: sp[3] }}>
                  <Text style={[styles.communityRowLabel, { color: GOLD }]}>
                    {t.journeyLatestAnnouncement}
                  </Text>
                  {communityLoading ? (
                    <Text style={[styles.communityRowValue, { color: colors.mutedForeground }]}>—</Text>
                  ) : latestAnnouncement ? (
                    <Text style={[styles.communityRowValue, { color: colors.foreground }]} numberOfLines={2}>
                      {latestAnnouncement.emoji} {latestAnnouncement.title}
                    </Text>
                  ) : (
                    <Text style={[styles.communityRowValue, { color: colors.mutedForeground }]}>
                      {t.journeyNoAnnouncements}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>

            {/* Open Community CTA */}
            <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
              <TouchableOpacity onPress={() => go("/(tabs)/community")} activeOpacity={0.75}>
                <Text style={[styles.cardCTA, { color: GOLD }]}>{t.journeyOpenCommunity}</Text>
              </TouchableOpacity>
            </View>
          </View>

          </Animated.View>

          {/* ══ §4  FAMILY JOURNEY — census + memorials ════════════════════════ */}
          <Animated.View style={j5}>
          <SectionTitle title={t.journeyFamilyJourney} />

          {censusLoading ? (
            <SkeletonCard lines={3} />
          ) : censusError ? (
            <View
              style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              accessible
              accessibilityLabel={t.journeyCensusUnavailable}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.emojiBox, { backgroundColor: GOLD + "16", borderColor: GOLD + "30" }]}>
                  <Feather name="cloud-off" size={20} color={GOLD} />
                </View>
                <View style={{ flex: 1, marginLeft: sp[3] }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    {t.journeyCensusUnavailable}
                  </Text>
                </View>
              </View>
            </View>
          ) : !branch ? (
            /* No census — milestone prompt */
            <TouchableOpacity
              onPress={() => go("/census")}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={`${t.journeyCensusMilestoneTitle}. ${t.journeyCensusMilestoneSubtitle}`}
              style={[styles.milestoneCard, { backgroundColor: colors.card, borderColor: GOLD + "55" }]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.emojiBox, { backgroundColor: GOLD + "16", borderColor: GOLD + "30" }]}>
                  <Feather name="users" size={20} color={GOLD} />
                </View>
                <View style={{ flex: 1, marginLeft: sp[3] }}>
                  <Text style={[styles.cardOverline, { color: GOLD }]}>MILESTONE</Text>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {t.journeyCensusMilestoneTitle}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {t.journeyCensusMilestoneSubtitle}
                  </Text>
                </View>
              </View>
              <View style={[styles.continuePill, {
                backgroundColor: GOLD + "18",
                borderColor: GOLD + "44",
                alignSelf: "flex-start",
              }]}>
                <Text style={[styles.continuePillText, { color: GOLD }]}>
                  {t.journeyCensusStartCta}
                </Text>
                <Feather name="arrow-right" size={12} color={GOLD} />
              </View>
            </TouchableOpacity>
          ) : (
            /* Has census record */
            <View style={{ gap: sp[3] }}>
              <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.emojiBox, { backgroundColor: GOLD + "16" }]}>
                    <Feather name="check-circle" size={20} color={GOLD} />
                  </View>
                  <View style={{ flex: 1, marginLeft: sp[3] }}>
                    <Text style={[styles.cardOverline, { color: GOLD }]}>
                      {t.journeyCensusStatusTitle.toUpperCase()}
                    </Text>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {branch.name}
                    </Text>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {branch.cityName}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.censusCount, { color: GOLD }]}>
                      {censusStats!.familyCount}
                    </Text>
                    <Text style={[styles.censusCountLabel, { color: colors.mutedForeground }]}>
                      {t.journeyCensusFamiliesLabel}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Aliyah priority — only when awaiting */}
              {aliyahAwaiting && (
                <View style={[styles.aliyahCard, { backgroundColor: GOLD + "0f", borderColor: GOLD + "66" }]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.emojiBox, { backgroundColor: GOLD + "22" }]}>
                      <Feather name="star" size={18} color={GOLD} />
                    </View>
                    <View style={{ flex: 1, marginLeft: sp[3] }}>
                      <Text style={[styles.cardOverline, { color: GOLD }]}>PRIORITY</Text>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                        {t.journeyCensusAliyahTitle}
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {t.journeyCensusAliyahSubtitle}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Memorial reminder */}
          <TouchableOpacity
            onPress={() => go("/sacred-memory")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t.journeyMemorialReminder}
            style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: sp[3] }]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.emojiBox, { backgroundColor: GOLD + "16" }]}>
                <Feather name="heart" size={20} color={GOLD} />
              </View>
              <View style={{ flex: 1, marginLeft: sp[3] }}>
                <Text style={[styles.cardOverline, { color: GOLD }]}>
                  {t.journeyMemorialReminder.toUpperCase()}
                </Text>
                {hasYahrzeit ? (
                  <>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                      {yahrzeit.length} {yahrzeit.length === 1 ? t.journeyMemorialSingular : t.journeyMemorialPlural}
                    </Text>
                    {yahrzeit[0] ? (
                      <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {yahrzeit[0].deceasedName}
                        {yahrzeit[0].learners.length > 0
                          ? ` · ${yahrzeit[0].learners.length} ${t.journeyMemorialsLearning}`
                          : ""}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                      {lang === "tk" ? "Inn Thianghlim Hriatna" : "Sacred Memory"}
                    </Text>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                      {lang === "tk" ? "Hriatna katni a mei chu rawh" : "Light a candle for those remembered"}
                    </Text>
                  </>
                )}
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </View>
            <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.cardCTA, { color: GOLD }]}>{t.journeyVisitSanctuary}</Text>
            </View>
          </TouchableOpacity>

          </Animated.View>

          {/* ══ §6  REFLECTION — day-context aware ══════════════════════════════ */}
          <Animated.View style={j6}>
          <SectionTitle title={t.journeyReflectionTitle} />

          <View
            style={[styles.reflectionCard, { backgroundColor: colors.card, borderColor: GOLD + "44" }]}
            accessible={true}
            accessibilityLabel={`${reflection.context}: "${reflection.quote}" — ${reflection.source}`}
          >
            <View style={[styles.reflectionBar, { backgroundColor: GOLD }]} />
            <View style={[styles.reflectionBadge, { backgroundColor: GOLD + "18", borderColor: GOLD + "30" }]}>
              <Text style={[styles.reflectionBadgeText, { color: GOLD }]}>{reflection.context}</Text>
            </View>
            <Text style={[styles.reflectionQuote, { color: colors.foreground }]}>
              "{reflection.quote}"
            </Text>
            <Text style={[styles.reflectionSource, { color: GOLD }]}>
              — {reflection.source}
            </Text>
          </View>

          </Animated.View>

        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  // §1 Greeting
  greetingSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  starAccent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  starLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  shalomText: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: 8,
  },
  hebrewDateText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  hebrewNumText: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  gregDateText: {
    fontSize: 15,
    marginBottom: 16,
  },
  greetingDivider: {
    height: 3,
    width: 48,
    borderRadius: 2,
  },

  // §5 Today's Recommendation (Continue Journey)
  continueWrap: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  continueCard: {
    padding: 20,
    borderRadius: 20,
    gap: 8,
    minHeight: 178,
  },
  continueIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  continueOverline: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.0,
  },
  continueTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  continueSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255,255,255,0.72)",
    lineHeight: 19,
  },
  continuePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  continuePillText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Shared section card
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  milestoneCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  aliyahCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },

  // Card internals
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  emojiBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 20,
  },
  cardOverline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  cardSub: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  cardCTA: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Session info row at bottom of card
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: 1,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoChipText: {
    fontSize: 12,
  },

  // Sacred Time countdown badge
  countdownBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 52,
    alignItems: "center",
  },
  countdownText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  // Community Today rows
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  communityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  communityRowLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  communityRowValue: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  communityRowSub: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
    marginHorizontal: 4,
  },

  // Census count display
  censusCount: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  censusCountLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // §6 Reflection
  reflectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  reflectionBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  reflectionBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginTop: 8,
  },
  reflectionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  reflectionQuote: {
    fontSize: 20,
    fontWeight: "500",
    fontStyle: "italic",
    lineHeight: 29,
  },
  reflectionSource: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

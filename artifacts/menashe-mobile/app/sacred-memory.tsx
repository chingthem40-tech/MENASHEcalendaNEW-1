/**
 * MEP-104 — Memorial Sanctuary Premium Experience
 * Mobile "Sacred Memory" hub — peaceful, reflective, premium sanctuary.
 *
 * Design direction: dark sanctuary atmosphere, warm gold, Apple-quality spacing.
 * All data, APIs, navigation, and animation logic unchanged from SPR-M011.
 *
 * Architecture rules (SPR-M011):
 *   ✓ Web untouched                 ✓ Web 3D Sanctuary untouched
 *   ✓ Shared Core reused            ✓ Memorial APIs reused (communityApi.ts)
 *   ✓ Mobile Shell reused           ✓ MMDL reused        ✓ MEL followed
 *   ✓ No duplicated candle/memorial business logic
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { HDate } from "@hebcal/core";
import { useUser } from "@clerk/expo";

import { useThemeTokens } from "@/src/mobile/design-system";
import { useReducedMotion } from "@/src/mobile/design-system/accessibility";
import { useLanguage } from "@/context/LanguageContext";
import { fetchCommunityYahrzeit, type CommunityYahrzeitEntry } from "@/lib/communityApi";
import BurningCandleRN from "@/components/BurningCandleRN";

const CURRENT_YEAR = new Date().getFullYear();

const HEBREW_MONTH_NAMES: Record<number, string> = {
  1: "Nissan", 2: "Iyar", 3: "Sivan", 4: "Tammuz",
  5: "Av", 6: "Elul", 7: "Tishrei", 8: "Cheshvan",
  9: "Kislev", 10: "Tevet", 11: "Shvat", 12: "Adar", 13: "Adar II",
};

// Quiet memorial readings — presentation-only content, not a duplicated engine.
const MEMORIAL_REFLECTIONS = [
  { thought: "May their memory be a blessing — a light that continues to guide those who loved them.", source: "Jewish Tradition" },
  { thought: "El Malei Rachamim: God, full of mercy, grant perfect rest beneath the wings of Your presence.", source: "Memorial Prayer" },
  { thought: "The righteous, even in death, are called living — their deeds continue to speak.", source: "Berakhot 18a" },
  { thought: "A candle is a soul, and remembrance is the flame that never lets it go dark.", source: "Jewish Wisdom" },
];

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function yahrzeitNumber(passingYear: number | null): number | undefined {
  if (!passingYear || passingYear >= CURRENT_YEAR) return undefined;
  return CURRENT_YEAR - passingYear;
}

function getDailyIndex(len: number): number {
  const dayNum = Math.floor(Date.now() / 86_400_000);
  return Math.abs(dayNum % len);
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

// ─── Animations (unchanged from SPR-M011) ─────────────────────────────────────

function useEntrance(delay: number, reducedMotion: boolean) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : 16)).current;
  useEffect(() => {
    const duration = reducedMotion ? 0 : 420;
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration, useNativeDriver: true }),
      ]).start();
    }, reducedMotion ? 0 : delay);
    return () => clearTimeout(t);
  }, [delay, opacity, translateY, reducedMotion]);
  return { opacity, transform: [{ translateY }] } as any;
}

function useGlowIn(reducedMotion: boolean) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(reducedMotion ? 1 : 0.94)).current;
  useEffect(() => {
    const duration = reducedMotion ? 0 : 560;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale, reducedMotion]);
  return { opacity, transform: [{ scale }] } as any;
}

function usePressScale(reducedMotion: boolean, toValue = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = useCallback(
    () => Animated.timing(scale, { toValue: reducedMotion ? 1 : toValue, duration: 80, useNativeDriver: true }).start(),
    [scale, toValue, reducedMotion],
  );
  const onPressOut = useCallback(
    () => Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start(),
    [scale],
  );
  return { scale, onPressIn, onPressOut };
}

// ─── Soft Candle Illustration ─────────────────────────────────────────────────

function SoftCandleIllustration({ gold, isLight }: { gold: string; isLight: boolean }) {
  const wickColor = isLight ? "#7a5c2e" : "#7a6ea0";
  return (
    <View style={{ alignItems: "center", width: 52, height: 110 }}>
      {/* Ambient glow orb */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute", top: -8, width: 76, height: 76,
          borderRadius: 38, backgroundColor: gold + "1e",
        }}
      />
      {/* Outer flame */}
      <View style={{
        width: 20, height: 30, marginTop: 4,
        backgroundColor: "#ff8c00",
        borderRadius: 10,
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
        shadowColor: gold, shadowRadius: 8, shadowOpacity: 0.7,
        shadowOffset: { width: 0, height: 0 }, elevation: 6,
      }} />
      {/* Inner flame highlight */}
      <View style={{
        position: "absolute", top: 12, left: "50%", marginLeft: -5,
        width: 10, height: 16, backgroundColor: "#fff8c0",
        borderRadius: 5, borderTopLeftRadius: 8, borderTopRightRadius: 8,
      }} />
      {/* Wick */}
      <View style={{ width: 2, height: 5, backgroundColor: wickColor }} />
      {/* Wax body — gradient for depth */}
      <LinearGradient
        colors={isLight ? ["#f5e9c6", "#eedba8"] : ["#35305a", "#28234c"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          width: 30, height: 68, borderRadius: 6,
          borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
          borderWidth: 1, borderColor: gold + "28",
        }}
      />
      {/* Wax drip highlight */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute", bottom: 14, left: 8,
          width: 6, height: 18, borderRadius: 3,
          backgroundColor: (isLight ? "#fff" : "#fff") + "12",
        }}
      />
    </View>
  );
}

// ─── Today's Yahrzeit — large elegant remembrance card ────────────────────────

interface TodayCardProps {
  entry: CommunityYahrzeitEntry;
  gold: string;
  isLight: boolean;
  colors: ReturnType<typeof useThemeTokens>["colors"];
  rd: ReturnType<typeof useThemeTokens>["rd"];
  sp: ReturnType<typeof useThemeTokens>["sp"];
  shadow: ReturnType<typeof useThemeTokens>["shadow"];
  onLightCandle: () => void;
}

const TodayYahrzeitCard = memo(function TodayYahrzeitCard({
  entry, gold, isLight, colors, rd, sp, shadow, onLightCandle,
}: TodayCardProps) {
  const yNum = yahrzeitNumber(entry.passingYear);
  const initial = getInitial(entry.deceasedName);

  return (
    <View style={{
      backgroundColor: isLight ? "#fdf6e8" : "#16101e",
      borderRadius: rd.xl, padding: sp[5],
      borderWidth: 1, borderColor: gold + "38",
      marginBottom: sp[3], ...shadow.level2,
    }}>
      {/* Warm glow accent — top-right */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute", top: -18, right: -18,
          width: 96, height: 96, borderRadius: 48,
          backgroundColor: gold + "0e",
        }}
      />

      {/* Avatar + name + Hebrew date */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: sp[4], marginBottom: sp[4] }}>
        <View style={{
          width: 58, height: 58, borderRadius: 29,
          backgroundColor: gold + "1e", borderWidth: 1, borderColor: gold + "40",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: gold }}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 22, fontWeight: "800", letterSpacing: -0.4,
              color: isLight ? "#1a120a" : "#f4e0c4", lineHeight: 28,
            }}
            numberOfLines={2}
          >
            {entry.deceasedName}
          </Text>
          <Text style={{ fontSize: 13, color: gold, fontWeight: "600", marginTop: 2, letterSpacing: 0.2 }}>
            {entry.displayDate}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 28,
            textShadowColor: gold, textShadowRadius: 10,
            textShadowOffset: { width: 0, height: 0 },
          }}
        >
          🕯
        </Text>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: gold + "22", marginBottom: sp[4] }} />

      {/* Yahrzeit badge + relationship */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: sp[2], marginBottom: sp[4] }}>
        {yNum !== undefined && (
          <View style={{
            paddingHorizontal: sp[3], paddingVertical: sp[1],
            backgroundColor: gold + "16", borderRadius: rd.pill,
            borderWidth: 1, borderColor: gold + "30",
          }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: gold }}>
              {ordinal(yNum)} Yahrzeit
            </Text>
          </View>
        )}
        {!!entry.donorDisplayName && (
          <View style={{
            paddingHorizontal: sp[3], paddingVertical: sp[1],
            backgroundColor: colors.cardBorder + "28", borderRadius: rd.pill,
            borderWidth: 1, borderColor: colors.cardBorder,
          }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary }}>
              Lit by {entry.donorDisplayName}
            </Text>
          </View>
        )}
      </View>

      {/* Message */}
      {!!entry.message && (
        <Text style={{
          fontSize: 14, color: colors.textSecondary,
          fontStyle: "italic", lineHeight: 22, marginBottom: sp[4],
        }}>
          "{entry.message}"
        </Text>
      )}

      {/* Light a Candle CTA */}
      <Pressable
        onPress={onLightCandle}
        accessibilityRole="button"
        accessibilityLabel="Light a candle in memory"
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center",
          gap: sp[2], paddingVertical: sp[3], borderRadius: rd.md,
          backgroundColor: gold, minHeight: 44,
        }}
      >
        <Text style={{ fontSize: 15 }}>🕯</Text>
        <Text style={{ fontSize: 14, fontWeight: "700", color: isLight ? "#1a120a" : "#1a0f00" }}>
          Light a Candle
        </Text>
      </Pressable>
    </View>
  );
});

// ─── Premium Memorial List Card ───────────────────────────────────────────────

interface MemorialListCardProps {
  entry: CommunityYahrzeitEntry;
  gold: string;
  isLight: boolean;
  colors: ReturnType<typeof useThemeTokens>["colors"];
  rd: ReturnType<typeof useThemeTokens>["rd"];
  sp: ReturnType<typeof useThemeTokens>["sp"];
  onPress: () => void;
}

const MemorialListCard = memo(function MemorialListCard({
  entry, gold, isLight, colors, rd, sp, onPress,
}: MemorialListCardProps) {
  const yNum = yahrzeitNumber(entry.passingYear);
  const initial = getInitial(entry.deceasedName);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={entry.deceasedName}
      style={{
        flexDirection: "row", alignItems: "center", gap: sp[4],
        paddingVertical: sp[4], paddingHorizontal: sp[4],
        backgroundColor: colors.card, borderRadius: rd.lg,
        borderWidth: 1, borderColor: colors.cardBorder,
        marginBottom: sp[2],
      }}
    >
      {/* Initial avatar */}
      <View style={{
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: gold + "18", borderWidth: 1, borderColor: gold + "32",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Text style={{ fontSize: 17, fontWeight: "800", color: gold }}>{initial}</Text>
      </View>

      {/* Name + Hebrew date */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16, fontWeight: "700", letterSpacing: -0.2,
            color: isLight ? "#1a120a" : "#f4e0c4", lineHeight: 22,
          }}
          numberOfLines={1}
        >
          {entry.deceasedName}
        </Text>
        <Text style={{ fontSize: 12, color: gold + "cc", marginTop: 2, fontWeight: "500" }}>
          {entry.displayDate}
          {yNum !== undefined ? ` · ${ordinal(yNum)} yahrzeit` : ""}
        </Text>
      </View>

      {/* Candle + learner count */}
      <View style={{ alignItems: "center", gap: 3, flexShrink: 0 }}>
        <Text style={{
          fontSize: 18,
          textShadowColor: gold, textShadowRadius: 6,
          textShadowOffset: { width: 0, height: 0 },
        }}>🕯</Text>
        {entry.learners.length > 0 && (
          <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: "600" }}>
            {entry.learners.length}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

// ─── Remembrance Timeline — entries grouped by Hebrew month ───────────────────

interface TimelineGroupProps {
  label: string;
  entries: CommunityYahrzeitEntry[];
  gold: string;
  colors: ReturnType<typeof useThemeTokens>["colors"];
  sp: ReturnType<typeof useThemeTokens>["sp"];
  isLight: boolean;
  onPress: () => void;
}

const TimelineGroup = memo(function TimelineGroup({
  label, entries, gold, colors, sp, isLight, onPress,
}: TimelineGroupProps) {
  return (
    <View style={{ marginBottom: sp[5] }}>
      {/* Month label with decorative lines */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: sp[3], marginBottom: sp[3] }}>
        <View style={{ flex: 1, height: 1, backgroundColor: gold + "22" }} />
        <Text style={{
          fontSize: 10, fontWeight: "800", letterSpacing: 1.8,
          color: gold + "aa", textTransform: "uppercase",
        }}>
          {label}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: gold + "22" }} />
      </View>

      {entries.map((entry, idx) => (
        <Pressable
          key={entry.id}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={entry.deceasedName}
          style={{
            flexDirection: "row", alignItems: "center", gap: sp[3],
            paddingVertical: sp[3], paddingHorizontal: sp[2],
            borderBottomWidth: idx < entries.length - 1 ? 1 : 0,
            borderBottomColor: colors.cardBorder,
          }}
        >
          {/* Lit / unlit dot */}
          <View style={{
            width: 8, height: 8, borderRadius: 4, flexShrink: 0,
            backgroundColor: entry.candleLit ? gold : colors.cardBorder,
          }} />
          <Text
            style={{
              flex: 1, fontSize: 15, fontWeight: "600",
              color: isLight ? "#1a120a" : "#f4e0c4",
            }}
            numberOfLines={1}
          >
            {entry.deceasedName}
          </Text>
          <Text style={{ fontSize: 12, color: gold + "bb", fontWeight: "500", flexShrink: 0 }}>
            {entry.displayDate}
          </Text>
        </Pressable>
      ))}
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SacredMemoryScreen() {
  const { colors, type, sp, rd, shadow, theme } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const { user } = useUser();

  const isLight = theme === "light";
  const isSapphire = theme === "sapphire";
  const gold = colors.accentGold;

  // Wider horizontal padding for premium breathing room
  const HX = sp[5];
  const topPad = insets.top > 0 ? insets.top : Platform.OS === "web" ? 60 : 20;

  // Sanctuary background — deep and atmospheric in dark/sapphire, warm parchment in light
  const sanctuaryBg = isLight ? colors.background : "#0e0b1e";

  const [entries, setEntries] = useState<CommunityYahrzeitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchCommunityYahrzeit();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  const reflection = useMemo(() => MEMORIAL_REFLECTIONS[getDailyIndex(MEMORIAL_REFLECTIONS.length)], []);

  // Today's Hebrew date — displayed prominently in the hero
  const hebrewDate = useMemo(() => {
    const hd = new HDate(new Date());
    const day = hd.getDate();
    const month = hd.getMonth();
    const monthName = HEBREW_MONTH_NAMES[month] ?? "";
    return { day, month, display: `${day} ${monthName} ${hd.getFullYear()}` };
  }, []);

  // Real Hebrew-calendar match — today's yahrzeits
  const todaysRemembrances = useMemo(() => {
    return entries.filter((e) => e.hebrewDay === hebrewDate.day && e.hebrewMonth === hebrewDate.month);
  }, [entries, hebrewDate]);

  // Memorial list — most recently created, capped for readability
  const memorialList = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
  }, [entries]);

  // Remembrance timeline — entries grouped by Hebrew month, ordered from current month
  const timelineGroups = useMemo(() => {
    const { month: todayMonth } = hebrewDate;
    const groups = new Map<number, CommunityYahrzeitEntry[]>();
    for (const entry of entries) {
      const m = entry.hebrewMonth;
      if (!groups.has(m)) groups.set(m, []);
      groups.get(m)!.push(entry);
    }
    const sortedMonths = [...groups.keys()].sort((a, b) => {
      const da = a >= todayMonth ? a - todayMonth : a + 13 - todayMonth;
      const db = b >= todayMonth ? b - todayMonth : b + 13 - todayMonth;
      return da - db;
    });
    return sortedMonths.slice(0, 4).map((month) => ({
      label: HEBREW_MONTH_NAMES[month] ?? `Month ${month}`,
      entries: groups.get(month)!.sort((a, b) => a.hebrewDay - b.hebrewDay),
    }));
  }, [entries, hebrewDate]);

  // Recent candles for the community section
  const recentCandles = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.candleLitAt || b.createdAt).getTime() - new Date(a.candleLitAt || a.createdAt).getTime())
      .slice(0, 6);
  }, [entries]);

  // Stat counts
  const candleCount = entries.length;
  const learnerCount = entries.reduce((s, e) => s + e.learners.length, 0);

  const goCommunity = useCallback(() => router.push("/(tabs)/community"), []);
  const goLightCandle = useCallback(
    () => router.push({ pathname: "/(tabs)/community", params: { form: "1" } } as any),
    [],
  );
  const enterSanctuary = useCallback(async () => {
    setOpening(true);
    try {
      await WebBrowser.openBrowserAsync(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
    } finally {
      setOpening(false);
    }
  }, []);

  const heroGradient = isLight
    ? (["#F9EEDB", "#F0DBAE", "#E0B978"] as const)
    : isSapphire
    ? (["#111d33", "#1e2f52", "#111d33"] as const)
    : (["#2a1500", "#1c0e00", "#3a2208"] as const);

  // Staggered entrance animations
  const heroAnim = useGlowIn(reducedMotion);
  const a0 = useEntrance(60, reducedMotion);
  const a1 = useEntrance(120, reducedMotion);
  const a2 = useEntrance(180, reducedMotion);
  const a3 = useEntrance(240, reducedMotion);
  const a4 = useEntrance(300, reducedMotion);
  const a5 = useEntrance(360, reducedMotion);

  const lightPress = usePressScale(reducedMotion, 0.97);
  const sanctuaryPress = usePressScale(reducedMotion, 0.97);

  const READING_MAX_WIDTH = 640;

  return (
    <View style={{ flex: 1, backgroundColor: sanctuaryBg }}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: (insets.bottom || 0) + 48,
          maxWidth: READING_MAX_WIDTH,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {/* ══ 1. HERO — candle illustration + Hebrew date + daily reflection ══ */}
        <Animated.View style={heroAnim}>
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: topPad + 16,
              paddingHorizontal: HX,
              paddingBottom: 36,
              overflow: "hidden",
            }}
          >
            {/* Back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginBottom: 22 }}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Feather name="chevron-left" size={22} color={isLight ? "#5a3d10" : "#e8d3a0"} />
            </TouchableOpacity>

            {/* Candle + title row */}
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: sp[5], marginBottom: 22 }}>
              <SoftCandleIllustration gold={gold} isLight={isLight} />
              <View style={{ flex: 1, paddingBottom: 8 }}>
                {/* Hebrew date — prominent */}
                <Text style={{
                  fontSize: 11, fontWeight: "700", letterSpacing: 2,
                  color: isLight ? "#8a5a1e" : gold,
                  textTransform: "uppercase", marginBottom: 8,
                }}>
                  {hebrewDate.display}
                </Text>
                <Text style={{
                  fontSize: 30, fontWeight: "800", letterSpacing: -0.8,
                  color: isLight ? "#2a1a08" : "#f4e0c4", lineHeight: 34,
                }}>
                  {t.sacredMemoryTitle}
                </Text>
              </View>
            </View>

            {/* Daily reflection — quiet, italicised, gold left-border */}
            <View style={{
              borderLeftWidth: 2, borderLeftColor: gold + "55",
              paddingLeft: sp[4],
            }}>
              <Text style={{
                fontSize: 13, color: isLight ? "#6b4d23" : "#d8c090",
                lineHeight: 20, fontStyle: "italic",
              }}>
                "{reflection.thought}"
              </Text>
              <Text style={{ fontSize: 11, color: gold + "aa", fontWeight: "600", marginTop: 5 }}>
                — {reflection.source}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ══ 2. TODAY'S YAHRZEIT — large elegant cards ══ */}
        <Animated.View style={[{ marginHorizontal: HX, marginTop: 30 }, a0]}>
          {/* Section eyebrow */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2], marginBottom: sp[4] }}>
            <Feather name="sun" size={13} color={gold} />
            <Text style={{
              fontSize: 10, fontWeight: "800", letterSpacing: 2,
              color: gold, textTransform: "uppercase",
            }}>
              {t.sacredMemoryTodaysRemembrance}
            </Text>
          </View>

          {todaysRemembrances.length === 0 ? (
            <View style={{
              backgroundColor: colors.card, borderRadius: rd.xl,
              padding: sp[7], borderWidth: 1, borderColor: colors.cardBorder,
              alignItems: "center", gap: sp[3],
            }}>
              <Text style={{ fontSize: 36 }}>🕊</Text>
              <Text style={[type.bodySm, { color: colors.textMuted, textAlign: "center", lineHeight: 20 }]}>
                {t.sacredMemoryNoRemembrance}
              </Text>
            </View>
          ) : (
            todaysRemembrances.map((entry) => (
              <TodayYahrzeitCard
                key={entry.id}
                entry={entry}
                gold={gold}
                isLight={isLight}
                colors={colors}
                rd={rd}
                sp={sp}
                shadow={shadow}
                onLightCandle={goLightCandle}
              />
            ))
          )}
        </Animated.View>

        {/* ══ 3. MEMORIAL LIST — premium vertical cards ══ */}
        {!loading && memorialList.length > 0 && (
          <Animated.View style={[{ marginHorizontal: HX, marginTop: 36 }, a1]}>
            <View style={{
              flexDirection: "row", alignItems: "center",
              justifyContent: "space-between", marginBottom: sp[4],
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2] }}>
                <Feather name="book-open" size={13} color={gold} />
                <Text style={{
                  fontSize: 10, fontWeight: "800", letterSpacing: 2,
                  color: gold, textTransform: "uppercase",
                }}>
                  Memorial Record
                </Text>
              </View>
              <Pressable
                onPress={goCommunity}
                accessibilityRole="button"
                accessibilityLabel="See all memorials"
                hitSlop={8}
              >
                <Text style={{ fontSize: 13, color: gold, fontWeight: "600" }}>See All</Text>
              </Pressable>
            </View>

            {memorialList.map((entry) => (
              <MemorialListCard
                key={entry.id}
                entry={entry}
                gold={gold}
                isLight={isLight}
                colors={colors}
                rd={rd}
                sp={sp}
                onPress={goCommunity}
              />
            ))}
          </Animated.View>
        )}

        {/* ══ LIGHT A CANDLE — flagship CTA ══ */}
        <Animated.View style={[{ marginHorizontal: HX, marginTop: 30 }, a2]}>
          <Animated.View style={{ transform: [{ scale: lightPress.scale }] }}>
            <Pressable
              onPress={goLightCandle}
              onPressIn={lightPress.onPressIn}
              onPressOut={lightPress.onPressOut}
              accessibilityRole="button"
              accessibilityLabel={t.sacredMemoryLightCandleCta}
              style={{ borderRadius: rd.xl, overflow: "hidden", ...shadow.level2 }}
            >
              <LinearGradient
                colors={isLight ? (["#F0DBAE", "#E0B978"] as const) : (["#3a2208", "#2a1500"] as const)}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{
                  padding: sp[5], flexDirection: "row",
                  alignItems: "center", gap: sp[4], minHeight: 96,
                }}
              >
                <View style={{
                  width: 58, height: 58, borderRadius: 29,
                  backgroundColor: "rgba(255,160,30,0.20)",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{
                    fontSize: 30,
                    textShadowColor: "rgba(255,160,30,0.7)",
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 12,
                  }}>🕯</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: isLight ? "#2a1a08" : "#f4e0c4" }}>
                    {t.sacredMemoryLightCandle}
                  </Text>
                  <Text style={{ fontSize: 12, color: isLight ? "#6b4d23" : "#d8c090", marginTop: 3, lineHeight: 17 }}>
                    {t.sacredMemoryLightCandleDesc}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: rd.md,
                  backgroundColor: gold, minHeight: 40, justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: isLight ? "#2a1a08" : "#1a1206" }}>
                    {t.sacredMemoryLightCandleCta}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Animated.View>

        {/* ══ 4. REMEMBRANCE TIMELINE — grouped by Hebrew month ══ */}
        {timelineGroups.length > 0 && (
          <Animated.View style={[{ marginHorizontal: HX, marginTop: 36 }, a3]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2], marginBottom: sp[5] }}>
              <Feather name="calendar" size={13} color={gold} />
              <Text style={{
                fontSize: 10, fontWeight: "800", letterSpacing: 2,
                color: gold, textTransform: "uppercase",
              }}>
                Remembrance Timeline
              </Text>
            </View>

            <View style={{
              backgroundColor: colors.card, borderRadius: rd.xl,
              borderWidth: 1, borderColor: colors.cardBorder,
              paddingVertical: sp[4], paddingHorizontal: sp[4],
              ...shadow.level1,
            }}>
              {timelineGroups.map((group) => (
                <TimelineGroup
                  key={group.label}
                  label={group.label}
                  entries={group.entries}
                  gold={gold}
                  colors={colors}
                  sp={sp}
                  isLight={isLight}
                  onPress={goCommunity}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* ══ 5. PRAYER — existing reflections, elevated presentation ══ */}
        <Animated.View style={[{ marginHorizontal: HX, marginTop: 36 }, a4]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2], marginBottom: sp[4] }}>
            <Feather name="feather" size={13} color={gold} />
            <Text style={{
              fontSize: 10, fontWeight: "800", letterSpacing: 2,
              color: gold, textTransform: "uppercase",
            }}>
              {t.sacredMemoryPrayerReflection}
            </Text>
          </View>

          {MEMORIAL_REFLECTIONS.map((r, i) => (
            <View
              key={i}
              style={{
                backgroundColor: colors.card, borderRadius: rd.lg,
                padding: sp[5], marginBottom: sp[3],
                borderWidth: 1,
                borderColor: i === 0 ? gold + "30" : colors.cardBorder,
                borderLeftWidth: 3,
                borderLeftColor: i === 0 ? gold : gold + "45",
              }}
            >
              <Text style={{
                fontSize: 14, color: colors.textSecondary,
                fontStyle: "italic", lineHeight: 22,
              }}>
                "{r.thought}"
              </Text>
              <Text style={{
                fontSize: 11, fontWeight: "700",
                color: gold + "cc", marginTop: 10, letterSpacing: 0.5,
              }}>
                — {r.source}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* ══ 6. COMMUNITY MEMORIAL — stats + recent candles ══ */}
        <Animated.View style={[{ marginHorizontal: HX, marginTop: 36 }, a5]}>
          <View style={{
            flexDirection: "row", alignItems: "center",
            justifyContent: "space-between", marginBottom: sp[4],
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2] }}>
              <Feather name="users" size={13} color={gold} />
              <Text style={{
                fontSize: 10, fontWeight: "800", letterSpacing: 2,
                color: gold, textTransform: "uppercase",
              }}>
                {t.sacredMemoryCommunityMemorial}
              </Text>
            </View>
            <Pressable
              onPress={goCommunity}
              accessibilityRole="button"
              accessibilityLabel={t.sacredMemoryViewCommunity}
              hitSlop={8}
            >
              <Text style={{ fontSize: 13, color: gold, fontWeight: "600" }}>View All</Text>
            </Pressable>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: "row", gap: sp[3], marginBottom: sp[4] }}>
            <View style={{
              flex: 1, alignItems: "center", paddingVertical: sp[5],
              backgroundColor: gold + "12", borderRadius: rd.lg,
              borderWidth: 1, borderColor: gold + "28",
            }}>
              <Text style={{ fontSize: 28, fontWeight: "900", color: gold, lineHeight: 32 }}>
                {candleCount}
              </Text>
              <Text style={{
                fontSize: 9, fontWeight: "700", letterSpacing: 1.2,
                color: gold + "88", textTransform: "uppercase", marginTop: 5,
              }}>
                {t.sacredMemoryCandlesLit}
              </Text>
            </View>
            <View style={{
              flex: 1, alignItems: "center", paddingVertical: sp[5],
              backgroundColor: colors.success + "10", borderRadius: rd.lg,
              borderWidth: 1, borderColor: colors.success + "28",
            }}>
              <Text style={{ fontSize: 28, fontWeight: "900", color: colors.success, lineHeight: 32 }}>
                {learnerCount}
              </Text>
              <Text style={{
                fontSize: 9, fontWeight: "700", letterSpacing: 1.2,
                color: colors.success + "88", textTransform: "uppercase", marginTop: 5,
              }}>
                {t.sacredMemoryLearningNow}
              </Text>
            </View>
          </View>

          {/* Recent candles horizontal scroll */}
          {recentCandles.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: sp[3], paddingBottom: sp[1] }}
            >
              {recentCandles.map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={goCommunity}
                  accessibilityRole="button"
                  accessibilityLabel={entry.deceasedName}
                  style={{
                    backgroundColor: colors.card, borderRadius: rd.lg,
                    borderWidth: 1, borderColor: colors.cardBorder,
                    paddingVertical: sp[3], paddingHorizontal: sp[3],
                    alignItems: "center", width: 100, gap: sp[2],
                  }}
                >
                  <BurningCandleRN
                    deceasedName={entry.deceasedName}
                    yahrzeitNumber={yahrzeitNumber(entry.passingYear)}
                    donorName={entry.donorDisplayName || undefined}
                    learners={entry.learners}
                    isLit={entry.candleLit}
                    compact
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11, fontWeight: "600",
                      color: isLight ? "#2a1a08" : "#e8d4a0",
                      textAlign: "center",
                    }}
                  >
                    {entry.deceasedName}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: 10, color: gold + "aa" }}>
                    {entry.displayDate}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* ══ ENTER SANCTUARY — flagship CTA ══ */}
        <Animated.View style={[{ marginHorizontal: HX, marginTop: 30, marginBottom: 8 }, a5]}>
          <Animated.View style={{ transform: [{ scale: sanctuaryPress.scale }] }}>
            <Pressable
              onPress={enterSanctuary}
              onPressIn={sanctuaryPress.onPressIn}
              onPressOut={sanctuaryPress.onPressOut}
              disabled={opening}
              accessibilityRole="button"
              accessibilityLabel={t.sacredMemoryEnterSanctuaryCta}
              accessibilityHint="Opens the immersive 3D memorial sanctuary in your browser"
              style={{ borderRadius: rd["2xl"], overflow: "hidden", ...shadow.level2 }}
            >
              <LinearGradient
                colors={["#3a1e08", "#1c0e00", "#2a1500", "#3a2208"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ minHeight: 190, padding: 26 }}
              >
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute", top: -32, right: -32,
                    width: 160, height: 160, borderRadius: 80,
                    backgroundColor: "rgba(212,120,10,0.14)",
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute", bottom: -20, left: -20,
                    width: 100, height: 100, borderRadius: 50,
                    backgroundColor: "rgba(212,160,20,0.08)",
                  }}
                />

                <Text style={{
                  fontSize: 10, fontWeight: "700", letterSpacing: 1.8,
                  color: gold, textTransform: "uppercase", marginBottom: 10,
                }}>
                  {t.sacredMemoryEnterSanctuary}
                </Text>
                <Text style={{
                  fontSize: 22, fontWeight: "800", color: "#f4e0c4",
                  marginBottom: 8, lineHeight: 28, letterSpacing: -0.3,
                }}>
                  {t.sacredMemoryEnterSanctuaryCta}
                </Text>
                <Text style={{
                  fontSize: 13, color: "#c4b090",
                  marginBottom: 22, lineHeight: 20, maxWidth: 340,
                }}>
                  {t.sacredMemoryEnterSanctuaryDesc}
                </Text>

                <View style={{
                  alignSelf: "flex-start", flexDirection: "row",
                  alignItems: "center", gap: 8,
                  paddingHorizontal: 18, paddingVertical: 12,
                  borderRadius: rd.md, backgroundColor: gold, minHeight: 44,
                }}>
                  {opening ? (
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#1a0f00" }}>…</Text>
                  ) : (
                    <>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#1a0f00" }}>
                        {t.sacredMemoryEnterSanctuaryCta}
                      </Text>
                      <Feather name="external-link" size={14} color="#1a0f00" />
                    </>
                  )}
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

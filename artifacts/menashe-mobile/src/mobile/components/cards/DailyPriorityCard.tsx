/**
 * DailyPriorityCard — SPR-X002 "Daily Life Engine"
 *
 * Answers: "What is the most meaningful thing I should do right now?"
 *
 * Priority order (highest wins — never shows more than one):
 *   1. Upcoming Prayer       → Open Sacred Time      → /(tabs)/zmanim
 *   2. Today's Learning      → Continue Learning     → /community/events
 *   3. Community Event Today → View Event            → /community/events
 *   4. Memorial Today        → Visit Sanctuary       → /sacred-memory
 *   5. Incomplete Census     → Complete Census       → /census
 *   6. Weekly Parashah       → Read Torah (fallback) → /(tabs)/torah
 *
 * Reuses (no new APIs, no new tables):
 *   calculateZmanim     — @/lib/zmanim
 *   getCurrentParasha   — @/lib/hebrewCalendar
 *   fetchCommunityEvents— @/lib/eventsApi
 *   fetchCommunityYahrzeit — @/lib/communityApi
 *   getHead             — @/lib/censusStore
 *   useApp              — @/context/AppContext
 *   useThemeTokens      — @/src/mobile/design-system
 */

import React, {
  memo,
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { HDate } from "@hebcal/core";
import { calculateZmanim, type ZmanimTimes } from "@/lib/zmanim";
import { getCurrentParasha } from "@/lib/hebrewCalendar";
import { fetchCommunityEvents, type CommunityEvent } from "@/lib/eventsApi";
import { fetchCommunityYahrzeit } from "@/lib/communityApi";
import { getHead } from "@/lib/censusStore";
import { useApp } from "@/context/AppContext";
import { useThemeTokens } from "@/src/mobile/design-system";
import { usePressScale } from "@/src/mobile/lib/usePressScale";

// ─── Priority slot ─────────────────────────────────────────────────────────────

interface PrioritySlot {
  id:             string;
  emoji:          string;
  overline:       string;
  title:          string;
  subtitle:       string;
  cta:            string;
  route:          string;
  accent:         string;
  gradientColors: readonly [string, string, string];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getNextPrayer(zm: ZmanimTimes, nowMs: number) {
  const candidates: Array<{ name: string; time: Date | null }> = [
    { name: "Shacharit", time: zm.sunrise },
    { name: "Mincha",    time: zm.minchaGedolah },
    { name: "Ma'ariv",   time: zm.tzais },
  ];
  for (const c of candidates) {
    if (c.time && c.time.getTime() > nowMs) return c;
  }
  return null;
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isTodayHebrewDate(hebrewDay: number, hebrewMonth: number): boolean {
  const hd = new HDate(new Date());
  return hd.getMonth() === hebrewMonth && hd.getDate() === hebrewDay;
}

// ─── Priority engine ───────────────────────────────────────────────────────────

interface AsyncData {
  events:          CommunityEvent[];
  hasMemorialToday: boolean;
  loaded:          boolean;
}

function buildPriority(
  zm: ZmanimTimes,
  nowMs: number,
  parasha: string,
  data: AsyncData,
): PrioritySlot {
  // P1 — Upcoming prayer
  const prayer = getNextPrayer(zm, nowMs);
  if (prayer) {
    const sub: Record<string, string> = {
      Shacharit: "Open the day in morning prayer",
      Mincha:    "Pause and connect in afternoon prayer",
      "Ma'ariv": "Evening prayer opens now",
    };
    return {
      id:             "prayer",
      emoji:          "🕍",
      overline:       "UPCOMING PRAYER",
      title:          prayer.name,
      subtitle:       sub[prayer.name] ?? "Open your heart in prayer",
      cta:            "Open Sacred Time",
      route:          "/(tabs)/zmanim",
      accent:         "#d4a843",
      gradientColors: ["#1a0a00", "#5c3008", "#c8852a"],
    };
  }

  // P2 — Learning event today
  const learningEvent = data.events.find(
    (e) => e.type === "learning" && e.date === todayISODate(),
  );
  if (learningEvent) {
    return {
      id:             "learning",
      emoji:          "📖",
      overline:       "TODAY'S LEARNING",
      title:          learningEvent.title,
      subtitle:       learningEvent.description || "Your study session is today",
      cta:            "Continue Learning",
      route:          "/community/events",
      accent:         "#d4a843",
      gradientColors: ["#1a0a00", "#3a1a00", "#7a3200"],
    };
  }

  // P3 — Community event today
  const communityEvent = data.events.find(
    (e) => e.type !== "learning" && e.date === todayISODate(),
  );
  if (communityEvent) {
    return {
      id:             "event",
      emoji:          communityEvent.emoji || "📅",
      overline:       "COMMUNITY EVENT",
      title:          communityEvent.title,
      subtitle:       communityEvent.description || "Join your community today",
      cta:            "View Event",
      route:          "/community/events",
      accent:         "#22c55e",
      gradientColors: ["#0a1a0a", "#1a3a1a", "#3a6a3a"],
    };
  }

  // P4 — Memorial today (Hebrew calendar match)
  if (data.hasMemorialToday) {
    return {
      id:             "memorial",
      emoji:          "🕯",
      overline:       "MEMORIAL TODAY",
      title:          "A Candle Burns in Remembrance",
      subtitle:       "Honor those the community remembers today",
      cta:            "Visit Sanctuary",
      route:          "/sacred-memory",
      accent:         "#fb923c",
      gradientColors: ["#3a1e08", "#1c0e00", "#3a2208"],
    };
  }

  // P5 — Census incomplete
  if (data.loaded && getHead() === null) {
    return {
      id:             "census",
      emoji:          "📋",
      overline:       "COMMUNITY MILESTONE",
      title:          "Complete Your Census",
      subtitle:       "Help strengthen the Bnei Menashe community",
      cta:            "Complete Census",
      route:          "/census",
      accent:         "#4ade80",
      gradientColors: ["#0a1a0a", "#1a3a1a", "#2e5e2e"],
    };
  }

  // P6 — Weekly Parashah (fallback — always available)
  return {
    id:             "parasha",
    emoji:          "📜",
    overline:       "WEEKLY PARASHAH",
    title:          parasha ? `Parashat ${parasha}` : "Torah Study",
    subtitle:       "Study this week's Torah portion",
    cta:            "Read Torah",
    route:          "/(tabs)/torah",
    accent:         "#d4a843",
    gradientColors: ["#1a0a00", "#3a1a00", "#5c2600"],
  };
}

// usePressScale is provided by @/src/mobile/lib/usePressScale (MEP-005)

// ─── Component ─────────────────────────────────────────────────────────────────

export const DailyPriorityCard = memo(function DailyPriorityCard() {
  const { rd, shadow } = useThemeTokens();
  const { location }   = useApp();
  const { scale, onPressIn, onPressOut } = usePressScale();

  // Minute-level ticker — keeps prayer priority fresh as time advances.
  // Same pattern as index.tsx (which ticks every second for the countdown).
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Derive today from nowMs so it rolls over correctly at midnight.
  const today = useMemo(() => new Date(nowMs), [nowMs]);

  const zm = useMemo(
    () =>
      calculateZmanim(
        today,
        location.lat,
        location.lng,
        location.candleLightingMinutes,
      ),
    [location, today],
  );

  const parasha = useMemo(() => getCurrentParasha(), []);

  const [data, setData] = useState<AsyncData>({
    events:           [],
    hasMemorialToday: false,
    loaded:           false,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchCommunityEvents(),
      fetchCommunityYahrzeit(),
    ])
      .then(([events, memorials]) => {
        if (cancelled) return;
        const hasMemorialToday = memorials.some((m) =>
          isTodayHebrewDate(m.hebrewDay, m.hebrewMonth),
        );
        setData({ events, hasMemorialToday, loaded: true });
      })
      .catch(() => {
        if (!cancelled) setData((d) => ({ ...d, loaded: true }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const priority = useMemo(
    () => buildPriority(zm, nowMs, parasha, data),
    [zm, nowMs, parasha, data],
  );

  return (
    <Animated.View
      style={[
        { borderRadius: rd.xl, ...shadow.level2 },
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        onPress={() => router.push(priority.route as any)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${priority.overline}: ${priority.title}. ${priority.subtitle}. Tap to ${priority.cta}.`}
        style={{ borderRadius: rd.xl, overflow: "hidden" }}
      >
        <LinearGradient
          colors={priority.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Ambient glow */}
          <View
            style={[
              styles.glowOrb,
              { backgroundColor: priority.accent + "1a" },
            ]}
          />

          <View style={styles.row}>
            {/* Text block */}
            <View style={styles.textBlock}>
              <Text
                style={[styles.overline, { color: priority.accent }]}
                numberOfLines={1}
              >
                {priority.overline}
              </Text>

              <Text style={styles.title} numberOfLines={2}>
                {priority.title}
              </Text>

              <Text style={styles.subtitle} numberOfLines={2}>
                {priority.subtitle}
              </Text>

              {/* CTA pill */}
              <View
                style={[
                  styles.ctaPill,
                  { backgroundColor: priority.accent },
                ]}
              >
                <Text style={styles.ctaLabel}>{priority.cta}</Text>
                <Feather name="chevron-right" size={12} color="#fff" />
              </View>
            </View>

            {/* Icon orb */}
            <View
              style={[
                styles.iconOrb,
                { backgroundColor: priority.accent + "22" },
              ]}
            >
              <Text style={styles.iconEmoji}>{priority.emoji}</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
});

// ─── Styles — MMDS rule: numeric literals only in StyleSheet.create() ──────────

const styles = StyleSheet.create({
  gradient: {
    minHeight: 164,
    padding: 22,
    overflow: "hidden",
  },
  glowOrb: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  overline: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.0,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f4f0e8",
    lineHeight: 26,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(240,220,180,0.75)",
    lineHeight: 18,
    marginBottom: 18,
  },
  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9999,
    minHeight: 36,
  },
  ctaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.1,
  },
  iconOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 40,
    textShadowColor: "rgba(255,255,255,0.25)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});

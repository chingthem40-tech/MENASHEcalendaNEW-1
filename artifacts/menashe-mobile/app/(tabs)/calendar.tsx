/**
 * Calendar Screen — MEP-101 Premium Redesign
 *
 * Visual redesign for Apple-quality parity with the Web Calendar.
 * All business logic, calculations, and APIs are unchanged.
 *
 * Changes (visual only):
 *   - Taller cells (1.84 ratio) with breathing room
 *   - Today = solid gold circle around date number (white text)
 *   - Selected = gold ring border + faint gold tint (no solid fill)
 *   - Shabbat column header = subtle crimson tint band
 *   - Candle time absolute-positioned top-right of Friday cells
 *   - Event labels flex-pushed to cell bottom
 *   - 22 px month title, larger day-header text
 *   - Detail card: larger typography, premium candle display, no accent stripe
 */

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useThemeTokens } from "@/src/mobile/design-system";
import { useReducedMotion } from "@/src/mobile/design-system/accessibility";
import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { calculateZmanim, formatTime } from "@/lib/zmanim";
import {
  getHebrewDate,
  getHebrewMonthName,
  getMonthCalendar,
  hebrewDayNumeral,
  getCurrentParashaInfo,
  type CalendarDay,
} from "@/lib/hebrewCalendar";

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_H_PAD = 14; // px, each side inside the card
const CARD_MARGIN = 14; // px, card from screen edge

const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "ששי", "שבת"];

const FAST_RE = /fast|tzom|tisha|ta'?anit|taanis/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isFastEvent(events: string[]): boolean {
  return events.some((e) => FAST_RE.test(e));
}

function primaryEvent(events: string[]): string | null {
  return events.find((e) => !/^shabbat$/i.test(e)) ?? null;
}

function shortenEvent(name: string): string {
  return name
    .replace(/Rosh Chodesh\s*/i, "R.Ch. ")
    .replace(/Parashat\s*/i, "")
    .replace(/Shabbat\s*/i, "Shab. ")
    .trim();
}

function compactTime(t: string): string {
  return t.replace(/\s+/g, "");
}

// ─── Month navigation animation hook ─────────────────────────────────────────

function useMonthAnim(reducedMotion: boolean) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const run = useCallback(
    (dir: 1 | -1, apply: () => void) => {
      if (reducedMotion) {
        apply();
        return;
      }
      Animated.timing(opacity, {
        toValue: 0,
        duration: 90,
        useNativeDriver: true,
      }).start(() => {
        apply();
        translateX.setValue(16 * dir);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [opacity, translateX, reducedMotion],
  );

  return { opacity, translateX, run };
}

// ─── Press-scale micro-animation ─────────────────────────────────────────────

function usePressScale(reducedMotion: boolean, to = 0.94) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = useCallback(
    () =>
      Animated.timing(scale, {
        toValue: reducedMotion ? 1 : to,
        duration: 70,
        useNativeDriver: true,
      }).start(),
    [scale, to, reducedMotion],
  );
  const onPressOut = useCallback(
    () =>
      Animated.timing(scale, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
      }).start(),
    [scale],
  );
  return { scale, onPressIn, onPressOut };
}

// ─── DayCell — Premium Redesign ───────────────────────────────────────────────

interface DayCellProps {
  day: CalendarDay;
  candleTime: string | null;
  isSelected: boolean;
  cellW: number;
  cellH: number;
  reducedMotion: boolean;
  accentGold: string;
  textPrimary: string;
  textMuted: string;
  onPress: (d: CalendarDay) => void;
}

const DayCell = memo(
  function DayCell({
    day,
    candleTime,
    isSelected,
    cellW,
    cellH,
    reducedMotion,
    accentGold,
    textPrimary,
    textMuted,
    onPress,
  }: DayCellProps) {
    const { scale, onPressIn, onPressOut } = usePressScale(reducedMotion, 0.92);

    const isSat = day.date.getDay() === 6;
    const isFri = day.date.getDay() === 5;
    const isFast = isFastEvent(day.events);
    const evLabel = primaryEvent(day.events);

    // Today circle: the gold circle sits behind the date number
    const circleSize = Math.min(cellW - 12, 32);

    // Date number color hierarchy:
    // today (on gold circle) → white
    // selected (non-today) → gold
    // shabbat → crimson
    // fast → amber-dark
    // normal → textPrimary
    const dayNumColor = day.isToday
      ? "#fff"
      : isSelected
      ? accentGold
      : isSat
      ? "#dc2626"
      : isFast
      ? "#b45309"
      : textPrimary;

    // Hebrew date color: white on today, faint gold on selected, muted otherwise
    const hebrewColor = day.isToday
      ? "rgba(255,255,255,0.78)"
      : isSelected
      ? accentGold + "BB"
      : textMuted;

    // Event label color
    const evColor = day.isToday
      ? "rgba(255,255,255,0.90)"
      : isSelected
      ? accentGold
      : isFast
      ? "#b45309"
      : isSat
      ? "#dc2626"
      : "#7c3aed";

    const a11yLabel = [
      day.date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      day.isToday ? "today" : "",
      isFast ? "fast day" : "",
      evLabel ?? "",
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <Pressable
        onPress={() => onPress(day)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ selected: isSelected }}
        style={{ width: cellW, height: cellH }}
      >
        <Animated.View
          style={{
            width: cellW,
            height: cellH,
            alignItems: "center",
            // Selected (non-today): gold ring + faint tint
            borderWidth: isSelected && !day.isToday ? 1.5 : 0,
            borderColor: accentGold,
            borderRadius: 10,
            backgroundColor:
              isSelected && !day.isToday
                ? accentGold + "0E"
                : isSat && !day.isToday
                ? "rgba(220,38,38,0.04)"
                : "transparent",
            transform: [{ scale }],
            paddingTop: 9,
          }}
        >
          {/* ── Candle + time: absolute top-right on Fridays ── */}
          {isFri && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 4,
                right: 3,
                alignItems: "flex-end",
              }}
            >
              <Text
                allowFontScaling={false}
                style={{ fontSize: 9, lineHeight: 11 }}
              >
                🕯
              </Text>
              {candleTime && (
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 6,
                    lineHeight: 8,
                    fontWeight: "700",
                    color: day.isToday
                      ? "rgba(255,255,255,0.85)"
                      : accentGold,
                  }}
                >
                  {compactTime(candleTime)}
                </Text>
              )}
            </View>
          )}

          {/* ── Today: gold circle | Others: transparent container ── */}
          <View
            style={{
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: day.isToday ? accentGold : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontSize: cellW > 46 ? 16 : 15,
                fontWeight:
                  day.isToday || isSelected ? "700" : isSat ? "600" : "400",
                color: dayNumColor,
                lineHeight: 20,
              }}
            >
              {day.gregorianDay}
            </Text>
          </View>

          {/* ── Hebrew day numeral ── */}
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 9.5,
              fontWeight: "500",
              color: hebrewColor,
              lineHeight: 13,
              marginTop: 2,
            }}
          >
            {hebrewDayNumeral(day.hebrewDay)}
          </Text>

          {/* ── Hebrew month name ── */}
          <Text
            allowFontScaling={false}
            style={{
              fontSize: 7.5,
              color: hebrewColor,
              lineHeight: 10,
              opacity: 0.85,
            }}
          >
            {day.hebrewMonth}
          </Text>

          {/* ── Flex spacer: pushes event label to bottom ── */}
          <View style={{ flex: 1 }} />

          {/* ── Event label at bottom of cell ── */}
          {(isFast || evLabel || day.roshChodesh) && (
            <View
              style={{
                paddingBottom: 4,
                paddingHorizontal: 2,
                alignItems: "center",
              }}
            >
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={{
                  fontSize: 6.5,
                  fontWeight: "700",
                  color: evColor,
                  textAlign: "center",
                  letterSpacing: 0.2,
                }}
              >
                {isFast
                  ? "FAST"
                  : evLabel
                  ? shortenEvent(evLabel).substring(0, 9)
                  : "R.CH"}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  },
  (p, n) =>
    p.isSelected === n.isSelected &&
    p.day.date.getTime() === n.day.date.getTime() &&
    p.day.events.length === n.day.events.length &&
    p.candleTime === n.candleTime,
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { colors, sp, rd, shadow, theme } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { location } = useApp();
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  const { width: screenW } = Dimensions.get("window");

  // ── State ──────────────────────────────────────────────────────────────────
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<CalendarDay | null>(null);

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  const isLight = theme === "light";
  const gold = colors.accentGold;

  // ── Grid dimensions ────────────────────────────────────────────────────────
  const gridWidth = screenW - CARD_MARGIN * 2 - GRID_H_PAD * 2;
  const cellW = Math.floor(gridWidth / 7);
  // MEP-101: taller cells for breathing room (was 1.45)
  const cellH = Math.floor(cellW * 1.84);

  // ── Calendar data ──────────────────────────────────────────────────────────
  const monthDays = useMemo(() => getMonthCalendar(year, month), [year, month]);
  const leadingBlanks = useMemo(
    () => Array(new Date(year, month, 1).getDay()).fill(null),
    [year, month],
  );

  const hebrewSubtitle = useMemo(() => {
    const firstHDate = getHebrewDate(new Date(year, month, 1));
    const lastHDate = getHebrewDate(new Date(year, month + 1, 0));
    const hYear = firstHDate.getFullYear();
    const firstMon = getHebrewMonthName(firstHDate);
    const lastMon = getHebrewMonthName(lastHDate);
    const months =
      firstMon === lastMon ? firstMon : `${firstMon} – ${lastMon}`;
    return `${months} ${hYear}`;
  }, [year, month]);

  const candleMap = useMemo(() => {
    const map: Record<number, string> = {};
    monthDays.forEach((day: CalendarDay) => {
      if (day.date.getDay() === 5) {
        try {
          const zm = calculateZmanim(
            day.date,
            location.lat,
            location.lng,
            location.candleLightingMinutes,
          );
          if (zm.candleLighting instanceof Date) {
            map[day.gregorianDay] = formatTime(zm.candleLighting);
          }
        } catch {
          // skip
        }
      }
    });
    return map;
  }, [monthDays, location]);

  // ── Selected day parasha (weekly Torah portion) ───────────────────────────
  const selectedParasha = useMemo(() => {
    if (!selected) return null;
    try { return getCurrentParashaInfo(selected.date); } catch { return null; }
  }, [selected]);

  // ── Havdalah time (Saturday selections only) ──────────────────────────────
  const havdalahTime = useMemo(() => {
    if (!selected || selected.date.getDay() !== 6) return null;
    try {
      const zm = calculateZmanim(
        selected.date,
        location.lat,
        location.lng,
        location.candleLightingMinutes,
      );
      return zm.havdalah instanceof Date ? formatTime(zm.havdalah) : null;
    } catch { return null; }
  }, [selected, location]);

  // ── Month navigation ───────────────────────────────────────────────────────
  const { opacity: gridOpacity, translateX: gridTransX, run: animateMonth } =
    useMonthAnim(reducedMotion);

  const prevMonth = useCallback(() => {
    animateMonth(-1, () => {
      setSelected(null);
      if (month === 0) {
        setMonth(11);
        setYear((y) => y - 1);
      } else {
        setMonth((m) => m - 1);
      }
    });
  }, [animateMonth, month]);

  const nextMonth = useCallback(() => {
    animateMonth(1, () => {
      setSelected(null);
      if (month === 11) {
        setMonth(0);
        setYear((y) => y + 1);
      } else {
        setMonth((m) => m + 1);
      }
    });
  }, [animateMonth, month]);

  const goToday = useCallback(() => {
    animateMonth(1, () => {
      setYear(today.getFullYear());
      setMonth(today.getMonth());
      setSelected(null);
    });
  }, [animateMonth, today]);

  const onSelectDay = useCallback((day: CalendarDay) => {
    setSelected((prev: CalendarDay | null) =>
      prev?.date.getTime() === day.date.getTime() ? null : day,
    );
  }, []);

  // ── Press scales ───────────────────────────────────────────────────────────
  const prevPress = usePressScale(reducedMotion, 0.82);
  const nextPress = usePressScale(reducedMotion, 0.82);
  const todayPress = usePressScale(reducedMotion, 0.92);

  // ── Header gradient stops ──────────────────────────────────────────────────
  const headerGrad = isLight
    ? (["#C4920A", "#D4A843", "#B8810A"] as const)
    : (["#9A6E18", "#C4922A", "#8A6010"] as const);

  const topPad = insets.top > 0 ? insets.top : Platform.OS === "web" ? 48 : 20;

  // Gregorian month label — "July 2026" (sentence-case, larger feels more premium)
  const monthLabel = useMemo(
    () =>
      new Date(year, month, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [year, month],
  );

  // ── Grid body background (light/clean under the cells) ─────────────────────
  const gridBg = isLight ? "#faf6ef" : colors.surface;

  // ── Shabbat column tint for day-header bar ─────────────────────────────────
  const satHeaderBg = isLight
    ? "rgba(220, 38, 38, 0.07)"
    : "rgba(220, 38, 38, 0.10)";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingBottom: (insets.bottom || 0) + 110,
          paddingHorizontal: CARD_MARGIN,
        }}
      >
        {/* ════════════════════════════════════════════════════════════
            MAIN CALENDAR CARD
            ════════════════════════════════════════════════════════════ */}
        <View
          style={{
            borderRadius: rd.xl,
            overflow: "hidden",
            ...shadow.level2,
            borderWidth: 1,
            borderColor: isLight
              ? "rgba(180,130,20,0.22)"
              : "rgba(212,168,67,0.14)",
          }}
        >
          {/* ── Gold-gradient header ── */}
          <LinearGradient
            colors={headerGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingTop: 16,
              paddingBottom: 14,
              paddingHorizontal: GRID_H_PAD,
            }}
          >
            {/* Ambient shimmer orb */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: -40,
                right: -24,
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: "rgba(255,255,255,0.07)",
              }}
            />

            {/* Navigation row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* ‹ Previous */}
              <Animated.View style={{ transform: [{ scale: prevPress.scale }] }}>
                <Pressable
                  onPress={prevMonth}
                  onPressIn={prevPress.onPressIn}
                  onPressOut={prevPress.onPressOut}
                  hitSlop={18}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: "rgba(0,0,0,0.16)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.18)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="chevron-left" size={19} color="#fff" />
                </Pressable>
              </Animated.View>

              {/* Center: Month + Year + Hebrew subtitle */}
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: "#fff",
                    letterSpacing: 0.4,
                    textAlign: "center",
                    textShadowColor: "rgba(0,0,0,0.25)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  {monthLabel}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.82)",
                    marginTop: 4,
                    letterSpacing: 0.8,
                    fontWeight: "500",
                  }}
                >
                  {hebrewSubtitle}
                </Text>
              </View>

              {/* › Next */}
              <Animated.View style={{ transform: [{ scale: nextPress.scale }] }}>
                <Pressable
                  onPress={nextMonth}
                  onPressIn={nextPress.onPressIn}
                  onPressOut={nextPress.onPressOut}
                  hitSlop={18}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: "rgba(0,0,0,0.16)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.18)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="chevron-right" size={19} color="#fff" />
                </Pressable>
              </Animated.View>
            </View>
          </LinearGradient>

          {/* ── Calendar grid body ── */}
          <View style={{ backgroundColor: gridBg, paddingHorizontal: GRID_H_PAD }}>

            {/* ── Day-of-week column headers ── */}
            <View
              style={{
                flexDirection: "row",
                borderBottomWidth: 1,
                borderBottomColor: isLight
                  ? "rgba(0,0,0,0.07)"
                  : "rgba(255,255,255,0.06)",
              }}
            >
              {DAY_LABELS_EN.map((label, i) => {
                const isSatCol = i === 6;
                return (
                  <View
                    key={label}
                    style={{
                      width: cellW,
                      alignItems: "center",
                      paddingTop: 11,
                      paddingBottom: 9,
                      backgroundColor: isSatCol ? satHeaderBg : "transparent",
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 11.5,
                        fontWeight: "700",
                        letterSpacing: 0.3,
                        color: isSatCol
                          ? "#dc2626"
                          : colors.textSecondary,
                      }}
                    >
                      {label}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 8,
                        color: isSatCol
                          ? "rgba(220,38,38,0.60)"
                          : colors.textMuted,
                        marginTop: 1.5,
                        fontWeight: "400",
                      }}
                    >
                      {DAY_LABELS_HE[i]}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* ── Grid rows ── */}
            <Animated.View
              style={{
                opacity: gridOpacity,
                transform: [{ translateX: gridTransX }],
                flexDirection: "row",
                flexWrap: "wrap",
                marginTop: 3,
                marginBottom: 8,
              }}
            >
              {/* Leading blank cells */}
              {leadingBlanks.map((_, i) => (
                <View
                  key={`blank-${i}`}
                  style={{ width: cellW, height: cellH }}
                />
              ))}

              {/* Day cells */}
              {monthDays.map((day: CalendarDay) => (
                <DayCell
                  key={day.gregorianDay}
                  day={day}
                  candleTime={candleMap[day.gregorianDay] ?? null}
                  isSelected={
                    selected?.date.getTime() === day.date.getTime()
                  }
                  cellW={cellW}
                  cellH={cellH}
                  reducedMotion={reducedMotion}
                  accentGold={gold}
                  textPrimary={colors.textPrimary}
                  textMuted={colors.textMuted}
                  onPress={onSelectDay}
                />
              ))}
            </Animated.View>
          </View>

          {/* ── Legend + TODAY button ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: GRID_H_PAD + 2,
              paddingTop: 10,
              paddingBottom: 12,
              backgroundColor: isLight
                ? "rgba(0,0,0,0.025)"
                : colors.backgroundSubtle,
              borderTopWidth: 1,
              borderTopColor: isLight
                ? "rgba(0,0,0,0.06)"
                : "rgba(255,255,255,0.05)",
            }}
          >
            {/* Legend */}
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              {/* Today */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <View
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 5.5,
                    backgroundColor: gold,
                  }}
                />
                <Text
                  allowFontScaling={false}
                  style={{ fontSize: 10, color: colors.textMuted, fontWeight: "500" }}
                >
                  Today
                </Text>
              </View>

              {/* Shabbat */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <View
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 5.5,
                    backgroundColor: "rgba(220,38,38,0.15)",
                    borderWidth: 1.5,
                    borderColor: "rgba(220,38,38,0.45)",
                  }}
                />
                <Text
                  allowFontScaling={false}
                  style={{ fontSize: 10, color: colors.textMuted, fontWeight: "500" }}
                >
                  Shabbat
                </Text>
              </View>

              {/* Fast */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <View
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 5.5,
                    backgroundColor: "rgba(180,83,9,0.12)",
                    borderWidth: 1.5,
                    borderColor: "rgba(180,83,9,0.38)",
                  }}
                />
                <Text
                  allowFontScaling={false}
                  style={{ fontSize: 10, color: colors.textMuted, fontWeight: "500" }}
                >
                  Fast
                </Text>
              </View>

              {/* Holiday */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <View
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 5.5,
                    backgroundColor: "rgba(124,58,237,0.12)",
                    borderWidth: 1.5,
                    borderColor: "rgba(124,58,237,0.38)",
                  }}
                />
                <Text
                  allowFontScaling={false}
                  style={{ fontSize: 10, color: colors.textMuted, fontWeight: "500" }}
                >
                  Holiday
                </Text>
              </View>
            </View>

            {/* TODAY button */}
            {!isCurrentMonth ? (
              <Animated.View
                style={{ transform: [{ scale: todayPress.scale }] }}
              >
                <Pressable
                  onPress={goToday}
                  onPressIn={todayPress.onPressIn}
                  onPressOut={todayPress.onPressOut}
                  accessibilityRole="button"
                  accessibilityLabel="Go to today"
                  style={{
                    backgroundColor: gold,
                    borderRadius: 9999,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: "#fff",
                      letterSpacing: 0.8,
                    }}
                  >
                    TODAY
                  </Text>
                </Pressable>
              </Animated.View>
            ) : (
              <Pressable
                onPress={goToday}
                accessibilityRole="button"
                accessibilityLabel="Go to today"
                style={{
                  backgroundColor: gold + "1A",
                  borderRadius: 9999,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: gold + "44",
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: gold,
                    letterSpacing: 0.8,
                  }}
                >
                  TODAY
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ════════════════════════════════════════════════════════════
            SELECTED DAY DETAIL CARD
            Appears below the calendar when a day is tapped.
            ════════════════════════════════════════════════════════════ */}
        {selected && (
          <View
            style={{
              marginTop: 16,
              backgroundColor: colors.surface,
              borderRadius: rd.xl,
              borderWidth: 1,
              borderColor: isLight
                ? "rgba(212,168,67,0.22)"
                : "rgba(212,168,67,0.16)",
              overflow: "hidden",
              ...shadow.level2,
            }}
          >
            {/* ── Header: date + badge ── */}
            <View
              style={{
                paddingHorizontal: sp[5],
                paddingTop: sp[5],
                paddingBottom: sp[4],
                borderBottomWidth: 1,
                borderBottomColor: isLight
                  ? "rgba(0,0,0,0.06)"
                  : "rgba(255,255,255,0.05)",
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                {/* Gregorian date */}
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 19,
                    fontWeight: "700",
                    color: colors.textPrimary,
                    letterSpacing: -0.3,
                    lineHeight: 24,
                  }}
                >
                  {selected.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
                {/* Hebrew date */}
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: gold,
                    marginTop: 4,
                    letterSpacing: 0.2,
                  }}
                >
                  {hebrewDayNumeral(selected.hebrewDay)}{" "}
                  {selected.hebrewMonth}{" "}
                  {selected.hebrewYear}
                </Text>
              </View>

              {/* Shabbat / Fast badge */}
              {(selected.isShabbat || isFastEvent(selected.events)) && (
                <View
                  style={{
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor: isFastEvent(selected.events)
                      ? "rgba(180,83,9,0.35)"
                      : "rgba(220,38,38,0.35)",
                    backgroundColor: isFastEvent(selected.events)
                      ? "rgba(180,83,9,0.10)"
                      : "rgba(220,38,38,0.08)",
                    paddingHorizontal: 11,
                    paddingVertical: 5,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 11.5,
                      fontWeight: "700",
                      color: isFastEvent(selected.events)
                        ? "#b45309"
                        : "#dc2626",
                      letterSpacing: 0.3,
                    }}
                  >
                    {isFastEvent(selected.events) ? "Fast Day" : "Shabbat"}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ padding: sp[5], gap: sp[3] }}>

              {/* ── Candle Lighting (Friday) ── */}
              {candleMap[selected.gregorianDay] && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    backgroundColor: isLight
                      ? "rgba(212,168,67,0.07)"
                      : "rgba(212,168,67,0.08)",
                    borderRadius: rd.lg,
                    borderWidth: 1,
                    borderColor: isLight
                      ? "rgba(212,168,67,0.22)"
                      : "rgba(212,168,67,0.18)",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: gold + "18",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>🕯️</Text>
                  </View>
                  <View>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 10,
                        color: gold,
                        fontWeight: "700",
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                      }}
                    >
                      Candle Lighting
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 26,
                        fontWeight: "800",
                        color: gold,
                        lineHeight: 32,
                        marginTop: 1,
                        letterSpacing: -0.5,
                      }}
                    >
                      {candleMap[selected.gregorianDay]}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {location.candleLightingMinutes} min before sunset
                    </Text>
                  </View>
                </View>
              )}

              {/* ── Havdalah (Saturday) ── */}
              {havdalahTime && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    backgroundColor: isLight
                      ? "rgba(124,58,237,0.05)"
                      : "rgba(124,58,237,0.07)",
                    borderRadius: rd.lg,
                    borderWidth: 1,
                    borderColor: isLight
                      ? "rgba(124,58,237,0.20)"
                      : "rgba(124,58,237,0.16)",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "rgba(124,58,237,0.13)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>✨</Text>
                  </View>
                  <View>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 10,
                        color: "#7c3aed",
                        fontWeight: "700",
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                      }}
                    >
                      Havdalah
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 26,
                        fontWeight: "800",
                        color: "#7c3aed",
                        lineHeight: 32,
                        marginTop: 1,
                        letterSpacing: -0.5,
                      }}
                    >
                      {havdalahTime}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                        marginTop: 2,
                      }}
                    >
                      Shabbat ends · {location.name}
                    </Text>
                  </View>
                </View>
              )}

              {/* ── Events list ── */}
              {selected.events.length === 0 && !selected.roshChodesh ? (
                <View
                  style={{
                    paddingVertical: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 13.5,
                      color: colors.textMuted,
                      fontStyle: "italic",
                    }}
                  >
                    No special events
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {selected.roshChodesh && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        backgroundColor: isLight
                          ? "rgba(124,58,237,0.05)"
                          : "rgba(124,58,237,0.08)",
                        borderRadius: rd.md,
                        borderWidth: 1,
                        borderColor: "rgba(124,58,237,0.18)",
                      }}
                    >
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 3.5,
                          backgroundColor: "#7c3aed",
                        }}
                      />
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.textPrimary,
                          flex: 1,
                        }}
                      >
                        Rosh Chodesh
                      </Text>
                    </View>
                  )}

                  {selected.events.map((ev: string) => {
                    const isFastEv = isFastEvent([ev]);
                    const isShabbatEv = /shabbat/i.test(ev);
                    const dotColor = isFastEv
                      ? "#b45309"
                      : isShabbatEv
                      ? "#dc2626"
                      : gold;
                    const rowBg = isLight
                      ? "rgba(212,168,67,0.05)"
                      : "rgba(212,168,67,0.06)";
                    return (
                      <View
                        key={ev}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          backgroundColor: rowBg,
                          borderRadius: rd.md,
                          borderWidth: 1,
                          borderColor: isLight
                            ? "rgba(212,168,67,0.15)"
                            : "rgba(212,168,67,0.12)",
                        }}
                      >
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 3.5,
                            backgroundColor: dotColor,
                          }}
                        />
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontSize: 14,
                            fontWeight: "500",
                            color: colors.textPrimary,
                            flex: 1,
                          }}
                        >
                          {ev}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* ── Parasha of the week ── */}
              {selectedParasha && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    backgroundColor: isLight
                      ? "rgba(212,168,67,0.05)"
                      : "rgba(212,168,67,0.06)",
                    borderRadius: rd.md,
                    borderWidth: 1,
                    borderColor: isLight
                      ? "rgba(212,168,67,0.16)"
                      : "rgba(212,168,67,0.12)",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 10,
                        color: gold,
                        fontWeight: "700",
                        letterSpacing: 1.0,
                        textTransform: "uppercase",
                        marginBottom: 3,
                      }}
                    >
                      Parasha
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: colors.textPrimary,
                        letterSpacing: -0.2,
                      }}
                    >
                      {selectedParasha.name}
                    </Text>
                    {selectedParasha.hebrewName ? (
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 13,
                          color: gold,
                          marginTop: 2,
                          fontWeight: "500",
                        }}
                      >
                        {selectedParasha.hebrewName}
                      </Text>
                    ) : null}
                    <Text
                      allowFontScaling={false}
                      numberOfLines={2}
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                        marginTop: 4,
                        lineHeight: 15,
                      }}
                    >
                      {selectedParasha.book} · {selectedParasha.verses}
                    </Text>
                  </View>
                </View>
              )}

              {/* ── Prayer Times link ── */}
              <Pressable
                onPress={() => router.push("/(tabs)/zmanim" as any)}
                accessibilityRole="button"
                accessibilityLabel="View prayer times"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  marginTop: 4,
                  paddingVertical: 12,
                  borderRadius: rd.lg,
                  borderWidth: 1,
                  borderColor: isLight
                    ? "rgba(212,168,67,0.28)"
                    : colors.border,
                  backgroundColor: isLight
                    ? "rgba(212,168,67,0.05)"
                    : colors.card,
                }}
              >
                <Feather name="clock" size={14} color={gold} />
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: gold,
                    letterSpacing: 0.2,
                  }}
                >
                  View Prayer Times
                </Text>
                <Feather name="chevron-right" size={13} color={gold} />
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Zmanim Screen — MEP-102 Sacred Time Dashboard
 *
 * Visual redesign only. All calculations via calculateZmanim() are unchanged.
 *
 * New sections:
 *   1. Current Sacred Moment — live countdown hero
 *   2. Day Progress         — horizontal timeline
 *   3. Today's Times        — grouped Morning / Midday / Afternoon / Evening
 *   4. Next Event           — highlighted action card + remind button
 *   5. Calculation Method   — GRA / Vilna Gaon note (redesigned)
 *   6. Week Ahead           — premium upsell card
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEntrance } from "@/src/mobile/lib/useEntrance";
import { usePressScale } from "@/src/mobile/lib/usePressScale";
import { useThemeTokens } from "@/src/mobile/design-system";
import { SectionTitle } from "@/src/mobile/components/display";
import { useApp } from "@/context/AppContext";
import { calculateZmanim, formatTime } from "@/lib/zmanim";
import { getHebrewDate, formatHebrewDate } from "@/lib/hebrewCalendar";

// ─── Static assets ─────────────────────────────────────────────────────────────

const BG_IMAGE = require("../../assets/images/saipikhup-photo.jpg");

/* Hebrew day-number glyphs (days 1–30) */
const HEBREW_DAY: Record<number, string> = {
   1:"א",  2:"ב",  3:"ג",  4:"ד",  5:"ה",
   6:"ו",  7:"ז",  8:"ח",  9:"ט", 10:"י",
  11:"יא", 12:"יב", 13:"יג", 14:"יד", 15:"טו",
  16:"טז", 17:"יז", 18:"יח", 19:"יט", 20:"כ",
  21:"כא", 22:"כב", 23:"כג", 24:"כד", 25:"כה",
  26:"כו", 27:"כז", 28:"כח", 29:"כט", 30:"ל",
};

// ─── Type aliases ──────────────────────────────────────────────────────────────

type Zmanim    = ReturnType<typeof calculateZmanim>;
type ZmanimKey = keyof Zmanim;

// ─── Timeline milestones (Section 2) ──────────────────────────────────────────

const TIMELINE: { key: ZmanimKey; label: string }[] = [
  { key: "alotHaShachar", label: "Alot"    },
  { key: "sunrise",        label: "Sunrise" },
  { key: "chatzot",        label: "Chatzot" },
  { key: "minchaKetana",  label: "Mincha"  },
  { key: "sunset",         label: "Sunset"  },
  { key: "tzais",          label: "Tzais"   },
];

// ─── Grouped zmanim (Section 3) ───────────────────────────────────────────────

const TIME_GROUPS: { label: string; emoji: string; keys: ZmanimKey[] }[] = [
  { label: "Morning",   emoji: "🌅", keys: ["alotHaShachar", "sunrise", "latestShema", "latestShacharit"] },
  { label: "Midday",    emoji: "☀️", keys: ["chatzot"] },
  { label: "Afternoon", emoji: "🌤",  keys: ["minchaGedolah", "minchaKetana", "plagHamincha"] },
  { label: "Evening",   emoji: "🌇", keys: ["sunset", "candleLighting", "havdalah", "tzais"] },
];

const ZMAN_META: Record<string, { label: string; sub: string }> = {
  alotHaShachar:   { label: "Alot HaShachar",  sub: "Dawn · 72 min before sunrise"         },
  sunrise:          { label: "Sunrise",          sub: "Hanetz HaChama"                        },
  latestShema:      { label: "Latest Shema",     sub: "Sof Zman Kriat Shema (GRA)"            },
  latestShacharit:  { label: "Latest Shacharit", sub: "Sof Zman Tefillah (GRA)"              },
  chatzot:          { label: "Chatzot",          sub: "Halachic noon"                         },
  minchaGedolah:    { label: "Mincha Gedolah",   sub: "Earliest Mincha · ½h after Chatzot"   },
  minchaKetana:     { label: "Mincha Ketana",    sub: "Preferred Mincha time"                 },
  plagHamincha:     { label: "Plag HaMincha",    sub: "1¼ shaot before nightfall"             },
  sunset:           { label: "Sunset",           sub: "Shkiah"                                },
  candleLighting:   { label: "Candle Lighting",  sub: "Erev Shabbat"                          },
  havdalah:         { label: "Havdalah",         sub: "End of Shabbat · 42 min after sunset"  },
  tzais:            { label: "Tzais HaKochavim", sub: "Nightfall · 42 min after sunset"       },
};

// ─── Pure helpers (no new calculations) ───────────────────────────────────────

interface NextZman { key: string; name: string; time: Date }

function getNextZman(zmanim: Zmanim, now: Date): NextZman | null {
  const candidates: { key: string; name: string; time: Date | null }[] = [
    { key: "alotHaShachar",  name: "Alot HaShachar",  time: zmanim.alotHaShachar  },
    { key: "sunrise",         name: "Sunrise",          time: zmanim.sunrise         },
    { key: "latestShema",     name: "Latest Shema",     time: zmanim.latestShema     },
    { key: "latestShacharit", name: "Latest Shacharit", time: zmanim.latestShacharit },
    { key: "chatzot",         name: "Chatzot",          time: zmanim.chatzot         },
    { key: "minchaGedolah",   name: "Mincha Gedolah",   time: zmanim.minchaGedolah   },
    { key: "minchaKetana",    name: "Mincha Ketana",    time: zmanim.minchaKetana    },
    { key: "plagHamincha",    name: "Plag HaMincha",    time: zmanim.plagHamincha    },
    { key: "candleLighting",  name: "Candle Lighting",  time: zmanim.candleLighting  },
    { key: "sunset",          name: "Sunset",           time: zmanim.sunset          },
    { key: "havdalah",        name: "Havdalah",         time: zmanim.havdalah        },
    { key: "tzais",           name: "Tzais HaKochavim", time: zmanim.tzais           },
  ];
  const upcoming = candidates
    .filter(c => c.time instanceof Date && c.time > now)
    .sort((a, b) => a.time!.getTime() - b.time!.getTime());
  if (!upcoming.length) return null;
  return { key: upcoming[0].key, name: upcoming[0].name, time: upcoming[0].time! };
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getCurrentPeriodLabel(zmanim: Zmanim, now: Date): string {
  const t     = now.getTime();
  const alot  = zmanim.alotHaShachar?.getTime()  ?? 0;
  const rise  = zmanim.sunrise?.getTime()          ?? 0;
  const shema = zmanim.latestShema?.getTime()      ?? 0;
  const chatz = zmanim.chatzot?.getTime()          ?? 0;
  const mink  = zmanim.minchaKetana?.getTime()     ?? 0;
  const set   = zmanim.sunset?.getTime()           ?? 0;
  const tz    = zmanim.tzais?.getTime()            ?? 0;
  if (t < alot)  return "Night";
  if (t < rise)  return "Dawn · Alot HaShachar";
  if (t < shema) return "Shema Time";
  if (t < chatz) return "Morning";
  if (t < mink)  return "Afternoon";
  if (t < set)   return "Mincha Time";
  if (t < tz)    return "Bein HaShmashos";
  return "Night";
}

// ─── RemindBtn ─────────────────────────────────────────────────────────────────
// Schedules an expo push notification 10 minutes before the zman.
// Uses the existing expo-notifications infrastructure unchanged.

interface RemindBtnProps { zmanName: string; time: Date | null; tz: string; gold: string }

function RemindBtn({ zmanName, time, tz, gold }: RemindBtnProps) {
  const [state, setState] = useState<"idle" | "set" | "denied">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPress = useCallback(async () => {
    if (!time || time <= new Date()) return;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        setState("denied");
        timerRef.current = setTimeout(() => setState("idle"), 2500);
        return;
      }
      const fireAt = new Date(time.getTime() - 10 * 60 * 1000);
      if (fireAt <= new Date()) return;
      const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: tz });
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${zmanName} in 10 minutes`,
          body:  `${zmanName} is at ${timeStr}. Time to prepare!`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
        },
      });
      setState("set");
      timerRef.current = setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("denied");
      timerRef.current = setTimeout(() => setState("idle"), 2500);
    }
  }, [time, zmanName, tz]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (!time || time <= new Date() || Platform.OS === "web") return null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Set reminder for ${zmanName}`}
      style={{
        width: 30, height: 30, borderRadius: 15,
        alignItems: "center", justifyContent: "center",
        backgroundColor: state === "set" ? gold + "20" : "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: state === "set" ? gold + "55" : "rgba(255,255,255,0.14)",
      }}
    >
      <Text style={{ fontSize: 13 }}>
        {state === "denied" ? "🔕" : "🔔"}
      </Text>
    </Pressable>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function ZmanimScreen() {
  const { colors, sp, rd, shadow } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { location } = useApp();

  const [offset, setOffset]   = useState(0);
  const [now,    setNow]      = useState(() => new Date());

  /* Live clock — ticks every second so countdown stays accurate */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* Selected date */
  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [offset]);

  /* Zmanim for the selected date — calculateZmanim() untouched */
  const zmanim = useMemo(
    () => calculateZmanim(selectedDate, location.lat, location.lng, location.candleLightingMinutes),
    [selectedDate, location],
  );

  const hdate    = useMemo(() => getHebrewDate(selectedDate), [selectedDate]);
  const isFriday  = selectedDate.getDay() === 5;
  const isShabbat = selectedDate.getDay() === 6;
  const isToday   = offset === 0;

  /* Next zman + countdown (today only) */
  const nextZman = useMemo(
    () => (isToday ? getNextZman(zmanim, now) : null),
    [zmanim, now, isToday],
  );
  const msUntilNext = useMemo(
    () => (nextZman ? Math.max(0, nextZman.time.getTime() - now.getTime()) : null),
    [nextZman, now],
  );

  /* Current halachic period */
  const currentPeriod = useMemo(
    () => (isToday ? getCurrentPeriodLabel(zmanim, now) : ""),
    [zmanim, now, isToday],
  );

  /* Hebrew date parts */
  const hebrewDateStr   = formatHebrewDate(hdate);
  const hdateParts      = hebrewDateStr.split(" ");
  const hebrewDayNum    = parseInt(hdateParts[0], 10);
  const hebrewGlyph     = HEBREW_DAY[hebrewDayNum] ?? hdateParts[0];
  const hebrewMonthYear = hdateParts.slice(1).join(" ");

  /* Gregorian date strings */
  const weekdayStr = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const gregStr    = selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  /* Shaah Zmanit */
  const shaahMin = Math.floor(zmanim.shaahZmanitGra);
  const shaahSec = Math.round((zmanim.shaahZmanitGra % 1) * 60);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);
  const gold   = colors.accentGold;
  const mx     = sp[4];

  /* Press scale hooks */
  const { scale: prevSc,   onPressIn: prevIn,   onPressOut: prevOut   } = usePressScale(0.88);
  const { scale: nextSc,   onPressIn: nextIn,   onPressOut: nextOut   } = usePressScale(0.88);
  const { scale: todaySc,  onPressIn: todayIn,  onPressOut: todayOut  } = usePressScale(0.92);

  /* Entrance animations — 60 ms stagger per section */
  const s0 = useEntrance(0);
  const s1 = useEntrance(60);
  const s2 = useEntrance(120);
  const s3 = useEntrance(180);
  const s4 = useEntrance(240);
  const s5 = useEntrance(300);

  /* Shared card base style */
  const cardBase = {
    backgroundColor: colors.card,
    borderRadius:    rd.lg,
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     colors.border,
    ...shadow.level1,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: insets.bottom + 110 }}
      >

        {/* ══════════════════════════════════════════════════════
            SECTION 1 — CURRENT SACRED MOMENT
            Hero card: countdown, current period, Hebrew date
            ══════════════════════════════════════════════════════ */}
        <Animated.View style={[s0, { marginHorizontal: mx, marginBottom: sp[4] }]}>
          <LinearGradient
            colors={["#1A1208", "#100D04", "#0D0B03"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: rd.xl,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: gold + "28",
              ...shadow.level3,
            }}
          >
            {/* Ambient light orb */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute", top: -50, right: -30,
                width: 180, height: 180, borderRadius: 90,
                backgroundColor: gold + "09",
              }}
            />

            {/* ── Navigation row ── */}
            <View style={{
              flexDirection: "row", alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: sp[5], paddingTop: sp[5], paddingBottom: sp[3],
            }}>
              <View style={{
                borderRadius: rd.pill, borderWidth: 1,
                borderColor: gold + "55", backgroundColor: gold + "18",
                paddingHorizontal: sp[3], paddingVertical: sp[0.5],
              }}>
                <Text allowFontScaling={false} style={{ fontSize: 10, fontWeight: "700", color: gold, letterSpacing: 1.8 }}>
                  {isToday ? "TODAY" : offset < 0 ? `${Math.abs(offset)}D AGO` : `+${offset}D`}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: sp[2] }}>
                <Pressable
                  onPress={() => setOffset(o => o - 1)}
                  onPressIn={prevIn} onPressOut={prevOut}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button" accessibilityLabel="Previous day"
                  style={styles.navBtn}
                >
                  <Animated.View style={{ transform: [{ scale: prevSc }] }}>
                    <Feather name="chevron-left" size={14} color="rgba(255,255,255,0.72)" />
                  </Animated.View>
                </Pressable>
                <Pressable
                  onPress={() => setOffset(o => o + 1)}
                  onPressIn={nextIn} onPressOut={nextOut}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button" accessibilityLabel="Next day"
                  style={styles.navBtn}
                >
                  <Animated.View style={{ transform: [{ scale: nextSc }] }}>
                    <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.72)" />
                  </Animated.View>
                </Pressable>
              </View>
            </View>

            {/* ── Overline ── */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2], paddingHorizontal: sp[5] }}>
              <View style={{ width: 18, height: 1.5, borderRadius: 2, backgroundColor: gold, opacity: 0.75 }} />
              <Text allowFontScaling={false} style={{ fontSize: 10, fontWeight: "700", color: gold, letterSpacing: 2.8 }}>
                SACRED TIME
              </Text>
              <View style={{ width: 18, height: 1.5, borderRadius: 2, backgroundColor: gold, opacity: 0.75 }} />
            </View>

            {/* ── Current period ── */}
            {isToday && !!currentPeriod && (
              <Text allowFontScaling={false} style={{
                fontSize: 14, fontWeight: "500",
                color: "rgba(245,237,212,0.65)",
                paddingHorizontal: sp[5], marginTop: sp[1.5],
                letterSpacing: 0.2,
              }}>
                {currentPeriod}
              </Text>
            )}

            {/* ── Countdown ── */}
            {isToday && msUntilNext !== null ? (
              <>
                <Text allowFontScaling={false} style={{
                  fontSize: 50, fontWeight: "800",
                  color: "#F5EDD4",
                  paddingHorizontal: sp[5], marginTop: sp[2],
                  letterSpacing: -1.5, lineHeight: 56,
                }}>
                  {formatCountdown(msUntilNext)}
                </Text>
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: sp[1.5],
                  paddingHorizontal: sp[5], marginTop: sp[1.5],
                }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: gold }} />
                  <Text allowFontScaling={false} style={{ fontSize: 13, fontWeight: "600", color: gold }}>
                    {nextZman!.name}
                  </Text>
                  <Text allowFontScaling={false} style={{ fontSize: 13, color: "rgba(200,184,120,0.65)" }}>
                    · {formatTime(nextZman!.time, location.tz)}
                  </Text>
                </View>
              </>
            ) : isToday ? (
              <Text allowFontScaling={false} style={{
                fontSize: 14, color: "rgba(200,184,120,0.65)",
                paddingHorizontal: sp[5], marginTop: sp[3],
                fontStyle: "italic",
              }}>
                All Zmanim for today have passed.
              </Text>
            ) : null}

            {/* ── Date summary ── */}
            <View style={{ paddingHorizontal: sp[5], marginTop: sp[4], paddingBottom: sp[5] }}>
              <Text allowFontScaling={false} style={{
                fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.3,
              }}>
                {gregStr}
              </Text>
              <Text allowFontScaling={false} style={{ fontSize: 13, color: gold + "CC", marginTop: 3 }}>
                {hebrewDateStr}
              </Text>
              <Text allowFontScaling={false} style={{
                fontSize: 11, color: "rgba(200,184,120,0.55)", marginTop: 2, letterSpacing: 0.3,
              }}>
                {location.name}
              </Text>

              {/* Return to today */}
              {!isToday && (
                <Pressable
                  onPress={() => setOffset(0)}
                  onPressIn={todayIn} onPressOut={todayOut}
                  accessibilityRole="button" accessibilityLabel="Return to today"
                  style={{ marginTop: sp[4], alignSelf: "flex-start" }}
                >
                  <Animated.View style={{
                    transform: [{ scale: todaySc }],
                    flexDirection: "row", alignItems: "center", gap: sp[1.5],
                    borderWidth: 1, borderColor: gold + "55", borderRadius: rd.pill,
                    backgroundColor: gold + "18",
                    paddingHorizontal: sp[3], paddingVertical: sp[1.5],
                  }}>
                    <Feather name="calendar" size={11} color={gold} />
                    <Text allowFontScaling={false} style={{ fontSize: 12, fontWeight: "600", color: gold }}>
                      Return to Today
                    </Text>
                  </Animated.View>
                </Pressable>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ══════════════════════════════════════════════════════
            SECTION 2 — DAY PROGRESS
            Horizontal timeline: past · current · upcoming
            ══════════════════════════════════════════════════════ */}
        <Animated.View style={[s1, { marginHorizontal: mx, marginBottom: sp[4] }]}>
          <SectionTitle eyebrow="DAY PROGRESS" style={{ marginBottom: sp[3] }} />
          <View style={[cardBase, { padding: sp[5], paddingBottom: sp[4] }]}>
            {(() => {
              const milestones = TIMELINE
                .map(m => ({ ...m, time: zmanim[m.key] as Date | null }))
                .filter(m => m.time instanceof Date);

              const nowT = isToday ? now.getTime() : 0;

              return (
                <>
                  {/* Dots + connecting bars */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: sp[3] }}>
                    {milestones.map((m, i) => {
                      const mT   = m.time!.getTime();
                      const past = isToday && mT < nowT;
                      const isNextMilestone = isToday && !past &&
                        milestones.findIndex(x => x.time!.getTime() > nowT) === i;
                      const last = i === milestones.length - 1;

                      return (
                        <React.Fragment key={m.key}>
                          <View style={{ alignItems: "center" }}>
                            {isNextMilestone ? (
                              /* Next milestone — gold pulsing ring */
                              <View style={{
                                width: 14, height: 14, borderRadius: 7,
                                backgroundColor: gold,
                                ...shadow.level2,
                              }} />
                            ) : (
                              <View style={{
                                width: 10, height: 10, borderRadius: 5,
                                backgroundColor: past ? gold + "99" : "transparent",
                                borderWidth: past ? 0 : 1.5,
                                borderColor: past ? "transparent" : "rgba(255,255,255,0.18)",
                              }} />
                            )}
                          </View>
                          {!last && (
                            <View style={{
                              flex: 1, height: 1.5,
                              backgroundColor: past ? gold + "60" : "rgba(255,255,255,0.08)",
                            }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </View>

                  {/* Labels + times */}
                  <View style={{ flexDirection: "row" }}>
                    {milestones.map((m, i) => {
                      const mT   = m.time!.getTime();
                      const past = isToday && mT < nowT;
                      const isNextMilestone = isToday && !past &&
                        milestones.findIndex(x => x.time!.getTime() > nowT) === i;
                      const last = i === milestones.length - 1;
                      const align: "flex-start" | "center" | "flex-end" =
                        i === 0 ? "flex-start" : last ? "flex-end" : "center";

                      return (
                        <View key={m.key} style={{ flex: last ? 0 : 1, alignItems: align }}>
                          <Text allowFontScaling={false} style={{
                            fontSize: 9, letterSpacing: 0.3,
                            fontWeight: isNextMilestone ? "700" : "500",
                            color: isNextMilestone ? gold
                              : past ? gold + "80"
                              : "rgba(255,255,255,0.32)",
                          }}>
                            {m.label}
                          </Text>
                          <Text allowFontScaling={false} style={{
                            fontSize: 8.5, marginTop: 1,
                            color: isNextMilestone ? gold + "CC"
                              : past ? "rgba(255,255,255,0.28)"
                              : "rgba(255,255,255,0.22)",
                          }}>
                            {formatTime(m.time, location.tz)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              );
            })()}
          </View>
        </Animated.View>

        {/* ══════════════════════════════════════════════════════
            SECTION 3 — TODAY'S TIMES (grouped)
            Morning · Midday · Afternoon · Evening
            ══════════════════════════════════════════════════════ */}
        <Animated.View style={[s2, { marginHorizontal: mx, marginBottom: sp[4] }]}>
          <SectionTitle eyebrow="TODAY'S TIMES" style={{ marginBottom: sp[3] }} />

          {TIME_GROUPS.map(group => {
            const visibleKeys = group.keys.filter(k => {
              if (k === "candleLighting") return isFriday;
              if (k === "havdalah")       return isShabbat;
              return true;
            });
            if (!visibleKeys.length) return null;

            return (
              <View key={group.label} style={{ marginBottom: sp[3] }}>
                {/* Group header */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: sp[1.5], marginBottom: sp[2] }}>
                  <Text style={{ fontSize: 13 }}>{group.emoji}</Text>
                  <Text allowFontScaling={false} style={{
                    fontSize: 11, fontWeight: "700",
                    color: colors.textMuted, letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}>
                    {group.label}
                  </Text>
                </View>

                <View style={[cardBase, { overflow: "hidden" }]}>
                  {visibleKeys.map((key, idx) => {
                    const time = zmanim[key] as Date | null;
                    const meta = ZMAN_META[key];
                    if (!meta) return null;

                    const isPast = isToday && time instanceof Date && time < now;
                    const isNext = isToday && nextZman?.key === key;
                    const isLast = idx === visibleKeys.length - 1;

                    return (
                      <View key={String(key)}>
                        <View style={{
                          flexDirection: "row", alignItems: "center",
                          paddingHorizontal: sp[4], paddingVertical: sp[3],
                          backgroundColor: isNext ? gold + "0C" : "transparent",
                        }}>
                          {/* Left accent stripe on next zman */}
                          {isNext && (
                            <View style={{
                              position: "absolute", left: 0, top: 0, bottom: 0,
                              width: 3, backgroundColor: gold,
                              borderTopLeftRadius:    idx === 0 ? rd.lg : 0,
                              borderBottomLeftRadius: isLast ? rd.lg : 0,
                            }} />
                          )}

                          <View style={{ flex: 1 }}>
                            <Text allowFontScaling={false} style={{
                              fontSize: 14, fontWeight: "600", letterSpacing: -0.1,
                              color: isNext ? gold
                                : isPast ? colors.textMuted
                                : colors.textPrimary,
                            }}>
                              {meta.label}
                            </Text>
                            <Text allowFontScaling={false} style={{
                              fontSize: 11, marginTop: 1, letterSpacing: 0.1,
                              color: colors.textMuted,
                            }}>
                              {meta.sub}
                            </Text>
                          </View>

                          <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2] }}>
                            {isToday && (
                              <RemindBtn
                                zmanName={meta.label}
                                time={time}
                                tz={location.tz}
                                gold={gold}
                              />
                            )}
                            <Text allowFontScaling={false} style={{
                              fontSize: 16, fontWeight: "700", letterSpacing: -0.3,
                              minWidth: 52, textAlign: "right",
                              color: isNext ? gold
                                : isPast ? colors.textMuted
                                : colors.textPrimary,
                            }}>
                              {formatTime(time, location.tz)}
                            </Text>
                          </View>
                        </View>

                        {!isLast && (
                          <View style={{
                            height: StyleSheet.hairlineWidth,
                            backgroundColor: colors.border,
                            marginLeft: sp[4],
                          }} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* ══════════════════════════════════════════════════════
            SECTION 4 — NEXT EVENT
            Highlighted card, countdown, remind button
            ══════════════════════════════════════════════════════ */}
        {isToday && nextZman && msUntilNext !== null && (
          <Animated.View style={[s3, { marginHorizontal: mx, marginBottom: sp[4] }]}>
            <SectionTitle eyebrow="NEXT EVENT" style={{ marginBottom: sp[3] }} />
            <LinearGradient
              colors={[gold + "1A", gold + "08"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: rd.lg,
                borderWidth: 1,
                borderColor: gold + "38",
                padding: sp[5],
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                ...shadow.level2,
              }}
            >
              <View style={{ flex: 1, paddingRight: sp[4] }}>
                <Text allowFontScaling={false} style={{
                  fontSize: 10, fontWeight: "700", color: gold,
                  letterSpacing: 1.6, textTransform: "uppercase", marginBottom: sp[1],
                }}>
                  NEXT ZMAN
                </Text>
                <Text allowFontScaling={false} style={{
                  fontSize: 19, fontWeight: "700",
                  color: colors.textPrimary, letterSpacing: -0.3,
                }}>
                  {nextZman.name}
                </Text>
                <Text allowFontScaling={false} style={{
                  fontSize: 12, color: colors.textMuted, marginTop: 2,
                }}>
                  at {formatTime(nextZman.time, location.tz)}
                </Text>
                {Platform.OS !== "web" && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2], marginTop: sp[3] }}>
                    <RemindBtn zmanName={nextZman.name} time={nextZman.time} tz={location.tz} gold={gold} />
                    <Text allowFontScaling={false} style={{ fontSize: 11, color: colors.textMuted }}>
                      Remind me · 10 min before
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text allowFontScaling={false} style={{
                  fontSize: 10, fontWeight: "600",
                  color: colors.textMuted, letterSpacing: 0.8, marginBottom: sp[1],
                }}>
                  IN
                </Text>
                <Text allowFontScaling={false} style={{
                  fontSize: 30, fontWeight: "800", color: gold,
                  letterSpacing: -0.8, lineHeight: 34,
                }}>
                  {formatCountdown(msUntilNext)}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* ══════════════════════════════════════════════════════
            DATE CARD — photo background (existing design, kept)
            ══════════════════════════════════════════════════════ */}
        <Animated.View style={[s3, { marginHorizontal: mx, marginBottom: sp[4] }]}>
          <SectionTitle eyebrow="DATE" style={{ marginBottom: sp[3] }} />
          <View style={[{ borderRadius: rd.lg, overflow: "hidden" }, shadow.level2]}>
            <ImageBackground
              source={BG_IMAGE}
              style={{ width: "100%" }}
              imageStyle={{ borderRadius: rd.lg }}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            >
              <LinearGradient
                colors={["rgba(10,8,3,0.40)", "rgba(8,6,2,0.80)", "rgba(5,4,1,0.96)"]}
                locations={[0, 0.55, 1]}
                style={{
                  paddingTop: sp[4], paddingHorizontal: sp[5],
                  paddingBottom: sp[5], borderRadius: rd.lg,
                }}
              >
                <Text style={styles.hebrewGlyph}>{hebrewGlyph}</Text>
                <Text style={styles.hebrewMonthYear}>{hebrewMonthYear}</Text>
                <Text style={styles.dateSubtitle} numberOfLines={1}>
                  {weekdayStr}  ·  {gregStr}  ·  {location.name}
                </Text>

                {/* Sunrise · Midday · Sunset chips */}
                <View style={{ flexDirection: "row", gap: sp[2] }}>
                  {[
                    { label: "SUNRISE", time: formatTime(zmanim.sunrise, location.tz) },
                    { label: "MIDDAY",  time: formatTime(zmanim.chatzot, location.tz) },
                    { label: "SUNSET",  time: formatTime(zmanim.sunset,  location.tz) },
                  ].map(({ label, time }) => (
                    <View key={label} style={[styles.statChip, { borderColor: gold + "40", backgroundColor: "rgba(20,15,4,0.72)" }]}>
                      <Text allowFontScaling={false} style={{ fontSize: 8.5, fontWeight: "700", color: gold, letterSpacing: 1.4 }}>
                        {label}
                      </Text>
                      <Text allowFontScaling={false} style={{ fontSize: 13, fontWeight: "700", color: "#fff", letterSpacing: -0.3 }}>
                        {time}
                      </Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        </Animated.View>

        {/* ══════════════════════════════════════════════════════
            SECTION 5 — CALCULATION METHOD
            Shaah Zmanit + GRA explanation (redesigned)
            ══════════════════════════════════════════════════════ */}
        <Animated.View style={[s4, { marginHorizontal: mx, marginBottom: sp[4] }]}>
          <SectionTitle eyebrow="CALCULATION METHOD" style={{ marginBottom: sp[3] }} />

          {/* Shaah Zmanit card */}
          <View style={[cardBase, {
            flexDirection: "row", alignItems: "center",
            justifyContent: "space-between",
            padding: sp[4], marginBottom: sp[3], overflow: "hidden",
          }]}>
            <View style={[styles.accentBar, { backgroundColor: gold }]} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: sp[3], paddingLeft: sp[1.5] }}>
              <View style={{
                width: 38, height: 38, borderRadius: rd.sm,
                backgroundColor: gold + "18", alignItems: "center", justifyContent: "center",
              }}>
                <Feather name="clock" size={18} color={gold} />
              </View>
              <View>
                <Text allowFontScaling={false} style={{ fontSize: 13, fontWeight: "600", color: colors.textPrimary, letterSpacing: -0.1 }}>
                  Shaah Zmanit (GRA)
                </Text>
                <Text allowFontScaling={false} style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                  Proportional halachic hour
                </Text>
              </View>
            </View>
            <Text allowFontScaling={false} style={{ fontSize: 18, fontWeight: "700", color: gold, letterSpacing: -0.3 }}>
              {shaahMin}m {shaahSec}s
            </Text>
          </View>

          {/* GRA method note */}
          <View style={{
            padding: sp[4],
            backgroundColor: gold + "09",
            borderRadius: rd.md,
            borderWidth: 1,
            borderColor: gold + "22",
          }}>
            <Text allowFontScaling={false} style={{
              fontSize: 12, fontWeight: "700", color: gold, marginBottom: sp[1.5], letterSpacing: 0.1,
            }}>
              Gra · Vilna Gaon
            </Text>
            <Text allowFontScaling={false} style={{
              fontSize: 12, color: colors.textMuted, lineHeight: 18, letterSpacing: 0.1,
            }}>
              Halachic day runs from Hanetz HaChama (sunrise) to Shkiah (sunset).
              Alot HaShachar = 72 min before sunrise. Tzais = 42 min after sunset.
              Candle lighting: {location.candleLightingMinutes} min before sunset for {location.name}.
            </Text>
          </View>
        </Animated.View>

        {/* ══════════════════════════════════════════════════════
            SECTION 6 — WEEK AHEAD (Premium)
            Apple-subscription-style premium card
            ══════════════════════════════════════════════════════ */}
        <Animated.View style={[s5, { marginHorizontal: mx, marginBottom: sp[4] }]}>
          <SectionTitle eyebrow="WEEK AHEAD" style={{ marginBottom: sp[3] }} />
          <LinearGradient
            colors={[gold + "14", gold + "07"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: rd.lg,
              borderWidth: 1,
              borderColor: gold + "30",
              overflow: "hidden",
              ...shadow.level1,
            }}
          >
            {/* Card header */}
            <View style={{
              flexDirection: "row", alignItems: "center", gap: sp[3],
              padding: sp[4],
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: gold + "25",
            }}>
              <View style={{
                width: 42, height: 42, borderRadius: rd.md,
                backgroundColor: gold + "18", borderWidth: 1, borderColor: gold + "30",
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontSize: 20 }}>📅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} style={{ fontSize: 14, fontWeight: "700", color: gold, letterSpacing: 0.1 }}>
                  Week Ahead Zmanim
                </Text>
                <Text allowFontScaling={false} style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                  Sunrise · Sunset · Candle lighting
                </Text>
              </View>
              <View style={{
                backgroundColor: gold,
                borderRadius: rd.pill,
                paddingHorizontal: sp[3], paddingVertical: sp[1],
              }}>
                <Text allowFontScaling={false} style={{ fontSize: 10, fontWeight: "800", color: "#1a0900", letterSpacing: 0.3 }}>
                  👑 PREMIUM
                </Text>
              </View>
            </View>

            {/* Preview rows — today is visible, rest dimmed */}
            {Array.from({ length: 4 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() + i);
              const z        = calculateZmanim(d, location.lat, location.lng, location.candleLightingMinutes);
              const dayLabel = i === 0 ? "Today" : i === 1 ? "Tomorrow"
                : d.toLocaleDateString("en-US", { weekday: "short" });
              const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const dIsSat   = d.getDay() === 6;
              const dIsFri   = d.getDay() === 5;

              return (
                <View key={i} style={{
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: sp[4], paddingVertical: sp[2.5],
                  borderBottomWidth: i < 3 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: gold + "15",
                  opacity: i === 0 ? 1 : 0.4,
                }}>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={{
                      fontSize: 13, fontWeight: i === 0 ? "700" : "500",
                      color: dIsSat ? colors.error : colors.textPrimary,
                    }}>
                      {dayLabel}{dIsFri ? "  🕯" : dIsSat ? "  Shabbat" : ""}
                    </Text>
                    <Text allowFontScaling={false} style={{ fontSize: 11, color: colors.textMuted }}>
                      {dateLabel}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: sp[4] }}>
                    <View style={{ alignItems: "center" }}>
                      <Text allowFontScaling={false} style={{ fontSize: 8, color: gold, fontWeight: "700", letterSpacing: 1, marginBottom: 1 }}>RISE</Text>
                      <Text allowFontScaling={false} style={{ fontSize: 13, fontWeight: "700", color: gold }}>{formatTime(z.sunrise, location.tz)}</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text allowFontScaling={false} style={{ fontSize: 8, color: colors.textMuted, fontWeight: "700", letterSpacing: 1, marginBottom: 1 }}>SET</Text>
                      <Text allowFontScaling={false} style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>{formatTime(z.sunset, location.tz)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Upgrade CTA */}
            <View style={{ padding: sp[4], alignItems: "center" }}>
              <Text allowFontScaling={false} style={{ fontSize: 12, color: colors.textMuted, textAlign: "center" }}>
                Unlock the full 7-day view with Premium
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

// ─── StyleSheet ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /* Hero navigation button */
  navBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
  },

  /* Left accent bar on Shaah Zmanit card */
  accentBar: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    width: 3, borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
  },

  /* Photo card — Hebrew glyph */
  hebrewGlyph: {
    fontSize: 56,
    fontWeight: "700",
    color: "#F0E6C0",
    lineHeight: 62,
    letterSpacing: -1,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  /* Photo card — Hebrew month + year */
  hebrewMonthYear: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.4,
    marginTop: 4,
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* Photo card — Gregorian subtitle */
  dateSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(220,200,160,0.80)",
    letterSpacing: 0.3,
    marginBottom: 18,
  },

  /* Stat chips row in photo card */
  statChip: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    paddingVertical: 9, paddingHorizontal: 6,
    alignItems: "center", gap: 3,
  },
});

/**
 * ShabbatModeOverlay — full-screen Shabbat experience for mobile.
 *
 * Mirrors the web app's ShabbatMode.tsx component.
 * Shows automatically in three modes:
 *   "approaching" — 45 min before candle lighting on Friday
 *   "active"      — Shabbat is in progress (after candle lighting → before havdalah)
 *   "shavua_tov"  — 10 min after havdalah (auto-dismisses in 9 s)
 *
 * Dismiss state is keyed per-Shabbat-date so it resets each week.
 */

import React, {
  useState, useEffect, useCallback, useRef, useMemo,
} from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, Path, RadialGradient, Stop } from "react-native-svg";

// ─── Constants ───────────────────────────────────────────────────────────────

const APPROACH_WINDOW_MS   = 45 * 60 * 1000;   // 45 minutes
const SHAVUA_TOV_WINDOW_MS = 10 * 60 * 1000;   // 10 minutes
const STAR_COUNT           = 24;

type ModeType = "approaching" | "active" | "shavua_tov" | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeMode(
  isFriday: boolean,
  isShabbat: boolean,
  candleLighting: Date | null,
  havdalah: Date | null,
  now: number,
): ModeType {
  if (isFriday && candleLighting) {
    const msBefore = candleLighting.getTime() - now;
    if (msBefore > 0 && msBefore <= APPROACH_WINDOW_MS) return "approaching";
    if (msBefore <= 0) return "active";       // candle lighting passed on Friday
  }
  if (isShabbat && havdalah) {
    const msAfterHavdalah = now - havdalah.getTime();
    if (msAfterHavdalah >= 0 && msAfterHavdalah < SHAVUA_TOV_WINDOW_MS) return "shavua_tov";
    if (now < havdalah.getTime()) return "active";
  }
  return null;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

/** Date-scoped dismiss key — auto-resets each calendar week. */
function dismissKey(isFriday: boolean, isShabbat: boolean, now: number): string {
  const d = new Date(now);
  // Use the Friday date as the week anchor
  if (isShabbat) d.setDate(d.getDate() - 1);
  const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  return `menashe-shabbat-dismissed-${dateStr}`;
}

// ─── Star positions (deterministic, no randomness) ───────────────────────────

const { width: SW, height: SH } = Dimensions.get("window");
const STARS = Array.from({ length: STAR_COUNT }, (_, i) => ({
  left:  ((i * 37 + 11) % 100) / 100 * SW,
  top:   ((i * 53 + 7)  % 85)  / 100 * SH,
  size:  i % 6 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
  gold:  i % 8 === 0,
  dur:   1800 + (i % 5) * 500,
  delay: (i * 280) % 3000,
}));

// ─── Animated candle component ────────────────────────────────────────────────

function AnimatedCandle({ gradientId }: { gradientId: string }) {
  const scale  = useRef(new Animated.Value(1)).current;
  const transX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.93, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.07, duration: 180, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.97, duration: 220, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.04, duration: 190, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.00, duration: 200, useNativeDriver: true }),
      ]),
    );
    const moveAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(transX, { toValue:  1.5, duration: 220, useNativeDriver: true }),
        Animated.timing(transX, { toValue: -1.0, duration: 180, useNativeDriver: true }),
        Animated.timing(transX, { toValue:  0.8, duration: 200, useNativeDriver: true }),
        Animated.timing(transX, { toValue: -0.8, duration: 190, useNativeDriver: true }),
        Animated.timing(transX, { toValue:  0.0, duration: 210, useNativeDriver: true }),
      ]),
    );
    scaleAnim.start();
    moveAnim.start();
    return () => { scaleAnim.stop(); moveAnim.stop(); };
  }, [scale, transX]);

  return (
    <View style={s.candle}>
      {/* Flame */}
      <Animated.View style={{
        transform: [
          { scaleX: scale },
          { scaleY: scale },
          { translateX: transX },
        ],
        transformOrigin: "50% 100%",
      }}>
        {/* Outer glow */}
        <View style={{
          position: "absolute",
          width: 40, height: 40,
          borderRadius: 20,
          backgroundColor: "rgba(255,165,20,0.25)",
          top: -8, left: -8,
        }} />
        <Svg width={24} height={36} viewBox="0 0 24 36">
          <Defs>
            <RadialGradient id={gradientId} cx="50%" cy="75%" r="55%">
              <Stop offset="0%"   stopColor="#fffbd0" />
              <Stop offset="35%"  stopColor="#ffb020" />
              <Stop offset="100%" stopColor="#ff4400" stopOpacity={0.6} />
            </RadialGradient>
          </Defs>
          {/* Outer flame */}
          <Path
            d="M12 2C12 2 4 11 4 20C4 26 7.5 31 12 33C16.5 31 20 26 20 20C20 11 12 2 12 2Z"
            fill={`url(#${gradientId})`}
          />
          {/* Inner bright core */}
          <Path
            d="M12 14C12 14 8 18.5 8 22C8 25 9.8 28 12 29C14.2 28 16 25 16 22C16 18.5 12 14 12 14Z"
            fill="rgba(255,248,160,0.92)"
          />
        </Svg>
      </Animated.View>

      {/* Wick */}
      <View style={s.wick} />

      {/* Candle body */}
      <LinearGradient
        colors={["#f5edda", "#ece0c2", "#d5c8a8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.candleBody}
      >
        {/* Highlight streak */}
        <View style={s.candleHighlight} />
      </LinearGradient>

      {/* Candle base */}
      <LinearGradient
        colors={["#c9a227", "#9a7510"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={s.candleBase}
      />
    </View>
  );
}

// ─── Twinkling star ───────────────────────────────────────────────────────────

function TwinkleStar({ star }: { star: typeof STARS[0] }) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(star.delay),
        Animated.timing(opacity, { toValue: 1,    duration: star.dur / 2, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2,  duration: star.dur / 2, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity, star.delay, star.dur]);

  return (
    <Animated.View
      style={[s.star, {
        left:            star.left,
        top:             star.top,
        width:           star.size,
        height:          star.size,
        borderRadius:    star.size / 2,
        backgroundColor: star.gold ? "#e8d4a0" : "#ffffff",
        opacity,
      }]}
    />
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

interface Props {
  isFriday:       boolean;
  isShabbat:      boolean;
  candleLighting: Date | null;   // Today's candle lighting (Friday)
  havdalah:       Date | null;   // This Shabbat's havdalah (Saturday or after Friday candle lighting)
}

export default function ShabbatModeOverlay({
  isFriday, isShabbat, candleLighting, havdalah,
}: Props) {
  const [now, setNow]           = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady]       = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 1-second ticker
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const mode = useMemo(
    () => computeMode(isFriday, isShabbat, candleLighting, havdalah, now),
    [isFriday, isShabbat, candleLighting, havdalah, now],
  );

  // Load persisted dismiss state
  useEffect(() => {
    const key = dismissKey(isFriday, isShabbat, now);
    AsyncStorage.getItem(key).then(val => {
      setDismissed(val === "1");
      setReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const dismiss = useCallback(async () => {
    const key = dismissKey(isFriday, isShabbat, Date.now());
    await AsyncStorage.setItem(key, "1");
    setDismissed(true);
  }, [isFriday, isShabbat]);

  // Auto-dismiss Shavua Tov after 9 s
  useEffect(() => {
    if (mode === "shavua_tov") {
      const id = setTimeout(dismiss, 9000);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [mode, dismiss]);

  // Fade in when shown
  const isVisible = ready && !!mode && !dismissed;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:  isVisible ? 1 : 0,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [isVisible, fadeAnim]);

  if (!ready || !mode || dismissed) return null;

  const isApproaching = mode === "approaching";
  const isActive      = mode === "active";
  const isShavuaTov   = mode === "shavua_tov";

  let countdownMs    = 0;
  let countdownLabel = "";
  if (isApproaching && candleLighting) {
    countdownMs    = Math.max(0, candleLighting.getTime() - now);
    countdownLabel = "CANDLE LIGHTING IN";
  } else if ((isActive || isApproaching) && havdalah) {
    countdownMs    = Math.max(0, havdalah.getTime() - now);
    countdownLabel = "HAVDALAH IN";
  }

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={dismiss}
    >
      <Animated.View style={[s.root, { opacity: fadeAnim }]}>

        {/* Background gradient — deep cosmic night */}
        <LinearGradient
          colors={["#05040d", "#080614", "#040312"]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Twinkling stars */}
        {STARS.map((star, i) => <TwinkleStar key={i} star={star} />)}

        {/* Bottom vignette */}
        <LinearGradient
          colors={["transparent", "rgba(4,3,12,0.85)"]}
          style={s.vignette}
          pointerEvents="none"
        />

        {/* ── Shavua Tov mode ── */}
        {isShavuaTov && (
          <View style={s.content}>
            <Text style={s.bigEmoji}>✨</Text>
            <Text style={[s.hebrewTitle, { fontSize: 40 }]}>שָׁבוּעַ טוֹב</Text>
            <Text style={s.englishTitle}>Shavua Tov</Text>
            <Text style={s.subtitle}>A wonderful new week!</Text>
          </View>
        )}

        {/* ── Approaching / Active mode ── */}
        {!isShavuaTov && (
          <View style={s.content}>

            {/* Candles — only during active Shabbat */}
            {isActive && (
              <View style={s.candlesRow}>
                <AnimatedCandle gradientId="flame1" />
                <AnimatedCandle gradientId="flame2" />
              </View>
            )}

            {/* Candle emoji for approaching mode */}
            {isApproaching && (
              <Text style={[s.bigEmoji, { marginBottom: 20 }]}>🕯</Text>
            )}

            {/* Hebrew title — שַׁבָּת שָׁלוֹם */}
            <Text style={[s.hebrewTitle, { fontSize: isApproaching ? 42 : 54 }]}>
              שַׁבָּת שָׁלוֹם
            </Text>

            {/* English */}
            <Text style={[s.englishTitle, { fontSize: isApproaching ? 18 : 23 }]}>
              SHABBAT SHALOM
            </Text>

            {/* Subtitle / Turkmen */}
            <Text style={s.subtitle}>
              {isApproaching ? "Shabbat is approaching" : "Şabbat Şalom"}
            </Text>

            {/* Divider */}
            <View style={s.divider} />

            {/* Mode label */}
            <Text style={s.modeLabel}>
              {isApproaching ? "SHABBAT APPROACHING" : "SHABBAT IS IN PROGRESS"}
            </Text>

            {/* Live countdown */}
            {countdownMs > 0 && (
              <View style={{ alignItems: "center", marginBottom: 28 }}>
                <Text style={s.countdownLabel}>{countdownLabel}</Text>
                <Text style={s.countdown}>{formatCountdown(countdownMs)}</Text>
              </View>
            )}

            {/* Dismiss button */}
            <Pressable
              onPress={dismiss}
              accessibilityRole="button"
              accessibilityLabel="Continue in the spirit of Shabbat"
              style={({ pressed }) => [
                s.dismissBtn,
                pressed && { backgroundColor: "rgba(201,162,39,0.16)" },
              ]}
            >
              <Text style={s.dismissText}>· Continue in the spirit of Shabbat</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GOLD = "#c9a227";

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  vignette: {
    position:  "absolute",
    bottom:    0, left: 0, right: 0,
    height:    180,
  },
  star: {
    position: "absolute",
  },
  content: {
    position:   "relative",
    zIndex:     1,
    alignItems: "center",
    width:      "88%",
    maxWidth:   340,
  },
  bigEmoji: {
    fontSize:     64,
    lineHeight:   72,
    marginBottom: 14,
  },
  hebrewTitle: {
    fontWeight:    "800",
    color:         GOLD,
    letterSpacing: 2,
    textAlign:     "center",
    lineHeight:    1.2 * 54,
    marginBottom:  8,
    writingDirection: "rtl",
  },
  englishTitle: {
    fontWeight:    "700",
    color:         "rgba(255,255,255,0.92)",
    letterSpacing: 5,
    textAlign:     "center",
    textTransform: "uppercase",
    marginBottom:  6,
  },
  subtitle: {
    fontSize:    13,
    color:       "rgba(201,162,39,0.68)",
    textAlign:   "center",
    fontStyle:   "italic",
    marginBottom: 24,
  },
  divider: {
    width:           90,
    height:          1,
    backgroundColor: "rgba(201,162,39,0.35)",
    marginBottom:    22,
  },
  modeLabel: {
    fontSize:      11,
    fontWeight:    "700",
    letterSpacing: 2.5,
    color:         "rgba(201,162,39,0.65)",
    textTransform: "uppercase",
    marginBottom:  14,
  },
  countdownLabel: {
    fontSize:      10,
    color:         "rgba(255,255,255,0.38)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom:  8,
  },
  countdown: {
    fontSize:      38,
    fontWeight:    "700",
    color:         "#ffffff",
    letterSpacing: 3,
  },
  dismissBtn: {
    backgroundColor: "rgba(201,162,39,0.07)",
    borderWidth:     1,
    borderColor:     "rgba(201,162,39,0.25)",
    borderRadius:    24,
    paddingHorizontal: 24,
    paddingVertical:   11,
  },
  dismissText: {
    fontSize:      12,
    fontWeight:    "600",
    color:         "rgba(201,162,39,0.75)",
    letterSpacing: 0.8,
  },
  // Candle parts
  candlesRow: {
    flexDirection:  "row",
    gap:            40,
    marginBottom:   28,
    alignItems:     "flex-end",
  },
  candle: {
    alignItems: "center",
  },
  wick: {
    width:           2,
    height:          8,
    backgroundColor: "#6b5a3a",
    marginTop:       -3,
    borderRadius:    1,
  },
  candleBody: {
    width:        18,
    height:       72,
    borderRadius: 2,
    overflow:     "hidden",
  },
  candleHighlight: {
    position:        "absolute",
    top:             0, left: 4,
    width:           4, height: 10,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius:    4,
  },
  candleBase: {
    width:        24,
    height:       5,
    borderRadius: 4,
  },
});

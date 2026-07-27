import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Alert, Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useThemeTokens } from "@/src/mobile/design-system";
import { HDate } from "@hebcal/core";

import { useApp } from "@/context/AppContext";
import { calculateZmanim } from "@/lib/zmanim";
import { hebrewDayNumeral } from "@/lib/hebrewCalendar";
import { storageGet, storageSet } from "@/lib/storageUtils";

const STORAGE_KEY = "menashe-yahrzeit-entries-v1";

interface YahrzeitEntry {
  id: string;
  name: string;
  hebrewDay: number;
  hebrewMonth: number;
  hebrewYear: number;
  displayDate: string;
  wasAfterSunset: boolean;
}

interface CalcResult {
  hebrewDay: number;
  hebrewMonth: number;
  hebrewYear: number;
  hebrewMonthName: string;
  wasAfterSunset: boolean;
  sunsetStr: string;
  nextDate: Date | null;
  daysAway: number;
}

const HEBREW_MONTHS = [
  "Nisan", "Iyar", "Sivan", "Tammuz", "Av", "Elul",
  "Tishrei", "Cheshvan", "Kislev", "Tevet", "Shevat", "Adar", "Adar II",
];

function getNextYahrzeit(hebrewDay: number, hebrewMonth: number): { date: Date; daysAway: number; isToday: boolean } | null {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hYear = new HDate(today).getFullYear();
    for (let offset = 0; offset <= 2; offset++) {
      try {
        const yhDate = new HDate(hebrewDay, hebrewMonth, hYear + offset);
        const greg = yhDate.greg();
        greg.setHours(0, 0, 0, 0);
        if (greg >= today) {
          const daysAway = Math.round((greg.getTime() - today.getTime()) / 86400000);
          return { date: greg, daysAway, isToday: daysAway === 0 };
        }
      } catch {}
    }
  } catch {}
  return null;
}

function formatTime12(date: Date | null, tz: string): string {
  if (!date) return "--:--";
  try {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz });
  } catch {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }
}

export default function YahrzeitCalcScreen() {
  const { colors } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { location } = useApp();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  const [entries, setEntries] = useState<YahrzeitEntry[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);

  useEffect(() => {
    storageGet<YahrzeitEntry[]>(STORAGE_KEY, []).then(setEntries);
  }, []);

  function calculate() {
    if (!dateStr) return;
    try {
      const dateOfPassing = new Date(dateStr + "T12:00:00");
      const zmanim = calculateZmanim(dateOfPassing, location.lat, location.lng);
      const sunset = zmanim.sunset;

      let wasAfterSunset = false;
      let yahrzeitDate = new Date(dateOfPassing);

      if (!timeUnknown && timeStr && sunset) {
        const [h, m] = timeStr.split(":").map(Number);
        const deathTime = new Date(dateOfPassing);
        deathTime.setHours(h, m, 0, 0);
        if (deathTime > sunset) {
          wasAfterSunset = true;
          yahrzeitDate.setDate(yahrzeitDate.getDate() + 1);
        }
      }

      const hdate = new HDate(yahrzeitDate);
      const hebrewDay = hdate.getDate();
      const hebrewMonth = hdate.getMonth();
      const hebrewYear = hdate.getFullYear();
      const hebrewMonthName = HDate.getMonthName(hebrewMonth, hebrewYear);

      const next = getNextYahrzeit(hebrewDay, hebrewMonth);

      setResult({
        hebrewDay,
        hebrewMonth,
        hebrewYear,
        hebrewMonthName,
        wasAfterSunset,
        sunsetStr: formatTime12(sunset, location.tz),
        nextDate: next?.date ?? null,
        daysAway: next?.daysAway ?? 0,
      });
    } catch (e) {
      Alert.alert("Error", "Could not calculate. Please check the date.");
    }
  }

  async function saveEntry() {
    if (!result || !name.trim()) {
      Alert.alert("Required", "Please enter a name and calculate first.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const entry: YahrzeitEntry = {
      id: Date.now().toString(),
      name: name.trim(),
      hebrewDay: result.hebrewDay,
      hebrewMonth: result.hebrewMonth,
      hebrewYear: result.hebrewYear,
      displayDate: dateStr,
      wasAfterSunset: result.wasAfterSunset,
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    await storageSet(STORAGE_KEY, updated);
    setName(""); setDateStr(""); setTimeStr(""); setResult(null); setShowForm(false);
  }

  async function deleteEntry(id: string) {
    Alert.alert("Remove Entry", "Delete this yahrzeit?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          const updated = entries.filter(e => e.id !== id);
          setEntries(updated);
          await storageSet(STORAGE_KEY, updated);
        },
      },
    ]);
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
          <Text style={[styles.title, { color: colors.foreground }]}>Yahrzeit Calc</Text>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>Find the Hebrew anniversary date</Text>
        </View>
      </View>

      {/* Calculator Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Calculate Yahrzeit</Text>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>NAME OF DECEASED</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          placeholder="e.g. Avraham ben Moshe"
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>DATE OF PASSING (YYYY-MM-DD)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          placeholder="e.g. 1998-03-15"
          placeholderTextColor={colors.mutedForeground}
          value={dateStr}
          onChangeText={setDateStr}
          keyboardType="numbers-and-punctuation"
        />

        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.mutedForeground, flex: 1 }]}>TIME OF PASSING</Text>
          <View style={styles.row}>
            <Text style={[{ fontSize: 12, color: colors.mutedForeground }]}>Unknown</Text>
            <Switch
              value={timeUnknown}
              onValueChange={setTimeUnknown}
              trackColor={{ false: colors.border, true: colors.primary + "88" }}
              thumbColor={timeUnknown ? colors.primary : colors.mutedForeground}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>
        {!timeUnknown && (
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. 19:30 (24h format)"
            placeholderTextColor={colors.mutedForeground}
            value={timeStr}
            onChangeText={setTimeStr}
            keyboardType="numbers-and-punctuation"
          />
        )}

        <TouchableOpacity
          style={[styles.calcBtn, { backgroundColor: colors.primary, opacity: dateStr ? 1 : 0.5 }]}
          onPress={calculate}
          disabled={!dateStr}
        >
          <Text style={[styles.calcBtnText, { color: colors.primaryForeground }]}>Calculate</Text>
        </TouchableOpacity>

        {result && (
          <View style={[styles.resultBox, { backgroundColor: colors.background, borderColor: colors.primary + "44" }]}>
            <Text style={[styles.resultHebrew, { color: colors.primary }]}>
              {hebrewDayNumeral(result.hebrewDay)} {result.hebrewMonthName} {result.hebrewYear}
            </Text>
            {result.wasAfterSunset && (
              <Text style={[styles.resultNote, { color: colors.mutedForeground }]}>
                ⚠️ Death was after sunset ({result.sunsetStr}). Yahrzeit falls on the following Hebrew day.
              </Text>
            )}
            {result.nextDate && (
              <View style={[styles.nextCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.nextLabel, { color: colors.mutedForeground }]}>Next Anniversary</Text>
                <Text style={[styles.nextDate, { color: colors.foreground }]}>
                  {result.nextDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </Text>
                <Text style={[styles.nextDays, { color: colors.primary }]}>
                  {result.daysAway === 0 ? "🕯 Today is the yahrzeit" : `${result.daysAway} days away`}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.saveEntryBtn, { borderColor: colors.primary }]}
              onPress={saveEntry}
            >
              <Feather name="bookmark" size={15} color={colors.primary} />
              <Text style={[{ fontSize: 14, fontWeight: "700", color: colors.primary }]}>Save to My List</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Saved entries */}
      {entries.length > 0 && (
        <>
          <View style={{ paddingHorizontal: 16, marginBottom: 10, marginTop: 4 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Saved Yahrzeits</Text>
          </View>
          {entries.map(entry => {
            const next = getNextYahrzeit(entry.hebrewDay, entry.hebrewMonth);
            const hMonthName = HDate.getMonthName(entry.hebrewMonth, entry.hebrewYear);
            return (
              <TouchableOpacity
                key={entry.id}
                style={[styles.entryRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onLongPress={() => deleteEntry(entry.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.candleIcon, { backgroundColor: "#f472b620" }]}>
                  <Text style={{ fontSize: 20 }}>🕯</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.entryName, { color: colors.foreground }]}>{entry.name}</Text>
                  <Text style={[styles.entryHebrew, { color: colors.primary }]}>
                    {hebrewDayNumeral(entry.hebrewDay)} {hMonthName}
                  </Text>
                </View>
                {next && (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.entryDays, { color: next.isToday ? "#f472b6" : colors.foreground }]}>
                      {next.isToday ? "Today!" : `${next.daysAway}d`}
                    </Text>
                    <Text style={[styles.entryDateSmall, { color: colors.mutedForeground }]}>
                      {next.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>
            Long press to delete an entry
          </Text>
        </>
      )}

      {/* ── Continue: visit Sacred Memory ─────────────────────────────── */}
      <TouchableOpacity
        onPress={() => router.push("/sacred-memory" as any)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
          marginHorizontal: 16, marginTop: 8, marginBottom: insets.bottom + 24,
          borderRadius: 14, borderWidth: 1, borderColor: colors.border,
          paddingVertical: 14, backgroundColor: colors.card,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.mutedForeground }}>Sacred Memory</Text>
        <Feather name="arrow-right" size={15} color={colors.mutedForeground} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 16, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  card: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, marginBottom: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  calcBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  calcBtnText: { fontSize: 15, fontWeight: "700" },
  resultBox: { borderRadius: 12, borderWidth: 1, padding: 16, marginTop: 16 },
  resultHebrew: { fontSize: 20, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  resultNote: { fontSize: 12, lineHeight: 17, marginBottom: 12 },
  nextCard: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12 },
  nextLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  nextDate: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  nextDays: { fontSize: 16, fontWeight: "800" },
  saveEntryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10 },
  entryRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  candleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  entryName: { fontSize: 14, fontWeight: "700" },
  entryHebrew: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  entryDays: { fontSize: 16, fontWeight: "700" },
  entryDateSmall: { fontSize: 11, marginTop: 2 },
});

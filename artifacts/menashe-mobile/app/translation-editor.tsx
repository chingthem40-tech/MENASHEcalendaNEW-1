import React, { useState, useMemo } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useThemeTokens } from "@/src/mobile/design-system";

import { useLanguage } from "@/context/LanguageContext";
import { Translations, en as defaultEn, tk as defaultTk } from "@/lib/translations";

async function clipboardWrite(text: string): Promise<void> {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  }
}
async function clipboardRead(): Promise<string> {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
    return navigator.clipboard.readText();
  }
  return "";
}

type TKey = keyof Translations;

const GROUPS: { label: string; labelKey: keyof Translations; keys: TKey[] }[] = [
  {
    label: "Navigation",
    labelKey: "txEditorGroupNav",
    keys: ["navHome", "navCalendar", "navZmanim", "navCommunity", "navTorah", "navSettings", "navSiddur"],
  },
  {
    label: "Home Page",
    labelKey: "txEditorGroupHome",
    keys: [
      "homeToday", "homeHebrewDate", "homeGregorian", "homeHebrewYear",
      "homeSacredCalendar", "homeZmanim", "homeViewAll",
      "homeSunrise", "homeSunset", "homeNightfall",
      "homeCandleLighting", "homeHavdalah", "homeHavdalahAt", "homeHavdalahTonight",
      "homeTodayShabbat", "homeUpcomingShabbat",
      "homeShabbatShalom", "homeShabbatInProgress", "homeShavuaTov",
      "homeUntilHavdalah", "homeUntilCandleLighting", "homeUntilNextShabbat",
      "homeQuickTools", "homeKeyZmanim",
      "homeWeeklyParasha", "homeParashah",
      "homeUpcomingHoliday", "homeUpcomingHolidays", "homeNoHolidays",
      "homeTodayHoliday", "homeChagSameach",
      "homeDafYomi", "homeDafYomiToday",
      "homeOmer", "homeOmerWeeks", "homeOmerDays",
      "homeDailyTorah", "homeReadMore", "homeShowLess", "homeShare",
      "homeCommunityTitle", "homeCommunityDesc",
      "homeCensusTitle", "homeCensusDesc",
      "homeMoreTools",
    ],
  },
  {
    label: "Settings",
    labelKey: "txEditorGroupSettings",
    keys: [
      "settingsTitle", "settingsAppearance", "settingsTheme",
      "settingsDarkMode", "settingsDarkOn", "settingsDarkOff", "settingsShowHebrew",
      "settingsLanguage", "settingsLanguageHint",
      "settingsEditTranslations", "settingsEditTranslationsHint",
      "settingsLocation", "settingsCity", "settingsCityHint", "settingsTimezone",
      "settingsNotifications",
      "settingsCandleLighting", "settingsHavdalah", "settingsShema",
      "settingsPrayers", "settingsHoliday", "settingsParasha",
      "settingsOmer", "settingsShabbatDigest", "settingsYahrtzeit",
      "settingsLeadTime", "settingsLeadTimeHint",
      "settingsBgPush", "settingsBgPushDesc", "settingsBgPushDescUnsupported",
      "settingsEnablePush", "settingsEnablingPush",
      "settingsTestPush", "settingsTestSent",
      "settingsDisablePush", "settingsPushActive",
      "settingsTools",
      "settingsTahara", "settingsTaharaSub",
      "settingsYartzeitCalc", "settingsYartzeitSub",
      "settingsBirthday", "settingsBirthdaySub",
      "settingsCommunity", "settingsCommunitySub",
      "settingsCensus", "settingsCensusSub",
      "settingsUpgrade", "settingsUpgradeSub",
      "settingsAccount", "settingsSignOut", "settingsVersion",
      "settingsNotifBlocked", "settingsNotifBlockedSub",
      "settingsNotifUnsupported", "settingsNotifActive",
    ],
  },
  {
    label: "Community Hub",
    labelKey: "txEditorGroupFab",
    keys: [
      "fabTitle", "fabAnnouncements", "fabCommunityEvents",
      "fabCommunityMemorial", "fabTorahWisdom", "fabPrayerBoard", "fabTorahTracker",
    ],
  },
];

type Row =
  | { type: "group"; label: string; count: number }
  | { type: "label"; key: TKey; en: string; tk: string };

export default function TranslationEditorScreen() {
  const { colors } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { t, tkOverrides, saveTkOverrides, resetTkOverrides } = useLanguage();

  const baseTk = defaultTk;
  const [edits, setEdits] = useState<Partial<Translations>>(() => {
    const init: Partial<Translations> = {};
    (Object.keys(baseTk) as TKey[]).forEach(k => {
      (init as any)[k] = (tkOverrides as any)[k] ?? (baseTk as any)[k] ?? "";
    });
    return init;
  });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  const ALL_KEYS = useMemo(() => new Set(GROUPS.flatMap(g => g.keys)), []);

  const rows = useMemo<Row[]>(() => {
    const q = search.toLowerCase().trim();
    const result: Row[] = [];
    for (const group of GROUPS) {
      const matching = group.keys.filter(k => {
        if (!q) return true;
        const enVal = (defaultEn as any)[k] as string ?? "";
        const tkVal = (edits as any)[k] as string ?? "";
        return (k as string).toLowerCase().includes(q) || enVal.toLowerCase().includes(q) || tkVal.toLowerCase().includes(q);
      });
      if (matching.length === 0) continue;
      result.push({ type: "group", label: (t as any)[group.labelKey] || group.label, count: matching.length });
      for (const k of matching) {
        result.push({
          type: "label",
          key: k,
          en: (defaultEn as any)[k] ?? "",
          tk: (edits as any)[k] ?? "",
        });
      }
    }
    return result;
  }, [search, edits, t]);

  function handleChange(key: TKey, value: string) {
    setEdits((prev: Partial<Translations>) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveTkOverrides(edits as Translations);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    Alert.alert(
      t.txEditorReset,
      t.txEditorResetConfirm,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetTkOverrides();
            const reset: Partial<Translations> = {};
            (Object.keys(baseTk) as TKey[]).forEach(k => {
              (reset as any)[k] = (baseTk as any)[k] ?? "";
            });
            setEdits(reset);
            setSaved(false);
          },
        },
      ],
    );
  }

  async function handleCopy() {
    const payload: Record<string, string> = {};
    (Object.keys(edits) as TKey[]).forEach(k => {
      payload[k as string] = (edits as any)[k] ?? "";
    });
    try {
      await clipboardWrite(JSON.stringify(payload, null, 2));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      Alert.alert("Error", "Could not copy to clipboard.");
    }
  }

  async function handlePaste() {
    try {
      const text = await clipboardRead();
      if (!text.trim()) { Alert.alert("Clipboard is empty"); return; }
      const raw = JSON.parse(text);
      if (typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid format");
      const incoming: Partial<Translations> = {};
      let count = 0;
      Object.entries(raw).forEach(([key, val]) => {
        if (ALL_KEYS.has(key as TKey) && typeof val === "string") {
          (incoming as any)[key] = val;
          count++;
        }
      });
      if (count === 0) throw new Error("No valid keys found");
      setEdits((prev: Partial<Translations>) => ({ ...prev, ...incoming }));
      setSaved(false);
      Alert.alert("Pasted", `${count} labels loaded. Tap Save to apply.`);
    } catch (err: any) {
      Alert.alert("Paste Failed", err?.message === "No valid keys found"
        ? "No valid translation keys were found in clipboard."
        : "Clipboard doesn't contain valid JSON.");
    }
  }

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: topPad + 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
            <Text style={{ fontSize: 24, color: colors.primary }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, letterSpacing: -0.3 }}>
              {t.txEditorTitle}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
              {t.txEditorSubtitle}
            </Text>
          </View>
        </View>

        {/* Search */}
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t.txEditorSearch}
          placeholderTextColor={colors.mutedForeground}
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 14,
            color: colors.foreground,
          }}
        />
      </View>

      {/* Rows */}
      <FlatList
        data={rows}
        keyExtractor={(item, idx) => item.type === "group" ? `g-${idx}` : String(item.key)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        renderItem={({ item }) => {
          if (item.type === "group") {
            return (
              <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary, letterSpacing: 1, textTransform: "uppercase" }}>
                  {item.label}
                </Text>
              </View>
            );
          }
          const val = (edits as any)[item.key] as string ?? "";
          return (
            <View style={{
              marginHorizontal: 16,
              marginBottom: 10,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 12,
            }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: colors.mutedForeground, marginBottom: 4, letterSpacing: 0.5 }}>
                {String(item.key)}
              </Text>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 8, lineHeight: 18 }}>
                🇬🇧 {item.en}
              </Text>
              <TextInput
                value={val}
                onChangeText={v => handleChange(item.key, v)}
                placeholder={item.en}
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  fontSize: 14,
                  color: colors.foreground,
                  minHeight: 40,
                  lineHeight: 20,
                }}
              />
            </View>
          );
        }}
      />

      {/* Bottom action bar */}
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: insets.bottom + 8,
        paddingTop: 10,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
        flexDirection: "row",
        gap: 8,
      }}>
        <TouchableOpacity
          onPress={handleCopy}
          style={[styles.btn, {
            backgroundColor: copied ? "rgba(34,197,94,0.12)" : colors.card,
            borderColor: copied ? "rgba(34,197,94,0.4)" : colors.border,
            flex: 1,
          }]}
        >
          <Text style={[styles.btnText, { color: copied ? "#22c55e" : colors.mutedForeground }]}>
            {copied ? "✓ Copied!" : "⧉ Copy"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePaste}
          style={[styles.btn, {
            backgroundColor: "rgba(251,191,36,0.08)",
            borderColor: "rgba(251,191,36,0.25)",
            flex: 1,
          }]}
        >
          <Text style={[styles.btnText, { color: "#fbbf24" }]}>⧉ Paste</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleReset}
          style={[styles.btn, {
            backgroundColor: "rgba(239,68,68,0.08)",
            borderColor: "rgba(239,68,68,0.2)",
            flex: 1,
          }]}
        >
          <Text style={[styles.btnText, { color: "#ef4444" }]}>{t.txEditorReset}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          style={[styles.btn, {
            backgroundColor: saved ? "rgba(34,197,94,0.12)" : colors.primary,
            borderColor: saved ? "rgba(34,197,94,0.4)" : colors.primary,
            flex: 2,
          }]}
        >
          <Text style={[styles.btnText, { color: saved ? "#22c55e" : colors.background, fontWeight: "700" }]}>
            {saved ? t.txEditorSaved : t.txEditorSave}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

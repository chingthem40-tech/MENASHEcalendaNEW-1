import React, { useState, useRef, useEffect } from "react";
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import Constants from "expo-constants";
import { useThemeTokens } from "@/src/mobile/design-system";
import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import PALETTES, { type ThemeKey } from "@/constants/colors";
import { LOCATIONS } from "@/lib/locations";
import LocationPickerModal from "@/components/LocationPickerModal";
import {
  requestPermission,
  getPermissionStatus,
  scheduleAllNotifications,
  type NotificationPrefs,
} from "@/lib/notifications";
import { sendTestExpoPush } from "@/lib/expoPush";
import * as Notifications from "expo-notifications";

// ── Constants ──────────────────────────────────────────────────────────────────

const LEAD_OPTIONS = [5, 10, 15, 30];
const GOLD = "#d4a843";
const DANGER = "#c0392b";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : "U";
}

function formatMemberSince(date?: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ── Sub-component interfaces ───────────────────────────────────────────────────

interface RowProps {
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  colors: ReturnType<typeof useThemeTokens>["colors"];
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const {
    theme, setTheme,
    location, setLocation,
    notifPrefs, setNotifPrefs,
    leadMinutes, setLeadMinutes,
    scheduledCount, reschedule,
    serverPushRegistered, registerServerPush, unregisterServerPush,
  } = useApp();
  const { lang, setLang, t } = useLanguage();

  // ── Local state ──────────────────────────────────────────────────────────────
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [permStatus, setPermStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [serverPushLoading, setServerPushLoading] = useState(false);
  const [testPushLoading, setTestPushLoading] = useState(false);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 460, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  // ── Handlers (unchanged business logic) ──────────────────────────────────────

  async function handleSetTheme(themeKey: ThemeKey) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setTheme(themeKey);
  }

  async function handleToggle(key: keyof NotificationPrefs, value: boolean) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      const status = await getPermissionStatus();
      if (status !== Notifications.PermissionStatus.GRANTED) {
        const granted = await requestPermission();
        if (!granted) {
          if (Platform.OS !== "web") {
            Alert.alert(
              t.settingsAlertNotifBlockedTitle,
              t.settingsAlertNotifBlockedMsg,
              [{ text: t.settingsAlertOk }],
            );
          }
          return;
        }
      }
    }
    await setNotifPrefs({ ...notifPrefs, [key]: value });
  }

  async function handleReschedule() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRescheduling(true);
    const n = await reschedule();
    setRescheduling(false);
    if (Platform.OS !== "web") {
      Alert.alert(t.settingsAlertScheduledTitle, t.settingsAlertScheduledMsg.replace("{n}", String(n)));
    }
  }

  async function handleEnableAll() {
    const granted = await requestPermission();
    setPermStatus(granted ? Notifications.PermissionStatus.GRANTED : Notifications.PermissionStatus.DENIED);
    if (granted) {
      await setNotifPrefs({ shabbat: true, havdalah: true, prayers: false, parasha: true, holiday: true });
    } else {
      Alert.alert(t.settingsAlertPermDeniedTitle, t.settingsAlertPermDeniedMsg);
    }
  }

  async function handleToggleServerPush(enable: boolean) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setServerPushLoading(true);
    try {
      if (enable) {
        await registerServerPush(getToken);
        Alert.alert(t.settingsAlertServerPushTitle, t.settingsAlertServerPushMsg);
      } else {
        await unregisterServerPush(getToken);
      }
    } catch (err: any) {
      Alert.alert(t.settingsAlertErrorTitle, err?.message ?? t.settingsAlertServerPushErrMsg);
    } finally {
      setServerPushLoading(false);
    }
  }

  async function handleTestServerPush() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTestPushLoading(true);
    try {
      await sendTestExpoPush(getToken);
      Alert.alert(t.settingsAlertTestSentTitle, t.settingsAlertTestSentMsg);
    } catch (err: any) {
      Alert.alert(t.settingsAlertErrorTitle, err?.message ?? t.settingsAlertTestFailMsg);
    } finally {
      setTestPushLoading(false);
    }
  }

  function handleSignOut() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t.settingsAlertSignOutTitle,
      t.settingsAlertSignOutMsg,
      [
        { text: t.settingsAlertCancel, style: "cancel" },
        {
          text: t.settingsAlertSignOutTitle,
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/sign-in");
          },
        },
      ],
    );
  }

  // ── Notification rows config ──────────────────────────────────────────────────

  const notifRows: {
    key: keyof NotificationPrefs;
    label: string;
    sub: string;
    icon: keyof typeof Feather.glyphMap;
    iconBg: string;
  }[] = [
    { key: "shabbat",  label: t.settingsNotifCandleLighting, sub: t.settingsNotifShabbatSub,  icon: "star",      iconBg: "rgba(212, 168, 67, 0.14)" },
    { key: "havdalah", label: t.settingsNotifHavdalah,        sub: t.settingsNotifHavdalahSub, icon: "moon",      iconBg: "rgba(99, 130, 255, 0.12)" },
    { key: "parasha",  label: t.settingsNotifParasha,         sub: t.settingsNotifParashaSub,  icon: "book-open", iconBg: "rgba(34, 197, 94, 0.10)"  },
    { key: "holiday",  label: t.settingsNotifHolidayAlerts,   sub: t.settingsNotifHolidaySub,  icon: "calendar",  iconBg: "rgba(245, 158, 11, 0.12)" },
    { key: "prayers",  label: t.settingsNotifPrayerReminders, sub: t.settingsNotifPrayersSub,  icon: "clock",     iconBg: "rgba(212, 168, 67, 0.10)" },
  ];

  // ── Derived values ────────────────────────────────────────────────────────────

  const initials = getInitials(user?.fullName, user?.primaryEmailAddress?.emailAddress);
  const memberSince = formatMemberSince(user?.createdAt);
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const buildNumber = String(
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode ??
    "—"
  );

  // ── Inline render helpers ─────────────────────────────────────────────────────

  /** Uppercase section label with generous top padding — gold accent matching web */
  const SectionLabel = ({ label }: { label: string }) => (
    <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: GOLD }} />
      <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.8, color: GOLD }}>
        {label}
      </Text>
    </View>
  );

  /** Glass-surface grouped card */
  const CardGroup = ({ children, style }: { children: React.ReactNode; style?: object }) => (
    <View style={[{
      marginHorizontal: 16,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    }, style]}>
      {children}
    </View>
  );

  /** Full-bleed hairline divider indented past the icon */
  const RowDivider = () => (
    <View style={{
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 68,
    }} />
  );

  /** Reusable preference / nav row */
  const Row = ({
    icon, iconBg, iconColor, title, subtitle,
    onPress, trailing, showChevron = true,
  }: RowProps) => {
    const ic = iconColor ?? colors.primary;
    const inner = (
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}>
        <View style={{
          width: 38, height: 38, borderRadius: 11,
          backgroundColor: iconBg, alignItems: "center", justifyContent: "center", marginRight: 14,
        }}>
          <Feather name={icon} size={18} color={ic} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>{title}</Text>
          {subtitle ? (
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>{subtitle}</Text>
          ) : null}
        </View>
        {trailing !== undefined
          ? trailing
          : (showChevron && onPress
              ? <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
              : null)}
      </View>
    );
    if (onPress) {
      return <TouchableOpacity onPress={onPress} activeOpacity={0.72}>{inner}</TouchableOpacity>;
    }
    return <>{inner}</>;
  };

  // ── JSX ───────────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ① PROFILE HERO ─────────────────────────────────────────────────── */}
          <View style={{
            paddingTop: topPad + 8,
            paddingBottom: 28,
            paddingHorizontal: 24,
            backgroundColor: colors.backgroundSubtle,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            {/* Screen label — gold accent matching web section-header pattern */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 22 }}>
              <View style={{ width: 3, height: 13, borderRadius: 2, backgroundColor: GOLD }} />
              <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.8, color: GOLD }}>
                ACCOUNT & PREFERENCES
              </Text>
            </View>

            {/* Avatar + identity */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Avatar with gold completion ring */}
              <View style={{
                width: 80, height: 80, borderRadius: 40,
                borderWidth: 2.5, borderColor: GOLD,
                padding: 3,
                shadowColor: GOLD,
                shadowOpacity: 0.30,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 2 },
                elevation: 6,
              }}>
                <View style={{
                  flex: 1, borderRadius: 36,
                  backgroundColor: "rgba(212, 168, 67, 0.14)",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 28, fontWeight: "700", color: GOLD }}>
                    {initials}
                  </Text>
                </View>
              </View>

              {/* Name / email / location / member since */}
              <View style={{ marginLeft: 18, flex: 1 }}>
                {user?.fullName ? (
                  <Text
                    style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, letterSpacing: -0.3 }}
                    numberOfLines={1}
                  >
                    {user.fullName}
                  </Text>
                ) : null}
                <Text
                  style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}
                  numberOfLines={1}
                >
                  {user?.primaryEmailAddress?.emailAddress ?? t.settingsSignedIn}
                </Text>
                {location.name ? (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5, gap: 4 }}>
                    <Feather name="map-pin" size={11} color={GOLD} />
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{location.name}</Text>
                  </View>
                ) : null}
                {memberSince ? (
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>
                    Member since {memberSince}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Quick Edit Profile pill */}
            <TouchableOpacity
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center",
                gap: 8, marginTop: 22, paddingVertical: 12, borderRadius: 14,
                borderWidth: 1.5, borderColor: GOLD + "60",
                backgroundColor: "rgba(212, 168, 67, 0.08)",
              }}
              onPress={() => router.push("/profile/edit" as any)}
              activeOpacity={0.75}
            >
              <Feather name="edit-2" size={14} color={GOLD} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: GOLD }}>
                {t.settingsEditProfile}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ② PERSONAL PREFERENCES ─────────────────────────────────────────── */}
          <SectionLabel label="PREFERENCES" />
          <CardGroup>
            {/* — Theme — */}
            <View style={{ padding: 16, paddingBottom: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", letterSpacing: 0.5, color: colors.mutedForeground, marginBottom: 14 }}>
                {t.settingsTheme}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>

                {/* Midnight */}
                <TouchableOpacity
                  style={{ flex: 1, alignItems: "center" }}
                  onPress={() => handleSetTheme("dark")}
                  activeOpacity={0.75}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: theme === "dark" }}
                  accessibilityLabel={t.settingsThemeMidnight}
                >
                  <View style={{
                    borderRadius: 14, overflow: "hidden", borderWidth: 2.5,
                    borderColor: theme === "dark" ? PALETTES.dark.primary : "transparent",
                    shadowColor: theme === "dark" ? PALETTES.dark.primary : "#000",
                    shadowOpacity: theme === "dark" ? 0.45 : 0.18,
                    shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
                    elevation: theme === "dark" ? 5 : 1,
                  }}>
                    <View style={{ backgroundColor: PALETTES.dark.background, padding: 8, height: 72, gap: 4 }}>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: PALETTES.dark.primary, width: "60%" }} />
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: PALETTES.dark.secondary, width: "90%" }} />
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: PALETTES.dark.secondary, width: "75%" }} />
                      <View style={{ flex: 1 }} />
                      <View style={{ flexDirection: "row", gap: 4 }}>
                        {[1,2,3].map(i => <View key={i} style={{ flex: 1, height: 14, borderRadius: 4, backgroundColor: PALETTES.dark.card }} />)}
                      </View>
                    </View>
                    <View style={{ backgroundColor: PALETTES.dark.background, padding: 5, flexDirection: "row", justifyContent: "space-around" }}>
                      {["🏠","📅","⏰","👥","⚙️"].map((ic, i) => <Text key={i} style={{ fontSize: 8 }}>{ic}</Text>)}
                    </View>
                  </View>
                  <Text style={{ marginTop: 7, fontSize: 11, fontWeight: theme === "dark" ? "700" : "500", color: theme === "dark" ? PALETTES.dark.primary : colors.mutedForeground }}>
                    {theme === "dark" ? "✓ " : ""}{t.settingsThemeMidnight}
                  </Text>
                </TouchableOpacity>

                {/* Parchment */}
                <TouchableOpacity
                  style={{ flex: 1, alignItems: "center" }}
                  onPress={() => handleSetTheme("light")}
                  activeOpacity={0.75}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: theme === "light" }}
                  accessibilityLabel={t.settingsThemeParchment}
                >
                  <View style={{
                    borderRadius: 14, overflow: "hidden", borderWidth: 2.5,
                    borderColor: theme === "light" ? PALETTES.light.primary : "transparent",
                    shadowColor: theme === "light" ? PALETTES.light.primary : "#000",
                    shadowOpacity: theme === "light" ? 0.30 : 0.15,
                    shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
                    elevation: theme === "light" ? 5 : 1,
                  }}>
                    <View style={{ backgroundColor: PALETTES.light.background, padding: 8, height: 72, gap: 4 }}>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: PALETTES.light.primary, width: "60%" }} />
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: PALETTES.light.card, width: "90%", borderWidth: 1, borderColor: PALETTES.light.border }} />
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: PALETTES.light.card, width: "75%", borderWidth: 1, borderColor: PALETTES.light.border }} />
                      <View style={{ flex: 1 }} />
                      <View style={{ flexDirection: "row", gap: 4 }}>
                        {[1,2,3].map(i => <View key={i} style={{ flex: 1, height: 14, borderRadius: 4, backgroundColor: PALETTES.light.card, borderWidth: 1, borderColor: PALETTES.light.border }} />)}
                      </View>
                    </View>
                    <View style={{ backgroundColor: PALETTES.light.card, padding: 5, borderTopWidth: 1, borderTopColor: PALETTES.light.border, flexDirection: "row", justifyContent: "space-around" }}>
                      {["🏠","📅","⏰","👥","⚙️"].map((ic, i) => <Text key={i} style={{ fontSize: 8 }}>{ic}</Text>)}
                    </View>
                  </View>
                  <Text style={{ marginTop: 7, fontSize: 11, fontWeight: theme === "light" ? "700" : "500", color: theme === "light" ? PALETTES.light.primary : colors.mutedForeground }}>
                    {theme === "light" ? "✓ " : ""}{t.settingsThemeParchment}
                  </Text>
                </TouchableOpacity>

                {/* Sapphire */}
                <TouchableOpacity
                  style={{ flex: 1, alignItems: "center" }}
                  onPress={() => handleSetTheme("sapphire")}
                  activeOpacity={0.75}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: theme === "sapphire" }}
                  accessibilityLabel={t.settingsThemeSapphire}
                >
                  <View style={{
                    borderRadius: 14, overflow: "hidden", borderWidth: 2.5,
                    borderColor: theme === "sapphire" ? PALETTES.sapphire.primary : "transparent",
                    shadowColor: theme === "sapphire" ? PALETTES.sapphire.primary : "#000",
                    shadowOpacity: theme === "sapphire" ? 0.45 : 0.18,
                    shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
                    elevation: theme === "sapphire" ? 5 : 1,
                  }}>
                    <View style={{ backgroundColor: PALETTES.sapphire.background, padding: 8, height: 72, gap: 4 }}>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: PALETTES.sapphire.primary, width: "60%" }} />
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: PALETTES.sapphire.card, width: "90%", borderWidth: 1, borderColor: PALETTES.sapphire.border }} />
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: PALETTES.sapphire.card, width: "75%", borderWidth: 1, borderColor: PALETTES.sapphire.border }} />
                      <View style={{ flex: 1 }} />
                      <View style={{ flexDirection: "row", gap: 4 }}>
                        {[1,2,3].map(i => <View key={i} style={{ flex: 1, height: 14, borderRadius: 4, backgroundColor: PALETTES.sapphire.card, borderWidth: 1, borderColor: PALETTES.sapphire.border }} />)}
                      </View>
                    </View>
                    <View style={{ backgroundColor: PALETTES.sapphire.background, padding: 5, borderTopWidth: 1, borderTopColor: PALETTES.sapphire.border, flexDirection: "row", justifyContent: "space-around" }}>
                      {["🏠","📅","⏰","👥","⚙️"].map((ic, i) => <Text key={i} style={{ fontSize: 8 }}>{ic}</Text>)}
                    </View>
                  </View>
                  <Text style={{ marginTop: 7, fontSize: 11, fontWeight: theme === "sapphire" ? "700" : "500", color: theme === "sapphire" ? PALETTES.sapphire.primary : colors.mutedForeground }}>
                    {theme === "sapphire" ? "✓ " : ""}{t.settingsThemeSapphire}
                  </Text>
                </TouchableOpacity>

              </View>
              <View style={{ height: 16 }} />
            </View>

            <RowDivider />

            {/* — Language — */}
            <View style={{ padding: 16, paddingTop: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", letterSpacing: 0.5, color: colors.mutedForeground, marginBottom: 12 }}>
                {t.settingsLanguage}
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1, borderRadius: 13, borderWidth: 1.5, paddingVertical: 13, alignItems: "center",
                    borderColor: lang === "en" ? colors.primary : colors.border,
                    backgroundColor: lang === "en" ? colors.primary + "15" : "transparent",
                  }}
                  onPress={() => setLang("en")}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: lang === "en" ? colors.primary : colors.mutedForeground }}>English</Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>EN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1, borderRadius: 13, borderWidth: 1.5, paddingVertical: 13, alignItems: "center",
                    borderColor: lang === "tk" ? colors.primary : colors.border,
                    backgroundColor: lang === "tk" ? colors.primary + "15" : "transparent",
                  }}
                  onPress={() => setLang("tk")}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: lang === "tk" ? colors.primary : colors.mutedForeground }}>Thadou Kuki</Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>TK</Text>
                </TouchableOpacity>
              </View>
            </View>

            <RowDivider />

            {/* — Location — */}
            <Row
              colors={colors}
              icon="map-pin"
              iconBg="rgba(212, 168, 67, 0.12)"
              iconColor={GOLD}
              title={location.name}
              subtitle={`${location.country} · ${t.settingsLocationUtc}`}
              onPress={() => setShowLocationPicker(true)}
            />

            <RowDivider />

            {/* — Notifications header — */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, fontWeight: "700", letterSpacing: 0.5, color: colors.mutedForeground }}>
                  {t.settingsNotifications}
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 5,
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                    backgroundColor: colors.primary + "15",
                  }}
                  onPress={handleEnableAll}
                  activeOpacity={0.8}
                >
                  <Feather name="bell" size={12} color={colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
                    {t.settingsEnableAllNotif}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notification toggles */}
            {notifRows.map((row, i) => (
              <React.Fragment key={row.key}>
                {i > 0 && <RowDivider />}
                <Row
                  colors={colors}
                  icon={row.icon}
                  iconBg={row.iconBg}
                  iconColor={colors.primary}
                  title={row.label}
                  subtitle={row.sub}
                  showChevron={false}
                  trailing={
                    <Switch
                      value={notifPrefs[row.key]}
                      onValueChange={(v) => handleToggle(row.key, v)}
                      trackColor={{ false: colors.border, true: colors.primary + "88" }}
                      thumbColor={notifPrefs[row.key] ? colors.primary : colors.mutedForeground}
                    />
                  }
                />
              </React.Fragment>
            ))}

            {/* Lead time */}
            <View style={{ padding: 16, paddingTop: 14, paddingBottom: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedForeground, marginBottom: 10 }}>
                {t.settingsLeadTimeSection}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {LEAD_OPTIONS.map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={{
                      flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 10, alignItems: "center",
                      backgroundColor: leadMinutes === mins ? colors.primary : "transparent",
                      borderColor: leadMinutes === mins ? colors.primary : colors.border,
                    }}
                    onPress={() => setLeadMinutes(mins)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: leadMinutes === mins ? colors.primaryForeground : colors.foreground }}>
                      {mins}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Scheduled count + Reschedule */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <Feather name="bell" size={14} color={colors.primary} />
                  <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "500" }}>
                    {t.settingsScheduledCount.replace("{n}", String(scheduledCount))}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 6,
                    paddingHorizontal: 14, paddingVertical: 8,
                    borderRadius: 10, borderWidth: 1.5, borderColor: colors.primary,
                  }}
                  onPress={handleReschedule}
                  disabled={rescheduling}
                  activeOpacity={0.8}
                >
                  <Feather name="refresh-cw" size={13} color={colors.primary} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
                    {rescheduling ? t.settingsRescheduling : t.settingsRescheduleNow}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 8, lineHeight: 17 }}>
                {t.settingsLocalNotifDesc}
              </Text>
            </View>

            {/* Server Push (native only) */}
            {Platform.OS !== "web" && (
              <>
                <RowDivider />
                <Row
                  colors={colors}
                  icon="cloud"
                  iconBg="rgba(99, 130, 255, 0.12)"
                  iconColor="#6382FF"
                  title={t.settingsServerPushLabel}
                  subtitle={serverPushRegistered ? t.settingsServerPushActiveDesc : t.settingsServerPushInactiveDesc}
                  showChevron={false}
                  trailing={
                    <Switch
                      value={serverPushRegistered}
                      onValueChange={handleToggleServerPush}
                      disabled={serverPushLoading}
                      trackColor={{ false: colors.border, true: colors.primary + "88" }}
                      thumbColor={serverPushRegistered ? colors.primary : colors.mutedForeground}
                    />
                  }
                />
                {serverPushRegistered && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                        borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary, paddingVertical: 11,
                      }}
                      onPress={handleTestServerPush}
                      disabled={testPushLoading}
                      activeOpacity={0.8}
                    >
                      <Feather name="send" size={14} color={colors.primary} />
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
                        {testPushLoading ? t.settingsSendingPush : t.settingsSendTestNotif}
                      </Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 8, lineHeight: 17 }}>
                      {t.settingsServerPushFullDesc}
                    </Text>
                  </View>
                )}
              </>
            )}
          </CardGroup>

          {/* ③ ACCOUNT ──────────────────────────────────────────────────────── */}
          <SectionLabel label={t.settingsAccount.toUpperCase()} />
          <CardGroup>
            <Row
              colors={colors}
              icon="mail"
              iconBg="rgba(212, 168, 67, 0.12)"
              iconColor={GOLD}
              title={user?.primaryEmailAddress?.emailAddress ?? t.settingsSignedIn}
              subtitle="Primary email"
              showChevron={false}
            />
            <RowDivider />
            <Row
              colors={colors}
              icon="edit-2"
              iconBg="rgba(212, 168, 67, 0.12)"
              iconColor={GOLD}
              title={t.settingsEditProfile}
              subtitle={t.settingsEditProfileHint}
              onPress={() => router.push("/profile/edit" as any)}
            />
            <RowDivider />
            <Row
              colors={colors}
              icon="globe"
              iconBg="rgba(99, 130, 255, 0.10)"
              iconColor="#6382FF"
              title={t.settingsEditTranslations}
              subtitle={t.settingsEditTranslationsHint}
              onPress={() => router.push("/translation-editor")}
            />
          </CardGroup>

          {/* ④ PREMIUM ──────────────────────────────────────────────────────── */}
          <SectionLabel label="PREMIUM" />
          <TouchableOpacity
            style={{
              marginHorizontal: 16,
              borderRadius: 18,
              overflow: "hidden",
              borderWidth: 1.5,
              borderColor: GOLD + "55",
              backgroundColor: colors.card,
              shadowColor: GOLD,
              shadowOpacity: 0.18,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 4 },
              elevation: 5,
            }}
            onPress={() => router.push("/(tabs)/journey" as any)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="My Personal Journey"
          >
            {/* Gold top shimmer */}
            <View style={{ height: 3, backgroundColor: GOLD, opacity: 0.90 }} />
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View style={{
                  width: 42, height: 42, borderRadius: 13,
                  backgroundColor: "rgba(212, 168, 67, 0.18)",
                  alignItems: "center", justifyContent: "center", marginRight: 14,
                }}>
                  <Feather name="compass" size={20} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                    My Personal Journey
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                    Daily dashboard & family progress
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 8, backgroundColor: "rgba(212, 168, 67, 0.16)",
                }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: GOLD }}>MEMBER</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Feather name="arrow-right-circle" size={14} color={GOLD} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: GOLD }}>Open Journey</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* ⑤ COMMUNITY ────────────────────────────────────────────────────── */}
          <SectionLabel label="COMMUNITY" />
          <CardGroup>
            <Row
              colors={colors}
              icon="users"
              iconBg="rgba(34, 197, 94, 0.10)"
              iconColor="#22c55e"
              title="Prayer Board"
              subtitle="Community prayers & amens"
              onPress={() => router.push("/(tabs)/community" as any)}
            />
            <RowDivider />
            <Row
              colors={colors}
              icon="book"
              iconBg="rgba(212, 168, 67, 0.12)"
              iconColor={GOLD}
              title="Member Directory"
              subtitle="Browse & connect with members"
              onPress={() => router.push("/(tabs)/community" as any)}
            />
            <RowDivider />
            <Row
              colors={colors}
              icon="help-circle"
              iconBg="rgba(99, 130, 255, 0.10)"
              iconColor="#6382FF"
              title="Support"
              subtitle="Get help with the app"
              onPress={() => Alert.alert("Support", "For support, contact admin@menashecalendar.app")}
            />
            <RowDivider />
            <Row
              colors={colors}
              icon="message-square"
              iconBg="rgba(245, 158, 11, 0.10)"
              iconColor="#f59e0b"
              title="Send Feedback"
              subtitle="Help us improve the app"
              onPress={() => Alert.alert("Feedback", "Thank you! Send feedback to admin@menashecalendar.app")}
            />
            <RowDivider />
            <Row
              colors={colors}
              icon="file-text"
              iconBg="rgba(168, 184, 204, 0.08)"
              iconColor={colors.mutedForeground}
              title="Release Notes"
              subtitle={`v${appVersion} — What's new`}
              onPress={() => Alert.alert(`Version ${appVersion}`, "You're on the latest version of Bnei Menashe Calendar.")}
            />
          </CardGroup>

          {/* ⑥ APP INFORMATION ──────────────────────────────────────────────── */}
          <SectionLabel label="APP INFORMATION" />
          <CardGroup>
            <Row
              colors={colors}
              icon="info"
              iconBg="rgba(168, 184, 204, 0.08)"
              iconColor={colors.mutedForeground}
              title="Version"
              subtitle={appVersion}
              showChevron={false}
            />
            <RowDivider />
            <Row
              colors={colors}
              icon="package"
              iconBg="rgba(168, 184, 204, 0.08)"
              iconColor={colors.mutedForeground}
              title="Build"
              subtitle={buildNumber}
              showChevron={false}
            />
            <RowDivider />
            <Row
              colors={colors}
              icon="cpu"
              iconBg="rgba(168, 184, 204, 0.08)"
              iconColor={colors.mutedForeground}
              title="Expo SDK"
              subtitle="54"
              showChevron={false}
            />
          </CardGroup>

          {/* Copyright footer */}
          <View style={{ paddingTop: 24, paddingHorizontal: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", lineHeight: 19 }}>
              © 2025 Bnei Menashe Calendar{"\n"}
              <Text style={{ fontSize: 11 }}>Crafted with devotion for the community</Text>
            </Text>
          </View>

          {/* ⑦ SIGN OUT ─────────────────────────────────────────────────────── */}
          <View style={{ marginHorizontal: 16, marginTop: 32 }}>
            <TouchableOpacity
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center",
                gap: 10, borderRadius: 16, paddingVertical: 16,
                backgroundColor: "rgba(192, 57, 43, 0.08)",
                borderWidth: 1.5, borderColor: "rgba(192, 57, 43, 0.38)",
              }}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={18} color={DANGER} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: DANGER }}>
                {t.settingsSignOut}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: 10, lineHeight: 17 }}>
              {t.settingsSignOutHint}
            </Text>
          </View>

        </Animated.View>
      </ScrollView>

      <LocationPickerModal
        visible={showLocationPicker}
        current={location}
        onSelect={(loc) => {
          setLocation(loc);
          setShowLocationPicker(false);
        }}
        onClose={() => setShowLocationPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles are inline for full theme-awareness.
  // StyleSheet is kept for hairlineWidth usage via RowDivider.
});

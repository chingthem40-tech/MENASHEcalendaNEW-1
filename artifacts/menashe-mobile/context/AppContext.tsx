import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { DEFAULT_LOCATION, type Location } from "@/lib/locations";
import type { NotificationPrefs } from "@/lib/notifications";
import type { ThemeKey } from "@/constants/colors";

const LOCATION_KEY = "menashe-location";
const PREFS_KEY = "menashe-notif-prefs";
const LEAD_KEY = "menashe-lead-time";
const EXPO_TOKEN_KEY = "menashe-expo-push-token";
const THEME_KEY = "menashe-theme";

export const DEFAULT_PREFS: NotificationPrefs = {
  shabbat: true,
  havdalah: true,
  prayers: false,
  parasha: true,
  holiday: true,
};

interface AppContextValue {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => Promise<void>;
  location: Location;
  setLocation: (loc: Location) => Promise<void>;
  notifPrefs: NotificationPrefs;
  setNotifPrefs: (prefs: NotificationPrefs) => Promise<void>;
  leadMinutes: number;
  setLeadMinutes: (mins: number) => Promise<void>;
  scheduledCount: number;
  reschedule: () => Promise<number>;
  permissionGranted: boolean;
  expoPushToken: string | null;
  serverPushRegistered: boolean;
  registerServerPush: (getToken: () => Promise<string | null>) => Promise<void>;
  unregisterServerPush: (getToken: () => Promise<string | null>) => Promise<void>;
  syncServerPushPrefs: (getToken: () => Promise<string | null>) => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

async function scheduleIfNative(
  prefs: NotificationPrefs,
  location: Location,
  lead: number,
): Promise<number> {
  if (Platform.OS === "web") return 0;
  const { scheduleAllNotifications } = await import("@/lib/notifications");
  return scheduleAllNotifications(prefs, location, lead);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>("dark");
  const [location, setLocationState] = useState<Location>(DEFAULT_LOCATION);
  const [notifPrefs, setNotifPrefsState] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [leadMinutes, setLeadMinutesState] = useState<number>(15);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [serverPushRegistered, setServerPushRegistered] = useState(false);
  const initDoneRef = useRef(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { setupNotificationChannel } = await import("@/lib/notifications");
        await setupNotificationChannel();
      }

      const [locRaw, prefsRaw, leadRaw, tokenRaw, themeRaw] = await Promise.all([
        AsyncStorage.getItem(LOCATION_KEY),
        AsyncStorage.getItem(PREFS_KEY),
        AsyncStorage.getItem(LEAD_KEY),
        AsyncStorage.getItem(EXPO_TOKEN_KEY),
        AsyncStorage.getItem(THEME_KEY),
      ]);

      let loc = DEFAULT_LOCATION;
      if (locRaw) {
        try { loc = JSON.parse(locRaw); } catch (_e) { /* use default */ }
      }
      let prefs = DEFAULT_PREFS;
      if (prefsRaw) {
        try { prefs = { ...DEFAULT_PREFS, ...JSON.parse(prefsRaw) }; } catch (_e) { /* use default */ }
      }
      const lead = leadRaw ? Number(leadRaw) || 15 : 15;
      if (themeRaw === "dark" || themeRaw === "light" || themeRaw === "sapphire") {
        setThemeState(themeRaw);
      }

      setLocationState(loc);
      setNotifPrefsState(prefs);
      setLeadMinutesState(lead);
      if (tokenRaw) {
        setExpoPushToken(tokenRaw);
        setServerPushRegistered(true);
      }

      if (Platform.OS !== "web") {
        const Notifications = await import("expo-notifications");
        const { status } = await Notifications.getPermissionsAsync();
        const granted = status === "granted";
        setPermissionGranted(granted);
        if (granted) {
          const n = await scheduleIfNative(prefs, loc, lead);
          setScheduledCount(n);
        }
      }

      initDoneRef.current = true;
    })();
  }, []);

  const setTheme = async (t: ThemeKey) => {
    setThemeState(t);
    await AsyncStorage.setItem(THEME_KEY, t);
  };

  const setLocation = async (loc: Location) => {
    setLocationState(loc);
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    const n = await scheduleIfNative(notifPrefs, loc, leadMinutes);
    setScheduledCount(n);
  };

  const setNotifPrefs = async (prefs: NotificationPrefs) => {
    setNotifPrefsState(prefs);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    const n = await scheduleIfNative(prefs, location, leadMinutes);
    setScheduledCount(n);
  };

  const setLeadMinutes = async (mins: number) => {
    setLeadMinutesState(mins);
    await AsyncStorage.setItem(LEAD_KEY, String(mins));
    const n = await scheduleIfNative(notifPrefs, location, mins);
    setScheduledCount(n);
  };

  const reschedule = async (): Promise<number> => {
    const n = await scheduleIfNative(notifPrefs, location, leadMinutes);
    setScheduledCount(n);
    return n;
  };

  const registerServerPush = async (getToken: () => Promise<string | null>) => {
    const { getExpoPushToken, registerExpoPushToken } = await import("@/lib/expoPush");
    const token = await getExpoPushToken();
    if (!token) throw new Error("Could not obtain Expo push token. Make sure notifications are enabled.");
    await registerExpoPushToken(token, getToken, location, notifPrefs, leadMinutes);
    setExpoPushToken(token);
    setServerPushRegistered(true);
    setPermissionGranted(true);
    await AsyncStorage.setItem(EXPO_TOKEN_KEY, token);
  };

  const unregisterServerPush = async (getToken: () => Promise<string | null>) => {
    if (!expoPushToken) return;
    const { unregisterExpoPushToken } = await import("@/lib/expoPush");
    await unregisterExpoPushToken(expoPushToken, getToken);
    setExpoPushToken(null);
    setServerPushRegistered(false);
    await AsyncStorage.removeItem(EXPO_TOKEN_KEY);
  };

  const syncServerPushPrefs = async (getToken: () => Promise<string | null>) => {
    if (!expoPushToken || !serverPushRegistered) return;
    const { registerExpoPushToken } = await import("@/lib/expoPush");
    await registerExpoPushToken(expoPushToken, getToken, location, notifPrefs, leadMinutes);
  };

  return (
    <AppContext.Provider
      value={{
        theme, setTheme,
        location, setLocation,
        notifPrefs, setNotifPrefs,
        leadMinutes, setLeadMinutes,
        scheduledCount, reschedule,
        permissionGranted,
        expoPushToken,
        serverPushRegistered,
        registerServerPush,
        unregisterServerPush,
        syncServerPushPrefs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

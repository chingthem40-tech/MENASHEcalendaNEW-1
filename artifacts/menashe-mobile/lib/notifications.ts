import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { HebrewCalendar, flags } from "@hebcal/core";
import { calculateZmanim } from "./zmanim";
import type { Location } from "./locations";

export interface NotificationPrefs {
  shabbat: boolean;
  havdalah: boolean;
  prayers: boolean;
  parasha: boolean;
  holiday: boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  shabbat: true,
  havdalah: true,
  prayers: false,
  parasha: true,
  holiday: true,
};

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function setupNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("menashe-default", {
      name: "Bnei Menashe Calendar",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#D4AF37",
      sound: "default",
    });
  }
}

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  if (Platform.OS === "web") return Notifications.PermissionStatus.DENIED;
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60 * 1000);
}

function nextWeekday(targetDay: number, from: Date = new Date()): Date {
  const d = new Date(from);
  let diff = (targetDay - d.getDay() + 7) % 7;
  if (diff === 0) diff = 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtTime(date: Date, tz: string): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz });
}

export async function scheduleAllNotifications(
  prefs: NotificationPrefs,
  location: Location,
  leadMinutes: number = 15,
): Promise<number> {
  if (Platform.OS === "web") return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = Date.now();
  let count = 0;

  async function schedule(fireAt: Date, title: string, body: string, id?: string) {
    if (fireAt.getTime() <= now) return;
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: id,
        content: { title, body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
        },
      });
      count++;
    } catch (_e) { /* skip past notifications */ }
  }

  // ── Shabbat & Havdalah (4 weeks) ──────────────────────────────
  for (let w = 0; w < 4; w++) {
    const base = new Date(now + w * 7 * 86400000);
    const friday = nextWeekday(5, base);
    const saturday = new Date(friday.getTime() + 86400000);

    const fridayZm = calculateZmanim(friday, location.lat, location.lng, location.candleLightingMinutes);
    const satZm = calculateZmanim(saturday, location.lat, location.lng);

    if (prefs.shabbat && fridayZm.candleLighting) {
      const remindAt = addMinutes(fridayZm.candleLighting, -18);
      await schedule(
        remindAt,
        "Shabbat Candle Lighting",
        `Light candles in 18 minutes at ${fmtTime(fridayZm.candleLighting, location.tz)} in ${location.name}. Shabbat Shalom!`,
        `candles-${w}`,
      );
    }

    if (prefs.havdalah && satZm.havdalah) {
      await schedule(
        satZm.havdalah,
        "Havdalah Time",
        `Shabbat has ended at ${fmtTime(satZm.havdalah, location.tz)}. Shavua Tov — have a wonderful week!`,
        `havdalah-${w}`,
      );
    }

    if (prefs.parasha) {
      const paraEvents = HebrewCalendar.calendar({
        start: friday, end: friday, il: true, isHebrewYear: false,
        mask: flags.PARSHA_HASHAVUA,
      });
      if (paraEvents.length > 0) {
        const name = paraEvents[0].render("en");
        const fireAt = new Date(friday);
        fireAt.setHours(8, 0, 0, 0);
        await schedule(
          fireAt,
          `Parashat ${name}`,
          `This Shabbat's Torah portion is Parashat ${name}. Shabbat Shalom from Bnei Menashe!`,
          `parasha-${w}`,
        );
      }
    }
  }

  // ── Holidays (next 30 days) ────────────────────────────────────
  if (prefs.holiday) {
    const today = new Date(); today.setHours(0,0,0,0);
    const end = new Date(today.getTime() + 30 * 86400000);
    const events = HebrewCalendar.calendar({
      start: today, end, il: true, isHebrewYear: false,
      mask: flags.CHAG | flags.MODERN_HOLIDAY,
    });
    const seen = new Set<string>();
    for (const ev of events) {
      const name = ev.render("en");
      if (seen.has(name)) continue;
      seen.add(name);
      const date = ev.getDate().greg();
      date.setHours(0,0,0,0);
      const dayBefore = new Date(date.getTime() - 86400000);
      dayBefore.setHours(8,0,0,0);
      const dateStr = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      await schedule(
        dayBefore,
        `${name} Begins Tomorrow`,
        `${name} starts tomorrow, ${dateStr}. Chag Sameach!`,
        `holiday-${name.replace(/\s+/g,"-").toLowerCase()}`,
      );
    }
  }

  // ── Prayer times (next 7 days) ─────────────────────────────────
  if (prefs.prayers) {
    const base = new Date(); base.setHours(0,0,0,0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base.getTime() + i * 86400000);
      const pz = calculateZmanim(d, location.lat, location.lng);
      const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      if (pz.sunrise) {
        const remindAt = addMinutes(pz.sunrise, -leadMinutes);
        await schedule(
          remindAt,
          `Shacharit in ${leadMinutes} min`,
          `Morning prayer at ${fmtTime(pz.sunrise, location.tz)} in ${location.name}. ${dateStr}.`,
          `shacharit-${i}`,
        );
      }
      if (pz.minchaKetana) {
        const remindAt = addMinutes(pz.minchaKetana, -leadMinutes);
        await schedule(
          remindAt,
          `Mincha in ${leadMinutes} min`,
          `Afternoon prayer at ${fmtTime(pz.minchaKetana, location.tz)} in ${location.name}. ${dateStr}.`,
          `mincha-${i}`,
        );
      }
      if (pz.tzais) {
        const remindAt = addMinutes(pz.tzais, -leadMinutes);
        await schedule(
          remindAt,
          `Maariv in ${leadMinutes} min`,
          `Evening prayer at ${fmtTime(pz.tzais, location.tz)} in ${location.name}. ${dateStr}.`,
          `maariv-${i}`,
        );
      }
    }
  }

  return count;
}

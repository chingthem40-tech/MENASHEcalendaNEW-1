import { useState, useEffect, useCallback, useRef } from "react";
import { HebrewCalendar, HDate, flags } from "@hebcal/core";
import { calculateZmanim } from "../lib/zmanim";
import { getUpcomingParashiyot, getUpcomingHolidays as getLibHolidays } from "../lib/parasha";
import { Location } from "../lib/locations";
import type { NotificationPrefs, LeadTime } from "./useNotifications";
import {
  calendarDateInTimeZone,
  isValidIanaTimeZone,
  zonedDateTime,
} from "../lib/timezone";

const API_BASE = "/api";
const SW_KEY = "menashe-push-subscribed";

type ScheduleItem = {
  fireAt: number;
  title: string;
  body: string;
  tag: string;
  timezone: string;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const array = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    array[i] = rawData.charCodeAt(i);
  }
  return array;
}

function getNextWeekday(targetDay: number, from: Date = new Date()): Date {
  const d = new Date(from);
  const current = d.getDay();
  let diff = (targetDay - current + 7) % 7;
  if (diff === 0) diff = 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmt2(date: Date, tz: string): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: tz });
}

function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

function buildSchedule(prefs: NotificationPrefs, loc: Location, lead: LeadTime): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  const now = Date.now();
  const locationToday = calendarDateInTimeZone(new Date(now), loc.tz);

  function add(fireAt: Date, title: string, body: string, tag: string) {
    const ms = fireAt.getTime();
    if (ms > now) items.push({ fireAt: ms, title, body, tag, timezone: loc.tz });
  }

  if (prefs.dailyDate) {
    const base = new Date(locationToday);
    for (let i = 0; i <= 8; i++) {
      const date = new Date(base);
      date.setDate(base.getDate() + i);
      const hebrew = new HDate(date);
      const label = `${ordinal(hebrew.getDate())} of ${HDate.getMonthName(hebrew.getMonth(), hebrew.getFullYear())}`;
      const fireAt = zonedDateTime(date, 8, 0, loc.tz);
      const relative = i === 0 ? "Today" : i === 1 ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "long" });
      add(fireAt, `${relative} — ${label}`, i === 0 ? "Take a moment for reflection." : `The Hebrew date is ${label}.`, `daily-hebrew-date-${date.toISOString().slice(0, 10)}`);
    }
  }

  if (prefs.shabbat || prefs.havdalah || prefs.shabbatDigest || prefs.parasha) {
    for (let w = 0; w < 8; w++) {
      const weekBase = new Date(locationToday);
      weekBase.setDate(weekBase.getDate() + w * 7);
      const friday = getNextWeekday(5, weekBase);
      const saturday = new Date(friday);
      saturday.setDate(friday.getDate() + 1);

      const fridayZm = calculateZmanim(friday, loc.lat, loc.lng, loc.candleLightingMinutes);
      const satZm = calculateZmanim(saturday, loc.lat, loc.lng);

      if (prefs.shabbat && fridayZm.candleLighting) {
        const remindAt = new Date(fridayZm.candleLighting.getTime() - 18 * 60 * 1000);
        const str = fmt2(fridayZm.candleLighting, loc.tz);
        add(remindAt, "🕯️ Shabbat Candle Lighting", `Light candles in 18 minutes at ${str}. Shabbat Shalom!`, `candle-push-${w}`);
      }

      if (prefs.havdalah && satZm.havdalah) {
        const str = fmt2(satZm.havdalah, loc.tz);
        add(satZm.havdalah, "✨ Havdalah Time", `Shabbat has ended at ${str}. Shavua Tov — have a wonderful week!`, `havdalah-push-${w}`);
      }

      if (prefs.shabbatDigest) {
        const digestAt = zonedDateTime(friday, 8, 0, loc.tz);
        const parashiyot = getUpcomingParashiyot(friday, 1);
        const parashaName = parashiyot[0]?.name ?? "Shabbat";
        const candleStr = fridayZm.candleLighting ? fmt2(fridayZm.candleLighting, loc.tz) : "--:--";
        const havdalahStr = satZm.havdalah ? fmt2(satZm.havdalah, loc.tz) : "--:--";
        add(digestAt, `📜 Parashat ${parashaName}`, `🕯 Candles: ${candleStr} · ✨ Havdalah: ${havdalahStr} · Shabbat Shalom!`, `digest-push-${w}`);
      }

      if (prefs.parasha) {
        const parashiyot = getUpcomingParashiyot(friday, 1);
        if (parashiyot[0]) {
          const { name, hebrewName } = parashiyot[0];
          const fireAt = zonedDateTime(friday, 8, 0, loc.tz);
          const heb = hebrewName ? ` (${hebrewName})` : "";
          add(fireAt, `📖 Parashat ${name}${heb}`, `This Shabbat's Torah portion is Parashat ${name}. Shabbat Shalom to the Bnei Menashe community!`, `parasha-push-${w}`);
        }
      }
    }
  }

  if (prefs.holiday || prefs.fastDay || prefs.specialEvent) {
    const today = new Date(locationToday);
    const end = new Date(today);
    end.setDate(end.getDate() + 45);
    const events = HebrewCalendar.calendar({
      start: today,
      end,
      il: true,
      isHebrewYear: false,
      mask: flags.CHAG | flags.MODERN_HOLIDAY | flags.MINOR_FAST | flags.MAJOR_FAST | flags.ROSH_CHODESH | flags.SPECIAL_SHABBAT,
    });
    const seen = new Set<string>();
    for (const ev of events) {
      const date = ev.getDate().greg();
      date.setHours(0, 0, 0, 0);
      const name = ev.render("en");
      if (seen.has(name)) continue;
      seen.add(name);
      const eventFlags = ev.getFlags();
      const isFast = Boolean(eventFlags & (flags.MINOR_FAST | flags.MAJOR_FAST));
      const isSpecial = Boolean(eventFlags & (flags.ROSH_CHODESH | flags.SPECIAL_SHABBAT));
      if ((isFast && !prefs.fastDay) || (isSpecial && !prefs.specialEvent) || (!isFast && !isSpecial && !prefs.holiday)) continue;
      const dayBefore = new Date(date);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const reminderAt = zonedDateTime(dayBefore, 8, 0, loc.tz);
      const dateStr = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      const category = isFast ? "fast" : isSpecial ? "special" : "holiday";
      add(reminderAt, `${isFast ? "⚠️" : "✡"} ${name} Tomorrow`, isFast ? `Tomorrow is ${name}. Plan your fast and reflection.` : `${name} begins tomorrow, ${dateStr}. Chag Sameach to the Bnei Menashe community!`, `${category}-push-${name.replace(/\s+/g, "-").toLowerCase()}`);
    }
  }

  if (prefs.shema || prefs.prayers) {
    const base = new Date(locationToday);
    for (let i = 0; i <= 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const pz = calculateZmanim(d, loc.lat, loc.lng);
      const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      if (prefs.shema && pz.latestShema) {
        const remindAt = new Date(pz.latestShema.getTime() - lead * 60 * 1000);
        const str = fmt2(pz.latestShema, loc.tz);
        add(remindAt, `📖 Latest Shema in ${lead} min`, `Deadline to recite Shema is at ${str} (${dateStr}). Don't miss it!`, `shema-push-${i}`);
      }
      if (prefs.prayers) {
        if (pz.sunrise) {
          const remindAt = new Date(pz.sunrise.getTime() - lead * 60 * 1000);
          add(remindAt, `🌅 Shacharit in ${lead} min`, `Morning prayer at ${fmt2(pz.sunrise, loc.tz)} in ${loc.name}. ${dateStr}.`, `shacharit-push-${i}`);
        }
        if (pz.minchaKetana) {
          const remindAt = new Date(pz.minchaKetana.getTime() - lead * 60 * 1000);
          add(remindAt, `🌤 Mincha in ${lead} min`, `Ideal Mincha at ${fmt2(pz.minchaKetana, loc.tz)} in ${loc.name}. ${dateStr}.`, `mincha-push-${i}`);
        }
        if (pz.tzais) {
          const remindAt = new Date(pz.tzais.getTime() - lead * 60 * 1000);
          add(remindAt, `🌙 Maariv in ${lead} min`, `Nightfall and Maariv at ${fmt2(pz.tzais, loc.tz)} in ${loc.name}. ${dateStr}.`, `maariv-push-${i}`);
        }
      }
    }
  }

  if (prefs.omer) {
    const today = new Date(locationToday);
    for (let i = 0; i <= 50; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      const events = HebrewCalendar.calendar({ start: checkDate, end: checkDate, il: true, isHebrewYear: false, mask: flags.OMER_COUNT });
      if (events.length === 0) continue;
      const ev = events[0] as any;
      const omerDay = typeof ev.getOmer === "function" ? ev.getOmer() : null;
      if (!omerDay) continue;
      const zmanim = calculateZmanim(checkDate, loc.lat, loc.lng);
      const nightfall = zmanim.tzais ?? zmanim.havdalah;
      if (!nightfall) continue;
      add(nightfall, `🌾 Count the Omer — Day ${omerDay}`, `Tonight is day ${omerDay} of 49. Time to count!`, `omer-push-${omerDay}`);
    }
  }

  return items;
}

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/push/vapid-public-key`, { credentials: "include" });
    if (!res.ok) return null;
    const { publicKey } = await res.json();
    return publicKey ?? null;
  } catch { return null; }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await (window as any).Clerk?.session?.getToken() ?? null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function postSubscription(
  subscription: PushSubscription,
  schedule: ScheduleItem[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      credentials: "include",
      body: JSON.stringify({ subscription: subscription.toJSON(), schedule }),
    });
    const body = await res.json().catch(() => ({})) as { error?: string };
    return { ok: res.ok, error: body.error };
  } catch {
    return { ok: false, error: "Could not reach the notification service." };
  }
}

async function deleteSubscription(endpoint: string): Promise<void> {
  try {
      await fetch(`${API_BASE}/push/unsubscribe`, {
      method: "DELETE",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        credentials: "include",
      body: JSON.stringify({ endpoint }),
    });
  } catch {}
}

export function usePushSubscription(location: Location, prefs: NotificationPrefs, leadTime: LeadTime, userId?: string | null) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subRef = useRef<PushSubscription | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    if (!isSupported) return;
    let cancelled = false;
    (async () => {
      try {
        const sw = await navigator.serviceWorker.ready;
        const existing = await sw.pushManager.getSubscription();
        if (!existing || Notification.permission !== "granted" || !userId) {
          if (!cancelled) {
            subRef.current = existing;
            setIsSubscribed(false);
            localStorage.removeItem(SW_KEY);
          }
          return;
        }
        subRef.current = existing;
        const schedule = buildSchedule(prefs, location, leadTime);
        const result = await postSubscription(existing, schedule);
        if (!cancelled) {
          setIsSubscribed(result.ok);
          setError(result.ok ? null : result.error ?? "Failed to register with server.");
          if (result.ok) localStorage.setItem(SW_KEY, "true");
          else localStorage.removeItem(SW_KEY);
        }
      } catch {
        if (!cancelled) {
          setIsSubscribed(false);
          setError("Could not verify the browser notification subscription.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isSupported, userId, location, prefs, leadTime]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) { setError("Push notifications are not supported in this browser."); return false; }
    setIsLoading(true);
    setError(null);
    try {
      if (!userId) {
        setError("Sign in before enabling browser notifications.");
        return false;
      }
      if (!isValidIanaTimeZone(location.tz)) {
        setError("Select a valid timezone before enabling notifications.");
        return false;
      }
      if (Notification.permission === "denied") {
        setError("Browser notifications are blocked. Allow them in your browser site settings, then try again.");
        return false;
      }
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Notification permission was not granted.");
          return false;
        }
      }
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) { setError("Push service is not configured."); return false; }

      const sw = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
      await navigator.serviceWorker.ready;

      let sub = await sw.pushManager.getSubscription();
      if (!sub) {
        sub = await sw.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }
      subRef.current = sub;
      const schedule = buildSchedule(prefs, location, leadTime);
      const result = await postSubscription(sub, schedule);
      if (!result.ok) {
        setError(result.error ?? "Failed to register with server.");
        return false;
      }
      setIsSubscribed(true);
      try { localStorage.setItem(SW_KEY, "true"); } catch {}
      return true;
    } catch (err: any) {
      setError(err?.message ?? "Failed to enable push notifications.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, prefs, location, leadTime, userId]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const sw = await navigator.serviceWorker.ready;
      const sub = await sw.pushManager.getSubscription();
      if (sub) {
        await deleteSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      try { localStorage.removeItem(SW_KEY); } catch {}
    } catch {}
    setIsLoading(false);
  }, []);

  const sendTest = useCallback(async (): Promise<boolean> => {
    const sw = await navigator.serviceWorker.ready;
    const sub = subRef.current ?? await sw.pushManager.getSubscription();
    if (!sub) return false;
    try {
      const res = await fetch(`${API_BASE}/push/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        credentials: "include",
      });
      return res.ok;
    } catch { return false; }
  }, []);

  return { isSubscribed, isSupported, isLoading, error, subscribe, unsubscribe, sendTest };
}

import { useState, useEffect, useCallback, useRef } from "react";
import { HebrewCalendar, HDate, flags } from "@hebcal/core";
import { calculateZmanim } from "../lib/zmanim";
import { getUpcomingParashiyot, getUpcomingHolidays as getLibHolidays } from "../lib/parasha";
import { Location } from "../lib/locations";
import type { NotificationPrefs, LeadTime } from "./useNotifications";

const API_BASE = "/api";
const SW_KEY = "menashe-push-subscribed";

type ScheduleItem = {
  fireAt: number;
  title: string;
  body: string;
  tag: string;
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

function buildSchedule(prefs: NotificationPrefs, loc: Location, lead: LeadTime): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  const now = Date.now();

  function add(fireAt: Date, title: string, body: string, tag: string) {
    const ms = fireAt.getTime();
    if (ms > now) items.push({ fireAt: ms, title, body, tag });
  }

  if (prefs.shabbat || prefs.havdalah || prefs.shabbatDigest || prefs.parasha) {
    for (let w = 0; w < 8; w++) {
      const friday = w === 0 ? getNextWeekday(5) : getNextWeekday(5, new Date(Date.now() + w * 7 * 86400000));
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
        const digestAt = new Date(friday);
        digestAt.setHours(8, 0, 0, 0);
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
          const fireAt = new Date(friday);
          fireAt.setHours(8, 0, 0, 0);
          const heb = hebrewName ? ` (${hebrewName})` : "";
          add(fireAt, `📖 Parashat ${name}${heb}`, `This Shabbat's Torah portion is Parashat ${name}. Shabbat Shalom to the Bnei Menashe community!`, `parasha-push-${w}`);
        }
      }
    }
  }

  if (prefs.holiday) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + 45);
    const events = HebrewCalendar.calendar({ start: today, end, il: true, isHebrewYear: false, mask: flags.CHAG | flags.MODERN_HOLIDAY });
    const seen = new Set<string>();
    for (const ev of events) {
      const date = ev.getDate().greg();
      date.setHours(0, 0, 0, 0);
      const name = ev.render("en");
      if (seen.has(name)) continue;
      seen.add(name);
      const dayBefore = new Date(date);
      dayBefore.setDate(dayBefore.getDate() - 1);
      dayBefore.setHours(8, 0, 0, 0);
      const dateStr = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      add(dayBefore, `✡ ${name} Begins Tomorrow`, `${name} starts tomorrow, ${dateStr}. Chag Sameach to the Bnei Menashe community!`, `holiday-push-${name.replace(/\s+/g, "-").toLowerCase()}`);
    }
  }

  if (prefs.shema || prefs.prayers) {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
    const res = await fetch(`${API_BASE}/push/vapid-public-key`);
    if (!res.ok) return null;
    const { publicKey } = await res.json();
    return publicKey ?? null;
  } catch { return null; }
}

async function postSubscription(subscription: PushSubscription, schedule: ScheduleItem[], userId?: string | null): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON(), schedule, userId: userId ?? undefined }),
    });
    return res.ok;
  } catch { return false; }
}

async function deleteSubscription(endpoint: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/push/unsubscribe`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
  } catch {}
}

export function usePushSubscription(location: Location, prefs: NotificationPrefs, leadTime: LeadTime, userId?: string | null) {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    try { return localStorage.getItem(SW_KEY) === "true"; } catch { return false; }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subRef = useRef<PushSubscription | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  useEffect(() => {
    if (!isSupported || !isSubscribed) return;
    let cancelled = false;
    (async () => {
      const sw = await navigator.serviceWorker.ready;
      const existing = await sw.pushManager.getSubscription();
      if (!cancelled && existing) {
        subRef.current = existing;
        const schedule = buildSchedule(prefs, location, leadTime);
        await postSubscription(existing, schedule, userId);
      }
    })();
    return () => { cancelled = true; };
  }, [isSupported, isSubscribed, location, prefs, leadTime, userId]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) { setError("Push notifications are not supported in this browser."); return false; }
    setIsLoading(true);
    setError(null);
    try {
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
      const ok = await postSubscription(sub, schedule, userId);
      if (!ok) { setError("Failed to register with server."); return false; }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      return res.ok;
    } catch { return false; }
  }, []);

  return { isSubscribed, isSupported, isLoading, error, subscribe, unsubscribe, sendTest };
}

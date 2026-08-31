import { useState, useEffect, useCallback, useRef } from "react";
import { Location } from "../lib/locations";
import type { NotificationPrefs, LeadTime } from "./useNotifications";
import {
  buildWebNotificationSchedule,
  type WebNotificationScheduleConfig,
  type WebNotificationScheduleItem,
} from "@workspace/shared-core";
import {
  isValidIanaTimeZone,
} from "../lib/timezone";
import { getAuthToken } from "../lib/authToken";

const API_BASE = "/api";
const SW_KEY = "menashe-push-subscribed";

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

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/push/vapid-public-key`, { credentials: "include" });
    if (!res.ok) return null;
    const { publicKey } = await res.json();
    return publicKey ?? null;
  } catch { return null; }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function postSubscription(
  subscription: PushSubscription,
  schedule: WebNotificationScheduleItem[],
  scheduleConfig: WebNotificationScheduleConfig,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      credentials: "include",
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        schedule,
        scheduleConfig,
      }),
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
        const scheduleConfig = { prefs, location, leadTime };
        const schedule = buildWebNotificationSchedule(scheduleConfig);
        const result = await postSubscription(existing, schedule, scheduleConfig);
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
      const scheduleConfig = { prefs, location, leadTime };
      const schedule = buildWebNotificationSchedule(scheduleConfig);
      const result = await postSubscription(sub, schedule, scheduleConfig);
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

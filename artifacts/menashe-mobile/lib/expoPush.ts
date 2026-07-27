import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Location } from "./locations";
import type { NotificationPrefs } from "./notifications";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

async function authFetch(path: string, getToken: () => Promise<string | null>, options: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  const finalStatus = existing === "granted"
    ? existing
    : (await Notifications.requestPermissionsAsync()).status;
  if (finalStatus !== "granted") return null;
  try {
    const result = await Notifications.getExpoPushTokenAsync();
    return result.data;
  } catch {
    return null;
  }
}

export async function registerExpoPushToken(
  token: string,
  getToken: () => Promise<string | null>,
  location?: Location,
  notifPrefs?: NotificationPrefs,
  leadMins?: number,
): Promise<void> {
  await authFetch("/push/expo-token", getToken, {
    method: "POST",
    body: JSON.stringify({ token, location, notifPrefs, leadMins }),
  });
}

export async function unregisterExpoPushToken(
  token: string,
  getToken: () => Promise<string | null>,
): Promise<void> {
  await authFetch("/push/expo-token", getToken, {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
}

export async function sendTestExpoPush(
  getToken: () => Promise<string | null>,
): Promise<void> {
  await authFetch("/push/expo-send-test", getToken, { method: "POST", body: "{}" });
}

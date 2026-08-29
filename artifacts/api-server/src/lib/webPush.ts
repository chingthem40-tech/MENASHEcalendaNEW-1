import webpush from "web-push";
import { logger } from "./logger";

export type WebPushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type WebPushPayload = {
  title: string;
  body: string;
  tag: string;
  icon?: string;
  url?: string;
};

const VAPID_PUBLIC_KEY = (process.env["VAPID_PUBLIC_KEY"] ?? "").trim();
const VAPID_PRIVATE_KEY = (process.env["VAPID_PRIVATE_KEY"] ?? "").replace(/[="'\s]/g, "");
const VAPID_SUBJECT = (process.env["VAPID_SUBJECT"] ?? "").trim();

let vapidError: string | null = null;

function isValidPrivateKey(value: string): boolean {
  try {
    return Buffer.from(value, "base64url").length === 32;
  } catch {
    return false;
  }
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
  vapidError = "VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT are required";
} else if (!isValidPrivateKey(VAPID_PRIVATE_KEY)) {
  vapidError = "VAPID_PRIVATE_KEY is not a valid 32-byte base64url key";
} else if (!VAPID_SUBJECT.startsWith("mailto:") && !VAPID_SUBJECT.startsWith("https://")) {
  vapidError = "VAPID_SUBJECT must be a mailto: or HTTPS URL";
} else {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch {
    vapidError = "VAPID details failed validation";
  }
}

if (vapidError) {
  logger.warn({ reason: vapidError }, "Web Push is not ready");
}

export function isWebPushReady(): boolean {
  return vapidError === null;
}

export function getWebPushPublicKey(): string | null {
  return isWebPushReady() ? VAPID_PUBLIC_KEY : null;
}

export function getWebPushReadiness(): { ready: boolean; reason?: string } {
  return vapidError ? { ready: false, reason: vapidError } : { ready: true };
}

export function isExpiredWebPushError(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number } | null)?.statusCode;
  return statusCode === 404 || statusCode === 410;
}

export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: WebPushPayload,
): Promise<void> {
  if (!isWebPushReady()) {
    throw new Error("Web Push is not configured");
  }

  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      ...payload,
      icon: payload.icon ?? "/favicon.svg",
      url: payload.url ?? "/",
    }),
  );
}
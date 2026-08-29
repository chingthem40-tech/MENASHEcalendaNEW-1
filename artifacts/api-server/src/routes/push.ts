import { Router } from "express";
import { createHash } from "node:crypto";
import type { PushSubscription } from "web-push";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { requireAuth } from "../lib/authorization";
import { requireAdmin } from "../lib/requireAdmin";
import { pushSubscribeRateLimiter } from "../lib/rateLimiter";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";
import { HebrewCalendar, HDate, flags } from "@hebcal/core";
import {
  enqueueWebNotificationForAll,
  enqueueWebNotificationForUser,
  startWebNotificationQueue,
  syncClientSchedule,
  type WebNotificationScheduleItem,
} from "../lib/webNotificationJobs";
import {
  getWebPushPublicKey,
  isExpiredWebPushError,
  isWebPushReady,
  sendWebPush,
} from "../lib/webPush";

const expo = new Expo();

const router = Router();

export type ScheduleItem = WebNotificationScheduleItem;

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function isValidScheduleItem(item: unknown): item is ScheduleItem {
  if (!item || typeof item !== "object") return false;
  const value = item as Partial<ScheduleItem>;
  const now = Date.now();
  return (
    Number.isFinite(value.fireAt) &&
    Number(value.fireAt) >= now - 5 * 60_000 &&
    Number(value.fireAt) <= now + 95 * 24 * 60 * 60_000 &&
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    value.title.length <= 200 &&
    typeof value.body === "string" &&
    value.body.trim().length > 0 &&
    value.body.length <= 2_000 &&
    typeof value.tag === "string" &&
    value.tag.trim().length > 0 &&
    value.tag.length <= 200 &&
    (value.timezone === undefined ||
      (typeof value.timezone === "string" && isValidTimeZone(value.timezone)))
  );
}

const WEB_PUSH_HOSTS = new Set([
  "fcm.googleapis.com",
  "android.googleapis.com",
  "updates.push.services.mozilla.com",
  "push.services.mozilla.com",
  "web.push.apple.com",
]);

function isValidBase64UrlKey(value: unknown, decodedLength: number): value is string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) return false;
  try {
    return Buffer.from(value, "base64url").length === decodedLength;
  } catch {
    return false;
  }
}

function isValidPushSubscription(subscription: PushSubscription | undefined): subscription is PushSubscription {
  if (!subscription?.endpoint || subscription.endpoint.length > 4_096) return false;
  let endpoint: URL;
  try {
    endpoint = new URL(subscription.endpoint);
  } catch {
    return false;
  }
  const host = endpoint.hostname.toLowerCase();
  const supportedHost =
    WEB_PUSH_HOSTS.has(host) ||
    (host.endsWith(".notify.windows.com") && host.length > ".notify.windows.com".length);
  const keys = subscription.keys as { p256dh?: unknown; auth?: unknown } | undefined;
  return (
    endpoint.protocol === "https:" &&
    !endpoint.username &&
    !endpoint.password &&
    supportedHost &&
    endpoint.pathname.length > 1 &&
    isValidBase64UrlKey(keys?.p256dh, 65) &&
    isValidBase64UrlKey(keys?.auth, 16)
  );
}

function subId(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

async function dbUpsert(
  subscription: PushSubscription,
  schedule: ScheduleItem[],
  userId: string,
): Promise<string> {
  const id = subId(subscription.endpoint);
  const keys = subscription.keys as { p256dh: string; auth: string };
  const result = await pool.query<{ id: string }>(
    `INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, schedule, user_id, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())
     ON CONFLICT (endpoint) DO UPDATE
       SET p256dh     = EXCLUDED.p256dh,
           auth       = EXCLUDED.auth,
           schedule   = EXCLUDED.schedule,
           user_id    = EXCLUDED.user_id,
           updated_at = NOW()
       WHERE push_subscriptions.user_id IS NULL
          OR push_subscriptions.user_id = EXCLUDED.user_id
     RETURNING id`,
    [id, subscription.endpoint, keys.p256dh, keys.auth, JSON.stringify(schedule), userId],
  );
  const saved = result.rows[0];
  if (!saved) throw new Error("Subscription endpoint is already registered");
  return saved.id;
}

/** Returns true if all sends succeeded (or only expired 410/404 subscriptions were cleaned up). */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; tag: string; icon?: string },
): Promise<boolean> {
  if (!isWebPushReady()) {
    logger.warn({ userId }, "sendPushToUser: VAPID is not configured");
    return false;
  }
  let rows: Array<{ endpoint: string; p256dh: string; auth: string }>;
  try {
    const result = await pool.query(
      "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1",
      [userId],
    );
    rows = result.rows;
  } catch { return false; }
  let hasTransientFailure = false;
  for (const row of rows) {
    try {
      await sendWebPush(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        { ...payload, icon: payload.icon ?? "/favicon.svg" },
      );
    } catch (err: any) {
      if (isExpiredWebPushError(err)) {
        await pool.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [row.endpoint]).catch(() => {});
      } else {
        hasTransientFailure = true;
        logger.warn({ err, userId }, "sendPushToUser: transient send failure");
      }
    }
  }
  return !hasTransientFailure;
}

async function fireBroadcastNow(bc: { id: number; emoji: string; title: string; body: string }) {
  const fullTitle = `${bc.emoji} ${bc.title}`;
  const tag = `broadcast-${bc.id}`;
  const icon = "/favicon.svg";

  await enqueueWebNotificationForAll({
    sourceType: "scheduled_broadcast",
    sourceId: String(bc.id),
    fireAt: Date.now(),
    title: fullTitle,
    body: bc.body,
    tag,
    icon,
    url: "/",
  });

  // Expo push
  let expoRows: Array<{ token: string }> = [];
  try {
    const r = await pool.query<{ token: string }>("SELECT token FROM expo_push_tokens");
    expoRows = r.rows;
  } catch {}
  const msgs: import("expo-server-sdk").ExpoPushMessage[] = expoRows
    .filter((r) => Expo.isExpoPushToken(r.token))
    .map((r) => ({ to: r.token, title: fullTitle, body: bc.body, sound: "default" as const, data: { tag } }));
  if (msgs.length > 0) {
    try {
      const chunks = expo.chunkPushNotifications(msgs);
      for (const chunk of chunks) await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      logger.error({ err }, "scheduled-broadcast: expo send failed");
    }
  }

  const pendingWeb = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM web_notification_jobs
      WHERE source_type = 'scheduled_broadcast' AND source_id = $1`,
    [String(bc.id)],
  );
  const hasWebJobs = Number(pendingWeb.rows[0]?.count ?? 0) > 0;
  await pool.query(
    `UPDATE scheduled_broadcasts
        SET sent_at = CASE WHEN $2::boolean THEN sent_at ELSE COALESCE(sent_at, NOW()) END
      WHERE id = $1`,
    [bc.id, hasWebJobs],
  );
  logger.info({ id: bc.id, title: bc.title }, "scheduled-broadcast: queued");
}

/**
 * broadcastDedicationPush — fire a real-time community notification when
 * someone dedicates Torah study to a memorial candle.
 * Fire-and-forget: callers should not await; failures are logged, never thrown.
 */
export async function broadcastDedicationPush(opts: {
  learnerName: string;
  studySubject: string;
  deceasedName: string;
}): Promise<void> {
  const title = "🕯 Torah Dedication";
  const body  = `${opts.learnerName} is studying ${opts.studySubject} in memory of ${opts.deceasedName}`;
  const tag   = `dedication-${Date.now()}`;
  const icon  = "/favicon.svg";

  // ── Web push ──────────────────────────────────────────────────────────────
  if (isWebPushReady()) {
    let webRows: Array<{ id: string; endpoint: string; p256dh: string; auth: string }> = [];
    try {
      const r = await pool.query<{ id: string; endpoint: string; p256dh: string; auth: string }>(
        "SELECT id, endpoint, p256dh, auth FROM push_subscriptions"
      );
      webRows = r.rows;
    } catch { /* no subscribers — skip */ }
    for (const row of webRows) {
      try {
        await sendWebPush(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          { title, body, tag, icon, url: "/" },
        );
      } catch (err: any) {
        if (isExpiredWebPushError(err)) {
          await pool.query("DELETE FROM push_subscriptions WHERE id = $1", [row.id]).catch(() => {});
        }
      }
    }
  }

  // ── Expo push ─────────────────────────────────────────────────────────────
  let expoRows: Array<{ token: string }> = [];
  try {
    const r = await pool.query<{ token: string }>("SELECT token FROM expo_push_tokens");
    expoRows = r.rows;
  } catch { /* no tokens — skip */ }
  const msgs: ExpoPushMessage[] = expoRows
    .filter(r => Expo.isExpoPushToken(r.token))
    .map(r => ({ to: r.token, title, body, sound: "default" as const, data: { tag } }));
  if (msgs.length > 0) {
    try {
      const chunks = expo.chunkPushNotifications(msgs);
      for (const chunk of chunks) await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      logger.error({ err }, "dedication-push: expo send failed");
    }
  }

  logger.info(
    { learnerName: opts.learnerName, deceasedName: opts.deceasedName },
    "dedication-push: broadcast fired"
  );
}

export function startPushScheduler() {
  startWebNotificationQueue();
  let running = false;
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const r = await pool.query<{ id: number; emoji: string; title: string; body: string }>(
        `WITH candidates AS (
           SELECT scheduled.id
             FROM scheduled_broadcasts scheduled
            WHERE scheduled.fire_at <= NOW()
              AND scheduled.sent_at IS NULL
              AND (
                scheduled.queued_at IS NULL
                OR (
                  scheduled.queued_at < NOW() - INTERVAL '10 minutes'
                  AND NOT EXISTS (
                    SELECT 1 FROM web_notification_jobs job
                    WHERE job.source_type = 'scheduled_broadcast'
                      AND job.source_id = scheduled.id::text
                  )
                )
              )
            ORDER BY scheduled.fire_at, scheduled.id
            FOR UPDATE SKIP LOCKED
            LIMIT 20
         )
         UPDATE scheduled_broadcasts scheduled
            SET queued_at = NOW()
           FROM candidates
          WHERE scheduled.id = candidates.id
        RETURNING scheduled.id, scheduled.emoji, scheduled.title, scheduled.body`
      );
      for (const bc of r.rows) {
        await fireBroadcastNow(bc);
      }
    } catch (err) {
      logger.error({ err }, "push-scheduler: failed to check scheduled broadcasts");
    } finally {
      running = false;
    }
  }, 30_000);
}

router.get("/push/vapid-public-key", (_req, res) => {
  const publicKey = getWebPushPublicKey();
  if (!publicKey) {
    res.status(503).json({ error: "Push notifications not configured" });
    return;
  }
  res.json({ publicKey });
});

router.post("/push/subscribe", requireAuth, pushSubscribeRateLimiter, async (req, res) => {
  const { subscription, schedule } = req.body as {
    subscription: PushSubscription;
    schedule: ScheduleItem[];
  };
  if (!isValidPushSubscription(subscription)) {
    res.status(400).json({ error: "Invalid or unsupported Web Push subscription" });
    return;
  }
  const userId = (req as any).userId as string;
  try {
    const uniqueSchedule = Array.from(
      new Map((Array.isArray(schedule) ? schedule : [])
        .filter(isValidScheduleItem)
        .map((item) => [`${item.tag}:${item.fireAt}`, item])).values(),
    );
    if (uniqueSchedule.length > 500) {
      res.status(400).json({ error: "Schedule contains too many items" });
      return;
    }
    const id = await dbUpsert(subscription, uniqueSchedule, userId);
    await syncClientSchedule(id, uniqueSchedule);
    res.json({ ok: true, id });
  } catch (err) {
    if (err instanceof Error && err.message === "Subscription endpoint is already registered") {
      res.status(409).json({ error: err.message });
      return;
    }
    logger.error({ err }, "push/subscribe: db error");
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

router.delete("/push/unsubscribe", requireAuth, async (req, res) => {
  const { endpoint } = req.body as { endpoint: string };
  if (!endpoint) { res.status(400).json({ error: "Missing endpoint" }); return; }
  try {
    const userId = (req as any).userId as string;
    await pool.query("DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2", [endpoint, userId]);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "push/unsubscribe: db error");
    res.status(500).json({ error: "Failed to remove subscription" });
  }
});

router.get("/push/subscriber-count", requireAdmin, async (req, res) => {
  try {
    const webResult = await pool.query("SELECT COUNT(*) FROM push_subscriptions");
    const expoResult = await pool.query("SELECT COUNT(*) FROM expo_push_tokens");
    res.json({
      web: parseInt(webResult.rows[0].count, 10),
      expo: parseInt(expoResult.rows[0].count, 10),
    });
  } catch (err) {
    logger.error({ err }, "subscriber-count: db error");
    res.status(500).json({ error: "Failed to get count" });
  }
});

router.post("/push/broadcast", requireAdmin, async (req, res) => {
  const { title, body, emoji } = req.body as { title: string; body: string; emoji?: string };
  if (!title?.trim() || !body?.trim()) {
    res.status(400).json({ error: "title and body are required" });
    return;
  }

  const icon = "/favicon.svg";
  const tag = `broadcast-${Date.now()}`;
  const fullTitle = emoji ? `${emoji} ${title}` : title;

  let webSent = 0, webFailed = 0, expoSent = 0, expoFailed = 0;

  // — Web push —
  if (isWebPushReady()) {
    try {
      webSent = await enqueueWebNotificationForAll({
        sourceType: "admin_broadcast",
        sourceId: tag,
        fireAt: Date.now(),
        title: fullTitle,
        body,
        tag,
        icon,
        url: "/",
      });
    } catch (err) {
      logger.error({ err }, "broadcast: failed to enqueue web notifications");
      webFailed = 1;
    }
  }

  // — Expo push —
  let expoRows: Array<{ token: string }> = [];
  try {
    const r = await pool.query<{ token: string }>("SELECT token FROM expo_push_tokens");
    expoRows = r.rows;
  } catch (err) {
    logger.error({ err }, "broadcast: failed to load expo tokens");
  }
  const expoMessages: import("expo-server-sdk").ExpoPushMessage[] = expoRows
    .filter((r) => Expo.isExpoPushToken(r.token))
    .map((r) => ({ to: r.token, title: fullTitle, body, sound: "default" as const, data: { tag } }));
  if (expoMessages.length > 0) {
    try {
      const chunks = expo.chunkPushNotifications(expoMessages);
      for (const chunk of chunks) {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        for (const receipt of receipts) {
          if (receipt.status === "ok") expoSent++;
          else expoFailed++;
        }
      }
    } catch (err) {
      logger.error({ err }, "broadcast: expo send failed");
      expoFailed += expoMessages.length;
    }
  }

  logger.info({ webSent, webFailed, expoSent, expoFailed }, "broadcast: complete");
  res.json({ ok: true, webSent, webFailed, expoSent, expoFailed });
});

// ── Scheduled Broadcast endpoints ────────────────────────────────────────────

router.get("/push/broadcast/scheduled", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query<{ id: number; emoji: string; title: string; body: string; fire_at: string; sent_at: string | null; created_at: string }>(
      "SELECT id, emoji, title, body, fire_at, sent_at, created_at FROM scheduled_broadcasts ORDER BY fire_at ASC"
    );
    res.json(r.rows);
  } catch (err) {
    logger.error({ err }, "broadcast/scheduled GET: db error");
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/push/broadcast/scheduled", requireAdmin, async (req, res) => {
  const { emoji, title, body, fireAt } = req.body as { emoji?: string; title: string; body: string; fireAt: string };
  if (!title?.trim() || !body?.trim() || !fireAt) {
    res.status(400).json({ error: "emoji, title, body, fireAt are required" });
    return;
  }
  const fireDate = new Date(fireAt);
  if (isNaN(fireDate.getTime()) || fireDate <= new Date()) {
    res.status(400).json({ error: "fireAt must be a future date" });
    return;
  }
  try {
    const r = await pool.query<{ id: number }>(
      "INSERT INTO scheduled_broadcasts (emoji, title, body, fire_at) VALUES ($1,$2,$3,$4) RETURNING id",
      [emoji ?? "📢", title.trim(), body.trim(), fireDate.toISOString()]
    );
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    logger.error({ err }, "broadcast/scheduled POST: db error");
    res.status(500).json({ error: "DB error" });
  }
});

router.delete("/push/broadcast/scheduled/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params["id"] ?? ""), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const deleted = await pool.query(
      "DELETE FROM scheduled_broadcasts WHERE id = $1 AND sent_at IS NULL AND queued_at IS NULL RETURNING id",
      [id],
    );
    if (deleted.rowCount === 0) {
      res.status(409).json({ error: "Broadcast is already queued, sent, or does not exist" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "broadcast/scheduled DELETE: db error");
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/push/send-test", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  try {
    const sent = await sendPushToUser(userId, {
      title: "MENASHE Calendar",
      body: "Test notification — your MENASHE notifications are working.",
      tag: "push-test",
      icon: "/favicon.svg",
    });
    if (!sent) {
      res.status(503).json({ error: "Push delivery is not configured or could not reach your device." });
      return;
    }
    res.json({ ok: true });
  } catch (err: any) {
    logger.error({ err, userId }, "push/send-test: delivery failed");
    res.status(500).json({ error: err?.message ?? "Send failed" });
  }
});


// ── Expo Push Token endpoints ────────────────────────────────────────────────

router.post("/push/expo-token", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { token, location, notifPrefs, leadMins } = req.body as {
    token: string;
    location?: object;
    notifPrefs?: object;
    leadMins?: number;
  };
  if (!token || !Expo.isExpoPushToken(token)) {
    res.status(400).json({ error: "Invalid Expo push token" });
    return;
  }
  const id = Buffer.from(token).toString("base64").slice(0, 64);
  try {
    await pool.query(
      `INSERT INTO expo_push_tokens (id, user_id, token, location, notif_prefs, lead_mins, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, NOW())
       ON CONFLICT (token) DO UPDATE
         SET user_id     = EXCLUDED.user_id,
             location    = COALESCE(EXCLUDED.location, expo_push_tokens.location),
             notif_prefs = COALESCE(EXCLUDED.notif_prefs, expo_push_tokens.notif_prefs),
             lead_mins   = EXCLUDED.lead_mins,
             updated_at  = NOW()`,
      [id, userId, token, location ? JSON.stringify(location) : null,
       notifPrefs ? JSON.stringify(notifPrefs) : null, leadMins ?? 15],
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "expo-token: db error");
    res.status(500).json({ error: "Failed to save token" });
  }
});

router.delete("/push/expo-token", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  const { token } = req.body as { token: string };
  if (!token) { res.status(400).json({ error: "Missing token" }); return; }
  try {
    await pool.query(
      "DELETE FROM expo_push_tokens WHERE token = $1 AND user_id = $2",
      [token, userId],
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "expo-token delete: db error");
    res.status(500).json({ error: "Failed to remove token" });
  }
});

router.post("/push/expo-send-test", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  let rows: { token: string }[];
  try {
    const r = await pool.query<{ token: string }>(
      "SELECT token FROM expo_push_tokens WHERE user_id = $1",
      [userId],
    );
    rows = r.rows;
  } catch (err) {
    logger.error({ err }, "expo-send-test: db error");
    res.status(500).json({ error: "Failed to load tokens" });
    return;
  }
  if (rows.length === 0) {
    res.status(404).json({ error: "No registered Expo push tokens for this user" });
    return;
  }
  const messages: ExpoPushMessage[] = rows
    .filter((r) => Expo.isExpoPushToken(r.token))
    .map((r) => ({
      to: r.token,
      title: "✡ Menashe Calendar",
      body: "Server push notifications are working! Shabbat Shalom.",
      sound: "default" as const,
      data: { tag: "push-test" },
    }));
  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) await expo.sendPushNotificationsAsync(chunk);
    res.json({ ok: true, sent: messages.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Send failed" });
  }
});

// ── Holiday Web Push Scheduler ───────────────────────────────────────────────
// Fires at 9am every day and sends a web push to ALL subscribers the day before a holiday.

let _holidayPushLastFiredDate = "";

export function startHolidayWebPushScheduler() {
  setInterval(async () => {
    if (!isWebPushReady()) return;

    const now = new Date();
    if (now.getHours() !== 9 || now.getMinutes() >= 5) return;

    const dateKey = now.toDateString();
    if (_holidayPushLastFiredDate === dateKey) return;

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const events = HebrewCalendar.calendar({
      start: tomorrow,
      end: tomorrowEnd,
      il: true,
      isHebrewYear: false,
      mask: flags.CHAG | flags.MODERN_HOLIDAY | flags.ROSH_CHODESH | flags.MINOR_FAST | flags.MAJOR_FAST,
    });

    if (events.length === 0) return;

    for (const ev of events) {
      const name = ev.render("en");
      const dateStr = tomorrow.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      const sourceId = `${name}:${tomorrow.toISOString().slice(0, 10)}`;
      const queued = await enqueueWebNotificationForAll({
        sourceType: "holiday_day_before",
        sourceId,
        fireAt: Date.now(),
        title: `✡ ${name} Begins Tomorrow`,
        body: `${name} starts tomorrow, ${dateStr}. Chag Sameach from Bnei Menashe!`,
        tag: `holiday-web-${name.replace(/\s+/g, "-").toLowerCase()}-${dateKey}`,
        icon: "/favicon.svg",
        url: "/",
      });
      logger.info({ name, queued }, "holiday-web-push: queued");
    }
    _holidayPushLastFiredDate = dateKey;
  }, 60_000); // check every minute
}

// ── Holiday 1-Hour Reminder Scheduler ────────────────────────────────────────
// Fires every minute; when a holiday midnight is 55–65 minutes away, sends a
// "starts in ~1 hour" push to all web-push subscribers. Deduped per holiday.

const _holidayHourReminderFired = new Set<string>();

export function startHolidayHourReminderScheduler() {
  setInterval(async () => {
    if (!isWebPushReady()) return;

    const now = new Date();
    const nowMs = now.getTime();

    // Look for any holiday whose midnight falls 55–65 min from now
    const windowStart = nowMs + 55 * 60_000;
    const windowEnd   = nowMs + 65 * 60_000;

    // Check today and tomorrow
    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + dayOffset);
      candidate.setHours(0, 0, 0, 0);
      const candidateMs = candidate.getTime();
      if (candidateMs < windowStart || candidateMs > windowEnd) continue;

      // We're in the window — find the holiday
      const dayStart = new Date(candidate);
      const dayEnd   = new Date(candidate);
      dayEnd.setHours(23, 59, 59, 999);

      const events = HebrewCalendar.calendar({
        start: dayStart,
        end: dayEnd,
        il: true,
        isHebrewYear: false,
        mask: flags.CHAG | flags.MODERN_HOLIDAY | flags.MINOR_FAST | flags.MAJOR_FAST,
      });

      for (const ev of events) {
        const name    = ev.render("en");
        const dedupKey = `${name}-${candidate.toDateString()}`;
        if (_holidayHourReminderFired.has(dedupKey)) continue;

        const dateStr = candidate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
        const queued = await enqueueWebNotificationForAll({
          sourceType: "holiday_hour",
          sourceId: `${name}:${candidate.toISOString().slice(0, 10)}`,
          fireAt: Date.now(),
          title: `⏱ ${name} Begins in ~1 Hour`,
          body: `${name} starts at midnight tonight (${dateStr}). Make your final preparations!`,
          tag: `holiday-hour-${name.replace(/\s+/g, "-").toLowerCase()}-${candidate.toDateString()}`,
          icon: "/favicon.svg",
          url: "/",
        });
        _holidayHourReminderFired.add(dedupKey);
        logger.info({ name, queued }, "holiday-hour-reminder: queued");
      }
    }
  }, 60_000); // check every minute
}

// ── Yahrzeit Push Scheduler ──────────────────────────────────────────────────

let _yahrzeitPushLastFiredDate = "";

export function startYahrzeitPushScheduler() {
  setInterval(async () => {
    if (!isWebPushReady()) return;

    const now = new Date();
    if (now.getHours() !== 8 || now.getMinutes() >= 5) return;

    const dateKey = now.toDateString();
    if (_yahrzeitPushLastFiredDate === dateKey) return;

    const hToday = new HDate(now);
    const hDay = hToday.getDate();
    const hMonth = hToday.getMonth();

    let entries: Array<{ user_id: string; name: string }> = [];
    try {
      const r = await pool.query<{ user_id: string; name: string }>(
        "SELECT user_id, name FROM yahrzeit_entries WHERE hebrew_day = $1 AND hebrew_month = $2",
        [hDay, hMonth],
      );
      entries = r.rows;
    } catch (err) {
      logger.error({ err }, "yahrzeit-push: failed to query entries");
      return;
    }

    if (entries.length === 0) return;

    for (const entry of entries) {
      try {
        await enqueueWebNotificationForUser(entry.user_id, {
          sourceType: "personal_yahrzeit",
          sourceId: `${entry.user_id}:${entry.name}:${dateKey}`,
          fireAt: Date.now(),
          title: `🕯 Yahrzeit Today: ${entry.name}`,
          body: `Today is the Yahrzeit of ${entry.name}. May their memory be a blessing. Light a candle and recite Kaddish.`,
          tag: `yahrzeit-${entry.user_id}-${dateKey}`,
          icon: "/favicon.svg",
          url: "/",
        });
      } catch (err) {
        logger.error({ err, name: entry.name }, "yahrzeit-push: failed to queue notification");
      }
    }

    _yahrzeitPushLastFiredDate = dateKey;
    logger.info({ count: entries.length, hDay, hMonth }, "yahrzeit-push: queued reminders");
  }, 60_000);
}

// ── Weekly Yahrzeit Digest Scheduler ─────────────────────────────────────────
//
// Every Sunday at 08:00 local server time, broadcast a digest of ALL community
// yahrzeits falling in the next 7 days to every web-push and Expo subscriber.
// Personal (per-user) yahrzeit_entries are handled by startYahrzeitPushScheduler;
// this scheduler focuses on the shared community_yahrzeit table so the whole
// community stays informed together.

let _weeklyDigestLastFiredDate = "";

export function startWeeklyYahrzeitDigestScheduler() {
  setInterval(async () => {
    if (!isWebPushReady()) return;

    const now = new Date();

    // Only fire on Sundays at 08:00
    if (now.getDay() !== 0) return;
    if (now.getHours() !== 8 || now.getMinutes() >= 5) return;

    const dateKey = now.toDateString();
    if (_weeklyDigestLastFiredDate === dateKey) return;

    // Build the 7 Hebrew (day, month) pairs for Sun–Sat
    type DaySpec = { hDay: number; hMonth: number; gregDate: Date };
    const weekDays: DaySpec[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(12, 0, 0, 0);
      const hd = new HDate(d);
      weekDays.push({ hDay: hd.getDate(), hMonth: hd.getMonth(), gregDate: d });
    }

    // Deduplicate — in rare edge cases two Gregorian dates can share the same
    // Hebrew date (start/end of Hebrew month around midnight), so use a Set.
    const seen = new Set<string>();
    const uniqueDays = weekDays.filter(({ hDay, hMonth }) => {
      const k = `${hDay}-${hMonth}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // Build SQL IN clause: ((day1,month1),(day2,month2),...)
    const params: number[] = [];
    const tuples = uniqueDays.map(({ hDay, hMonth }) => {
      params.push(hDay, hMonth);
      const i = params.length;
      return `($${i - 1}, $${i})`;
    });

    let rows: Array<{ deceased_name: string; hebrew_day: number; hebrew_month: number }> = [];
    try {
      const r = await pool.query<{ deceased_name: string; hebrew_day: number; hebrew_month: number }>(
        `SELECT DISTINCT ON (deceased_name) deceased_name, hebrew_day, hebrew_month
         FROM community_yahrzeit
         WHERE (hebrew_day, hebrew_month) IN (${tuples.join(", ")})
         ORDER BY deceased_name`,
        params,
      );
      rows = r.rows;
    } catch (err) {
      logger.error({ err }, "weekly-yahrzeit-digest: failed to query community_yahrzeit");
      return;
    }

    if (rows.length === 0) {
      logger.info("weekly-yahrzeit-digest: no yahrzeits this week — skipping broadcast");
      return;
    }

    // Match each row back to its Gregorian weekday name for the body text
    function gregDayName(hDay: number, hMonth: number): string {
      const match = weekDays.find((d) => d.hDay === hDay && d.hMonth === hMonth);
      if (!match) return "";
      return match.gregDate.toLocaleDateString("en-US", { weekday: "short" });
    }

    // Build compact body — max ~100 chars for readability
    const MAX_NAMED = 3;
    const named = rows.slice(0, MAX_NAMED).map((r) => {
      const day = gregDayName(r.hebrew_day, r.hebrew_month);
      return day ? `${r.deceased_name} (${day})` : r.deceased_name;
    });
    const extra = rows.length - named.length;

    const title = `🕯 ${rows.length} Yahrzeit${rows.length > 1 ? "s" : ""} This Week`;
    const body =
      named.join(" · ") +
      (extra > 0 ? ` · +${extra} more` : "") +
      " — May their memory be a blessing.";

    // ── Web push ─────────────────────────────────────────────────────────────
    let webSent = 0;
    let hasTransientFailure = false;
    try {
      webSent = await enqueueWebNotificationForAll({
        sourceType: "weekly_yahrzeit_digest",
        sourceId: dateKey,
        fireAt: Date.now(),
        title,
        body,
        tag: `yahrzeit-digest-${dateKey}`,
        icon: "/favicon.svg",
        url: "/",
      });
    } catch (err) {
      hasTransientFailure = true;
      logger.error({ err }, "weekly-yahrzeit-digest: failed to queue web notifications");
    }

    // ── Expo push ─────────────────────────────────────────────────────────────
    let expoRows: Array<{ token: string }> = [];
    try {
      const r = await pool.query<{ token: string }>("SELECT token FROM expo_push_tokens");
      expoRows = r.rows;
    } catch {}

    const msgs: import("expo-server-sdk").ExpoPushMessage[] = expoRows
      .filter((r) => Expo.isExpoPushToken(r.token))
      .map((r) => ({
        to: r.token,
        title,
        body,
        sound: "default" as const,
        data: { tag: `yahrzeit-digest-${dateKey}` },
      }));

    if (msgs.length > 0) {
      try {
        const chunks = expo.chunkPushNotifications(msgs);
        for (const chunk of chunks) await expo.sendPushNotificationsAsync(chunk);
      } catch (err) {
        hasTransientFailure = true;
        logger.error({ err }, "weekly-yahrzeit-digest: expo send failed");
      }
    }

    if (!hasTransientFailure) _weeklyDigestLastFiredDate = dateKey;
    logger.info(
      { yahrzeits: rows.length, webSubscribers: webSent, expoSubscribers: msgs.length, retryable: hasTransientFailure },
      "weekly-yahrzeit-digest: broadcast sent",
    );
  }, 60_000); // check every minute
}

// ── Expo Push Scheduler ──────────────────────────────────────────────────────

function nextShabbatCandles(from: Date = new Date()): Date {
  const d = new Date(from);
  const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilFriday);
  d.setHours(18, 0, 0, 0);
  return d;
}

export function startExpoScheduler() {
  async function tick() {
    let rows: { user_id: string; token: string; notif_prefs: any; location: any; lead_mins: number }[];
    try {
      const r = await pool.query<{ user_id: string; token: string; notif_prefs: any; location: any; lead_mins: number }>(
        "SELECT user_id, token, notif_prefs, location, lead_mins FROM expo_push_tokens",
      );
      rows = r.rows;
    } catch (err) {
      logger.error({ err }, "expo-scheduler: failed to load tokens");
      return;
    }

    const now = new Date();
    const messages: ExpoPushMessage[] = [];

    for (const row of rows) {
      if (!Expo.isExpoPushToken(row.token)) continue;
      const prefs = row.notif_prefs ?? {};

      // Shabbat candle lighting reminder — fire at 18:00 on Fridays
      if (prefs.shabbat !== false) {
        const friday = nextShabbatCandles(now);
        const reminderHour = friday.getHours() - 1;
        if (now.getDay() === 5 && now.getHours() === reminderHour && now.getMinutes() < 5) {
          const tz = row.location?.tz ?? "UTC";
          const localTime = friday.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz });
          messages.push({
            to: row.token,
            title: "🕯️ Shabbat Candle Lighting",
            body: `Candle lighting is in about 1 hour at ${localTime}. Shabbat Shalom!`,
            sound: "default",
            data: { tag: "shabbat" },
          });
        }
      }

      // Holiday alerts — fire at 09:00 the day before
      if (prefs.holiday !== false) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        if (now.getHours() === 9 && now.getMinutes() < 5) {
          const events = HebrewCalendar.calendar({
            start: tomorrow, end: tomorrow, il: true, isHebrewYear: false,
            mask: flags.CHAG | flags.MODERN_HOLIDAY,
          });
          for (const ev of events) {
            const name = ev.render("en");
            const dateStr = tomorrow.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
            messages.push({
              to: row.token,
              title: `✡ ${name} Begins Tomorrow`,
              body: `${name} starts tomorrow, ${dateStr}. Chag Sameach from Bnei Menashe!`,
              sound: "default",
              data: { tag: `holiday-${name.replace(/\s+/g, "-").toLowerCase()}` },
            });
          }
        }
      }

      // Parasha reminder — Friday morning at 08:00
      if (prefs.parasha !== false) {
        if (now.getDay() === 5 && now.getHours() === 8 && now.getMinutes() < 5) {
          const events = HebrewCalendar.calendar({
            start: now, end: now, il: true, isHebrewYear: false,
            mask: flags.PARSHA_HASHAVUA,
          });
          if (events.length > 0) {
            const name = events[0].render("en");
            messages.push({
              to: row.token,
              title: `📖 Parashat ${name}`,
              body: `This Shabbat's Torah portion is Parashat ${name}. Shabbat Shalom from Bnei Menashe!`,
              sound: "default",
              data: { tag: "parasha" },
            });
          }
        }
      }
    }

    if (messages.length === 0) return;
    try {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        for (const receipt of receipts) {
          if (receipt.status === "error") {
            if (receipt.details?.error === "DeviceNotRegistered") {
              const badToken = messages.find((m) =>
                chunk.some((c) => c.to === m.to),
              )?.to;
              if (badToken) {
                await pool.query("DELETE FROM expo_push_tokens WHERE token = $1", [badToken]).catch(() => {});
              }
            }
          }
        }
      }
      logger.info({ count: messages.length }, "expo-scheduler: sent push notifications");
    } catch (err) {
      logger.error({ err }, "expo-scheduler: send failed");
    }
  }

  setInterval(tick, 5 * 60 * 1000);
}

export default router;

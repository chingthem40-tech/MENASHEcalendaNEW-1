import { Router } from "express";
import { z } from "zod";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAdmin } from "../lib/requireAdmin";
import { safeIsAdmin } from "../lib/authorization";
import { apiError } from "../lib/apiError";
import { enqueueWebNotificationForAll } from "../lib/webNotificationJobs";

const router = Router();
const expo = new Expo();

export interface CommunityAnnouncement {
  id: string;
  emoji: string;
  title: string;
  body: string;
  status: "sent" | "scheduled" | "draft";
  pinned: boolean;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

const broadcastSchema = z.object({
  emoji: z.string().max(10).optional(),
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  pinned: z.boolean().optional(),
});

const patchSchema = z.object({
  emoji: z.string().max(10).optional(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().max(2000).optional(),
  pinned: z.boolean().optional(),
  sendNow: z.boolean().optional(),
});

function rowToAnn(row: any): CommunityAnnouncement {
  return {
    id: row.id,
    emoji: row.emoji,
    title: row.title,
    body: row.body,
    status: row.status,
    pinned: row.pinned,
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : null,
    sentAt: row.sent_at ? new Date(row.sent_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function broadcastToAll(ann: CommunityAnnouncement) {
  const title = `${ann.emoji} ${ann.title}`;
  const body = ann.body || ann.title;

  // ── Expo push (mobile) ──────────────────────────────────────────
  let expoTokenRows: { token: string }[] = [];
  try {
    const r = await pool.query<{ token: string }>("SELECT token FROM expo_push_tokens");
    expoTokenRows = r.rows;
  } catch (err) {
    logger.error({ err }, "announcements broadcast: failed to load expo tokens");
  }

  const expoMessages: ExpoPushMessage[] = expoTokenRows
    .filter((r) => Expo.isExpoPushToken(r.token))
    .map((r) => ({
      to: r.token,
      title,
      body,
      sound: "default" as const,
      data: { tag: `announcement-${ann.id}`, announcementId: ann.id },
    }));

  if (expoMessages.length > 0) {
    try {
      const chunks = expo.chunkPushNotifications(expoMessages);
      for (const chunk of chunks) {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        for (const receipt of receipts) {
          if (receipt.status === "error" && receipt.details?.error === "DeviceNotRegistered") {
            const badToken = chunk.find((_, i) => receipts[i] === receipt)?.to;
            if (badToken) await pool.query("DELETE FROM expo_push_tokens WHERE token = $1", [badToken]).catch(() => {});
          }
        }
      }
      logger.info({ count: expoMessages.length }, "announcements: sent expo push");
    } catch (err) {
      logger.error({ err }, "announcements: expo push failed");
    }
  }

  await queueWebAnnouncement(ann);
}

async function queueWebAnnouncement(ann: CommunityAnnouncement): Promise<void> {
  const title = `${ann.emoji} ${ann.title}`;
  const body = ann.body || ann.title;
  const queued = await enqueueWebNotificationForAll({
    sourceType: "community_announcement",
    sourceId: ann.id,
    fireAt:
      ann.status === "scheduled" && ann.scheduledAt
        ? new Date(ann.scheduledAt).getTime()
        : Date.now(),
    title,
    body,
    tag: `announcement-${ann.id}`,
    icon: "/favicon.svg",
    url: "/",
  });
  if (
    queued === 0 &&
    ann.status === "scheduled" &&
    ann.scheduledAt &&
    new Date(ann.scheduledAt).getTime() <= Date.now()
  ) {
    await pool.query(
      "UPDATE community_announcements SET status = 'sent', sent_at = COALESCE(sent_at, NOW()), updated_at = NOW() WHERE id = $1",
      [ann.id],
    );
  }
  logger.info({ announcementId: ann.id, queued }, "announcements: queued web push");
}

// GET /announcements — public feed (sent); admin sees all
router.get("/announcements", async (req, res) => {
  const isAdmin = safeIsAdmin(req);
  try {
    const r = await pool.query(
      isAdmin
        ? `SELECT * FROM community_announcements ORDER BY COALESCE(sent_at, scheduled_at, created_at) DESC LIMIT 100`
        : `SELECT * FROM community_announcements WHERE status = 'sent' ORDER BY pinned DESC, sent_at DESC LIMIT 50`,
    );
    res.json({ announcements: r.rows.map(rowToAnn) });
  } catch (err) {
    logger.error({ err }, "GET /announcements: db error");
    return apiError.internal(res, "Failed to load announcements");
  }
});

// POST /announcements/broadcast — admin creates + sends + pushes
router.post("/announcements/broadcast", requireAdmin, async (req, res) => {
  const parsed = broadcastSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid announcement data", parsed.error.issues);
  }

  const { emoji, title, body, scheduledAt, pinned } = parsed.data;

  const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const isScheduled = !!scheduledAt;
  const status = isScheduled ? "scheduled" : "sent";
  const sentAt = isScheduled ? null : new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO community_announcements (id, emoji, title, body, status, pinned, scheduled_at, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, emoji ?? "📢", title.trim(), body ?? "", status, pinned ?? false,
       scheduledAt ? new Date(scheduledAt) : null, sentAt ? new Date(sentAt) : null],
    );
  } catch (err) {
    logger.error({ err }, "POST /announcements/broadcast: db error");
    return apiError.internal(res, "Failed to save announcement");
  }

  const ann: CommunityAnnouncement = {
    id, emoji: emoji ?? "📢", title: title.trim(), body: body ?? "", status,
    pinned: pinned ?? false,
    scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    sentAt,
    createdAt: new Date().toISOString(),
  };

  try {
    if (status === "sent") {
      await broadcastToAll(ann);
    } else {
      await queueWebAnnouncement(ann);
    }
  } catch (err) {
    logger.error({ err, announcementId: id }, "Failed to enqueue announcement");
    return apiError.internal(res, "Announcement was saved but could not be queued");
  }
  res.json({ ok: true, announcement: ann });
});

// PATCH /announcements/:id — admin update / send draft
router.patch("/announcements/:id", requireAdmin, async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid announcement data", parsed.error.issues);
  }

  const { emoji, title, body, pinned, sendNow } = parsed.data;
  const id = String(req.params.id);

  try {
    const existing = await pool.query("SELECT * FROM community_announcements WHERE id = $1", [id]);
    if (existing.rows.length === 0) { return apiError.notFound(res); }

    const row = existing.rows[0];
    const newEmoji = emoji ?? row.emoji;
    const newTitle = title ?? row.title;
    const newBody = body ?? row.body;
    const newPinned = pinned ?? row.pinned;
    const shouldSendNow = sendNow === true && row.status !== "sent";
    const newStatus = shouldSendNow ? "sent" : row.status;
    const newSentAt = shouldSendNow ? new Date() : row.sent_at;
    const newScheduledAt = shouldSendNow ? null : row.scheduled_at;

    await pool.query(
      `UPDATE community_announcements SET emoji=$1, title=$2, body=$3, pinned=$4, status=$5, sent_at=$6, scheduled_at=$7, updated_at=NOW() WHERE id=$8`,
      [newEmoji, newTitle, newBody, newPinned, newStatus, newSentAt, newScheduledAt, id],
    );

    const ann: CommunityAnnouncement = {
      id, emoji: newEmoji, title: newTitle, body: newBody, status: newStatus,
      pinned: newPinned,
      scheduledAt: newScheduledAt ? new Date(newScheduledAt).toISOString() : null,
      sentAt: newSentAt ? new Date(newSentAt).toISOString() : null,
      createdAt: new Date(row.created_at).toISOString(),
    };
    if (shouldSendNow) {
      await broadcastToAll(ann);
    } else if (row.status === "scheduled") {
      await queueWebAnnouncement(ann);
    }
    res.json({ ok: true, announcement: ann });
  } catch (err) {
    logger.error({ err }, "PATCH /announcements/:id: db error");
    return apiError.internal(res, "Failed to update announcement");
  }
});

// DELETE /announcements/:id — admin delete
router.delete("/announcements/:id", requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const id = String(req.params.id);
    await client.query("BEGIN");
    const jobs = await client.query<{ status: string }>(
      `SELECT status FROM web_notification_jobs
        WHERE source_type = 'community_announcement' AND source_id = $1
        FOR UPDATE`,
      [id],
    );
    if (jobs.rows.some((job) => job.status === "processing")) {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Announcement delivery is already processing" });
      return;
    }
    await client.query(
      `DELETE FROM web_notification_jobs
        WHERE source_type = 'community_announcement'
          AND source_id = $1
          AND status IN ('pending', 'retry', 'failed')`,
      [id],
    );
    await client.query("DELETE FROM community_announcements WHERE id = $1", [id]);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    logger.error({ err }, "DELETE /announcements/:id: db error");
    return apiError.internal(res, "Failed to delete announcement");
  } finally {
    client.release();
  }
});

export default router;

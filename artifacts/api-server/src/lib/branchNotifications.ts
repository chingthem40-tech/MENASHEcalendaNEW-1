/**
 * Branch Notification Helpers — DATA-702
 *
 * Reuses the existing push infrastructure (sendPushToUser in push.ts pattern)
 * to notify branch owners when their branch status changes.
 *
 * Uses the existing push_subscriptions and expo_push_tokens tables.
 * Does NOT build a second notification engine.
 */

import webpush from "web-push";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { pool } from "@workspace/db";
import { logger } from "./logger";
import type { BranchStatus } from "./branchAuth";

const expo = new Expo();

const VAPID_PUBLIC  = process.env["VAPID_PUBLIC_KEY"]  ?? "";
const VAPID_PRIVATE = process.env["VAPID_PRIVATE_KEY"] ?? "";
const VAPID_SUBJECT = process.env["VAPID_SUBJECT"]     ?? "mailto:admin@menashecalendar.app";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try { webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE); } catch {}
}

interface BranchNotifPayload {
  title: string;
  body: string;
  tag: string;
}

function buildPayload(branchName: string, newStatus: BranchStatus, note?: string): BranchNotifPayload {
  const statusLabels: Record<BranchStatus, { title: string; body: string }> = {
    pending_review: {
      title: "Branch Submitted for Review",
      body:  `"${branchName}" has been submitted and is awaiting review.`,
    },
    approved: {
      title: "Branch Approved ✓",
      body:  `"${branchName}" has been approved by the Regional Admin.`,
    },
    active: {
      title: "Branch Activated 🎉",
      body:  `"${branchName}" is now fully active in the BMC registry.`,
    },
    rejected: {
      title: "Branch Requires Attention",
      body:  note
        ? `"${branchName}" was not approved: ${note}`
        : `"${branchName}" was rejected. Please review the feedback and resubmit.`,
    },
    draft: {
      title: "Branch Changes Requested",
      body:  note
        ? `"${branchName}" needs corrections: ${note}`
        : `"${branchName}" has been returned for corrections.`,
    },
    suspended: {
      title: "Branch Suspended",
      body:  note
        ? `"${branchName}" has been suspended: ${note}`
        : `"${branchName}" has been temporarily suspended.`,
    },
    archived: {
      title: "Branch Archived",
      body:  `"${branchName}" has been archived.`,
    },
  };

  const label = statusLabels[newStatus] ?? {
    title: "Branch Status Updated",
    body:  `"${branchName}" status changed to ${newStatus}.`,
  };

  return { ...label, tag: `branch-status-${newStatus}` };
}

/**
 * Notify the owner of a branch about a status change.
 * Sends both web push (browser) and Expo push (mobile) if subscriptions exist.
 * Silently no-ops if VAPID is not configured or no subscriptions found.
 */
export async function notifyBranchOwner(
  ownerUserId: string,
  branchName: string,
  newStatus: BranchStatus,
  note?: string,
): Promise<void> {
  const payload = buildPayload(branchName, newStatus, note);

  // ── Expo (mobile) ─────────────────────────────────────────────
  try {
    const { rows: tokenRows } = await pool.query<{ token: string }>(
      "SELECT token FROM expo_push_tokens WHERE user_id = $1",
      [ownerUserId],
    );

    const messages: ExpoPushMessage[] = tokenRows
      .filter((r) => Expo.isExpoPushToken(r.token))
      .map((r) => ({
        to: r.token,
        title: payload.title,
        body: payload.body,
        sound: "default" as const,
        data: { tag: payload.tag },
      }));

    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk).catch((err) => {
          logger.warn({ err }, "branchNotif: expo push chunk failed");
        });
      }
    }
  } catch (err) {
    logger.warn({ err }, "branchNotif: expo push failed");
  }

  // ── Web push (browser) ────────────────────────────────────────
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  try {
    const { rows: webRows } = await pool.query<{ id: string; endpoint: string; p256dh: string; auth: string }>(
      "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1",
      [ownerUserId],
    );

    const webPayload = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      tag:   payload.tag,
      icon:  "/favicon.svg",
    });

    for (const row of webRows) {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          webPayload,
        );
      } catch (err: any) {
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await pool.query("DELETE FROM push_subscriptions WHERE id = $1", [row.id]).catch(() => {});
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, "branchNotif: web push failed");
  }
}

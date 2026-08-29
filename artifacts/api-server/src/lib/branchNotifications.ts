/**
 * Branch Notification Helpers — DATA-702
 *
 * Reuses the existing push infrastructure (sendPushToUser in push.ts pattern)
 * to notify branch owners when their branch status changes.
 *
 * Uses the existing push_subscriptions and expo_push_tokens tables.
 * Does NOT build a second notification engine.
 */

import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import type { PoolClient } from "pg";
import { pool } from "@workspace/db";
import { logger } from "./logger";
import type { BranchStatus } from "./branchAuth";
import { enqueueWebNotificationForUser } from "./webNotificationJobs";

const expo = new Expo();

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
export async function enqueueBranchOwnerWebNotification(
  ownerUserId: string,
  branchName: string,
  newStatus: BranchStatus,
  note?: string,
  occurrenceId?: string,
  db: Pick<PoolClient, "query"> = pool,
): Promise<void> {
  const payload = buildPayload(branchName, newStatus, note);
  if (!occurrenceId) throw new Error("Branch notification occurrenceId is required");
  await enqueueWebNotificationForUser(ownerUserId, {
    sourceType: "branch_status",
    sourceId: occurrenceId,
    fireAt: Date.now(),
    title: payload.title,
    body: payload.body,
    tag: payload.tag,
    icon: "/favicon.svg",
    url: "/community",
  }, db);
}

export async function sendBranchOwnerExpoNotification(
  ownerUserId: string,
  branchName: string,
  newStatus: BranchStatus,
  note?: string,
): Promise<void> {
  const payload = buildPayload(branchName, newStatus, note);
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
  for (const chunk of expo.chunkPushNotifications(messages)) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}

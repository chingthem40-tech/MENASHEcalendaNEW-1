import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "@workspace/db";
import { logger } from "./logger";
import {
  isExpiredWebPushError,
  isWebPushReady,
  sendWebPush,
  type WebPushPayload,
  type WebPushSubscription,
} from "./webPush";

export type WebNotificationScheduleItem = WebPushPayload & {
  fireAt: number;
  timezone?: string;
};

export type WebNotificationJobInput = WebNotificationScheduleItem & {
  subscriptionId: string;
  idempotencyKey: string;
  sourceType: string;
  sourceId?: string | null;
  maxAttempts?: number;
};

export type ClaimedWebNotificationJob = WebNotificationJobInput & {
  id: number;
  attemptCount: number;
  leaseToken: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const CLAIM_LIMIT = 50;
const LEASE_MS = 5 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

export function makeWebNotificationKey(
  subscriptionId: string,
  tag: string,
  fireAt: number,
  sourceType = "client_schedule",
): string {
  return createHash("sha256")
    .update(`${sourceType}:${subscriptionId}:${tag}:${fireAt}`)
    .digest("hex");
}

async function insertJob(
  executor: Pick<PoolClient, "query">,
  input: WebNotificationJobInput,
): Promise<void> {
  await executor.query(
    `INSERT INTO web_notification_jobs
       (subscription_id, idempotency_key, source_type, source_id, run_at,
        title, body, tag, icon, url, timezone, status, attempts, max_attempts,
        next_attempt_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0), $6, $7, $8, $9, $10,
             $11, 'pending', 0, $12, NULL, NOW(), NOW())
     ON CONFLICT (idempotency_key) DO UPDATE
       SET run_at = EXCLUDED.run_at,
           title = EXCLUDED.title,
           body = EXCLUDED.body,
           tag = EXCLUDED.tag,
           icon = EXCLUDED.icon,
           url = EXCLUDED.url,
           timezone = EXCLUDED.timezone,
           updated_at = NOW()
       WHERE web_notification_jobs.status IN ('pending', 'retry')`,
    [
      input.subscriptionId,
      input.idempotencyKey,
      input.sourceType,
      input.sourceId ?? null,
      input.fireAt,
      input.title,
      input.body,
      input.tag,
      input.icon ?? "/favicon.svg",
      input.url ?? "/",
      input.timezone ?? null,
      input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    ],
  );
}

export async function syncClientSchedule(
  subscriptionId: string,
  schedule: WebNotificationScheduleItem[],
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const keys = schedule.map((item) =>
      makeWebNotificationKey(subscriptionId, item.tag, item.fireAt),
    );
    if (keys.length > 0) {
      await client.query(
        `DELETE FROM web_notification_jobs
         WHERE subscription_id = $1
           AND source_type = 'client_schedule'
           AND status IN ('pending', 'retry')
           AND idempotency_key <> ALL($2::text[])`,
        [subscriptionId, keys],
      );
    } else {
      await client.query(
        `DELETE FROM web_notification_jobs
         WHERE subscription_id = $1
           AND source_type = 'client_schedule'
           AND status IN ('pending', 'retry')`,
        [subscriptionId],
      );
    }

    for (const item of schedule) {
      await insertJob(client, {
        ...item,
        subscriptionId,
        idempotencyKey: makeWebNotificationKey(subscriptionId, item.tag, item.fireAt),
        sourceType: "client_schedule",
      });
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function enqueueWebNotificationForAll(
  input: Omit<WebNotificationJobInput, "subscriptionId" | "idempotencyKey"> & {
    sourceType: string;
    sourceId?: string | null;
  },
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO web_notification_jobs
       (subscription_id, idempotency_key, source_type, source_id, run_at,
        title, body, tag, icon, url, timezone, status, attempts, max_attempts,
        next_attempt_at, created_at, updated_at)
     SELECT ps.id,
            md5($1 || ':' || COALESCE($2, '') || ':' || ps.id),
            $1,
            $2,
            to_timestamp($3 / 1000.0),
            $4, $5, $6, $7, $8, $9,
            'pending', 0, $10, NULL, NOW(), NOW()
       FROM push_subscriptions ps
     ON CONFLICT (idempotency_key) DO UPDATE
       SET run_at = EXCLUDED.run_at,
           title = EXCLUDED.title,
           body = EXCLUDED.body,
           tag = EXCLUDED.tag,
           icon = EXCLUDED.icon,
           url = EXCLUDED.url,
           timezone = EXCLUDED.timezone,
           updated_at = NOW()
       WHERE web_notification_jobs.status IN ('pending', 'retry')`,
    [
      input.sourceType,
      input.sourceId ?? null,
      input.fireAt,
      input.title,
      input.body,
      input.tag,
      input.icon ?? "/favicon.svg",
      input.url ?? "/",
      input.timezone ?? null,
      input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    ],
  );
  return result.rowCount ?? 0;
}

export async function enqueueWebNotificationForUser(
  userId: string,
  input: Omit<WebNotificationJobInput, "subscriptionId" | "idempotencyKey">,
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO web_notification_jobs
       (subscription_id, idempotency_key, source_type, source_id, run_at,
        title, body, tag, icon, url, timezone, status, attempts, max_attempts,
        next_attempt_at, created_at, updated_at)
     SELECT ps.id,
            md5($1 || ':' || COALESCE($2, '') || ':' || ps.id),
            $1,
            $2,
            to_timestamp($3 / 1000.0),
            $4, $5, $6, $7, $8, $9,
            'pending', 0, $10, NULL, NOW(), NOW()
       FROM push_subscriptions ps
      WHERE ps.user_id = $11
     ON CONFLICT (idempotency_key) DO UPDATE
       SET run_at = EXCLUDED.run_at,
           title = EXCLUDED.title,
           body = EXCLUDED.body,
           tag = EXCLUDED.tag,
           icon = EXCLUDED.icon,
           url = EXCLUDED.url,
           timezone = EXCLUDED.timezone,
           updated_at = NOW()
       WHERE web_notification_jobs.status IN ('pending', 'retry')`,
    [
      input.sourceType,
      input.sourceId ?? null,
      input.fireAt,
      input.title,
      input.body,
      input.tag,
      input.icon ?? "/favicon.svg",
      input.url ?? "/",
      input.timezone ?? null,
      input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      userId,
    ],
  );
  return result.rowCount ?? 0;
}

async function claimDueJobs(limit = CLAIM_LIMIT): Promise<ClaimedWebNotificationJob[]> {
  const client = await pool.connect();
  const leaseToken = randomUUID();
  let exhaustedSources: Array<{ source_type: string; source_id: string | null }> = [];
  try {
    await client.query("BEGIN");
    const exhausted = await client.query<{ source_type: string; source_id: string | null }>(
      `UPDATE web_notification_jobs
          SET status = 'failed', lease_token = NULL, lease_expires_at = NULL,
              last_error = COALESCE(last_error, 'Delivery lease expired after final attempt'),
              updated_at = NOW()
        WHERE status = 'processing'
          AND lease_expires_at < NOW()
          AND attempts >= max_attempts
      RETURNING source_type, source_id`,
    );
    exhaustedSources = exhausted.rows;
    const result = await client.query<ClaimedWebNotificationJob>(
      `WITH candidates AS (
         SELECT job.id, ps.endpoint, ps.p256dh, ps.auth
           FROM web_notification_jobs job
           JOIN push_subscriptions ps ON ps.id = job.subscription_id
          WHERE (
            job.status IN ('pending', 'retry')
            AND COALESCE(job.next_attempt_at, job.run_at) <= NOW()
          ) OR (
            job.status = 'processing'
            AND job.lease_expires_at < NOW()
            AND job.attempts < job.max_attempts
          )
          ORDER BY job.run_at ASC, job.id ASC
          FOR UPDATE SKIP LOCKED
          LIMIT $1
       )
       UPDATE web_notification_jobs job
          SET status = 'processing',
              attempts = job.attempts + 1,
              lease_token = $2,
              lease_expires_at = NOW() + ($3 * INTERVAL '1 millisecond'),
              next_attempt_at = NULL,
              updated_at = NOW()
         FROM candidates
        WHERE job.id = candidates.id
       RETURNING job.id, job.subscription_id AS "subscriptionId",
         job.idempotency_key AS "idempotencyKey", job.source_type AS "sourceType",
         job.source_id AS "sourceId", EXTRACT(EPOCH FROM job.run_at) * 1000 AS "fireAt",
         job.title, job.body, job.tag, job.icon, job.url, job.timezone,
         job.attempts AS "attemptCount", job.max_attempts AS "maxAttempts",
         job.lease_token AS "leaseToken",
         candidates.endpoint, candidates.p256dh, candidates.auth`,
      [limit, leaseToken, LEASE_MS],
    );
    await client.query("COMMIT");
    for (const source of exhaustedSources) {
      await finalizeSource(source.source_type, source.source_id).catch((err) => {
        logger.error({ err, source }, "Failed to finalize exhausted web notification source");
      });
    }
    return result.rows.map((row) => ({ ...row, fireAt: Number(row.fireAt) }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function finalizeSource(sourceType: string, sourceId: string | null | undefined): Promise<void> {
  if (!sourceId) return;
  const done = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status IN ('sent', 'failed'))::int AS finished
       FROM web_notification_jobs
      WHERE source_type = $1 AND source_id = $2`,
    [sourceType, sourceId],
  );
  const row = done.rows[0] as { total: number; finished: number } | undefined;
  if (!row || row.total === 0 || row.total !== row.finished) return;

  if (sourceType === "scheduled_broadcast") {
    await pool.query(
      "UPDATE scheduled_broadcasts SET sent_at = COALESCE(sent_at, NOW()) WHERE id = $1",
      [Number(sourceId)],
    );
  } else if (sourceType === "community_announcement") {
    await pool.query(
      "UPDATE community_announcements SET status = 'sent', sent_at = COALESCE(sent_at, NOW()), updated_at = NOW() WHERE id = $1",
      [sourceId],
    );
  }
}

async function sourceMayDeliver(job: ClaimedWebNotificationJob): Promise<boolean> {
  if (job.sourceType !== "community_announcement" || !job.sourceId) return true;
  const result = await pool.query(
    `SELECT 1
       FROM community_announcements
      WHERE id = $1 AND status IN ('scheduled', 'sent')
      LIMIT 1`,
    [job.sourceId],
  );
  return result.rowCount === 1;
}

async function markSent(job: ClaimedWebNotificationJob): Promise<void> {
  await pool.query(
    `UPDATE web_notification_jobs
        SET status = 'sent', sent_at = NOW(), lease_token = NULL,
            lease_expires_at = NULL, last_error = NULL, updated_at = NOW()
      WHERE id = $1 AND status = 'processing' AND lease_token = $2`,
    [job.id, job.leaseToken],
  );
  await finalizeSource(job.sourceType, job.sourceId);
}

async function markFailedOrRetry(
  job: ClaimedWebNotificationJob,
  error: unknown,
  permanent: boolean,
): Promise<void> {
  const message = error instanceof Error ? error.message.slice(0, 500) : "Push delivery failed";
  const terminal = permanent || job.attemptCount >= (job.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  if (terminal) {
    await pool.query(
      `UPDATE web_notification_jobs
          SET status = 'failed', lease_token = NULL, lease_expires_at = NULL,
              last_error = $3, updated_at = NOW()
        WHERE id = $1 AND status = 'processing' AND lease_token = $2`,
      [job.id, job.leaseToken, message],
    );
  } else {
    const delaySeconds = Math.min(60 * 60, 15 * 2 ** Math.max(0, job.attemptCount - 1));
    await pool.query(
      `UPDATE web_notification_jobs
          SET status = 'retry', lease_token = NULL, lease_expires_at = NULL,
              next_attempt_at = NOW() + ($3 * INTERVAL '1 second'),
              last_error = $4, updated_at = NOW()
        WHERE id = $1 AND status = 'processing' AND lease_token = $2`,
      [job.id, job.leaseToken, delaySeconds, message],
    );
  }
  await finalizeSource(job.sourceType, job.sourceId);
}

async function processJob(job: ClaimedWebNotificationJob): Promise<void> {
  const subscription: WebPushSubscription = {
    endpoint: job.endpoint,
    keys: { p256dh: job.p256dh, auth: job.auth },
  };
  const payload: WebPushPayload = {
    title: job.title,
    body: job.body,
    tag: job.tag,
    icon: job.icon ?? "/favicon.svg",
    url: job.url ?? "/",
  };

  if (!(await sourceMayDeliver(job))) {
    await pool.query(
      `UPDATE web_notification_jobs
          SET status = 'failed', lease_token = NULL, lease_expires_at = NULL,
              last_error = 'Source was deleted or cancelled', updated_at = NOW()
        WHERE id = $1 AND status = 'processing' AND lease_token = $2`,
      [job.id, job.leaseToken],
    );
    return;
  }

  try {
    await sendWebPush(subscription, payload);
    await markSent(job);
  } catch (error) {
    const permanent = isExpiredWebPushError(error);
    await markFailedOrRetry(job, error, permanent);
    if (permanent) {
      await pool.query("DELETE FROM push_subscriptions WHERE id = $1", [job.subscriptionId]).catch(() => {});
    } else {
      logger.warn({ jobId: job.id, attempt: job.attemptCount }, "Web Push delivery will retry");
    }
  }
}

export async function runWebNotificationQueueOnce(): Promise<number> {
  await pool.query(
    `UPDATE community_announcements announcement
        SET status = 'sent', sent_at = COALESCE(sent_at, NOW()), updated_at = NOW()
      WHERE announcement.status = 'scheduled'
        AND announcement.scheduled_at <= NOW()
        AND NOT EXISTS (
          SELECT 1 FROM web_notification_jobs job
          WHERE job.source_type = 'community_announcement'
            AND job.source_id = announcement.id
        )`,
  );
  if (!isWebPushReady()) return 0;
  const jobs = await claimDueJobs();
  for (const job of jobs) await processJob(job);
  return jobs.length;
}

export function startWebNotificationQueue(): void {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runWebNotificationQueueOnce();
    } catch (error) {
      logger.error({ error }, "web-notification-queue: tick failed");
    } finally {
      running = false;
    }
  };
  void tick();
  setInterval(() => void tick(), 30_000);
}
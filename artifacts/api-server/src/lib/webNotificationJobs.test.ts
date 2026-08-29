import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after, before } from "node:test";
import { pool } from "@workspace/db";
import {
  ensureRecurringWebScheduleSchema,
  runMigrations,
} from "../migrate";
import {
  enqueueWebNotificationForAll,
  enqueueWebNotificationForUser,
  renewClientSchedulesOnce,
  retireWebPushSubscription,
  syncClientSchedule,
  webNotificationJobTestApi,
  type ClaimedWebNotificationJob,
} from "./webNotificationJobs";
import {
  getZonedDateParts,
  shouldReconcileSameDay,
  zonedCalendarDate,
} from "./notificationTime";
import {
  isValidWebPushSubscription,
  pushSubscriptionTestApi,
  scheduledBroadcastTestApi,
} from "../routes/push";

const subscriptionIds: string[] = [];
const scheduledBroadcastIds: number[] = [];

async function addSubscription(label: string): Promise<string> {
  const id = randomUUID();
  subscriptionIds.push(id);
  await pool.query(
    `INSERT INTO push_subscriptions
       (id, endpoint, p256dh, auth, schedule, user_id)
     VALUES ($1, $2, 'test-p256dh', 'test-auth', '[]'::jsonb, $3)`,
    [id, `https://push.test/${label}/${id}`, `test-user-${id}`],
  );
  return id;
}

async function addJob(
  subscriptionId: string,
  overrides: Partial<{
    key: string;
    status: string;
    attempts: number;
    maxAttempts: number;
    runAt: Date;
    leaseToken: string | null;
    leaseExpiresAt: Date | null;
  }> = {},
): Promise<void> {
  await pool.query(
    `INSERT INTO web_notification_jobs
       (subscription_id, idempotency_key, source_type, source_id, run_at,
        title, body, tag, status, attempts, max_attempts, lease_token,
        lease_expires_at)
     VALUES ($1, $2, 'test', $3, $4, 'Title', 'Body', 'tag', $5, $6, $7, $8, $9)`,
    [
      subscriptionId,
      overrides.key ?? randomUUID(),
      randomUUID(),
      overrides.runAt ?? new Date(Date.now() - 60_000),
      overrides.status ?? "pending",
      overrides.attempts ?? 0,
      overrides.maxAttempts ?? 5,
      overrides.leaseToken ?? null,
      overrides.leaseExpiresAt ?? null,
    ],
  );
}

async function statusFor(job: ClaimedWebNotificationJob): Promise<{
  status: string;
  attempts: number;
  lease_token: string | null;
  next_attempt_at: Date | null;
}> {
  const result = await pool.query(
    `SELECT status, attempts, lease_token, next_attempt_at
       FROM web_notification_jobs WHERE id = $1`,
    [job.id],
  );
  return result.rows[0];
}

before(async () => {
  await runMigrations();
});

after(async () => {
  if (subscriptionIds.length > 0) {
    await pool.query(
      "DELETE FROM web_notification_jobs WHERE subscription_id = ANY($1::text[])",
      [subscriptionIds],
    );
    await pool.query(
      "DELETE FROM push_subscriptions WHERE id = ANY($1::text[])",
      [subscriptionIds],
    );
  }
  if (scheduledBroadcastIds.length > 0) {
    await pool.query(
      "DELETE FROM scheduled_broadcasts WHERE id = ANY($1::int[])",
      [scheduledBroadcastIds],
    );
  }
  await pool.end();
});

test("concurrent queue instances never share a claimed job", async () => {
  const subscriptionId = await addSubscription("concurrent");
  await addJob(subscriptionId);
  await addJob(subscriptionId);

  const [first, second] = await Promise.all([
    webNotificationJobTestApi.claimDueJobs(1, "test"),
    webNotificationJobTestApi.claimDueJobs(1, "test"),
  ]);

  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.notEqual(String(first[0].id), String(second[0].id));
  assert.notEqual(first[0].leaseToken, second[0].leaseToken);
});

test("expired processing leases recover after interruption", async () => {
  const subscriptionId = await addSubscription("recovery");
  await addJob(subscriptionId, {
    status: "processing",
    attempts: 1,
    leaseToken: "expired-worker",
    leaseExpiresAt: new Date(Date.now() - 60_000),
  });

  const claimed = await webNotificationJobTestApi.claimDueJobs(10, "test");
  const recovered = claimed.find((job) => job.subscriptionId === subscriptionId);
  assert.ok(recovered);
  assert.equal(recovered.attemptCount, 2);
  assert.notEqual(recovered.leaseToken, "expired-worker");
});

test("an expired final lease becomes terminal instead of being reclaimed", async () => {
  const subscriptionId = await addSubscription("exhausted-recovery");
  await addJob(subscriptionId, {
    status: "processing",
    attempts: 3,
    maxAttempts: 3,
    leaseToken: "expired-final-worker",
    leaseExpiresAt: new Date(Date.now() - 60_000),
  });

  const claimed = await webNotificationJobTestApi.claimDueJobs(10, "test");
  assert.equal(
    claimed.some((job) => job.subscriptionId === subscriptionId),
    false,
  );
  const result = await pool.query(
    "SELECT status, attempts FROM web_notification_jobs WHERE subscription_id = $1",
    [subscriptionId],
  );
  assert.equal(result.rows[0].status, "failed");
  assert.equal(result.rows[0].attempts, 3);
});

test("transient failures retry with bounded backoff and terminal attempts fail", async () => {
  const retrySubscription = await addSubscription("retry");
  await addJob(retrySubscription, { maxAttempts: 3 });
  const retryJob = (await webNotificationJobTestApi.claimDueJobs(10, "test"))
    .find((job) => job.subscriptionId === retrySubscription);
  assert.ok(retryJob);

  await webNotificationJobTestApi.markFailedOrRetry(
    retryJob,
    new Error("temporary outage"),
    false,
  );
  const retryState = await statusFor(retryJob);
  assert.equal(retryState.status, "retry");
  assert.equal(retryState.lease_token, null);
  assert.ok(retryState.next_attempt_at);

  const terminalSubscription = await addSubscription("terminal");
  await addJob(terminalSubscription, { attempts: 2, maxAttempts: 3 });
  const terminalJob = (await webNotificationJobTestApi.claimDueJobs(10, "test"))
    .find((job) => job.subscriptionId === terminalSubscription);
  assert.ok(terminalJob);
  await webNotificationJobTestApi.markFailedOrRetry(
    terminalJob,
    new Error("still unavailable"),
    false,
  );
  assert.equal((await statusFor(terminalJob)).status, "failed");
});

test("stale workers cannot finalize a lease they no longer own", async () => {
  const subscriptionId = await addSubscription("stale");
  await addJob(subscriptionId);
  const job = (await webNotificationJobTestApi.claimDueJobs(10, "test"))
    .find((candidate) => candidate.subscriptionId === subscriptionId);
  assert.ok(job);

  await pool.query(
    "UPDATE web_notification_jobs SET lease_token = 'replacement-worker' WHERE id = $1",
    [job.id],
  );
  await webNotificationJobTestApi.markSent(job);
  const state = await statusFor(job);
  assert.equal(state.status, "processing");
  assert.equal(state.lease_token, "replacement-worker");
});

test("sent jobs are never claimed again", async () => {
  const subscriptionId = await addSubscription("sent");
  await addJob(subscriptionId, { status: "sent" });
  const claimed = await webNotificationJobTestApi.claimDueJobs(50, "test");
  assert.equal(
    claimed.some((job) => job.subscriptionId === subscriptionId),
    false,
  );
});

test("broadcast producer occurrence keys are idempotent across instances", async () => {
  const firstSubscription = await addSubscription("producer-a");
  const secondSubscription = await addSubscription("producer-b");
  const sourceId = `occurrence-${randomUUID()}`;
  const input = {
    sourceType: "test_broadcast",
    sourceId,
    fireAt: Date.now() + 60_000,
    title: "Test",
    body: "Test body",
    tag: "test-tag",
    timezone: "Asia/Kolkata",
  };

  await Promise.all([
    enqueueWebNotificationForAll(input),
    enqueueWebNotificationForAll(input),
  ]);

  const result = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count
       FROM web_notification_jobs
      WHERE source_type = $1 AND source_id = $2
        AND subscription_id = ANY($3::text[])`,
    [input.sourceType, sourceId, [firstSubscription, secondSubscription]],
  );
  assert.equal(result.rows[0].count, 2);
});

test("transaction rollback cannot persist a domain job independently", async () => {
  const subscriptionId = await addSubscription("transactional-producer");
  const userResult = await pool.query<{ user_id: string }>(
    "SELECT user_id FROM push_subscriptions WHERE id = $1",
    [subscriptionId],
  );
  const sourceId = `rolled-back-${randomUUID()}`;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await enqueueWebNotificationForUser(userResult.rows[0].user_id, {
      sourceType: "test_transactional_producer",
      sourceId,
      fireAt: Date.now(),
      title: "Test",
      body: "Rollback",
      tag: "rollback",
    }, client);
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
  const jobs = await pool.query(
    "SELECT 1 FROM web_notification_jobs WHERE source_type = $1 AND source_id = $2",
    ["test_transactional_producer", sourceId],
  );
  assert.equal(jobs.rowCount, 0);
});

test("subscription metadata and schedule jobs roll back together", async () => {
  const subscriptionId = await addSubscription("schedule-transaction");
  const original = [{
    fireAt: Date.now() + 3_600_000,
    title: "Original",
    body: "Original reminder",
    tag: `original-${randomUUID()}`,
    timezone: "Asia/Kolkata",
  }];
  const replacement = [{
    fireAt: Date.now() + 7_200_000,
    title: "Replacement",
    body: "Replacement reminder",
    tag: `replacement-${randomUUID()}`,
    timezone: "America/New_York",
  }];
  const setup = await pool.connect();
  try {
    await setup.query("BEGIN");
    await setup.query(
      "UPDATE push_subscriptions SET schedule = $2::jsonb WHERE id = $1",
      [subscriptionId, JSON.stringify(original)],
    );
    await syncClientSchedule(subscriptionId, original, setup);
    await setup.query("COMMIT");
  } finally {
    setup.release();
  }

  const attempted = await pool.connect();
  try {
    await attempted.query("BEGIN");
    await attempted.query(
      "UPDATE push_subscriptions SET schedule = $2::jsonb WHERE id = $1",
      [subscriptionId, JSON.stringify(replacement)],
    );
    await syncClientSchedule(subscriptionId, replacement, attempted);
    await attempted.query("ROLLBACK");
  } finally {
    attempted.release();
  }

  const state = await pool.query<{ schedule: Array<{ tag: string }> }>(
    "SELECT schedule FROM push_subscriptions WHERE id = $1",
    [subscriptionId],
  );
  assert.equal(state.rows[0].schedule[0].tag, original[0].tag);
  const jobs = await pool.query<{ tag: string }>(
    `SELECT tag FROM web_notification_jobs
      WHERE subscription_id = $1 AND source_type = 'client_schedule'`,
    [subscriptionId],
  );
  assert.deepEqual(jobs.rows.map((row) => row.tag), [original[0].tag]);
});

test("recurring client schedules renew before their horizon expires", async () => {
  const subscriptionId = await addSubscription("schedule-renewal");
  const now = new Date("2026-08-29T12:00:00.000Z");
  const config = {
    prefs: {
      dailyDate: true,
      shabbat: false,
      havdalah: false,
      holiday: false,
      fastDay: false,
      specialEvent: false,
      omer: false,
      prayers: false,
      parasha: false,
      shema: false,
      shabbatDigest: false,
      yahrzeit: false,
    },
    location: {
      name: "Churachandpur",
      country: "India",
      lat: 24.3333,
      lng: 93.6833,
      tz: "Asia/Kolkata",
      candleLightingMinutes: 18,
    },
    leadTime: 15 as const,
  };
  await pool.query(
    `UPDATE push_subscriptions
        SET schedule_config = $2::jsonb,
            schedule_horizon_until = $3
      WHERE id = $1`,
    [subscriptionId, JSON.stringify(config), now],
  );

  assert.equal(
    await renewClientSchedulesOnce(now, 1, subscriptionId),
    1,
  );
  const state = await pool.query<{
    schedule_horizon_until: Date;
    schedule: Array<{ fireAt: number }>;
  }>(
    `SELECT schedule_horizon_until, schedule
       FROM push_subscriptions
      WHERE id = $1`,
    [subscriptionId],
  );
  const renewed = state.rows[0];
  assert.ok(renewed.schedule.length >= 60);
  assert.ok(
    renewed.schedule.some(
      (item) => item.fireAt >= now.getTime() + 60 * 24 * 60 * 60 * 1000,
    ),
  );
  assert.ok(
    renewed.schedule_horizon_until.getTime() >=
      now.getTime() + 69 * 24 * 60 * 60 * 1000,
  );

  const jobs = await pool.query<{ count: number; latest: Date }>(
    `SELECT COUNT(*)::int AS count, MAX(run_at) AS latest
       FROM web_notification_jobs
      WHERE subscription_id = $1 AND source_type = 'client_schedule'`,
    [subscriptionId],
  );
  assert.equal(jobs.rows[0].count, renewed.schedule.length);
  assert.ok(
    jobs.rows[0].latest.getTime() >=
      now.getTime() + 60 * 24 * 60 * 60 * 1000,
  );

  assert.equal(
    await renewClientSchedulesOnce(now, 1, subscriptionId),
    0,
  );
});

test("production startup migration keeps recurring schedule columns ready", async () => {
  await ensureRecurringWebScheduleSchema();
  const columns = await pool.query<{ column_name: string }>(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'push_subscriptions'
        AND column_name IN ('schedule_config', 'schedule_horizon_until')
      ORDER BY column_name`,
  );
  assert.deepEqual(
    columns.rows.map((row) => row.column_name),
    ["schedule_config", "schedule_horizon_until"],
  );
});

test("zoned occurrence dates remain stable across India and DST transitions", () => {
  const india = getZonedDateParts(
    new Date("2026-03-08T02:30:00.000Z"),
    "Asia/Kolkata",
  );
  assert.equal(india.dateKey, "2026-03-08");
  assert.equal(india.hour, 8);

  const beforeDst = getZonedDateParts(
    new Date("2026-03-08T06:30:00.000Z"),
    "America/New_York",
  );
  const afterDst = getZonedDateParts(
    new Date("2026-03-08T07:30:00.000Z"),
    "America/New_York",
  );
  assert.equal(beforeDst.hour, 1);
  assert.equal(afterDst.hour, 3);
  assert.equal(beforeDst.dateKey, afterDst.dateKey);

  assert.equal(
    zonedCalendarDate(
      new Date("2026-11-01T05:30:00.000Z"),
      "America/New_York",
    ).toISOString(),
    "2026-11-01T12:00:00.000Z",
  );
});

test("server producers reconcile after their narrow firing minute", () => {
  assert.equal(
    shouldReconcileSameDay(
      new Date("2026-08-30T03:00:00.000Z"),
      "Asia/Kolkata",
      8,
      "Sun",
    ),
    true,
  );
  assert.equal(
    shouldReconcileSameDay(
      new Date("2026-08-29T04:00:00.000Z"),
      "Asia/Kolkata",
      9,
    ),
    true,
  );
  assert.equal(
    shouldReconcileSameDay(
      new Date("2026-08-29T02:00:00.000Z"),
      "Asia/Kolkata",
      9,
    ),
    false,
  );
});

test("push subscriptions reject SSRF endpoints and malformed keys", () => {
  const validP256dh = Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 1)])
    .toString("base64url");
  const validAuth = Buffer.alloc(16, 2).toString("base64url");

  assert.equal(
    isValidWebPushSubscription({
      endpoint: "https://fcm.googleapis.com/fcm/send/test-token",
      keys: { p256dh: validP256dh, auth: validAuth },
    }),
    true,
  );
  for (const endpoint of [
    "http://fcm.googleapis.com/fcm/send/test",
    "https://127.0.0.1/internal",
    "https://metadata.google.internal/computeMetadata/v1/",
    "https://fcm.googleapis.com.evil.example/push",
    "https://user:pass@fcm.googleapis.com/push",
  ]) {
    assert.equal(
      isValidWebPushSubscription({
        endpoint,
        keys: { p256dh: validP256dh, auth: validAuth },
      }),
      false,
      endpoint,
    );
  }
  assert.equal(
    isValidWebPushSubscription({
      endpoint: "https://web.push.apple.com/test",
      keys: { p256dh: "short", auth: validAuth },
    }),
    false,
  );
});

test("push subscription endpoints cannot be reassigned to another user", async () => {
  const id = randomUUID();
  const endpoint = `https://push.test/ownership/${id}`;
  subscriptionIds.push(id);
  await pool.query(
    `INSERT INTO push_subscriptions
       (id, endpoint, p256dh, auth, schedule, user_id)
     VALUES ($1, $2, 'owner-p256dh', 'owner-auth', '[]'::jsonb, $3)`,
    [id, endpoint, `owner-${id}`],
  );

  await assert.rejects(
    pushSubscriptionTestApi.dbUpsert(
      {
        endpoint,
        keys: { p256dh: "attacker-p256dh", auth: "attacker-auth" },
      },
      [],
      `attacker-${id}`,
    ),
    /already registered/,
  );

  const result = await pool.query<{
    user_id: string;
    p256dh: string;
    auth: string;
  }>(
    "SELECT user_id, p256dh, auth FROM push_subscriptions WHERE endpoint = $1",
    [endpoint],
  );
  assert.equal(result.rows[0]?.user_id, `owner-${id}`);
  assert.equal(result.rows[0]?.p256dh, "owner-p256dh");
  assert.equal(result.rows[0]?.auth, "owner-auth");
});

test("due scheduled broadcasts still invoke Expo delivery exactly once", async () => {
  const created = await pool.query<{ id: number }>(
    `INSERT INTO scheduled_broadcasts (emoji, title, body, fire_at)
     VALUES ('📣', 'Scheduled test', 'Body', NOW() - INTERVAL '1 minute')
     RETURNING id`,
  );
  const id = created.rows[0].id;
  scheduledBroadcastIds.push(id);
  let deliveries = 0;
  const deps = {
    loadTokens: async () => ["ExponentPushToken[test-token]"],
    send: async (messages: import("expo-server-sdk").ExpoPushMessage[]) => {
      assert.equal(messages.length, 1);
      deliveries += 1;
    },
  };

  const [first, second] = await Promise.all([
    scheduledBroadcastTestApi.deliverScheduledBroadcastExpo(
      { id, emoji: "📣", title: "Scheduled test", body: "Body" },
      deps,
    ),
    scheduledBroadcastTestApi.deliverScheduledBroadcastExpo(
      { id, emoji: "📣", title: "Scheduled test", body: "Body" },
      deps,
    ),
  ]);
  assert.equal(first || second, true);
  assert.equal(deliveries, 1);
});

test("unsubscribe terminalizes jobs and lets scheduled broadcasts finish", async () => {
  const subscriptionId = await addSubscription("unsubscribe-finalization");
  const endpointResult = await pool.query<{ endpoint: string; user_id: string }>(
    "SELECT endpoint, user_id FROM push_subscriptions WHERE id = $1",
    [subscriptionId],
  );
  const broadcast = await pool.query<{ id: number }>(
    `INSERT INTO scheduled_broadcasts
       (emoji, title, body, fire_at, expo_sent_at)
     VALUES ('📣', 'Unsubscribe test', 'Body', NOW() - INTERVAL '1 minute', NOW())
     RETURNING id`,
  );
  const broadcastId = broadcast.rows[0].id;
  scheduledBroadcastIds.push(broadcastId);
  await addJob(subscriptionId, {
    key: `scheduled_broadcast:${broadcastId}:${subscriptionId}`,
    status: "processing",
    attempts: 1,
    leaseToken: "interrupted-worker",
    leaseExpiresAt: new Date(Date.now() + 300_000),
  });
  await pool.query(
    `UPDATE web_notification_jobs
        SET source_type = 'scheduled_broadcast', source_id = $2
      WHERE subscription_id = $1 AND idempotency_key = $3`,
    [
      subscriptionId,
      String(broadcastId),
      `scheduled_broadcast:${broadcastId}:${subscriptionId}`,
    ],
  );

  await retireWebPushSubscription(
    endpointResult.rows[0].endpoint,
    endpointResult.rows[0].user_id,
  );

  const job = await pool.query<{ status: string }>(
    `SELECT status FROM web_notification_jobs
      WHERE source_type = 'scheduled_broadcast' AND source_id = $1`,
    [String(broadcastId)],
  );
  assert.equal(job.rows[0].status, "failed");
  const source = await pool.query<{ sent_at: Date | null }>(
    "SELECT sent_at FROM scheduled_broadcasts WHERE id = $1",
    [broadcastId],
  );
  assert.ok(source.rows[0].sent_at);
});
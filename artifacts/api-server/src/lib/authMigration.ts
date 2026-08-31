import { pool } from "@workspace/db";
import { logger } from "./logger";

export type LegacyClerkIdentity = {
  id: string;
  verifiedEmails: string[];
  displayName: string;
};

export type LegacyClerkInventory = {
  configured: boolean;
  available: boolean;
  users: LegacyClerkIdentity[];
};

type ClerkEmailAddress = {
  email_address?: unknown;
  verification?: { status?: unknown } | null;
};

type ClerkUser = {
  id?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  email_addresses?: unknown;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isVerifiedEmail(
  value: ClerkEmailAddress,
): value is ClerkEmailAddress & {
  email_address: string;
} {
  return (
    typeof value.email_address === "string" &&
    value.email_address.includes("@") &&
    value.verification?.status === "verified"
  );
}

function displayName(user: ClerkUser): string {
  return [user.first_name, user.last_name]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .trim();
}

function clerkSecret(): string | null {
  const value = process.env.CLERK_SECRET_KEY?.trim();
  return value || null;
}

async function fetchClerkPage(
  secret: string,
  offset: number,
): Promise<ClerkUser[]> {
  const response = await fetch(
    `https://api.clerk.com/v1/users?limit=100&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Legacy Clerk inventory failed (${response.status})`);
  }
  const users = (await response.json()) as unknown;
  return Array.isArray(users) ? (users as ClerkUser[]) : [];
}

/**
 * Reads the legacy Clerk directory without exposing provider tokens or raw
 * provider payloads. Only verified email addresses are retained because they
 * are the only safe basis for an automatic account match.
 */
export async function listLegacyClerkIdentities(): Promise<LegacyClerkInventory> {
  const secret = clerkSecret();
  if (!secret) return { configured: false, available: false, users: [] };

  const users: LegacyClerkIdentity[] = [];
  try {
    for (let offset = 0; ; offset += 100) {
      const page = await fetchClerkPage(secret, offset);
      for (const user of page) {
        if (typeof user.id !== "string") continue;
        const addresses = Array.isArray(user.email_addresses)
          ? (user.email_addresses as ClerkEmailAddress[])
          : [];
        const verifiedEmails = addresses
          .filter(isVerifiedEmail)
          .map((address) => normalizeEmail(address.email_address));
        users.push({
          id: user.id,
          verifiedEmails: [...new Set(verifiedEmails)],
          displayName: displayName(user),
        });
      }
      if (page.length < 100) break;
    }
    return { configured: true, available: true, users };
  } catch (error) {
    logger.warn({ err: error }, "Could not inventory legacy Clerk identities");
    return { configured: true, available: false, users: [] };
  }
}

export async function findLegacyClerkMatches(email: string): Promise<string[]> {
  const inventory = await listLegacyClerkIdentities();
  if (!inventory.available) return [];
  const normalized = normalizeEmail(email);
  return inventory.users
    .filter((user) => user.verifiedEmails.includes(normalized))
    .map((user) => user.id);
}

export type AccountDataCounts = {
  profiles: { private: number; public: number };
  memorials: { owned: number };
  family: { memberships: number; families: number };
  notifications: { webPush: number; expoTokens: number; jobs: number };
  premium: { enabled: boolean; requests: number; payments: number };
};

function emptyCounts(): AccountDataCounts {
  return {
    profiles: { private: 0, public: 0 },
    memorials: { owned: 0 },
    family: { memberships: 0, families: 0 },
    notifications: { webPush: 0, expoTokens: 0, jobs: 0 },
    premium: { enabled: false, requests: 0, payments: 0 },
  };
}

/**
 * Counts records by stable account ID without changing any user-owned rows.
 * Memorial ownership is represented by membership in a memorial family.
 */
export async function loadAccountDataCounts(
  accountIds: string[],
): Promise<Map<string, AccountDataCounts>> {
  const result = new Map(accountIds.map((id) => [id, emptyCounts()]));
  if (accountIds.length === 0) return result;

  const [
    profiles,
    publicProfiles,
    memorials,
    memberships,
    webPush,
    expoTokens,
    jobs,
    premiumRequests,
    payments,
  ] = await Promise.all([
    pool.query<{ user_id: string; is_premium: boolean }>(
      `SELECT user_id, is_premium FROM user_profiles WHERE user_id = ANY($1::text[])`,
      [accountIds],
    ),
    pool.query<{ user_id: string }>(
      `SELECT user_id FROM user_public_profiles WHERE user_id = ANY($1::text[])`,
      [accountIds],
    ),
    pool.query<{ user_id: string; owned: string }>(
      `SELECT mfm.user_id, COUNT(DISTINCT m.id)::text AS owned
           FROM memorial_family_members mfm
           JOIN memorials m ON m.family_id = mfm.family_id
          WHERE mfm.user_id = ANY($1::text[])
          GROUP BY mfm.user_id`,
      [accountIds],
    ),
    pool.query<{ user_id: string; memberships: string; families: string }>(
      `SELECT user_id, COUNT(*)::text AS memberships,
                COUNT(DISTINCT family_id)::text AS families
           FROM memorial_family_members
          WHERE user_id = ANY($1::text[])
          GROUP BY user_id`,
      [accountIds],
    ),
    pool.query<{ user_id: string; count: string }>(
      `SELECT user_id, COUNT(*)::text AS count
           FROM push_subscriptions
          WHERE user_id = ANY($1::text[])
          GROUP BY user_id`,
      [accountIds],
    ),
    pool.query<{ user_id: string; count: string }>(
      `SELECT user_id, COUNT(*)::text AS count
           FROM expo_push_tokens
          WHERE user_id = ANY($1::text[])
          GROUP BY user_id`,
      [accountIds],
    ),
    pool.query<{ user_id: string; count: string }>(
      `SELECT ps.user_id, COUNT(*)::text AS count
           FROM web_notification_jobs jobs
           JOIN push_subscriptions ps ON ps.id = jobs.subscription_id
          WHERE ps.user_id = ANY($1::text[])
          GROUP BY ps.user_id`,
      [accountIds],
    ),
    pool.query<{ user_id: string; count: string }>(
      `SELECT user_id, COUNT(*)::text AS count
           FROM premium_requests
          WHERE user_id = ANY($1::text[])
          GROUP BY user_id`,
      [accountIds],
    ),
    pool.query<{ user_id: string; count: string }>(
      `SELECT user_id, COUNT(*)::text AS count
           FROM payment_records
          WHERE user_id = ANY($1::text[])
          GROUP BY user_id`,
      [accountIds],
    ),
  ]);

  for (const row of profiles.rows) {
    const counts = result.get(row.user_id);
    if (counts) {
      counts.profiles.private += 1;
      counts.premium.enabled ||= row.is_premium;
    }
  }
  for (const row of publicProfiles.rows) {
    result.get(row.user_id)?.profiles &&
      (result.get(row.user_id)!.profiles.public += 1);
  }
  for (const row of memorials.rows) {
    const counts = result.get(row.user_id);
    if (counts) counts.memorials.owned = Number(row.owned);
  }
  for (const row of memberships.rows) {
    const counts = result.get(row.user_id);
    if (counts) {
      counts.family.memberships = Number(row.memberships);
      counts.family.families = Number(row.families);
    }
  }
  for (const row of webPush.rows)
    result.get(row.user_id)!.notifications.webPush = Number(row.count);
  for (const row of expoTokens.rows)
    result.get(row.user_id)!.notifications.expoTokens = Number(row.count);
  for (const row of jobs.rows)
    result.get(row.user_id)!.notifications.jobs = Number(row.count);
  for (const row of premiumRequests.rows)
    result.get(row.user_id)!.premium.requests = Number(row.count);
  for (const row of payments.rows)
    result.get(row.user_id)!.premium.payments = Number(row.count);

  return result;
}

export function emptyAccountDataCounts(): AccountDataCounts {
  return emptyCounts();
}
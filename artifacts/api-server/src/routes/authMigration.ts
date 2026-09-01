import { randomUUID } from "node:crypto";
import { Router } from "express";
import { pool } from "@workspace/db";
import { apiError } from "../lib/apiError";
import {
  listLegacyClerkIdentities,
  loadAccountDataCounts,
  type AccountDataCounts,
} from "../lib/authMigration";
import { auditLog } from "../lib/auditLog";
import { requireAdmin } from "../lib/requireAdmin";

const router = Router();

type SupabaseIdentityRow = {
  provider_subject: string;
  account_id: string;
  email: string | null;
  email_verified: boolean;
  link_status: string;
  linked_at: string | null;
  linked_by: string | null;
  created_at: string;
  updated_at: string;
};

type LocalClerkIdentityRow = {
  provider_subject: string;
  account_id: string;
  email: string | null;
  email_verified: boolean;
  display_name: string;
};

function dataCounts(
  counts: Map<string, AccountDataCounts>,
  accountId: string,
): AccountDataCounts {
  return (
    counts.get(accountId) ?? {
      profiles: { private: 0, public: 0 },
      memorials: { owned: 0 },
      family: { memberships: 0, families: 0 },
      notifications: { webPush: 0, expoTokens: 0, jobs: 0 },
      premium: { enabled: false, requests: 0, payments: 0 },
    }
  );
}

/**
 * Read-only acceptance inventory for the staged legacy → Supabase transition.
 * The endpoint intentionally reports ambiguity instead of guessing an owner.
 */
router.get("/admin/auth/inventory", requireAdmin, async (_req, res) => {
  try {
    const [identityResult, localClerkResult, adminResult, clerk] =
      await Promise.all([
        pool.query<SupabaseIdentityRow>(
          `SELECT provider_subject, account_id, email, email_verified,
                link_status, linked_at, linked_by, created_at, updated_at
           FROM auth_identities
          WHERE provider = 'supabase'
          ORDER BY created_at ASC`,
        ),
        pool.query<LocalClerkIdentityRow>(
          `SELECT provider_subject, account_id, email, email_verified, display_name
           FROM auth_identities
          WHERE provider = 'clerk'
          ORDER BY created_at ASC`,
        ),
        pool.query<{
          account_id: string;
          assigned_by: string;
          assigned_at: string;
        }>(
          `SELECT account_id, assigned_by, assigned_at
           FROM app_admin_assignments
          ORDER BY assigned_at ASC`,
        ),
        listLegacyClerkIdentities(),
      ]);

    const identities = identityResult.rows;
    const legacyDirectoryAvailable =
      clerk.available || localClerkResult.rows.length > 0;
    const legacyClerkById = new Map(
      clerk.users.map((user) => [
        user.id,
        {
          id: user.id,
          verifiedEmails: user.verifiedEmails,
          displayName: user.displayName,
        },
      ]),
    );
    for (const identity of localClerkResult.rows) {
      const current = legacyClerkById.get(identity.provider_subject);
      const verifiedEmails =
        identity.email_verified && identity.email
          ? [...(current?.verifiedEmails ?? []), identity.email]
          : (current?.verifiedEmails ?? []);
      legacyClerkById.set(identity.provider_subject, {
        id: identity.provider_subject,
        verifiedEmails: [...new Set(verifiedEmails)],
        displayName: current?.displayName || identity.display_name,
      });
    }
    const legacyClerkIdentities = [...legacyClerkById.values()];
    const clerkByEmail = new Map<
      string,
      Array<{ id: string; displayName: string }>
    >();
    for (const user of legacyClerkIdentities) {
      for (const email of user.verifiedEmails) {
        const matches = clerkByEmail.get(email) ?? [];
        matches.push({ id: user.id, displayName: user.displayName });
        clerkByEmail.set(email, matches);
      }
    }

    const identityDetails = identities.map((identity) => {
      const matches =
        legacyDirectoryAvailable && identity.email_verified && identity.email
          ? (clerkByEmail.get(identity.email) ?? [])
          : [];
      const state =
        identity.link_status === "explicitly_linked"
          ? "explicitly_linked"
          : matches.length > 1
            ? "ambiguous"
            : matches.length === 1
              ? "auto_linked"
              : !legacyDirectoryAvailable && identity.email_verified
                ? "clerk_unavailable"
                : "unmatched";
      return {
        providerSubject: identity.provider_subject,
        accountId: identity.account_id,
        email: identity.email,
        emailVerified: identity.email_verified,
        linkStatus: identity.link_status,
        evaluatedStatus: state,
        legacyClerkMatches: matches,
        linkedAt: identity.linked_at,
        linkedBy: identity.linked_by,
        createdAt: identity.created_at,
        updatedAt: identity.updated_at,
      };
    });

    const accountIds = [
      ...new Set([
        ...legacyClerkIdentities.map((user) => user.id),
        ...identities.map((identity) => identity.account_id),
        ...adminResult.rows.map((assignment) => assignment.account_id),
      ]),
    ];
    const counts = await loadAccountDataCounts(accountIds);
    const linkedSubjectsByAccount = new Map<string, string[]>();
    for (const identity of identities) {
      const subjects = linkedSubjectsByAccount.get(identity.account_id) ?? [];
      subjects.push(identity.provider_subject);
      linkedSubjectsByAccount.set(identity.account_id, subjects);
    }

    const legacyClerkUsers = legacyClerkIdentities.map((user) => ({
      clerkUserId: user.id,
      displayName: user.displayName,
      verifiedEmails: user.verifiedEmails,
      supabaseSubjects: linkedSubjectsByAccount.get(user.id) ?? [],
      matched: (linkedSubjectsByAccount.get(user.id) ?? []).length > 0,
      dataCounts: dataCounts(counts, user.id),
    }));
    const unmatchedLegacyClerkUsers = legacyClerkUsers.filter(
      (user) => !user.matched,
    );
    const ambiguousMatches = identityDetails.filter(
      (identity) => identity.evaluatedStatus === "ambiguous",
    );
    const unmatchedSupabaseIdentities = identityDetails.filter((identity) =>
      ["unmatched", "clerk_unavailable"].includes(identity.evaluatedStatus),
    );
    const adminAssignments = adminResult.rows.map((assignment) => ({
      accountId: assignment.account_id,
      assignedBy: assignment.assigned_by,
      assignedAt: assignment.assigned_at,
      supabaseSubjects: linkedSubjectsByAccount.get(assignment.account_id) ?? [],
      dataCounts: dataCounts(counts, assignment.account_id),
    }));

    return res.json({
      generatedAt: new Date().toISOString(),
      clerk: {
        configured: clerk.configured,
        available: clerk.available,
        userCount: legacyClerkIdentities.length,
      },
      summary: {
        supabaseIdentities: identities.length,
        autoLinked: identityDetails.filter(
          (identity) => identity.evaluatedStatus === "auto_linked",
        ).length,
        explicitlyLinked: identityDetails.filter(
          (identity) => identity.evaluatedStatus === "explicitly_linked",
        ).length,
        unmatchedSupabase: unmatchedSupabaseIdentities.length,
        ambiguous: ambiguousMatches.length,
        legacyClerkUsers: legacyClerkUsers.length,
        unmatchedLegacyClerk: unmatchedLegacyClerkUsers.length,
        adminAssignments: adminAssignments.length,
        adminsWithoutSupabase: adminAssignments.filter(
          (assignment) => assignment.supabaseSubjects.length === 0,
        ).length,
      },
      supabaseIdentities: identityDetails.map((identity) => ({
        ...identity,
        dataCounts: dataCounts(counts, identity.accountId),
      })),
      legacyClerkMatches: legacyClerkUsers.filter((user) => user.matched),
      unmatchedUsers: {
        supabase: unmatchedSupabaseIdentities.map((identity) => ({
          ...identity,
          dataCounts: dataCounts(counts, identity.accountId),
        })),
        clerk: unmatchedLegacyClerkUsers,
      },
      ambiguousMatches,
      adminAssignments,
    });
  } catch (error) {
    console.error("Authentication inventory failed", error);
    return apiError.internal(res, "Failed to build authentication inventory");
  }
});

/**
 * Explicit, administrator-approved link. It never rewrites user-owned rows;
 * future requests simply resolve this Supabase subject to the selected account.
 */
router.post("/admin/auth/identity-links", requireAdmin, async (req, res) => {
  const provider = req.body?.provider;
  const providerSubject = req.body?.providerSubject;
  const accountId = req.body?.accountId;
  const reason = req.body?.reason;
  if (
    provider !== "supabase" ||
    typeof providerSubject !== "string" ||
    providerSubject.trim().length < 1 ||
    providerSubject.length > 500 ||
    typeof accountId !== "string" ||
    accountId.trim().length < 1 ||
    accountId.length > 500 ||
    typeof reason !== "string" ||
    reason.trim().length < 1 ||
    reason.length > 1_000
  ) {
    return apiError.badRequest(
      res,
      "provider, providerSubject, accountId, and a linking reason are required",
    );
  }

  const actorAccountId = String((req as any).userId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const identity = await client.query<{
      account_id: string;
      email: string | null;
      email_verified: boolean;
    }>(
      `SELECT account_id, email, email_verified
         FROM auth_identities
        WHERE provider = 'supabase' AND provider_subject = $1
        FOR UPDATE`,
      [providerSubject],
    );
    const current = identity.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return apiError.notFound(res, "Supabase identity was not found");
    }

    await client.query(
      `INSERT INTO auth_identity_links
         (id, provider, provider_subject, from_account_id, to_account_id,
          actor_account_id, reason)
        VALUES ($1, 'supabase', $2, $3, $4, $5, $6)`,
      [
        randomUUID(),
        providerSubject,
        current.account_id,
        accountId.trim(),
        actorAccountId,
        reason.trim(),
      ],
    );
    const updated = await client.query(
      `UPDATE auth_identities
          SET account_id = $1,
              link_status = 'explicitly_linked',
              linked_at = NOW(),
              linked_by = $2,
              updated_at = NOW()
        WHERE provider = 'supabase' AND provider_subject = $3
      RETURNING provider, provider_subject, account_id, email, email_verified,
                link_status, linked_at, linked_by`,
      [accountId.trim(), actorAccountId, providerSubject],
    );
    await client.query(
      `DELETE FROM auth_sessions
        WHERE provider = 'supabase' AND provider_subject = $1`,
      [providerSubject],
    );
    await client.query("COMMIT");
    await auditLog.record({
      event: "admin.auth.identity_link",
      actorId: actorAccountId,
      targetId: accountId.trim(),
      metadata: {
        provider,
        providerSubject,
        fromAccountId: current.account_id,
        reason: reason.trim(),
      },
    });
    return res.json({ ok: true, identity: updated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Identity link failed", error);
    return apiError.internal(res, "Failed to link identity");
  } finally {
    client.release();
  }
});

router.get("/admin/auth/admin-assignments", requireAdmin, async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT account_id, assigned_by, assigned_at
       FROM app_admin_assignments
      ORDER BY assigned_at ASC`,
  );
  return res.json(
    rows.map((row) => ({
      accountId: row.account_id,
      assignedBy: row.assigned_by,
      assignedAt: row.assigned_at,
    })),
  );
});

router.post("/admin/auth/admin-assignments", requireAdmin, async (req, res) => {
  const accountId = req.body?.accountId;
  if (
    typeof accountId !== "string" ||
    accountId.trim().length < 1 ||
    accountId.length > 500
  ) {
    return apiError.badRequest(res, "accountId is required");
  }
  const actorAccountId = String((req as any).userId);
  const { rows } = await pool.query(
    `INSERT INTO app_admin_assignments (account_id, assigned_by)
     VALUES ($1, $2)
     ON CONFLICT (account_id) DO UPDATE SET assigned_by = EXCLUDED.assigned_by
     RETURNING account_id, assigned_by, assigned_at`,
    [accountId.trim(), actorAccountId],
  );
  await auditLog.record({
    event: "admin.auth.admin_assignment",
    actorId: actorAccountId,
    targetId: accountId.trim(),
    metadata: { action: "assign" },
  });
  return res.json({ ok: true, assignment: rows[0] });
});

router.delete(
  "/admin/auth/admin-assignments/:accountId",
  requireAdmin,
  async (req, res) => {
    const accountId = String(req.params.accountId);
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM app_admin_assignments",
    );
    if (Number(countRows[0]?.count) <= 1) {
      return res
        .status(409)
        .json({ error: "Cannot remove the last administrator" });
    }
    const result = await pool.query(
      "DELETE FROM app_admin_assignments WHERE account_id = $1 RETURNING account_id",
      [accountId],
    );
    if (!result.rows[0])
      return apiError.notFound(res, "Administrator assignment was not found");
    await auditLog.record({
      event: "admin.auth.admin_assignment",
      actorId: String((req as any).userId),
      targetId: accountId,
      metadata: { action: "remove" },
    });
    return res.json({ ok: true });
  },
);

export default router;
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { pool } from "@workspace/db";
import { branchSchema, memberSubmissionSchema } from "@workspace/shared-core/census";
import { requireAuth } from "../lib/requireAuth";
import { requireAdmin } from "../lib/requireAdmin";
import { apiError } from "../lib/apiError";
import { logger } from "../lib/logger";
import {
  resolveAdminRole, requireRegionalAdmin, requireNationalAdmin,
  ACTION_TO_STATUS, ACTION_FROM_STATUSES, ACTION_MIN_ROLE,
  type BranchAction, type BranchAdminRole,
} from "../lib/branchAuth";
import {
  enqueueBranchOwnerWebNotification,
  sendBranchOwnerExpoNotification,
} from "../lib/branchNotifications";

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────
// Canonical Census schemas now live in @workspace/shared-core/census.
// See SPR-P005B — there must be ONE Census model.

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToBranch(row: any) {
  return {
    id: row.id,
    name: row.name,
    cityId: row.city_id,
    cityName: row.city_name,
    adminName: row.admin_name ?? undefined,
    established: row.established ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    synagogueImageUrl: row.synagogue_image_url ?? undefined,
    families: Array.isArray(row.families) ? row.families : [],
    leadership: row.leadership ?? undefined,
    branchStatus: row.branch_status ?? "active",
    createdBy: row.owner_user_id,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

// Reads camelCase keys from a parsed JSONB branch_data snapshot.
function jsonToBranch(data: any) {
  return {
    id: data.id,
    name: data.name,
    cityId: data.cityId,
    cityName: data.cityName,
    adminName: data.adminName ?? undefined,
    established: data.established ?? undefined,
    logoUrl: data.logoUrl ?? undefined,
    synagogueImageUrl: data.synagogueImageUrl ?? undefined,
    families: Array.isArray(data.families) ? data.families : [],
  };
}

function rowToSubmission(row: any) {
  const branch = jsonToBranch(row.branch_data);
  // Overlay with live image URLs fetched via JOIN (beat the stale JSONB snapshot)
  if (row.branch_logo_url != null) branch.logoUrl = row.branch_logo_url;
  if (row.branch_synagogue_image_url != null) branch.synagogueImageUrl = row.branch_synagogue_image_url;
  return {
    id: row.id,
    branch,
    submittedAt: row.submitted_at,
    status: row.status,
    reviewNote: row.review_note ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
  };
}

function rowToMemberSub(row: any) {
  return {
    id: row.id,
    branchId: row.branch_id,
    branchName: row.branch_name,
    submitterName: row.submitter_name,
    submitterNote: row.submitter_note ?? undefined,
    headCensus: row.head_census ?? {},
    members: Array.isArray(row.members) ? row.members : [],
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewNote: row.review_note ?? undefined,
  };
}

/* ── Branch (Local Admin) ─────────────────────────────────────────────────── */

router.get("/census/branch", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM census_branches WHERE owner_user_id = $1",
      [userId]
    );
    if (rows.length === 0) { res.json(null); return; }
    res.json(rowToBranch(rows[0]));
  } catch (err) {
    logger.error({ err }, "census/branch GET failed");
    return apiError.internal(res, "Failed to load branch");
  }
});

router.put("/census/branch", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = branchSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid branch data", parsed.error.issues);
  }
  const { id, name, cityId, cityName, adminName, established, logoUrl, synagogueImageUrl, families, leadership, branchStatus } = parsed.data;
  const isNew = !id;
  const branchId = id || `br_${Date.now()}`;
  // New branches always start as 'draft' (DATA-702 lifecycle); updates preserve caller-supplied status
  const resolvedStatus = isNew ? "draft" : (branchStatus || "draft");
  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM census_branches WHERE owner_user_id = $1", [userId]
    );
    const alreadyExists = existing.length > 0;

    await pool.query(
      `INSERT INTO census_branches (id, owner_user_id, name, city_id, city_name, admin_name, established, logo_url, synagogue_image_url, families, leadership, branch_status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, NOW())
       ON CONFLICT (owner_user_id) DO UPDATE
         SET id = EXCLUDED.id,
             name = EXCLUDED.name,
             city_id = EXCLUDED.city_id,
             city_name = EXCLUDED.city_name,
             admin_name = EXCLUDED.admin_name,
             established = EXCLUDED.established,
             logo_url = EXCLUDED.logo_url,
             synagogue_image_url = EXCLUDED.synagogue_image_url,
             families = EXCLUDED.families,
             leadership = EXCLUDED.leadership,
             branch_status = CASE
               WHEN census_branches.branch_status IN ('approved', 'active', 'suspended', 'archived')
               THEN census_branches.branch_status   -- never downgrade approved/active via PUT
               ELSE EXCLUDED.branch_status
             END,
             updated_at = NOW()`,
      [
        branchId, userId, name, cityId || "", cityName || "",
        adminName || null, established || null, logoUrl || null, synagogueImageUrl || null,
        JSON.stringify(families ?? []),
        leadership ? JSON.stringify(leadership) : null,
        resolvedStatus,
      ]
    );

    const { rows: saved } = await pool.query(
      "SELECT * FROM census_branches WHERE owner_user_id = $1", [userId]
    );

    // Record creation event for brand-new branches
    if (!alreadyExists) {
      await pool.query(
        `INSERT INTO branch_review_events (id, branch_id, actor_user_id, actor_role, action, from_status, to_status)
         VALUES ($1, $2, $3, 'local_admin', 'created', NULL, 'draft')`,
        [`bre_${Date.now()}`, saved[0].id, userId]
      ).catch(() => {});
    }

    res.json(rowToBranch(saved[0]));
  } catch (err) {
    logger.error({ err }, "census/branch PUT failed");
    return apiError.internal(res, "Failed to save branch");
  }
});

/* ── Submissions (Global Admin review) ───────────────────────────────────── */

router.get("/census/submissions", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cs.*,
              cb.logo_url            AS branch_logo_url,
              cb.synagogue_image_url AS branch_synagogue_image_url
         FROM census_submissions cs
         LEFT JOIN census_branches cb ON cb.owner_user_id = cs.owner_user_id
        ORDER BY cs.submitted_at DESC`
    );
    res.json(rows.map(rowToSubmission));
  } catch (err) {
    logger.error({ err }, "census/submissions GET failed");
    return apiError.internal(res, "Failed to load submissions");
  }
});

router.post("/census/submissions", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { branch } = req.body;
  if (!branch) { return apiError.badRequest(res, "Missing branch"); }
  const parsedBranch = branchSchema.safeParse(branch);
  if (!parsedBranch.success) {
    return apiError.badRequest(res, "Invalid branch data", parsedBranch.error.issues);
  }
  try {
    const existing = await pool.query(
      "SELECT id FROM census_submissions WHERE owner_user_id = $1",
      [userId]
    );
    if (existing.rows.length > 0) {
      const id = existing.rows[0].id;
      await pool.query(
        `UPDATE census_submissions
           SET branch_data = $2::jsonb, status = 'pending', submitted_at = NOW(), reviewed_at = NULL, review_note = NULL
           WHERE id = $1`,
        [id, JSON.stringify(parsedBranch.data)]
      );
      const { rows } = await pool.query("SELECT * FROM census_submissions WHERE id = $1", [id]);
      res.json(rowToSubmission(rows[0]));
    } else {
      const id = `csub_${Date.now()}`;
      await pool.query(
        `INSERT INTO census_submissions (id, owner_user_id, branch_data, status)
         VALUES ($1, $2, $3::jsonb, 'pending')`,
        [id, userId, JSON.stringify(parsedBranch.data)]
      );
      const { rows } = await pool.query("SELECT * FROM census_submissions WHERE id = $1", [id]);
      res.json(rowToSubmission(rows[0]));
    }
  } catch (err) {
    logger.error({ err }, "census/submissions POST failed");
    return apiError.internal(res, "Failed to create submission");
  }
});

router.patch("/census/submissions/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, reviewNote } = req.body as { status: "approved" | "rejected"; reviewNote?: string };
  if (!["approved", "rejected"].includes(status)) {
    return apiError.badRequest(res, "status must be 'approved' or 'rejected'");
  }
  if (reviewNote != null && (typeof reviewNote !== "string" || reviewNote.length > 500)) {
    return apiError.badRequest(res, "reviewNote must be a string under 500 characters");
  }
  try {
    await pool.query(
      `UPDATE census_submissions
         SET status = $2, review_note = $3, reviewed_at = NOW()
         WHERE id = $1`,
      [id, status, reviewNote || null]
    );
    const { rows } = await pool.query(
      `SELECT cs.*,
              cb.logo_url            AS branch_logo_url,
              cb.synagogue_image_url AS branch_synagogue_image_url
         FROM census_submissions cs
         LEFT JOIN census_branches cb ON cb.owner_user_id = cs.owner_user_id
        WHERE cs.id = $1`,
      [id]
    );
    if (rows.length === 0) { return apiError.notFound(res); }
    res.json(rowToSubmission(rows[0]));
  } catch (err) {
    logger.error({ err }, "census/submissions PATCH failed");
    return apiError.internal(res, "Failed to update submission");
  }
});

/* ── Member submissions ───────────────────────────────────────────────────── */

router.get("/census/member-submissions", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM census_member_submissions ORDER BY submitted_at DESC"
    );
    res.json(rows.map(rowToMemberSub));
  } catch (err) {
    logger.error({ err }, "census/member-submissions GET failed");
    return apiError.internal(res, "Failed to load member submissions");
  }
});

/* POST /census/member-submissions — intentionally public (no auth required):
   Community members submit their household census without needing to sign in. */
router.post("/census/member-submissions", async (req, res) => {
  const parsed = memberSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid submission data", parsed.error.issues);
  }
  const { branchId, branchName, submitterName, submitterNote, headCensus, members } = parsed.data;
  const id = `msub_${Date.now()}`;
  try {
    await pool.query(
      `INSERT INTO census_member_submissions
         (id, branch_id, branch_name, submitter_name, submitter_note, head_census, members, status)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, 'pending')`,
      [id, branchId || "", branchName || "", submitterName, submitterNote || null,
       JSON.stringify(headCensus ?? {}), JSON.stringify(members ?? [])]
    );
    const { rows } = await pool.query("SELECT * FROM census_member_submissions WHERE id = $1", [id]);
    res.json(rowToMemberSub(rows[0]));
  } catch (err) {
    logger.error({ err }, "census/member-submissions POST failed");
    return apiError.internal(res, "Failed to submit");
  }
});

router.patch("/census/member-submissions/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, reviewNote } = req.body as { status: "approved" | "rejected" | "pending"; reviewNote?: string };
  if (!["approved", "rejected", "pending"].includes(status)) {
    return apiError.badRequest(res, "status must be 'approved', 'rejected', or 'pending'");
  }
  if (reviewNote != null && (typeof reviewNote !== "string" || reviewNote.length > 500)) {
    return apiError.badRequest(res, "reviewNote must be a string under 500 characters");
  }
  try {
    await pool.query(
      `UPDATE census_member_submissions
         SET status = $2, review_note = $3, reviewed_at = CASE WHEN $2 = 'pending' THEN NULL ELSE NOW() END
         WHERE id = $1`,
      [id, status, reviewNote || null]
    );
    const { rows } = await pool.query("SELECT * FROM census_member_submissions WHERE id = $1", [id]);
    if (rows.length === 0) { return apiError.notFound(res); }
    res.json(rowToMemberSub(rows[0]));
  } catch (err) {
    logger.error({ err }, "census/member-submissions PATCH failed");
    return apiError.internal(res, "Failed to update");
  }
});

/* ── Approved branches (public — no auth) ─────────────────────────────────── */

router.get("/census/approved-branches", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (cb.id) cb.*
         FROM census_branches cb
         INNER JOIN census_submissions cs ON cs.owner_user_id = cb.owner_user_id
        WHERE cs.status = 'approved'
        ORDER BY cb.id, cb.name`
    );
    res.json(rows.map(rowToBranch));
  } catch (err) {
    logger.error({ err }, "census/approved-branches GET failed");
    return apiError.internal(res, "Failed to load approved branches");
  }
});

/* ── My submission status (auth) ─────────────────────────────────────────── */

router.get("/census/submissions/mine", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const { rows } = await pool.query(
      `SELECT cs.*,
              cb.logo_url            AS branch_logo_url,
              cb.synagogue_image_url AS branch_synagogue_image_url
         FROM census_submissions cs
         LEFT JOIN census_branches cb ON cb.owner_user_id = cs.owner_user_id
        WHERE cs.owner_user_id = $1
        ORDER BY cs.submitted_at DESC
        LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) { res.json(null); return; }
    res.json(rowToSubmission(rows[0]));
  } catch (err) {
    logger.error({ err }, "census/submissions/mine GET failed");
    return apiError.internal(res, "Failed to load submission status");
  }
});

/* ══════════════════════════════════════════════════════════════
   DATA-702 — BRANCH LIFECYCLE ENDPOINTS
══════════════════════════════════════════════════════════════ */

const transitionSchema = z.object({
  action: z.enum(["submit", "approve", "reject", "request_changes", "activate", "suspend", "archive", "restore"]),
  note: z.string().max(2000).optional(),
});

/* ── Local Admin: submit own branch for review ───────────────────────────── */

router.post("/census/branch/submit", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM census_branches WHERE owner_user_id = $1", [userId]
    );
    if (rows.length === 0) return apiError.notFound(res, "No branch found");
    const branch = rows[0];
    const current: string = branch.branch_status;
    if (!["draft", "rejected"].includes(current)) {
      return res.status(409).json({ error: `Cannot submit a branch with status '${current}'` });
    }

    const reviewEventId = `bre_${randomUUID()}`;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query(
        `UPDATE census_branches
            SET branch_status = 'pending_review', updated_at = NOW()
          WHERE id = $1 AND branch_status = $2
        RETURNING id`,
        [branch.id, current],
      );
      if ((updated.rowCount ?? 0) !== 1) throw new Error("Branch status changed concurrently");
      await client.query(
        `INSERT INTO branch_review_events (id, branch_id, actor_user_id, actor_role, action, from_status, to_status)
         VALUES ($1, $2, $3, 'local_admin', 'submitted', $4, 'pending_review')`,
        [reviewEventId, branch.id, userId, current],
      );
      await enqueueBranchOwnerWebNotification(
        userId, branch.name, "pending_review", undefined, reviewEventId, client,
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    sendBranchOwnerExpoNotification(userId, branch.name, "pending_review").catch(() => {});
    logger.info({ branchId: branch.id, userId }, "branch submitted for review");

    const { rows: updated } = await pool.query("SELECT * FROM census_branches WHERE id = $1", [branch.id]);
    res.json(rowToBranch(updated[0]));
  } catch (err) {
    logger.error({ err }, "census/branch/submit failed");
    return apiError.internal(res, "Failed to submit branch");
  }
});

/* ── Admin: transition branch status (Regional + National) ──────────────── */

router.post("/census/admin/branches/:id/transition", requireRegionalAdmin, async (req, res) => {
  const { id } = req.params;
  const adminUserId: string = (req as any).userId;
  const adminRole: BranchAdminRole = (req as any).adminRole;

  const parsed = transitionSchema.safeParse(req.body);
  if (!parsed.success) return apiError.badRequest(res, "Invalid request", parsed.error.issues);

  const { action, note } = parsed.data as { action: BranchAction; note?: string };

  // Verify role is sufficient for this action
  const minRole = ACTION_MIN_ROLE[action];
  const roleRank: Record<BranchAdminRole, number> = { local_admin: 0, regional_admin: 1, national_admin: 2 };
  if (roleRank[adminRole] < roleRank[minRole]) {
    return res.status(403).json({ error: `Action '${action}' requires ${minRole} role` });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM census_branches WHERE id = $1", [String(id)]);
    if (rows.length === 0) return apiError.notFound(res, "Branch not found");

    const branch = rows[0];
    const current: string = branch.branch_status;
    const validFrom = ACTION_FROM_STATUSES[action];

    if (!validFrom.includes(current as any)) {
      return res.status(409).json({ error: `Cannot perform '${action}' on branch with status '${current}'` });
    }

    const toStatus = ACTION_TO_STATUS[action];
    const reviewEventId = `bre_${randomUUID()}`;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query(
        `UPDATE census_branches SET branch_status = $2, updated_at = NOW()
          WHERE id = $1 AND branch_status = $3 RETURNING id`,
        [String(id), toStatus, current],
      );
      if ((updated.rowCount ?? 0) !== 1) throw new Error("Branch status changed concurrently");
      await client.query(
        `INSERT INTO branch_review_events (id, branch_id, actor_user_id, actor_role, action, from_status, to_status, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [reviewEventId, String(id), adminUserId, adminRole, action, current, toStatus, note || null],
      );
      await enqueueBranchOwnerWebNotification(
        branch.owner_user_id, branch.name, toStatus, note, reviewEventId, client,
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
    sendBranchOwnerExpoNotification(
      branch.owner_user_id, branch.name, toStatus, note,
    ).catch(() => {});
    logger.info({ branchId: String(id), action, adminUserId, toStatus }, "branch lifecycle transition");

    const { rows: updated } = await pool.query("SELECT * FROM census_branches WHERE id = $1", [String(id)]);
    res.json(rowToBranch(updated[0]));
  } catch (err) {
    logger.error({ err }, "census/admin/branches/:id/transition failed");
    return apiError.internal(res, "Failed to transition branch status");
  }
});

/* ── Admin: list all branches (dashboard) ───────────────────────────────── */

router.get("/census/admin/branches", requireRegionalAdmin, async (req, res) => {
  const status = req.query["status"] as string | undefined;
  try {
    const query = status
      ? "SELECT * FROM census_branches WHERE branch_status = $1 ORDER BY created_at DESC"
      : "SELECT * FROM census_branches ORDER BY created_at DESC";
    const params = status ? [status] : [];
    const { rows } = await pool.query(query, params);
    res.json(rows.map(rowToBranch));
  } catch (err) {
    logger.error({ err }, "census/admin/branches GET failed");
    return apiError.internal(res, "Failed to list branches");
  }
});

/* ── Branch review history (auth — owner or admin) ──────────────────────── */

router.get("/census/branch/history", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    // Resolve owner's branch
    const { rows: branchRows } = await pool.query(
      "SELECT id FROM census_branches WHERE owner_user_id = $1", [userId]
    );
    if (branchRows.length === 0) { res.json([]); return; }
    const branchId = branchRows[0].id;

    const { rows } = await pool.query(
      `SELECT * FROM branch_review_events WHERE branch_id = $1 ORDER BY created_at ASC`,
      [branchId]
    );
    res.json(rows.map((r: any) => ({
      id: r.id,
      branchId: r.branch_id,
      actorUserId: r.actor_user_id,
      actorRole: r.actor_role,
      action: r.action,
      fromStatus: r.from_status,
      toStatus: r.to_status,
      note: r.note ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, "census/branch/history GET failed");
    return apiError.internal(res, "Failed to load branch history");
  }
});

/* ── Admin: get review history for any branch ───────────────────────────── */

router.get("/census/admin/branches/:id/history", requireRegionalAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM branch_review_events WHERE branch_id = $1 ORDER BY created_at ASC",
      [String(id)]
    );
    res.json(rows.map((r: any) => ({
      id: r.id,
      branchId: r.branch_id,
      actorUserId: r.actor_user_id,
      actorRole: r.actor_role,
      action: r.action,
      fromStatus: r.from_status,
      toStatus: r.to_status,
      note: r.note ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, "census/admin/branches/:id/history GET failed");
    return apiError.internal(res, "Failed to load branch history");
  }
});

/* ── Get current user's admin role ──────────────────────────────────────── */

router.get("/census/admin/role", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const resolved = await resolveAdminRole(req);
  if (!resolved) {
    // Check if user owns a branch (local admin)
    const { rows } = await pool.query(
      "SELECT id FROM census_branches WHERE owner_user_id = $1", [userId]
    );
    res.json({ role: rows.length > 0 ? "local_admin" : null });
    return;
  }
  res.json({ role: resolved.role });
});

/* ── National Admin: assign regional/national role ──────────────────────── */

router.post("/census/admin/roles", requireNationalAdmin, async (req, res) => {
  const adminId: string = (req as any).userId;
  const parsed = z.object({
    userId: z.string().min(1),
    role: z.enum(["regional_admin", "national_admin"]),
  }).safeParse(req.body);
  if (!parsed.success) return apiError.badRequest(res, "Invalid request", parsed.error.issues);

  try {
    await pool.query(
      `INSERT INTO branch_admin_roles (user_id, role, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, assigned_by = EXCLUDED.assigned_by, assigned_at = NOW()`,
      [parsed.data.userId, parsed.data.role, adminId]
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "census/admin/roles POST failed");
    return apiError.internal(res, "Failed to assign role");
  }
});

export default router;

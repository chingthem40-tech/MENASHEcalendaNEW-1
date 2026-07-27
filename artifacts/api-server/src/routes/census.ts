import { Router } from "express";
import { pool } from "@workspace/db";
import { branchSchema, memberSubmissionSchema } from "@workspace/shared-core/census";
import { requireAuth } from "../lib/requireAuth";
import { requireAdmin } from "../lib/requireAdmin";
import { apiError } from "../lib/apiError";
import { logger } from "../lib/logger";

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
  const { id, name, cityId, cityName, adminName, established, logoUrl, synagogueImageUrl, families } = parsed.data;
  const branchId = id || `br_${Date.now()}`;
  try {
    await pool.query(
      `INSERT INTO census_branches (id, owner_user_id, name, city_id, city_name, admin_name, established, logo_url, synagogue_image_url, families, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, NOW())
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
             updated_at = NOW()`,
      [branchId, userId, name, cityId || "", cityName || "", adminName || null, established || null, logoUrl || null, synagogueImageUrl || null, JSON.stringify(families ?? [])]
    );
    const { rows: saved } = await pool.query(
      "SELECT * FROM census_branches WHERE owner_user_id = $1", [userId]
    );
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

export default router;

import { Router } from "express";
import { z } from "zod";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";
import { requireAdmin } from "../lib/requireAdmin";
import { safeIsAdmin, safeGetAuth } from "../lib/authorization";
import { apiError } from "../lib/apiError";

const router = Router();

const submitSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(200).optional().default("Anonymous"),
  isAnonymous: z.boolean().optional().default(false),
  text: z.string().min(1).max(1000),
  category: z.string().max(50).optional().default("Blessing"),
});

const patchSchema = z.object({
  status: z.enum(["pending", "approved", "removed"]).optional(),
  pinned: z.boolean().optional(),
  adminResponse: z.string().max(1000).optional(),
});

function rowToRequest(row: any) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    name: row.name,
    isAnonymous: row.is_anonymous,
    text: row.text,
    category: row.category,
    status: row.status,
    pinned: row.pinned,
    adminResponse: row.admin_response,
    amens: row.amens,
    submittedAt: new Date(row.submitted_at).toISOString(),
  };
}

/* ── GET /prayer-requests — approved list (or full list for admins) ── */
router.get("/prayer-requests", async (req, res) => {
  const isAdmin = safeIsAdmin(req);
  try {
    const { rows } = isAdmin
      ? await pool.query(
          "SELECT * FROM prayer_requests ORDER BY pinned DESC, submitted_at DESC",
        )
      : await pool.query(
          "SELECT * FROM prayer_requests WHERE status = 'approved' ORDER BY pinned DESC, submitted_at DESC",
        );
    res.json(rows.map(rowToRequest));
  } catch (err) {
    logger.error({ err }, "GET /prayer-requests: db error");
    apiError.internal(res, "Failed to load prayer requests");
  }
});

/* ── POST /prayer-requests — submit a new request ── */
router.post("/prayer-requests", async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return apiError.badRequest(res, "Invalid request body");

  const { id, name, isAnonymous, text, category } = parsed.data;
  const userId = safeGetAuth(req).userId ?? null;
  const displayName = isAnonymous ? "Anonymous" : (name.trim() || "Anonymous");

  try {
    const existing = await pool.query("SELECT id FROM prayer_requests WHERE id = $1", [id]);
    if (existing.rows.length > 0) {
      return apiError.badRequest(res, "Request already submitted");
    }

    const { rows } = await pool.query(
      `INSERT INTO prayer_requests
         (id, user_id, name, is_anonymous, text, category, status, pinned, admin_response, amens)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', FALSE, '', 0)
       RETURNING *`,
      [id, userId, displayName, isAnonymous, text.trim(), category],
    );
    res.status(201).json(rowToRequest(rows[0]));
  } catch (err) {
    logger.error({ err }, "POST /prayer-requests: db error");
    apiError.internal(res, "Failed to submit prayer request");
  }
});

/* ── PATCH /prayer-requests/:id — admin moderation ── */
router.patch("/prayer-requests/:id", requireAdmin, async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return apiError.badRequest(res, "Invalid request body");

  const id = String(req.params["id"]);
  const { status, pinned, adminResponse } = parsed.data;

  const sets: string[] = ["updated_at = NOW()"];
  const values: any[] = [];
  let idx = 1;

  if (status !== undefined)        { sets.push(`status = $${idx++}`);         values.push(status); }
  if (pinned !== undefined)        { sets.push(`pinned = $${idx++}`);          values.push(pinned); }
  if (adminResponse !== undefined) { sets.push(`admin_response = $${idx++}`);  values.push(adminResponse); }

  if (sets.length === 1) return apiError.badRequest(res, "Nothing to update");

  values.push(id);
  try {
    const { rows } = await pool.query(
      `UPDATE prayer_requests SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );
    if (rows.length === 0) return apiError.notFound(res);
    res.json(rowToRequest(rows[0]));
  } catch (err) {
    logger.error({ err }, "PATCH /prayer-requests/:id: db error");
    apiError.internal(res, "Failed to update request");
  }
});

/* ── POST /prayer-requests/:id/amen — increment amen count ── */
router.post("/prayer-requests/:id/amen", async (req, res) => {
  const id = String(req.params["id"]);
  try {
    const { rows } = await pool.query(
      "UPDATE prayer_requests SET amens = amens + 1, updated_at = NOW() WHERE id = $1 AND status = 'approved' RETURNING amens",
      [id],
    );
    if (rows.length === 0) return apiError.notFound(res);
    res.json({ amens: rows[0].amens });
  } catch (err) {
    logger.error({ err }, "POST /prayer-requests/:id/amen: db error");
    apiError.internal(res, "Failed to register amen");
  }
});

export default router;

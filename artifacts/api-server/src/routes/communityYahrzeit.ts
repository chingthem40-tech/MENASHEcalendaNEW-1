import { Router } from "express";
import { z } from "zod";
import type { Request } from "express";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/requireAuth";
import { requireAdmin } from "../lib/requireAdmin";
import { safeGetAuth } from "../lib/authorization";
import { apiError } from "../lib/apiError";
import { broadcastDedicationPush } from "./push";

/**
 * resolveUserId — returns the authenticated Clerk userId when available,
 * otherwise returns a stable-per-IP-per-day anonymous identifier.
 *
 * Using IP+day gives each client a consistent identity within a calendar day
 * (so dedicate-cleanup DELETEs work correctly) while keeping different clients
 * isolated (no shared "guest" collision). When CLERK_SECRET_KEY is present
 * and the user is signed in, the real Clerk userId is always preferred.
 */
function resolveUserId(req: Request): string {
  const authed = safeGetAuth(req).userId;
  if (authed) return authed;
  const raw = String(req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "");
  const ip = (raw.split(",")[0]?.trim() || "unknown").replace(/[^a-z0-9.:_-]/gi, "_");
  const day = new Date().toISOString().slice(0, 10);
  return `anon-${ip}-${day}`;
}

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const yahrzeitCreateSchema = z.object({
  id: z.string().min(1).max(100),
  deceasedName: z.string().min(1).max(200),
  hebrewDay: z.number().int().min(1).max(30),
  hebrewMonth: z.number().int().min(1).max(13),
  displayDate: z.string().max(100).optional(),
  passingYear: z.number().int().min(1).max(3000).optional().nullable(),
  message: z.string().max(500).optional(),
  donorDisplayName: z.string().max(200).optional(),
});

const lightSchema = z.object({
  donorDisplayName: z.string().max(200).optional(),
});

const dedicateSchema = z.object({
  learnerName: z.string().min(1).max(200),
  studySubject: z.string().max(200).optional(),
});

/* ── GET /yahrzeit — public, returns all lit candles with active learners ── */
router.get("/yahrzeit", async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT
        cy.id, cy.user_id, cy.deceased_name, cy.hebrew_day, cy.hebrew_month,
        cy.display_date, cy.passing_year, cy.message,
        cy.candle_lit, cy.candle_lit_by, cy.candle_lit_at,
        cy.donor_display_name, cy.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', cyl.id,
              'learnerName', cyl.learner_name,
              'studySubject', cyl.study_subject
            )
          ) FILTER (WHERE cyl.id IS NOT NULL AND cyl.active_until > NOW()),
          '[]'
        ) AS learners
      FROM community_yahrzeit cy
      LEFT JOIN community_yahrzeit_learners cyl
        ON cyl.entry_id = cy.id AND cyl.active_until > NOW()
      WHERE cy.candle_lit = true
      GROUP BY cy.id
      ORDER BY cy.candle_lit_at DESC
      LIMIT 50
    `);

    return res.json(rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      deceasedName: r.deceased_name,
      hebrewDay: r.hebrew_day,
      hebrewMonth: r.hebrew_month,
      displayDate: r.display_date,
      passingYear: r.passing_year,
      message: r.message,
      candleLit: r.candle_lit,
      candleLitAt: r.candle_lit_at,
      donorDisplayName: r.donor_display_name,
      createdAt: r.created_at,
      learners: r.learners,
    })));
  } finally {
    client.release();
  }
});

/* ── POST /yahrzeit — create + immediately light a candle (optional auth) ── */
router.post("/yahrzeit", async (req, res) => {
  const userId = resolveUserId(req);
  const parsed = yahrzeitCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid yahrzeit data", parsed.error.issues);
  }
  const { id, deceasedName, hebrewDay, hebrewMonth, displayDate, passingYear, message, donorDisplayName } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO community_yahrzeit
         (id, user_id, deceased_name, hebrew_day, hebrew_month, display_date, passing_year, message, candle_lit, candle_lit_by, candle_lit_at, donor_display_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$2,NOW(),$9)
       ON CONFLICT (id) DO NOTHING`,
      [id, userId, deceasedName, hebrewDay, hebrewMonth, displayDate ?? "", passingYear ?? null, message ?? "", donorDisplayName ?? ""]
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

/* ── POST /yahrzeit/:id/light — light a candle (optional auth) ── */
router.post("/yahrzeit/:id/light", async (req, res) => {
  const userId = resolveUserId(req);
  const { id } = req.params;
  const parsed = lightSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid data", parsed.error.issues);
  }
  const { donorDisplayName } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE community_yahrzeit
       SET candle_lit = true, candle_lit_by = $2, candle_lit_at = NOW(), donor_display_name = $3
       WHERE id = $1`,
      [id, userId, donorDisplayName ?? ""]
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

/* ── DELETE /yahrzeit/:id — delete own entry (auth) ── */
router.delete("/yahrzeit/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query(
      "DELETE FROM community_yahrzeit WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

/* ── POST /yahrzeit/:id/dedicate — dedicate current learning to a candle (optional auth) ── */
router.post("/yahrzeit/:id/dedicate", async (req, res) => {
  const userId = resolveUserId(req);
  const { id } = req.params;
  const parsed = dedicateSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid dedication data", parsed.error.issues);
  }
  const { learnerName, studySubject } = parsed.data;

  const dedicationId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const activeUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const client = await pool.connect();
  try {
    /* Fetch the deceased name so we can include it in the push notification. */
    const nameRow = await client.query<{ deceased_name: string }>(
      "SELECT deceased_name FROM community_yahrzeit WHERE id = $1",
      [id]
    );
    const deceasedName = nameRow.rows[0]?.deceased_name ?? "a loved one";

    await client.query(
      "DELETE FROM community_yahrzeit_learners WHERE entry_id = $1 AND user_id = $2",
      [id, userId]
    );
    await client.query(
      `INSERT INTO community_yahrzeit_learners (id, entry_id, user_id, learner_name, study_subject, active_until)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [dedicationId, id, userId, learnerName, studySubject ?? "Torah", activeUntil]
    );

    /* Fire the community push notification in the background — never block the response. */
    broadcastDedicationPush({
      learnerName,
      studySubject: studySubject ?? "Torah",
      deceasedName,
    }).catch(() => { /* broadcast failure must not surface to caller */ });

    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

/* ── Admin: GET /admin/yahrzeit — all entries ── */
router.get("/admin/yahrzeit", requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT cy.*, COUNT(cyl.id) FILTER (WHERE cyl.active_until > NOW()) AS active_learners
      FROM community_yahrzeit cy
      LEFT JOIN community_yahrzeit_learners cyl ON cyl.entry_id = cy.id
      GROUP BY cy.id
      ORDER BY cy.created_at DESC
    `);
    return res.json(rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      deceasedName: r.deceased_name,
      hebrewDay: r.hebrew_day,
      hebrewMonth: r.hebrew_month,
      displayDate: r.display_date,
      passingYear: r.passing_year,
      message: r.message,
      candleLit: r.candle_lit,
      candleLitAt: r.candle_lit_at,
      donorDisplayName: r.donor_display_name,
      createdAt: r.created_at,
      activeLearners: Number(r.active_learners),
    })));
  } finally {
    client.release();
  }
});

/* ── Admin: DELETE /admin/yahrzeit/:id — remove any entry ── */
router.delete("/admin/yahrzeit/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM community_yahrzeit_learners WHERE entry_id = $1", [id]);
    await client.query("DELETE FROM community_yahrzeit WHERE id = $1", [id]);
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

export default router;

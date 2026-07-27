import { Router } from "express";
import { z } from "zod/v4";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/requireAuth";
import { requireAdmin } from "../lib/requireAdmin";
import { apiError } from "../lib/apiError";
import { logger } from "../lib/logger";

const router = Router();

/**
 * Member Directory — server-backed, shared across web + mobile.
 * Replaces the web app's previous localStorage-only implementation.
 * One row per registered user (upsert on POST/PUT — a user always
 * has at most one directory entry).
 */

// ── Validation ────────────────────────────────────────────────────────────────

const directorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().max(120).optional().default(""),
  country: z.string().trim().max(60).optional().default("India"),
  role: z.string().trim().max(60).optional().default("Member"),
  bio: z.string().trim().max(1000).optional().default(""),
  whatsapp: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(200).optional(),
  otherContact: z.string().trim().max(200).optional(),
  birthday: z.string().trim().max(20).optional(),
  aliyahDate: z.string().trim().max(20).optional(),
  avatarEmoji: z.string().trim().max(8).optional(),
  profilePhotoUrl: z.string().trim().max(1000).optional(),
});

// ── Row mapper ────────────────────────────────────────────────────────────────

function rowToMember(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    city: row.city,
    country: row.country,
    role: row.role,
    bio: row.bio,
    whatsapp: row.whatsapp ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    otherContact: row.other_contact ?? undefined,
    birthday: row.birthday ?? undefined,
    aliyahDate: row.aliyah_date ?? undefined,
    avatarEmoji: row.avatar_emoji ?? undefined,
    profilePhotoUrl: row.profile_photo_url ?? null,
    status: row.status,
    joinedAt: row.joined_at,
  };
}

// ── Public: approved members only ────────────────────────────────────────────

router.get("/directory", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM member_directory WHERE status = 'approved' ORDER BY joined_at DESC",
    );
    res.json(rows.map(rowToMember));
  } catch (err) {
    logger.error({ err }, "directory GET failed");
    return apiError.internal(res, "Failed to load directory");
  }
});

// ── Authenticated: my own entry (any status) ─────────────────────────────────

router.get("/directory/me", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM member_directory WHERE user_id = $1",
      [userId],
    );
    if (rows.length === 0) return res.json(null);
    res.json(rowToMember(rows[0]));
  } catch (err) {
    logger.error({ err }, "directory/me GET failed");
    return apiError.internal(res, "Failed to load your directory entry");
  }
});

// ── Authenticated: register (create) ─────────────────────────────────────────

router.post("/directory", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = directorySchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid directory data", parsed.error.issues);
  }
  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM member_directory WHERE user_id = $1",
      [userId],
    );
    if (existing.length > 0) {
      return apiError.badRequest(res, "You already have a directory entry — use PUT to edit it");
    }
    const d = parsed.data;
    const id = `dir_${Date.now()}`;
    await pool.query(
      `INSERT INTO member_directory
         (id, user_id, name, city, country, role, bio, whatsapp, phone, email, other_contact, birthday, aliyah_date, avatar_emoji, profile_photo_url, status, joined_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending',NOW(),NOW())`,
      [
        id, userId, d.name, d.city, d.country, d.role, d.bio,
        d.whatsapp || null, d.phone || null, d.email || null, d.otherContact || null,
        d.birthday || null, d.aliyahDate || null, d.avatarEmoji || null, d.profilePhotoUrl || null,
      ],
    );
    const { rows } = await pool.query("SELECT * FROM member_directory WHERE id = $1", [id]);
    res.json(rowToMember(rows[0]));
  } catch (err) {
    logger.error({ err }, "directory POST failed");
    return apiError.internal(res, "Failed to register");
  }
});

// ── Authenticated: edit my own entry ──────────────────────────────────────────

router.put("/directory", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = directorySchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid directory data", parsed.error.issues);
  }
  const d = parsed.data;
  try {
    const { rows: existing } = await pool.query(
      "SELECT id FROM member_directory WHERE user_id = $1",
      [userId],
    );
    const id = existing.length > 0 ? existing[0].id : `dir_${Date.now()}`;
    await pool.query(
      `INSERT INTO member_directory
         (id, user_id, name, city, country, role, bio, whatsapp, phone, email, other_contact, birthday, aliyah_date, avatar_emoji, profile_photo_url, status, joined_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending',NOW(),NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         name = EXCLUDED.name,
         city = EXCLUDED.city,
         country = EXCLUDED.country,
         role = EXCLUDED.role,
         bio = EXCLUDED.bio,
         whatsapp = EXCLUDED.whatsapp,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         other_contact = EXCLUDED.other_contact,
         birthday = EXCLUDED.birthday,
         aliyah_date = EXCLUDED.aliyah_date,
         avatar_emoji = EXCLUDED.avatar_emoji,
         profile_photo_url = EXCLUDED.profile_photo_url,
         updated_at = NOW()`,
      [
        id, userId, d.name, d.city, d.country, d.role, d.bio,
        d.whatsapp || null, d.phone || null, d.email || null, d.otherContact || null,
        d.birthday || null, d.aliyahDate || null, d.avatarEmoji || null, d.profilePhotoUrl || null,
      ],
    );
    const { rows } = await pool.query("SELECT * FROM member_directory WHERE user_id = $1", [userId]);
    res.json(rowToMember(rows[0]));
  } catch (err) {
    logger.error({ err }, "directory PUT failed");
    return apiError.internal(res, "Failed to save your directory entry");
  }
});

// ── Admin moderation ──────────────────────────────────────────────────────────

router.get("/directory/admin/all", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM member_directory ORDER BY joined_at DESC",
    );
    res.json(rows.map(rowToMember));
  } catch (err) {
    logger.error({ err }, "directory/admin/all GET failed");
    return apiError.internal(res, "Failed to load members");
  }
});

router.patch("/directory/:id/approve", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      "UPDATE member_directory SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id],
    );
    if (rows.length === 0) return apiError.notFound(res);
    res.json(rowToMember(rows[0]));
  } catch (err) {
    logger.error({ err }, "directory approve failed");
    return apiError.internal(res, "Failed to approve member");
  }
});

router.patch("/directory/:id/hide", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      "UPDATE member_directory SET status = 'hidden', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id],
    );
    if (rows.length === 0) return apiError.notFound(res);
    res.json(rowToMember(rows[0]));
  } catch (err) {
    logger.error({ err }, "directory hide failed");
    return apiError.internal(res, "Failed to hide member");
  }
});

router.delete("/directory/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM member_directory WHERE id = $1",
      [id],
    );
    if (!rowCount) return apiError.notFound(res);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "directory delete failed");
    return apiError.internal(res, "Failed to delete member");
  }
});

export default router;

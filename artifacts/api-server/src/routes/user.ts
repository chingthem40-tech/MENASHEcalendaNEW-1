import { Router } from "express";
import { z } from "zod";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/requireAuth";
import { requireAdmin } from "../lib/requireAdmin";
import { apiError } from "../lib/apiError";
import { sendPushToUser } from "./push";

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const profileSchema = z.object({
  theme: z.enum(["dark", "light", "sapphire"]).optional(),
  location: z.record(z.unknown()).optional().nullable(),
  // isPremium intentionally excluded — only set by admin/payment routes
  candleEnabled: z.boolean().optional(),
  language: z.enum(["en", "tk"]).optional(),
  notifPrefs: z.record(z.unknown()).optional().nullable(),
  leadTime: z.number().int().min(0).max(120).optional(),
});

const publicProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  congregation: z.string().max(200).optional(),
  bio: z.string().max(500).optional(),
  role: z.enum(["Member", "Avrekh", "Elder", "Rabbi", "Student", "Leader", "Teacher", "Other", "Community Leader", "Cantor", "Youth Leader", "Women's Group", "Admin"]).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  avatarEmoji: z.string().max(10).optional(),
  profilePhotoUrl: z.string().max(2_000_000).optional().nullable(),
});

const yahrzeitSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  hebrewDay: z.number().int().min(1).max(30),
  hebrewMonth: z.number().int().min(1).max(13),
  displayDate: z.string().max(100).optional(),
  wasAfterSunset: z.boolean().optional(),
});

const torahTrackerSchema = z.object({
  id: z.string().min(1).max(100),
  date: z.string().min(1).max(20),
  subject: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  duration: z.number().int().min(0).max(1440).optional(),
  notes: z.string().max(2000).optional(),
});

const goalSchema = z.object({
  goalMins: z.number().int().min(0).max(1440),
});

const premiumRequestSchema = z.object({
  note: z.string().max(500).optional(),
});

// ── Profile ───────────────────────────────────────────────────────────────────

router.get("/user/profile", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT * FROM user_profiles WHERE user_id = $1",
      [userId],
    );
    if (rows.length === 0) {
      return res.json({
        theme: "dark",
        location: null,
        isPremium: false,
        candleEnabled: true,
        language: "en",
        notifPrefs: null,
        leadTime: 10,
      });
    }
    const r = rows[0];
    return res.json({
      theme: r.theme,
      location: r.location,
      isPremium: r.is_premium,
      candleEnabled: r.candle_enabled,
      language: r.language,
      notifPrefs: r.notif_prefs,
      leadTime: r.lead_time,
    });
  } finally {
    client.release();
  }
});

router.put("/user/profile", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid profile data", parsed.error.issues);
  }
  const { theme, location, candleEnabled, language, notifPrefs, leadTime } = parsed.data;
  // isPremium is intentionally NOT accepted here — premium status is controlled
  // exclusively by admin routes (/admin/users/:id/premium) and payment verification.
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO user_profiles (user_id, theme, location, candle_enabled, language, notif_prefs, lead_time, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         theme = EXCLUDED.theme,
         location = EXCLUDED.location,
         candle_enabled = EXCLUDED.candle_enabled,
         language = EXCLUDED.language,
         notif_prefs = EXCLUDED.notif_prefs,
         lead_time = EXCLUDED.lead_time,
         updated_at = NOW()`,
      [
        userId,
        theme ?? "dark",
        location ? JSON.stringify(location) : null,
        candleEnabled ?? true,
        language ?? "en",
        notifPrefs ? JSON.stringify(notifPrefs) : null,
        leadTime ?? 10,
      ],
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

// ── Yahrzeit entries ──────────────────────────────────────────────────────────

router.get("/user/yahrzeit", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT * FROM yahrzeit_entries WHERE user_id = $1 ORDER BY created_at ASC",
      [userId],
    );
    return res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        hebrewDay: r.hebrew_day,
        hebrewMonth: r.hebrew_month,
        displayDate: r.display_date,
        wasAfterSunset: r.was_after_sunset,
      })),
    );
  } finally {
    client.release();
  }
});

router.post("/user/yahrzeit", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = yahrzeitSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid yahrzeit data", parsed.error.issues);
  }
  const { id, name, hebrewDay, hebrewMonth, displayDate, wasAfterSunset } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO yahrzeit_entries (id, user_id, name, hebrew_day, hebrew_month, display_date, was_after_sunset)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, id) DO UPDATE SET
         name = EXCLUDED.name,
         hebrew_day = EXCLUDED.hebrew_day,
         hebrew_month = EXCLUDED.hebrew_month,
         display_date = EXCLUDED.display_date,
         was_after_sunset = EXCLUDED.was_after_sunset`,
      [id, userId, name, hebrewDay, hebrewMonth, displayDate ?? "", wasAfterSunset ?? false],
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

router.delete("/user/yahrzeit/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = String(req.params.id);
  if (!id || id.length > 100) return apiError.badRequest(res, "Invalid id");
  const client = await pool.connect();
  try {
    await client.query(
      "DELETE FROM yahrzeit_entries WHERE user_id = $1 AND id = $2",
      [userId, id],
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

// ── Torah tracker entries ─────────────────────────────────────────────────────

router.get("/user/torah-tracker", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT * FROM torah_tracker_entries WHERE user_id = $1 ORDER BY date DESC",
      [userId],
    );
    return res.json(
      rows.map((r) => ({
        id: r.id,
        date: r.date,
        subject: r.subject,
        description: r.description,
        duration: r.duration,
        notes: r.notes,
      })),
    );
  } finally {
    client.release();
  }
});

router.post("/user/torah-tracker", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = torahTrackerSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid Torah tracker data", parsed.error.issues);
  }
  const { id, date, subject, description, duration, notes } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO torah_tracker_entries (id, user_id, date, subject, description, duration, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, id) DO UPDATE SET
         date = EXCLUDED.date,
         subject = EXCLUDED.subject,
         description = EXCLUDED.description,
         duration = EXCLUDED.duration,
         notes = EXCLUDED.notes`,
      [id, userId, date, subject, description ?? "", duration ?? 0, notes ?? ""],
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

router.delete("/user/torah-tracker/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = String(req.params.id);
  if (!id || id.length > 100) return apiError.badRequest(res, "Invalid id");
  const client = await pool.connect();
  try {
    await client.query(
      "DELETE FROM torah_tracker_entries WHERE user_id = $1 AND id = $2",
      [userId, id],
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

router.get("/user/torah-tracker/goal", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT goal_mins FROM torah_tracker_goals WHERE user_id = $1",
      [userId],
    );
    return res.json({ goalMins: rows.length > 0 ? rows[0].goal_mins : 0 });
  } finally {
    client.release();
  }
});

router.put("/user/torah-tracker/goal", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid goal data", parsed.error.issues);
  }
  const { goalMins } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO torah_tracker_goals (user_id, goal_mins, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE SET goal_mins = EXCLUDED.goal_mins, updated_at = NOW()`,
      [userId, goalMins],
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

// ── Public member profiles ────────────────────────────────────────────────────

router.get("/user/public-profile", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT * FROM user_public_profiles WHERE user_id = $1",
      [userId],
    );
    if (rows.length === 0) return res.json(null);
    const r = rows[0];
    return res.json({
      displayName: r.display_name,
      congregation: r.congregation,
      bio: r.bio,
      role: r.role,
      city: r.city,
      country: r.country,
      avatarEmoji: r.avatar_emoji,
      profilePhotoUrl: r.profile_photo_url ?? null,
    });
  } finally {
    client.release();
  }
});

router.put("/user/public-profile", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = publicProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid public profile data", parsed.error.issues);
  }
  const { displayName, congregation, bio, role, city, country, avatarEmoji, profilePhotoUrl } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO user_public_profiles (user_id, display_name, congregation, bio, role, city, country, avatar_emoji, profile_photo_url, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         congregation = EXCLUDED.congregation,
         bio = EXCLUDED.bio,
         role = EXCLUDED.role,
         city = EXCLUDED.city,
         country = EXCLUDED.country,
         avatar_emoji = EXCLUDED.avatar_emoji,
         profile_photo_url = EXCLUDED.profile_photo_url,
         updated_at = NOW()`,
      [userId, displayName.trim(), congregation ?? "", bio ?? "", role ?? "Member", city ?? "", country ?? "", avatarEmoji ?? "👤", profilePhotoUrl ?? null],
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

// ── Premium access requests ───────────────────────────────────────────────────

router.post("/premium/request", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const parsed = premiumRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid request data", parsed.error.issues);
  }
  const { note } = parsed.data;
  const client = await pool.connect();
  try {
    const { rows: pp } = await client.query(
      "SELECT display_name, avatar_emoji, congregation, city, country FROM user_public_profiles WHERE user_id = $1",
      [userId],
    );
    const profile = pp[0] ?? {};
    await client.query(
      `INSERT INTO premium_requests
         (id, user_id, status, note, display_name, avatar_emoji, congregation, city, country, requested_at)
       VALUES (gen_random_uuid()::text, $1, 'pending', $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         status = 'pending', note = EXCLUDED.note,
         display_name = EXCLUDED.display_name, avatar_emoji = EXCLUDED.avatar_emoji,
         congregation = EXCLUDED.congregation, city = EXCLUDED.city,
         country = EXCLUDED.country, requested_at = NOW()`,
      [userId, note ?? "", profile.display_name ?? null, profile.avatar_emoji ?? "👤",
       profile.congregation ?? null, profile.city ?? null, profile.country ?? null],
    );

    const adminUserId = process.env["ADMIN_USER_ID"];
    if (adminUserId) {
      const isPaid = typeof note === "string" && note.toLowerCase().includes("paid");
      sendPushToUser(adminUserId, {
        title: isPaid ? "💳 New Payment Request" : "🔔 New Premium Request",
        body: `${profile.display_name ?? "Someone"} has requested Premium access.${isPaid ? " (UPI payment claimed)" : ""}`,
        tag: `admin-premium-request-${userId}`,
      }).catch(() => {});
    }

    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

router.get("/premium/my-request", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT status, requested_at FROM premium_requests WHERE user_id = $1",
      [userId],
    );
    if (rows.length === 0) return res.json(null);
    return res.json({ status: rows[0].status, requestedAt: rows[0].requested_at });
  } finally {
    client.release();
  }
});

// ── Admin: list pending premium requests ─────────────────────────────────────

router.get("/admin/premium-requests", requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT * FROM premium_requests WHERE status = 'pending' ORDER BY requested_at ASC`,
    );
    return res.json(rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      status: r.status,
      note: r.note,
      displayName: r.display_name,
      avatarEmoji: r.avatar_emoji,
      congregation: r.congregation,
      city: r.city,
      country: r.country,
      requestedAt: r.requested_at,
    })));
  } finally {
    client.release();
  }
});

router.put("/admin/premium-requests/:userId/approve", requireAdmin, async (req, res) => {
  const userId = String(req.params.userId);
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO user_profiles (user_id, is_premium, theme, candle_enabled, language, updated_at)
       VALUES ($1, true, 'dark', true, 'en', NOW())
       ON CONFLICT (user_id) DO UPDATE SET is_premium = true, updated_at = NOW()`,
      [userId],
    );
    await client.query(
      `UPDATE premium_requests SET status = 'approved', reviewed_at = NOW() WHERE user_id = $1`,
      [userId],
    );
    sendPushToUser(userId, {
      title: "👑 Premium Approved!",
      body: "Your Premium access has been approved. Open the app to unlock all features!",
      tag: "premium-approved",
    }).catch(() => {});
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

router.put("/admin/premium-requests/:userId/deny", requireAdmin, async (req, res) => {
  const userId = String(req.params.userId);
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE premium_requests SET status = 'denied', reviewed_at = NOW() WHERE user_id = $1`,
      [userId],
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

// ── Admin: list all users ─────────────────────────────────────────────────────

router.get("/admin/users", requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT
        up.user_id,
        up.is_premium,
        up.updated_at,
        pp.display_name,
        pp.congregation,
        pp.bio,
        pp.role,
        pp.city,
        pp.country,
        pp.avatar_emoji
      FROM user_profiles up
      LEFT JOIN user_public_profiles pp ON pp.user_id = up.user_id
      ORDER BY up.updated_at DESC
    `);
    return res.json(rows.map(r => ({
      userId: r.user_id,
      isPremium: r.is_premium,
      updatedAt: r.updated_at,
      displayName: r.display_name ?? null,
      congregation: r.congregation ?? null,
      bio: r.bio ?? null,
      role: r.role ?? null,
      city: r.city ?? null,
      country: r.country ?? null,
      avatarEmoji: r.avatar_emoji ?? "👤",
    })));
  } finally {
    client.release();
  }
});

// ── Admin: set premium for a user ─────────────────────────────────────────────

router.put("/admin/users/:userId/premium", requireAdmin, async (req, res) => {
  const userId = String(req.params.userId);
  const { isPremium } = req.body;
  if (typeof isPremium !== "boolean") return apiError.badRequest(res, "isPremium must be boolean");
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO user_profiles (user_id, is_premium, theme, candle_enabled, language, updated_at)
       VALUES ($1, $2, 'dark', true, 'en', NOW())
       ON CONFLICT (user_id) DO UPDATE SET is_premium = EXCLUDED.is_premium, updated_at = NOW()`,
      [userId, isPremium],
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

export default router;

import { Router } from "express";
import { z } from "zod";
import type { Request } from "express";
import { pool } from "@workspace/db";
import { safeGetAuth } from "../lib/authorization";
import type { ApiErrorBody } from "../lib/apiError";

/** Same anon-fallback pattern used in communityYahrzeit routes */
function resolveUserId(req: Request): string {
  const authed = safeGetAuth(req).userId;
  if (authed) return authed;
  const raw = String(
    req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "",
  );
  const ip = (raw.split(",")[0]?.trim() || "unknown").replace(
    /[^a-z0-9.:_-]/gi,
    "_",
  );
  return `anon-${ip}`;
}

const router = Router();

const eventSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  relationship: z.string().max(100).default(""),
  eventType: z
    .enum(["yahrzeit", "birthday", "anniversary"])
    .default("yahrzeit"),
  gregorianDate: z.string().max(20).optional().nullable(),
  hebrewDay: z.number().int().min(1).max(30).optional().nullable(),
  hebrewMonth: z.number().int().min(1).max(13).optional().nullable(),
  hebrewYear: z.number().int().min(1).max(9999).optional().nullable(),
  usesHebrewDate: z.boolean().default(false),
  beforeSunset: z.boolean().default(true),
  notificationEnabled: z.boolean().default(false),
  notificationDays: z.number().int().min(0).max(30).default(1),
  notificationTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("09:00"),
  repeatAnnually: z.boolean().default(true),
  location: z.string().max(200).default(""),
  notes: z.string().max(1000).default(""),
  photoUrl: z.string().max(500).optional().nullable(),
  censusBranchId: z.string().max(100).optional().nullable(),
});

function rowToEvent(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    relationship: r.relationship,
    eventType: r.event_type,
    gregorianDate: r.gregorian_date ?? undefined,
    hebrewDay: r.hebrew_day ?? undefined,
    hebrewMonth: r.hebrew_month ?? undefined,
    hebrewYear: r.hebrew_year ?? undefined,
    usesHebrewDate: r.uses_hebrew_date,
    beforeSunset: r.before_sunset,
    notificationEnabled: r.notification_enabled,
    notificationDays: r.notification_days,
    notificationTime: r.notification_time ?? "09:00",
    repeatAnnually: r.repeat_annually,
    location: r.location ?? "",
    notes: r.notes,
    photoUrl: r.photo_url ?? undefined,
    censusBranchId: r.census_person_id ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ── GET /api/remembrance ─────────────────────────────────────────────────── */
router.get("/remembrance", async (req, res) => {
  const userId = resolveUserId(req as Request);
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT * FROM remembrance_events WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return res.json(rows.map(rowToEvent));
  } finally {
    client.release();
  }
});

/* ── POST /api/remembrance ────────────────────────────────────────────────── */
router.post("/remembrance", async (req, res) => {
  const userId = resolveUserId(req as Request);
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" } satisfies ApiErrorBody);
  const d = parsed.data;
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO remembrance_events
         (id, user_id, name, relationship, event_type, gregorian_date,
          hebrew_day, hebrew_month, hebrew_year, uses_hebrew_date,
          before_sunset, notification_enabled, notification_days,
           notification_time, repeat_annually, location, notes, photo_url, census_person_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (user_id, id) DO NOTHING`,
      [
        d.id,
        userId,
        d.name,
        d.relationship,
        d.eventType,
        d.gregorianDate ?? null,
        d.hebrewDay ?? null,
        d.hebrewMonth ?? null,
        d.hebrewYear ?? null,
        d.usesHebrewDate,
        d.beforeSunset,
        d.notificationEnabled,
        d.notificationDays,
        d.notificationTime,
        d.repeatAnnually,
        d.location,
        d.notes,
        d.photoUrl ?? null,
        d.censusBranchId ?? null,
      ],
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

/* ── PUT /api/remembrance/:id ─────────────────────────────────────────────── */
router.put("/remembrance/:id", async (req, res) => {
  const userId = resolveUserId(req as Request);
  const id = String(req.params.id);
  const parsed = eventSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" } satisfies ApiErrorBody);
  const d = parsed.data;
  const client = await pool.connect();
  try {
    const colMap: Record<string, unknown> = {
      name: d.name,
      relationship: d.relationship,
      event_type: d.eventType,
      gregorian_date: d.gregorianDate,
      hebrew_day: d.hebrewDay,
      hebrew_month: d.hebrewMonth,
      hebrew_year: d.hebrewYear,
      uses_hebrew_date: d.usesHebrewDate,
      before_sunset: d.beforeSunset,
      notification_enabled: d.notificationEnabled,
      notification_days: d.notificationDays,
      notification_time: d.notificationTime,
      repeat_annually: d.repeatAnnually,
      location: d.location,
      notes: d.notes,
      photo_url: d.photoUrl,
      census_person_id: d.censusBranchId,
    };
    const fields: string[] = [];
    const vals: unknown[] = [];
    let n = 1;
    for (const [col, val] of Object.entries(colMap)) {
      if (val !== undefined) {
        fields.push(`${col} = $${n++}`);
        vals.push(val);
      }
    }
    if (!fields.length) return res.json({ ok: true });
    fields.push(`updated_at = NOW()`);
    vals.push(userId, id);
    await client.query(
      `UPDATE remembrance_events SET ${fields.join(", ")} WHERE user_id = $${n} AND id = $${n + 1}`,
      vals,
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

/* ── DELETE /api/remembrance/:id ──────────────────────────────────────────── */
router.delete("/remembrance/:id", async (req, res) => {
  const userId = resolveUserId(req as Request);
  const id = String(req.params.id);
  const client = await pool.connect();
  try {
    await client.query(
      `DELETE FROM remembrance_events WHERE user_id = $1 AND id = $2`,
      [userId, id],
    );
    return res.json({ ok: true });
  } finally {
    client.release();
  }
});

export default router;

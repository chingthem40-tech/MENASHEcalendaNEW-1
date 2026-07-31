import { Router } from "express";
import { z } from "zod";
import { pool } from "@workspace/db";
import { requireAuth } from "../lib/authorization";
import type { ApiErrorBody } from "../lib/apiError";

const router = Router();

const EVENT_TYPES = [
  "birth",
  "hebrew_birthday",
  "anniversary",
  "yahrzeit",
  "marriage",
  "aliyah",
  "milestone",
  "achievement",
  "document",
  "photo",
] as const;

type EventType = (typeof EVENT_TYPES)[number];

const FILTER_MAP: Record<string, EventType[]> = {
  births:       ["birth", "hebrew_birthday"],
  anniversaries: ["anniversary", "marriage"],
  yahrzeits:    ["yahrzeit"],
  milestones:   ["milestone", "achievement", "aliyah"],
  documents:    ["document"],
  photos:       ["photo"],
};

const createSchema = z.object({
  eventType:      z.enum(EVENT_TYPES),
  title:          z.string().min(1).max(300),
  description:    z.string().max(2000).default(""),
  memberName:     z.string().max(200).default(""),
  memberPhotoUrl: z.string().url().max(1000).optional().nullable(),
  gregorianDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  hebrewDate:     z.string().max(100).default(""),
  icon:           z.string().max(10).default(""),
  detailsUrl:     z.string().url().max(1000).optional().nullable(),
});

function rowToEvent(r: Record<string, unknown>) {
  return {
    id:             r.id,
    userId:         r.user_id,
    eventType:      r.event_type,
    title:          r.title,
    description:    r.description,
    memberName:     r.member_name,
    memberPhotoUrl: r.member_photo_url ?? null,
    gregorianDate:  r.gregorian_date
      ? (r.gregorian_date as Date).toISOString().slice(0, 10)
      : null,
    hebrewDate:     r.hebrew_date,
    icon:           r.icon,
    detailsUrl:     r.details_url ?? null,
    createdAt:      r.created_at,
    updatedAt:      r.updated_at,
  };
}

// GET /api/family-timeline
router.get("/family-timeline", requireAuth, async (req, res) => {
  const auth = (req as any).auth as { userId: string };
  const userId = auth.userId;

  const filter  = typeof req.query.filter  === "string" ? req.query.filter  : "all";
  const search  = typeof req.query.search  === "string" ? req.query.search  : "";
  const page    = Math.max(1, parseInt(typeof req.query.page  === "string" ? req.query.page  : "1",  10) || 1);
  const limit   = Math.min(50, Math.max(1, parseInt(typeof req.query.limit === "string" ? req.query.limit : "20", 10) || 20));
  const offset  = (page - 1) * limit;

  const conditions: string[] = ["user_id = $1"];
  const params: unknown[] = [userId];
  let pi = 2;

  // Event type filter
  if (filter !== "all" && FILTER_MAP[filter]) {
    const types = FILTER_MAP[filter];
    const placeholders = types.map(() => `$${pi++}`).join(", ");
    conditions.push(`event_type IN (${placeholders})`);
    params.push(...types);
  }

  // Search
  if (search.trim()) {
    conditions.push(`(
      title        ILIKE $${pi}
      OR description ILIKE $${pi}
      OR member_name ILIKE $${pi}
      OR hebrew_date ILIKE $${pi}
    )`);
    params.push(`%${search.trim()}%`);
    pi++;
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(
        `SELECT * FROM family_timeline
         ${where}
         ORDER BY
           CASE WHEN gregorian_date IS NOT NULL THEN gregorian_date ELSE created_at::date END DESC,
           created_at DESC
         LIMIT $${pi} OFFSET $${pi + 1}`,
        [...params, limit, offset],
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM family_timeline ${where}`,
        params,
      ),
    ]);

    const total = parseInt(countRes.rows[0].total, 10);
    res.json({
      events:   dataRes.rows.map(rowToEvent),
      total,
      page,
      limit,
      hasMore:  offset + dataRes.rows.length < total,
    });
  } catch (err) {
    console.error("[family-timeline] GET error", err);
    res.status(500).json({ error: "Failed to fetch timeline" } satisfies ApiErrorBody);
  }
});

// POST /api/family-timeline
router.post("/family-timeline", requireAuth, async (req, res) => {
  const auth = (req as any).auth as { userId: string };
  const userId = auth.userId;

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" } satisfies ApiErrorBody);
    return;
  }
  const d = parsed.data;

  try {
    const { rows } = await pool.query(
      `INSERT INTO family_timeline
         (user_id, event_type, title, description, member_name,
          member_photo_url, gregorian_date, hebrew_date, icon, details_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        userId,
        d.eventType,
        d.title,
        d.description,
        d.memberName,
        d.memberPhotoUrl ?? null,
        d.gregorianDate  ?? null,
        d.hebrewDate,
        d.icon,
        d.detailsUrl ?? null,
      ],
    );
    res.status(201).json(rowToEvent(rows[0]));
  } catch (err) {
    console.error("[family-timeline] POST error", err);
    res.status(500).json({ error: "Failed to create event" } satisfies ApiErrorBody);
  }
});

// PATCH /api/family-timeline/:id
router.patch("/family-timeline/:id", requireAuth, async (req, res) => {
  const auth = (req as any).auth as { userId: string };
  const userId = auth.userId;
  const id = String(req.params.id);

  const parsed = createSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" } satisfies ApiErrorBody);
    return;
  }
  const d = parsed.data;

  const sets: string[] = [];
  const vals: unknown[] = [];
  let pi = 1;

  const fieldMap: Record<string, string> = {
    eventType:      "event_type",
    title:          "title",
    description:    "description",
    memberName:     "member_name",
    memberPhotoUrl: "member_photo_url",
    gregorianDate:  "gregorian_date",
    hebrewDate:     "hebrew_date",
    icon:           "icon",
    detailsUrl:     "details_url",
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in d) {
      sets.push(`${col} = $${pi++}`);
      vals.push((d as Record<string, unknown>)[key] ?? null);
    }
  }

  if (sets.length === 0) {
    res.status(400).json({ error: "Nothing to update" } satisfies ApiErrorBody);
    return;
  }

  sets.push(`updated_at = NOW()`);
  vals.push(id, userId);

  try {
    const { rows } = await pool.query(
      `UPDATE family_timeline SET ${sets.join(", ")}
       WHERE id = $${pi} AND user_id = $${pi + 1}
       RETURNING *`,
      vals,
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Not found" } satisfies ApiErrorBody);
      return;
    }
    res.json(rowToEvent(rows[0]));
  } catch (err) {
    console.error("[family-timeline] PATCH error", err);
    res.status(500).json({ error: "Failed to update event" } satisfies ApiErrorBody);
  }
});

// DELETE /api/family-timeline/:id
router.delete("/family-timeline/:id", requireAuth, async (req, res) => {
  const auth = (req as any).auth as { userId: string };
  const userId = auth.userId;
  const id = String(req.params.id);

  try {
    const { rowCount } = await pool.query(
      "DELETE FROM family_timeline WHERE id = $1 AND user_id = $2",
      [id, userId],
    );
    if (!rowCount) {
      res.status(404).json({ error: "Not found" } satisfies ApiErrorBody);
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("[family-timeline] DELETE error", err);
    res.status(500).json({ error: "Failed to delete event" } satisfies ApiErrorBody);
  }
});

export default router;

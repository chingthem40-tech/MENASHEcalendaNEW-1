import { Router } from "express";
import { db } from "@workspace/db";
import { feedbackTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { safeGetAuth } from "../lib/authorization";
import { apiError } from "../lib/apiError";
import { z } from "zod/v4";
import { requireAdmin } from "../lib/requireAdmin";

const router = Router();

const CATEGORIES = ["bug", "ux", "content", "perf", "suggest"] as const;
const PRIORITIES = ["critical", "high", "medium", "low"] as const;
const STATUSES = ["open", "in_progress", "resolved", "wont_fix"] as const;

const submitSchema = z.object({
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  message: z.string().min(1).max(2000),
  page: z.string().max(200).default(""),
  device: z.string().max(300).default(""),
});

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  adminNote: z.string().max(1000).optional(),
});

router.post("/feedback", async (req, res) => {
  const auth = safeGetAuth(req);
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return apiError.badRequest(res, "Invalid feedback payload");

  try {
    const [row] = await db
      .insert(feedbackTable)
      .values({
        userId: auth?.userId ?? null,
        category: parsed.data.category,
        priority: parsed.data.priority,
        message: parsed.data.message,
        page: parsed.data.page,
        device: parsed.data.device,
        status: "open",
      })
      .returning();
    return res.status(201).json({ id: row.id });
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to save feedback");
  }
});

router.get("/feedback", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(feedbackTable)
      .orderBy(desc(feedbackTable.createdAt));
    return res.json(rows);
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to fetch feedback");
  }
});

router.patch("/feedback/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) return apiError.badRequest(res, "Invalid id");

  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return apiError.badRequest(res, "Invalid patch payload");

  try {
    const [row] = await db
      .update(feedbackTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(feedbackTable.id, id))
      .returning();
    if (!row) return apiError.notFound(res);
    return res.json(row);
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to update feedback");
  }
});

export default router;

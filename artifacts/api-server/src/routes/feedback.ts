import { Router } from "express";
import { db } from "@workspace/db";
import { feedbackTable } from "@workspace/db";
import { eq, desc, and, ilike, inArray, sql } from "drizzle-orm";
import { safeGetAuth, requireAuth } from "../lib/authorization";
import { apiError } from "../lib/apiError";
import { requireAdmin } from "../lib/requireAdmin";
import { z } from "zod/v4";

const router = Router();

const TYPES     = ["bug_report","feature_request","appreciation","help_request","app_rating","general"] as const;
const CATEGORIES = ["ui","calendar","auth","performance","data","suggest","ux","content","perf","account","prayer","premium","payments","community","bug","other"] as const;
const PRIORITIES = ["critical","high","medium","low"] as const;
const STATUSES   = ["new","reviewed","in_progress","planned","completed","closed","open","resolved","wont_fix"] as const;
const PLATFORMS  = ["web","android","ios","other"] as const;
const IMPORTANCES = ["low","medium","high"] as const;
const RECOMMEND  = ["yes","maybe","no"] as const;

const submitSchema = z.object({
  type:              z.enum(TYPES).default("general"),
  category:          z.string().max(50).default("bug"),
  priority:          z.string().max(20).default("medium"),
  subject:           z.string().max(200).default(""),
  message:           z.string().min(1).max(4000),
  // Bug-report extras
  expectedBehaviour: z.string().max(2000).default(""),
  actualBehaviour:   z.string().max(2000).default(""),
  stepsToReproduce:  z.string().max(2000).default(""),
  platform:          z.string().max(20).default(""),
  browser:           z.string().max(200).default(""),
  deviceModel:       z.string().max(200).default(""),
  appVersion:        z.string().max(50).default(""),
  // Feature-request extras
  problemSolved:     z.string().max(2000).default(""),
  whoBenefits:       z.string().max(500).default(""),
  importance:        z.string().max(20).default(""),
  // Appreciation extras
  emojiReaction:     z.string().max(10).default(""),
  // Rating extras
  rating:            z.number().int().min(1).max(5).optional(),
  wouldRecommend:    z.string().max(10).default(""),
  // Legacy
  page:              z.string().max(200).default(""),
  device:            z.string().max(300).default(""),
});

const patchSchema = z.object({
  status:    z.enum(["new","reviewed","in_progress","planned","completed","closed"]).optional(),
  adminNote: z.string().max(1000).optional(),
});

const bulkSchema = z.object({
  ids:    z.array(z.number().int()).min(1).max(100),
  status: z.enum(["new","reviewed","in_progress","planned","completed","closed"]),
});

// ── POST /feedback — submit new feedback ─────────────────────────────────────
router.post("/feedback", async (req, res) => {
  const auth = safeGetAuth(req);
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return apiError.badRequest(res, "Invalid feedback payload");

  const d = parsed.data;
  try {
    const [row] = await db
      .insert(feedbackTable)
      .values({
        userId:            auth?.userId ?? null,
        type:              d.type,
        category:          d.category,
        priority:          d.priority,
        subject:           d.subject,
        message:           d.message,
        expectedBehaviour: d.expectedBehaviour,
        actualBehaviour:   d.actualBehaviour,
        stepsToReproduce:  d.stepsToReproduce,
        platform:          d.platform,
        browser:           d.browser,
        deviceModel:       d.deviceModel,
        appVersion:        d.appVersion,
        problemSolved:     d.problemSolved,
        whoBenefits:       d.whoBenefits,
        importance:        d.importance,
        emojiReaction:     d.emojiReaction,
        rating:            d.rating ?? null,
        wouldRecommend:    d.wouldRecommend,
        page:              d.page,
        device:            d.device,
        status:            "new",
        referenceNumber:   "", // filled below
      })
      .returning();

    // Set reference number based on auto-generated ID
    const refNum = `FB-${String(row.id).padStart(6, "0")}`;
    await db
      .update(feedbackTable)
      .set({ referenceNumber: refNum })
      .where(eq(feedbackTable.id, row.id));

    return res.status(201).json({ id: row.id, referenceNumber: refNum });
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to save feedback");
  }
});

// ── GET /feedback/my — authenticated user's submissions ──────────────────────
router.get("/feedback/my", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;
  try {
    const rows = await db
      .select()
      .from(feedbackTable)
      .where(eq(feedbackTable.userId, userId))
      .orderBy(desc(feedbackTable.createdAt));
    return res.json(rows);
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to fetch feedback");
  }
});

// ── GET /feedback/export — admin CSV export ──────────────────────────────────
router.get("/feedback/export", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(feedbackTable)
      .orderBy(desc(feedbackTable.createdAt));

    const cols = [
      "id","referenceNumber","type","category","priority","subject","message",
      "platform","browser","deviceModel","appVersion","importance","rating",
      "wouldRecommend","emojiReaction","status","adminNote","userId",
      "expectedBehaviour","actualBehaviour","stepsToReproduce",
      "problemSolved","whoBenefits","page","device","createdAt","updatedAt",
    ] as const;

    const escape = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };

    const lines = [
      cols.join(","),
      ...rows.map((r) => cols.map((c) => escape((r as Record<string, unknown>)[c])).join(",")),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="feedback-${Date.now()}.csv"`);
    return res.send(lines.join("\r\n"));
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to export feedback");
  }
});

// ── GET /feedback — admin list with filters ──────────────────────────────────
router.get("/feedback", requireAdmin, async (req, res) => {
  const {
    type, category, priority, platform, status, userId: filterUser,
    search, limit = "50", offset = "0",
  } = req.query as Record<string, string>;

  const lim  = Math.min(parseInt(limit, 10) || 50, 200);
  const skip = parseInt(offset, 10) || 0;

  try {
    const conditions = [];
    if (type)        conditions.push(eq(feedbackTable.type,     type));
    if (category)    conditions.push(eq(feedbackTable.category, category));
    if (priority)    conditions.push(eq(feedbackTable.priority, priority));
    if (platform)    conditions.push(eq(feedbackTable.platform, platform));
    if (status)      conditions.push(eq(feedbackTable.status,   status));
    if (filterUser)  conditions.push(eq(feedbackTable.userId,   filterUser));
    if (search)      conditions.push(ilike(feedbackTable.message, `%${search}%`));

    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db.select().from(feedbackTable)
        .where(where)
        .orderBy(desc(feedbackTable.createdAt))
        .limit(lim).offset(skip),
      db.select({ total: sql<number>`COUNT(*)::int` }).from(feedbackTable).where(where),
    ]);

    return res.json({ rows, total, limit: lim, offset: skip });
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to fetch feedback");
  }
});

// ── PATCH /feedback/:id — admin update ───────────────────────────────────────
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

// ── POST /feedback/bulk — admin bulk status update ───────────────────────────
router.post("/feedback/bulk", requireAdmin, async (req, res) => {
  const parsed = bulkSchema.safeParse(req.body);
  if (!parsed.success) return apiError.badRequest(res, "Invalid bulk payload");

  try {
    await db
      .update(feedbackTable)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(inArray(feedbackTable.id, parsed.data.ids));
    return res.json({ updated: parsed.data.ids.length });
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to bulk update feedback");
  }
});

// ── DELETE /feedback/:id — admin delete ──────────────────────────────────────
router.delete("/feedback/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) return apiError.badRequest(res, "Invalid id");

  try {
    const [row] = await db
      .delete(feedbackTable)
      .where(eq(feedbackTable.id, id))
      .returning();
    if (!row) return apiError.notFound(res);
    return res.json({ deleted: true });
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to delete feedback");
  }
});

export default router;

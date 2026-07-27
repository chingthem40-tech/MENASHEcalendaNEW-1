import { Router } from "express";
import { z } from "zod";
import { safeGetAuth } from "../lib/authorization";
import { requireAuth } from "../lib/requireAuth";
import { apiError } from "../lib/apiError";
import { memorialService } from "../memorial/services/MemorialService";
import { candleService } from "../memorial/services/CandleService";
import { tributeService } from "../memorial/services/TributeService";
import { candleRepository } from "../memorial/repositories/CandleRepository";
import { tributeRepository } from "../memorial/repositories/TributeRepository";
import { photoRepository } from "../memorial/repositories/PhotoRepository";
import { memorialRepository } from "../memorial/repositories/MemorialRepository";
import { familyRepository } from "../memorial/repositories/FamilyRepository";
import {
  insertCandleSchema,
  insertTributeSchema,
  insertPhotoSchema,
  insertMemorialPersonSchema,
} from "@workspace/db";

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const createMemorialSchema = z.object({
  person: insertMemorialPersonSchema as unknown as z.ZodType<(typeof insertMemorialPersonSchema)["_output"]>,
  familyId: z.string().uuid().optional(),
  familyName: z.string().min(1).max(200).optional(),
});

const updateMemorialSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
});

const searchSchema = z.object({
  q: z.string().max(100).optional().default(""),
  sort: z
    .enum(["recent_activity", "most_visited", "recently_lit", "upcoming_yahrzeit", "community_picks"])
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

const candleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  filter: z.enum(["recent", "today", "community"]).optional().default("recent"),
});

const transferOwnershipSchema = z.object({
  newPrimaryContactId: z.string().min(1),
});

const moderateSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

const inviteMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "member", "viewer"]).optional().default("member"),
});

const updateRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]),
});

// ── POST /memorials ───────────────────────────────────────────────────────────

router.post("/memorials", requireAuth, async (req, res) => {
  const userId = (req as any).userId as string;

  const parsed = createMemorialSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid data", parsed.error.issues);
  }

  try {
    const memorial = await memorialService.create(parsed.data, userId);
    return res.status(201).json(memorial);
  } catch (err: any) {
    req.log.error(err);
    if (err.message === "Family not found") return apiError.notFound(res, "Family not found");
    if (err.message === "Not a member of this family")
      return apiError.forbidden(res, err.message);
    return apiError.internal(res, "Failed to create memorial");
  }
});

// ── GET /memorials/search ─────────────────────────────────────────────────────

router.get("/memorials/search", async (req, res) => {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid query parameters");
  }

  try {
    const auth = safeGetAuth(req);
    const { q, sort, page, limit } = parsed.data;

    if (q.trim().length > 0 && q.trim().length < 2) {
      return apiError.badRequest(res, "Query parameter 'q' must be at least 2 characters");
    }

    const results = await memorialService.search(
      q,
      auth?.userId ?? null,
      { sort, page, limit },
    );
    return res.json(results);
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Search failed");
  }
});

// ── GET /memorials/:id ────────────────────────────────────────────────────────

router.get("/memorials/:id", async (req, res) => {
  const id = String(req.params.id);
  const auth = safeGetAuth(req);
  const viewerUserId = auth?.userId ?? null;

  try {
    const isUuid = /^[0-9a-f-]{36}$/i.test(id);
    const memorial = isUuid
      ? await memorialService.getById(id, viewerUserId)
      : await memorialService.getBySlug(id, viewerUserId);

    if (!memorial) return apiError.notFound(res);
    return res.json(memorial);
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to fetch memorial");
  }
});

// ── PATCH /memorials/:id ──────────────────────────────────────────────────────

router.patch("/memorials/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = (req as any).userId as string;

  const parsed = updateMemorialSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid data", parsed.error.issues);
  }

  try {
    const updated = await memorialService.update(id, parsed.data, userId);
    if (!updated) return apiError.notFound(res);
    return res.json(updated);
  } catch (err: any) {
    req.log.error(err);
    if (err.message === "Memorial not found") return apiError.notFound(res);
    if (err.message?.includes("admin")) return apiError.forbidden(res, err.message);
    return apiError.internal(res, "Failed to update memorial");
  }
});

// ── GET /memorials/:id/candles ────────────────────────────────────────────────

router.get("/memorials/:id/candles", async (req, res) => {
  const memorialId = String(req.params.id);

  const parsed = candleQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid query parameters");
  }

  try {
    const memorial = await memorialRepository.findById(memorialId);
    if (!memorial) return apiError.notFound(res, "Memorial not found");

    const result = await candleRepository.findByMemorial(
      memorialId,
      parsed.data.page,
      parsed.data.limit,
      parsed.data.filter,
    );
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to fetch candles");
  }
});

// ── POST /memorials/:id/candles ───────────────────────────────────────────────

router.post("/memorials/:id/candles", async (req, res) => {
  const memorialId = String(req.params.id);
  const auth = safeGetAuth(req);
  const userId = auth?.userId ?? null;

  const parsed = insertCandleSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid candle data", parsed.error.issues);
  }

  const ipAddress =
    String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "");

  try {
    const candle = await candleService.lightCandle(
      memorialId,
      parsed.data,
      userId,
      ipAddress,
    );
    return res.status(201).json(candle);
  } catch (err: any) {
    req.log.error(err);
    if (err.message === "Memorial not found") return apiError.notFound(res);
    if (err.message?.includes("not published"))
      return apiError.badRequest(res, err.message);
    if (err.message?.includes("permission"))
      return apiError.forbidden(res, err.message);
    if (err.message?.includes("already lit"))
      return apiError.tooManyRequests(res, err.message);
    if (err.message?.includes("Guest name"))
      return apiError.badRequest(res, err.message);
    return apiError.internal(res, "Failed to light candle");
  }
});

// ── GET /memorials/:id/tributes ───────────────────────────────────────────────

router.get("/memorials/:id/tributes", async (req, res) => {
  const memorialId = String(req.params.id);
  const auth = safeGetAuth(req);
  const viewerUserId = auth?.userId ?? null;

  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid pagination parameters");
  }

  try {
    const memorial = await memorialRepository.findById(memorialId);
    if (!memorial) return apiError.notFound(res, "Memorial not found");

    const isFamilyMember = viewerUserId
      ? await familyRepository.isMember(memorial.familyId, viewerUserId)
      : false;

    const statusFilter = isFamilyMember ? "all" : "approved";

    const result = await tributeRepository.findByMemorial(
      memorialId,
      statusFilter,
      parsed.data.page,
      parsed.data.limit,
    );
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to fetch tributes");
  }
});

// ── POST /memorials/:id/tributes ──────────────────────────────────────────────

router.post("/memorials/:id/tributes", async (req, res) => {
  const memorialId = String(req.params.id);
  const auth = safeGetAuth(req);
  const userId = auth?.userId ?? null;

  const parsed = insertTributeSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid tribute data", parsed.error.issues);
  }

  try {
    const tribute = await tributeService.submit(memorialId, parsed.data, userId);
    return res.status(201).json(tribute);
  } catch (err: any) {
    req.log.error(err);
    if (err.message === "Memorial not found") return apiError.notFound(res);
    if (err.message?.includes("not published"))
      return apiError.badRequest(res, err.message);
    if (
      err.message?.includes("permission") ||
      err.message?.includes("family members") ||
      err.message?.includes("signed in")
    )
      return apiError.forbidden(res, err.message);
    if (err.message?.includes("not allowed"))
      return apiError.forbidden(res, err.message);
    if (err.message?.includes("Guest name"))
      return apiError.badRequest(res, err.message);
    return apiError.internal(res, "Failed to submit tribute");
  }
});

// ── POST /memorials/:id/tributes/:tributeId/moderate ─────────────────────────

router.post(
  "/memorials/:id/tributes/:tributeId/moderate",
  requireAuth,
  async (req, res) => {
    const memorialId = String(req.params.id);
    const tributeId = String(req.params.tributeId);
    const userId = (req as any).userId as string;

    const parsed = moderateSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError.badRequest(res, "Invalid moderation data");
    }

    try {
      let result;
      if (parsed.data.action === "approve") {
        result = await tributeService.approve(tributeId, userId);
      } else {
        result = await tributeService.reject(tributeId, userId, parsed.data.reason);
      }

      if (!result) return apiError.notFound(res, "Tribute not found");
      return res.json(result);
    } catch (err: any) {
      req.log.error(err);
      if (err.message?.includes("not found")) return apiError.notFound(res, err.message);
      if (err.message?.includes("admin")) return apiError.forbidden(res, err.message);
      return apiError.internal(res, "Failed to moderate tribute");
    }
  },
);

// ── GET /memorials/:id/photos ─────────────────────────────────────────────────

router.get("/memorials/:id/photos", async (req, res) => {
  const memorialId = String(req.params.id);
  const auth = safeGetAuth(req);
  const viewerUserId = auth?.userId ?? null;

  try {
    const memorial = await memorialRepository.findById(memorialId);
    if (!memorial) return apiError.notFound(res, "Memorial not found");

    const isFamilyMember = viewerUserId
      ? await familyRepository.isMember(memorial.familyId, viewerUserId)
      : false;

    const photos = await photoRepository.findByMemorial(memorialId, !isFamilyMember);
    return res.json(photos);
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to fetch photos");
  }
});

// ── POST /memorials/:id/photos ────────────────────────────────────────────────

router.post("/memorials/:id/photos", requireAuth, async (req, res) => {
  const memorialId = String(req.params.id);
  const userId = (req as any).userId as string;

  const parsed = insertPhotoSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid photo data", parsed.error.issues);
  }

  try {
    const memorial = await memorialRepository.findById(memorialId);
    if (!memorial) return apiError.notFound(res, "Memorial not found");

    const isFamilyMember = await familyRepository.isMember(
      memorial.familyId,
      userId,
    );

    const autoApprove = isFamilyMember;

    const photo = await photoRepository.create(
      memorialId,
      parsed.data,
      userId,
      autoApprove,
    );

    return res.status(201).json(photo);
  } catch (err: any) {
    req.log.error(err);
    return apiError.internal(res, "Failed to upload photo");
  }
});

// ── POST /memorials/families/:id/transfer ────────────────────────────────────

router.post("/memorials/families/:id/transfer", requireAuth, async (req, res) => {
  const familyId = String(req.params.id);
  const actorId = (req as any).userId as string;

  const parsed = transferOwnershipSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid transfer data");
  }

  try {
    const isAdmin = await familyRepository.isAdmin(familyId, actorId);
    if (!isAdmin) return apiError.forbidden(res, "Only a family admin can transfer ownership");

    const updated = await familyRepository.transferOwnership(
      familyId,
      parsed.data.newPrimaryContactId,
    );
    return res.json(updated);
  } catch (err: any) {
    req.log.error(err);
    if (err.message?.includes("must be a family member"))
      return apiError.badRequest(res, err.message);
    if (err.message === "Family not found") return apiError.notFound(res, err.message);
    return apiError.internal(res, "Failed to transfer ownership");
  }
});

// ── GET /memorials/families/:id ───────────────────────────────────────────────

router.get("/memorials/families/:id", requireAuth, async (req, res) => {
  const familyId = String(req.params.id);
  const userId = (req as any).userId as string;

  try {
    const family = await familyRepository.findById(familyId);
    if (!family) return apiError.notFound(res, "Family not found");

    const isMember = await familyRepository.isMember(familyId, userId);
    if (!isMember) return apiError.forbidden(res, "Not a member of this family");

    return res.json(family);
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to fetch family");
  }
});

// ── GET /memorials/families/:id/members ──────────────────────────────────────

router.get("/memorials/families/:id/members", requireAuth, async (req, res) => {
  const familyId = String(req.params.id);
  const userId = (req as any).userId as string;

  try {
    const isMember = await familyRepository.isMember(familyId, userId);
    if (!isMember) return apiError.forbidden(res, "Not a member of this family");

    const members = await familyRepository.getMembers(familyId);
    return res.json(members);
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to fetch members");
  }
});

// ── POST /memorials/families/:id/members ─────────────────────────────────────

router.post("/memorials/families/:id/members", requireAuth, async (req, res) => {
  const familyId = String(req.params.id);
  const actorId = (req as any).userId as string;

  const parsed = inviteMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid member data");
  }

  try {
    const isAdmin = await familyRepository.isAdmin(familyId, actorId);
    if (!isAdmin) return apiError.forbidden(res, "Only a family admin can invite members");

    const member = await familyRepository.addMember(
      familyId,
      parsed.data.userId,
      parsed.data.role,
      actorId,
    );
    return res.status(201).json(member);
  } catch (err) {
    req.log.error(err);
    return apiError.internal(res, "Failed to add member");
  }
});

// ── PATCH /memorials/families/:id/members/:memberId ──────────────────────────

router.patch(
  "/memorials/families/:id/members/:memberId",
  requireAuth,
  async (req, res) => {
    const familyId = String(req.params.id);
    const memberId = String(req.params.memberId);
    const actorId = (req as any).userId as string;

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError.badRequest(res, "Invalid role");
    }

    try {
      const isAdmin = await familyRepository.isAdmin(familyId, actorId);
      if (!isAdmin) return apiError.forbidden(res, "Only a family admin can change roles");

      const members = await familyRepository.getMembers(familyId);
      const target = members.find((m) => m.id === memberId);
      if (!target) return apiError.notFound(res, "Member not found");

      await familyRepository.removeMember(familyId, target.userId);
      const updated = await familyRepository.addMember(
        familyId,
        target.userId,
        parsed.data.role,
        actorId,
      );
      return res.json(updated);
    } catch (err) {
      req.log.error(err);
      return apiError.internal(res, "Failed to update member role");
    }
  },
);

// ── DELETE /memorials/families/:id/members/:memberId ─────────────────────────

router.delete(
  "/memorials/families/:id/members/:memberId",
  requireAuth,
  async (req, res) => {
    const familyId = String(req.params.id);
    const memberId = String(req.params.memberId);
    const actorId = (req as any).userId as string;

    try {
      const isAdmin = await familyRepository.isAdmin(familyId, actorId);

      const members = await familyRepository.getMembers(familyId);
      const target = members.find((m) => m.id === memberId);
      if (!target) return apiError.notFound(res, "Member not found");

      if (!isAdmin && target.userId !== actorId) {
        return apiError.forbidden(res, "Only an admin or the member themselves can remove a member");
      }

      await familyRepository.removeMember(familyId, target.userId);
      return res.status(204).send();
    } catch (err) {
      req.log.error(err);
      return apiError.internal(res, "Failed to remove member");
    }
  },
);

export default router;

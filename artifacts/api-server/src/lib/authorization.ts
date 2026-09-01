import type { Request, Response, NextFunction } from "express";
import { auditLog } from "./auditLog";
import { getRequestAuth } from "./supabaseAuth";

/**
 * Always returns an object; userId is null when auth is unavailable.
 */
export function safeGetAuth(req: Request): {
  userId: string | null;
  orgRole: string | null;
  isAdmin: boolean;
  provider: "supabase" | null;
} {
  const managed = getRequestAuth(req);
  if (managed) {
    return {
      userId: managed.userId,
      orgRole: managed.isAdmin ? "org:admin" : null,
      isAdmin: managed.isAdmin,
      provider: "supabase",
    };
  }
  return { userId: null, orgRole: null, isAdmin: false, provider: null };
}

/**
 * isAdminUser — compatibility helper for application-owned admin assignments.
 */
export function isAdminUser(userId: string | null | undefined, orgRole?: string | null): boolean {
  if (!userId) return false;
  return orgRole === "org:admin" || userId === process.env.ADMIN_USER_ID;
}

/**
 * safeIsAdmin — convenience helper for read routes that need to branch on
 * admin status without blocking non-admin users.  Extracts both userId and
 * the resolved application auth in a single call.
 */
export function safeIsAdmin(req: Request): boolean {
  return safeGetAuth(req).isAdmin;
}

/**
 * requireAuth — Express middleware.
 * Requires a valid Supabase session. Sets req.userId.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const { userId } = safeGetAuth(req);
  if (!userId) {
    auditLog.record({ event: "admin.permission_denied", actorId: "anonymous", metadata: { path: req.path } }).catch(() => {});
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).userId = userId;
  next();
}

/**
 * requireAdmin — Express middleware.
 * Requires a valid Supabase session and an application-owned admin assignment.
 * Sets req.userId.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = safeGetAuth(req);
  const userId = auth.userId;
  const orgRole = auth.orgRole;

  if (!userId) {
    auditLog.record({ event: "admin.permission_denied", actorId: "anonymous", metadata: { path: req.path } }).catch(() => {});
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!auth.isAdmin) {
    auditLog.record({ event: "admin.permission_denied", actorId: userId, metadata: { path: req.path, orgRole: orgRole ?? "none" } }).catch(() => {});
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  auditLog.record({ event: "admin.role_verified", actorId: userId, metadata: { path: req.path } }).catch(() => {});
  (req as any).userId = userId;
  next();
}

/**
 * requireModerator — delegates to requireAdmin until moderator roles are added.
 */
export const requireModerator = requireAdmin;

/**
 * requireCommunityAdmin — any authenticated user for now.
 */
export const requireCommunityAdmin = requireAuth;

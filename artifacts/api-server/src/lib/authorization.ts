import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { auditLog } from "./auditLog";

/**
 * safeGetAuth — wraps getAuth in a try-catch so it never throws when
 * clerkMiddleware is absent (e.g. CLERK_SECRET_KEY not set).
 * Always returns an object; userId is null when auth is unavailable.
 */
export function safeGetAuth(req: Request): { userId: string | null } {
  try {
    const auth = getAuth(req);
    return { userId: auth?.userId ?? null };
  } catch {
    return { userId: null };
  }
}

/**
 * isAdminUser — returns true if the Clerk session carries org:admin role.
 * orgRole is populated automatically by Clerk when the user is an org member.
 */
export function isAdminUser(userId: string | null | undefined, orgRole?: string | null): boolean {
  if (!userId) return false;
  return orgRole === "org:admin";
}

/**
 * safeIsAdmin — convenience helper for read routes that need to branch on
 * admin status without blocking non-admin users.  Extracts both userId and
 * orgRole from the Clerk session in a single call, returns true only when
 * both are present and orgRole === "org:admin".
 */
export function safeIsAdmin(req: Request): boolean {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId ?? null;
    const orgRole = (auth as any)?.orgRole as string | null | undefined;
    return !!userId && orgRole === "org:admin";
  } catch {
    return false;
  }
}

/**
 * requireAuth — Express middleware.
 * Requires a valid Clerk session. Sets req.userId.
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
 * Requires a valid Clerk session AND the user must have org:admin role in the Clerk Organization.
 * Sets req.userId.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  let orgRole: string | null | undefined;
  let userId: string | null;
  try {
    const auth = getAuth(req);
    userId = auth?.userId ?? null;
    orgRole = (auth as any)?.orgRole as string | null | undefined;
  } catch {
    userId = null;
    orgRole = null;
  }

  if (!userId) {
    auditLog.record({ event: "admin.permission_denied", actorId: "anonymous", metadata: { path: req.path } }).catch(() => {});
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (orgRole !== "org:admin") {
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

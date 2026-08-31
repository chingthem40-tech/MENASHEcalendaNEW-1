import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { auditLog } from "./auditLog";
import { getRequestAuth } from "./replitAuth";

/**
 * safeGetAuth — wraps getAuth in a try-catch so it never throws when
 * clerkMiddleware is absent (e.g. CLERK_SECRET_KEY not set).
 * Always returns an object; userId is null when auth is unavailable.
 */
export function safeGetAuth(req: Request): {
  userId: string | null;
  orgRole: string | null;
  isAdmin: boolean;
  provider: "replit" | "clerk" | null;
} {
  const managed = getRequestAuth(req);
  if (managed) {
    return {
      userId: managed.userId,
      orgRole: managed.isAdmin ? "org:admin" : null,
      isAdmin: managed.isAdmin,
      provider: "replit",
    };
  }
  try {
    const auth = getAuth(req);
    const userId = auth?.userId ?? null;
    const orgRole = (auth as any)?.orgRole as string | null | undefined;
    return {
      userId,
      orgRole: orgRole ?? null,
      isAdmin: orgRole === "org:admin",
      provider: userId ? "clerk" : null,
    };
  } catch {
    return { userId: null, orgRole: null, isAdmin: false, provider: null };
  }
}

/**
 * isAdminUser — returns true if the Clerk session carries org:admin role.
 * orgRole is populated automatically by Clerk when the user is an org member.
 */
export function isAdminUser(userId: string | null | undefined, orgRole?: string | null): boolean {
  if (!userId) return false;
  return orgRole === "org:admin" || userId === process.env.ADMIN_USER_ID;
}

/**
 * safeIsAdmin — convenience helper for read routes that need to branch on
 * admin status without blocking non-admin users.  Extracts both userId and
 * orgRole from the Clerk session in a single call, returns true only when
 * both are present and orgRole === "org:admin".
 */
export function safeIsAdmin(req: Request): boolean {
  return safeGetAuth(req).isAdmin;
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

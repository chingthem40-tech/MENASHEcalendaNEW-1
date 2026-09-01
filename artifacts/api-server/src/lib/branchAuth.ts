/**
 * Branch Authorization Helpers — DATA-702
 *
 * Role hierarchy (server-side only — never trust the frontend):
 *   national_admin  — app admin assignment OR branch_admin_roles.role = 'national_admin'
 *   regional_admin  — branch_admin_roles.role = 'regional_admin' (or national)
 *   local_admin     — owns the branch (owner_user_id = userId)
 *
 * Permitted transitions per role:
 *   local_admin     : draft → pending_review (submit action only)
 *   regional_admin  : pending_review → approved | rejected | changes_requested
 *   national_admin  : approved → active | suspended | archived; active → suspended | archived; suspended → active
 */

import type { Request, Response, NextFunction } from "express";
import { pool } from "@workspace/db";
import { getRequestAuth } from "./supabaseAuth";

export type BranchAdminRole = "local_admin" | "regional_admin" | "national_admin";

export type BranchAction =
  | "submit"            // draft → pending_review  (local_admin)
  | "approve"           // pending_review → approved (regional_admin)
  | "reject"            // pending_review → rejected (regional_admin)
  | "request_changes"   // pending_review → draft    (regional_admin — asks local to fix)
  | "activate"          // approved → active         (national_admin)
  | "suspend"           // active → suspended        (national_admin)
  | "archive"           // any → archived            (national_admin)
  | "restore";          // suspended → active        (national_admin)

export type BranchStatus =
  | "draft" | "pending_review" | "approved" | "active"
  | "suspended" | "archived" | "rejected";

/** Maps an action to the resulting branch_status. */
export const ACTION_TO_STATUS: Record<BranchAction, BranchStatus> = {
  submit:          "pending_review",
  approve:         "approved",
  reject:          "rejected",
  request_changes: "draft",
  activate:        "active",
  suspend:         "suspended",
  archive:         "archived",
  restore:         "active",
};

/** Valid from-statuses for each action. */
export const ACTION_FROM_STATUSES: Record<BranchAction, BranchStatus[]> = {
  submit:          ["draft", "rejected"],
  approve:         ["pending_review"],
  reject:          ["pending_review"],
  request_changes: ["pending_review"],
  activate:        ["approved"],
  suspend:         ["active", "approved"],
  archive:         ["draft", "pending_review", "approved", "active", "suspended", "rejected"],
  restore:         ["suspended", "archived"],
};

/** Minimum role required for each action. */
export const ACTION_MIN_ROLE: Record<BranchAction, BranchAdminRole> = {
  submit:          "local_admin",
  approve:         "regional_admin",
  reject:          "regional_admin",
  request_changes: "regional_admin",
  activate:        "national_admin",
  suspend:         "national_admin",
  archive:         "national_admin",
  restore:         "national_admin",
};

function safeGetAuth(req: Request): { userId: string | null; orgRole: string | null } {
  const managed = getRequestAuth(req);
  if (managed) {
    return {
      userId: managed.userId,
      orgRole: managed.isAdmin ? "org:admin" : null,
    };
  }
  try {
    const auth = (req as any).auth;
    return {
      userId: auth?.userId ?? null,
      orgRole: auth?.orgRole ?? null,
    };
  } catch {
    return { userId: null, orgRole: null };
  }
}

/** Look up the role for a user in branch_admin_roles; returns null if not found. */
export async function getDbAdminRole(userId: string): Promise<"regional_admin" | "national_admin" | null> {
  try {
    const { rows } = await pool.query<{ role: string }>(
      "SELECT role FROM branch_admin_roles WHERE user_id = $1",
      [userId]
    );
    if (rows.length === 0) return null;
    const role = rows[0].role;
    if (role === "regional_admin" || role === "national_admin") return role;
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve the highest admin role for a user.
 * Checks the application admin assignment (→ national_admin) then the DB role table.
 */
export async function resolveAdminRole(req: Request): Promise<{ userId: string; role: BranchAdminRole } | null> {
  const { userId, orgRole } = safeGetAuth(req);
  if (!userId) return null;

  // Application admin assignment = national admin
  if (orgRole === "org:admin") return { userId, role: "national_admin" };

  // Check DB
  const dbRole = await getDbAdminRole(userId);
  if (dbRole) return { userId, role: dbRole };

  return null;
}

/** Middleware: requires auth + regional or national admin role. */
export async function requireRegionalAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const resolved = await resolveAdminRole(req);
  if (!resolved) {
    res.status(403).json({ error: "Regional or National Admin access required" });
    return;
  }
  (req as any).userId = resolved.userId;
  (req as any).adminRole = resolved.role;
  next();
}

/** Middleware: requires auth + national admin role only. */
export async function requireNationalAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { userId, orgRole } = safeGetAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  if (orgRole === "org:admin") {
    (req as any).userId = userId;
    (req as any).adminRole = "national_admin";
    next();
    return;
  }

  const dbRole = await getDbAdminRole(userId);
  if (dbRole === "national_admin") {
    (req as any).userId = userId;
    (req as any).adminRole = "national_admin";
    next();
    return;
  }

  res.status(403).json({ error: "National Admin access required" });
}

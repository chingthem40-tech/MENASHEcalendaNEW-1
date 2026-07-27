/**
 * Audit Log — Types and interface only.
 *
 * This module defines the contract for audit logging admin actions.
 * Storage implementation is deferred to a future sprint.
 *
 * Usage (once storage is implemented):
 *   import { auditLog } from "../lib/auditLog";
 *   await auditLog.record({ event: "admin.premium.approve", actorId: userId, targetId: targetUserId });
 */

export type AuditEventType =
  | "admin.login"
  | "admin.action"
  | "admin.permission_denied"
  | "admin.role_verified"
  | "admin.premium.approve"
  | "admin.premium.deny"
  | "admin.premium.grant"
  | "admin.user.list"
  | "admin.book.create"
  | "admin.book.update"
  | "admin.book.delete"
  | "admin.book.seed"
  | "admin.announcement.create"
  | "admin.announcement.update"
  | "admin.announcement.delete"
  | "admin.announcement.broadcast"
  | "admin.push.broadcast"
  | "admin.push.schedule"
  | "admin.census.view"
  | "admin.census.review"
  | "admin.yahrzeit.view"
  | "admin.yahrzeit.delete"
  | "admin.payment.view";

export interface AuditEvent {
  event: AuditEventType;
  actorId: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface AuditLogStorage {
  record(event: AuditEvent): Promise<void>;
}

/**
 * NoopAuditLog — placeholder implementation.
 * Replace with a real DB-backed implementation in a future sprint.
 */
class NoopAuditLog implements AuditLogStorage {
  async record(_event: AuditEvent): Promise<void> {
    // No-op until persistent storage is implemented (SPR-003)
  }
}

export const auditLog: AuditLogStorage = new NoopAuditLog();

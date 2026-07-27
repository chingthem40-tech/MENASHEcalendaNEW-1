import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const memberDirectoryStatusEnum = pgEnum("member_directory_status", [
  "pending",
  "approved",
  "hidden",
]);

// ── Table ─────────────────────────────────────────────────────────────────────

/**
 * Member Directory — a real, shared, server-backed community directory.
 * One row per registered user (userId is unique). Mirrors the `Member`
 * interface previously hardcoded in the web app's MemberDirectoryModal,
 * which stored entries in localStorage only (SPR — Member Directory backend).
 */
export const memberDirectoryTable = pgTable("member_directory", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull().default(""),
  country: text("country").notNull().default("India"),
  role: text("role").notNull().default("Member"),
  bio: text("bio").notNull().default(""),
  whatsapp: text("whatsapp"),
  phone: text("phone"),
  email: text("email"),
  otherContact: text("other_contact"),
  birthday: text("birthday"),
  aliyahDate: text("aliyah_date"),
  avatarEmoji: text("avatar_emoji"),
  profilePhotoUrl: text("profile_photo_url"),
  status: memberDirectoryStatusEnum("status").notNull().default("pending"),
  joinedAt: timestamp("joined_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Insert / Update schemas ───────────────────────────────────────────────────

export const insertMemberDirectorySchema = createInsertSchema(
  memberDirectoryTable,
).omit({
  id: true,
  userId: true,
  status: true,
  joinedAt: true,
  updatedAt: true,
});

export const updateMemberDirectorySchema = insertMemberDirectorySchema.partial();

// ── Types ─────────────────────────────────────────────────────────────────────

export type MemberDirectoryEntry = typeof memberDirectoryTable.$inferSelect;
export type InsertMemberDirectoryEntry = z.infer<
  typeof insertMemberDirectorySchema
>;
export type UpdateMemberDirectoryEntry = z.infer<
  typeof updateMemberDirectorySchema
>;

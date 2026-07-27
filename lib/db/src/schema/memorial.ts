import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const memorialStatusEnum = pgEnum("memorial_status", [
  "draft",
  "published",
  "archived",
  "removed",
]);

export const privacyLevelEnum = pgEnum("memorial_privacy_level", [
  "private",
  "family",
  "community",
  "public",
]);

export const interactionPermissionEnum = pgEnum(
  "memorial_interaction_permission",
  ["nobody", "family", "community", "public"],
);

export const candleTypeEnum = pgEnum("memorial_candle_type", [
  "yahrzeit",
  "shabbat",
  "memorial",
  "neshama",
  "shloshim",
]);

export const tributeTypeEnum = pgEnum("memorial_tribute_type", [
  "memory",
  "prayer",
  "scripture",
  "family",
  "community",
]);

export const tributeStatusEnum = pgEnum("memorial_tribute_status", [
  "pending",
  "approved",
  "rejected",
  "removed",
]);

export const familyMemberRoleEnum = pgEnum("memorial_family_member_role", [
  "admin",
  "member",
  "viewer",
]);

export const locationTypeEnum = pgEnum("memorial_location_type", [
  "burial",
  "birthplace",
  "hometown",
  "synagogue",
  "other",
]);

// ── Tables ────────────────────────────────────────────────────────────────────

export const memorialFamiliesTable = pgTable("memorial_families", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  primaryContactId: text("primary_contact_id").notNull(),
  memberCount: integer("member_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const memorialFamilyMembersTable = pgTable(
  "memorial_family_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => memorialFamiliesTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: familyMemberRoleEnum("role").notNull().default("member"),
    invitedBy: text("invited_by"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const memorialPersonsTable = pgTable("memorial_persons", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  hebrewName: text("hebrew_name"),
  hebrewFatherName: text("hebrew_father_name"),
  hebrewMotherName: text("hebrew_mother_name"),
  birthDate: text("birth_date"),
  birthDateHebrew: text("birth_date_hebrew"),
  deathDate: text("death_date").notNull(),
  deathDateHebrew: text("death_date_hebrew"),
  birthCity: text("birth_city"),
  birthCountry: text("birth_country"),
  deathCity: text("death_city"),
  deathCountry: text("death_country"),
  tribeAffiliation: text("tribe_affiliation"),
  occupation: text("occupation"),
  biography: text("biography"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const memorialsTable = pgTable("memorials", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  personId: uuid("person_id")
    .notNull()
    .references(() => memorialPersonsTable.id, { onDelete: "restrict" }),
  familyId: uuid("family_id")
    .notNull()
    .references(() => memorialFamiliesTable.id, { onDelete: "restrict" }),
  status: memorialStatusEnum("status").notNull().default("draft"),
  createdBy: text("created_by").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  candleCount: integer("candle_count").notNull().default(0),
  flowerCount: integer("flower_count").notNull().default(0),
  tributeCount: integer("tribute_count").notNull().default(0),
  prayerCount: integer("prayer_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const memorialPrivacyTable = pgTable("memorial_privacy", {
  id: uuid("id").primaryKey().defaultRandom(),
  memorialId: uuid("memorial_id")
    .notNull()
    .unique()
    .references(() => memorialsTable.id, { onDelete: "cascade" }),
  visibilityLevel: privacyLevelEnum("visibility_level")
    .notNull()
    .default("family"),
  canLightCandles: interactionPermissionEnum("can_light_candles")
    .notNull()
    .default("community"),
  canLeaveTributes: interactionPermissionEnum("can_leave_tributes")
    .notNull()
    .default("family"),
  canViewPhotos: interactionPermissionEnum("can_view_photos")
    .notNull()
    .default("family"),
  requireModeration: boolean("require_moderation").notNull().default(true),
  allowGuestInteraction: boolean("allow_guest_interaction")
    .notNull()
    .default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const memorialCandlesTable = pgTable("memorial_candles", {
  id: uuid("id").primaryKey().defaultRandom(),
  memorialId: uuid("memorial_id")
    .notNull()
    .references(() => memorialsTable.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  guestName: text("guest_name"),
  message: text("message"),
  candleType: candleTypeEnum("candle_type").notNull().default("memorial"),
  relationship: text("relationship"),
  community: text("community"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  ipHash: text("ip_hash"),
  litAt: timestamp("lit_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const memorialTributesTable = pgTable("memorial_tributes", {
  id: uuid("id").primaryKey().defaultRandom(),
  memorialId: uuid("memorial_id")
    .notNull()
    .references(() => memorialsTable.id, { onDelete: "cascade" }),
  userId: text("user_id"),
  guestName: text("guest_name"),
  guestEmail: text("guest_email"),
  title: text("title"),
  body: text("body").notNull(),
  tributeType: tributeTypeEnum("tribute_type"),
  language: text("language").notNull().default("en"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  status: tributeStatusEnum("status").notNull().default("pending"),
  moderatedBy: text("moderated_by"),
  moderatedAt: timestamp("moderated_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const memorialPhotosTable = pgTable("memorial_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  memorialId: uuid("memorial_id")
    .notNull()
    .references(() => memorialsTable.id, { onDelete: "cascade" }),
  uploadedBy: text("uploaded_by").notNull(),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  takenYear: integer("taken_year"),
  takenLocation: text("taken_location"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const memorialLocationsTable = pgTable("memorial_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => memorialPersonsTable.id, { onDelete: "cascade" }),
  locationType: locationTypeEnum("location_type").notNull().default("burial"),
  label: text("label").notNull(),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ── Insert / Select Schemas ───────────────────────────────────────────────────

export const insertMemorialFamilySchema = createInsertSchema(
  memorialFamiliesTable,
).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true, memberCount: true });

export const updateMemorialFamilySchema = insertMemorialFamilySchema.partial();

export const insertMemorialPersonSchema = createInsertSchema(
  memorialPersonsTable,
).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true });

export const updateMemorialPersonSchema = insertMemorialPersonSchema.partial();

export const insertMemorialSchema = createInsertSchema(memorialsTable).omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  publishedAt: true,
  lastActivityAt: true,
  candleCount: true,
  flowerCount: true,
  tributeCount: true,
  prayerCount: true,
  viewCount: true,
  createdBy: true,
  status: true,
});

export const updateMemorialSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export const insertPrivacySchema = createInsertSchema(
  memorialPrivacyTable,
).omit({ id: true, updatedAt: true, memorialId: true });

export const insertCandleSchema = z.object({
  candleType: z
    .enum(["yahrzeit", "shabbat", "memorial", "neshama", "shloshim"])
    .optional()
    .default("memorial"),
  message: z.string().max(280).optional(),
  guestName: z.string().min(1).max(100).optional(),
  isAnonymous: z.boolean().optional().default(false),
  relationship: z.string().max(100).optional(),
  community: z.string().max(200).optional(),
});

export const insertTributeSchema = z.object({
  title: z.string().max(100).optional(),
  body: z.string().min(10).max(2000),
  tributeType: z
    .enum(["memory", "prayer", "scripture", "family", "community"])
    .optional(),
  language: z.enum(["en", "tk", "he"]).optional().default("en"),
  guestName: z.string().min(1).max(100).optional(),
  guestEmail: z.string().max(200).optional(),
  isAnonymous: z.boolean().optional().default(false),
});

export const insertPhotoSchema = z.object({
  photoUrl: z.string().url().max(1000),
  caption: z.string().max(200).optional(),
  takenYear: z.number().int().min(1800).max(2100).optional(),
  takenLocation: z.string().max(200).optional(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type MemorialFamily = typeof memorialFamiliesTable.$inferSelect;
export type InsertMemorialFamily = z.infer<typeof insertMemorialFamilySchema>;

export type MemorialFamilyMember =
  typeof memorialFamilyMembersTable.$inferSelect;

export type MemorialPerson = typeof memorialPersonsTable.$inferSelect;
export type InsertMemorialPerson = z.infer<typeof insertMemorialPersonSchema>;
export type UpdateMemorialPerson = z.infer<typeof updateMemorialPersonSchema>;

export type Memorial = typeof memorialsTable.$inferSelect;
export type InsertMemorial = z.infer<typeof insertMemorialSchema>;

export type MemorialPrivacy = typeof memorialPrivacyTable.$inferSelect;

export type MemorialCandle = typeof memorialCandlesTable.$inferSelect;
export type InsertCandle = z.infer<typeof insertCandleSchema>;

export type MemorialTribute = typeof memorialTributesTable.$inferSelect;
export type InsertTribute = z.infer<typeof insertTributeSchema>;

export type MemorialPhoto = typeof memorialPhotosTable.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type MemorialLocation = typeof memorialLocationsTable.$inferSelect;

export type MemorialWithPerson = Memorial & {
  person: MemorialPerson;
  privacy: MemorialPrivacy;
};

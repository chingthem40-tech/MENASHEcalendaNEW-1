import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  category: text("category").notNull().default("bug"),
  priority: text("priority").notNull().default("medium"),
  message: text("message").notNull(),
  page: text("page").notNull().default(""),
  device: text("device").notNull().default(""),
  status: text("status").notNull().default("open"),
  adminNote: text("admin_note").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFeedbackSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "wont_fix"]).optional(),
  adminNote: z.string().max(1000).optional(),
});

export const selectFeedbackSchema = createSelectSchema(feedbackTable);

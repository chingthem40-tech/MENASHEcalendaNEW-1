import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feedbackTable = pgTable("feedback", {
  id:               serial("id").primaryKey(),
  referenceNumber:  text("reference_number").notNull().default(""),
  userId:           text("user_id"),
  // Feedback type
  type:             text("type").notNull().default("general"),
  category:         text("category").notNull().default("bug"),
  priority:         text("priority").notNull().default("medium"),
  subject:          text("subject").notNull().default(""),
  message:          text("message").notNull(),
  // Bug-report extras
  expectedBehaviour:  text("expected_behaviour").notNull().default(""),
  actualBehaviour:    text("actual_behaviour").notNull().default(""),
  stepsToReproduce:   text("steps_to_reproduce").notNull().default(""),
  platform:           text("platform").notNull().default(""),
  browser:            text("browser").notNull().default(""),
  deviceModel:        text("device_model").notNull().default(""),
  appVersion:         text("app_version").notNull().default(""),
  // Feature-request extras
  problemSolved:    text("problem_solved").notNull().default(""),
  whoBenefits:      text("who_benefits").notNull().default(""),
  importance:       text("importance").notNull().default(""),
  // Appreciation extras
  emojiReaction:    text("emoji_reaction").notNull().default(""),
  // Rating extras
  rating:           integer("rating"),
  wouldRecommend:   text("would_recommend").notNull().default(""),
  // Legacy / shared
  page:             text("page").notNull().default(""),
  device:           text("device").notNull().default(""),
  attachmentUrl:    text("attachment_url"),
  // Status & admin
  status:           text("status").notNull().default("new"),
  adminNote:        text("admin_note").notNull().default(""),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
  updatedAt:        timestamp("updated_at").notNull().defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({
  id: true,
  referenceNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFeedbackSchema = z.object({
  status: z.enum(["new", "reviewed", "in_progress", "planned", "completed", "closed"]).optional(),
  adminNote: z.string().max(1000).optional(),
});

export const selectFeedbackSchema = createSelectSchema(feedbackTable);

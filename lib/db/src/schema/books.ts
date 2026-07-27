import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const booksTable = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  language: text("language").notNull().default("English"),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  coverEmoji: text("cover_emoji").notNull().default("📖"),
  coverColor: text("cover_color").notNull().default("#1a2540"),
  fileUrl: text("file_url"),
  coverImageUrl: text("cover_image_url"),
  isPremium: boolean("is_premium").notNull().default(false),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookSchema = createInsertSchema(booksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBookSchema = insertBookSchema.partial();

export const selectBookSchema = createSelectSchema(booksTable);

export type InsertBook = z.infer<typeof insertBookSchema>;
export type UpdateBook = z.infer<typeof updateBookSchema>;
export type Book = typeof booksTable.$inferSelect;

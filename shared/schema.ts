import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  jsonb,
  bigint,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  googleId: text("google_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
});

export const flashcardSets = pgTable("flashcard_sets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  cards: jsonb("cards")
    .notNull()
    .$type<{ id: string; front: string; back: string }[]>()
    .default([]),
  knownCardIds: jsonb("known_card_ids")
    .notNull()
    .$type<string[]>()
    .default([]),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  googleId: true,
  email: true,
  name: true,
  avatarUrl: true,
});

export const insertFlashcardSetSchema = createInsertSchema(flashcardSets).pick({
  title: true,
  description: true,
  cards: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FlashcardSet = typeof flashcardSets.$inferSelect;
export type InsertFlashcardSet = z.infer<typeof insertFlashcardSetSchema>;

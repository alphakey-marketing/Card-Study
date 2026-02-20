import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  flashcardSets,
  type User,
  type InsertUser,
  type FlashcardSet,
} from "@shared/schema";

export async function getUser(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByGoogleId(
  googleId: string
): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId));
  return user;
}

export async function createUser(data: InsertUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function upsertUser(data: InsertUser): Promise<User> {
  const existing = await getUserByGoogleId(data.googleId);
  if (existing) {
    const [updated] = await db
      .update(users)
      .set({ name: data.name, avatarUrl: data.avatarUrl, email: data.email })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }
  return createUser(data);
}

export async function getUserSets(userId: string): Promise<FlashcardSet[]> {
  return db
    .select()
    .from(flashcardSets)
    .where(eq(flashcardSets.userId, userId))
    .orderBy(desc(flashcardSets.updatedAt));
}

export async function getSetById(
  id: string,
  userId: string
): Promise<FlashcardSet | undefined> {
  const [set] = await db
    .select()
    .from(flashcardSets)
    .where(eq(flashcardSets.id, id));
  if (set && set.userId !== userId) return undefined;
  return set;
}

export async function createSet(
  userId: string,
  data: { title: string; description: string; cards: { id: string; front: string; back: string }[] }
): Promise<FlashcardSet> {
  const now = Date.now();
  const [set] = await db
    .insert(flashcardSets)
    .values({
      userId,
      title: data.title,
      description: data.description,
      cards: data.cards,
      knownCardIds: [],
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return set;
}

export async function updateSet(
  id: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    cards?: { id: string; front: string; back: string }[];
    knownCardIds?: string[];
  }
): Promise<FlashcardSet | undefined> {
  const existing = await getSetById(id, userId);
  if (!existing) return undefined;

  const [updated] = await db
    .update(flashcardSets)
    .set({
      ...data,
      updatedAt: Date.now(),
    })
    .where(eq(flashcardSets.id, id))
    .returning();
  return updated;
}

export async function deleteSetById(
  id: string,
  userId: string
): Promise<boolean> {
  const existing = await getSetById(id, userId);
  if (!existing) return false;
  await db.delete(flashcardSets).where(eq(flashcardSets.id, id));
  return true;
}

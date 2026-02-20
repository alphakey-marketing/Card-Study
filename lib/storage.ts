import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
  createdAt: number;
  updatedAt: number;
  knownCardIds: string[];
}

const SETS_KEY = "flashmind_sets";

export async function getAllSets(): Promise<FlashcardSet[]> {
  const raw = await AsyncStorage.getItem(SETS_KEY);
  if (!raw) return [];
  const sets: FlashcardSet[] = JSON.parse(raw);
  return sets.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getSet(id: string): Promise<FlashcardSet | null> {
  const sets = await getAllSets();
  return sets.find((s) => s.id === id) ?? null;
}

export async function saveSet(set: FlashcardSet): Promise<void> {
  const sets = await getAllSets();
  const idx = sets.findIndex((s) => s.id === set.id);
  if (idx >= 0) {
    sets[idx] = set;
  } else {
    sets.push(set);
  }
  await AsyncStorage.setItem(SETS_KEY, JSON.stringify(sets));
}

export async function deleteSet(id: string): Promise<void> {
  const sets = await getAllSets();
  const filtered = sets.filter((s) => s.id !== id);
  await AsyncStorage.setItem(SETS_KEY, JSON.stringify(filtered));
}

export function createNewSet(
  title: string,
  description: string,
  cards: { front: string; back: string }[]
): FlashcardSet {
  const now = Date.now();
  return {
    id: Crypto.randomUUID(),
    title,
    description,
    cards: cards.map((c) => ({
      id: Crypto.randomUUID(),
      front: c.front,
      back: c.back,
    })),
    createdAt: now,
    updatedAt: now,
    knownCardIds: [],
  };
}

export async function updateKnownCards(
  setId: string,
  knownCardIds: string[]
): Promise<void> {
  const set = await getSet(setId);
  if (!set) return;
  set.knownCardIds = knownCardIds;
  set.updatedAt = Date.now();
  await saveSet(set);
}

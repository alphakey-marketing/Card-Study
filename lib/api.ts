import { apiRequest } from "./query-client";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardSet {
  id: string;
  userId: string;
  title: string;
  description: string;
  cards: Flashcard[];
  knownCardIds: string[];
  createdAt: number;
  updatedAt: number;
}

export async function getAllSets(): Promise<FlashcardSet[]> {
  const res = await apiRequest("GET", "/api/sets");
  return res.json();
}

export async function getSet(id: string): Promise<FlashcardSet | null> {
  try {
    const res = await apiRequest("GET", `/api/sets/${id}`);
    return res.json();
  } catch {
    return null;
  }
}

export async function createSetOnServer(data: {
  title: string;
  description: string;
  cards: { id: string; front: string; back: string }[];
}): Promise<FlashcardSet> {
  const res = await apiRequest("POST", "/api/sets", data);
  return res.json();
}

export async function updateSetOnServer(
  id: string,
  data: {
    title?: string;
    description?: string;
    cards?: { id: string; front: string; back: string }[];
    knownCardIds?: string[];
  }
): Promise<FlashcardSet> {
  const res = await apiRequest("PUT", `/api/sets/${id}`, data);
  return res.json();
}

export async function deleteSetOnServer(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/sets/${id}`);
}

export async function updateKnownCards(
  setId: string,
  knownCardIds: string[]
): Promise<void> {
  await apiRequest("PUT", `/api/sets/${setId}`, { knownCardIds });
}

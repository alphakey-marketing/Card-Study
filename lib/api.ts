import * as Storage from "./storage";

export type Flashcard = Storage.Flashcard;
export type FlashcardSet = Storage.FlashcardSet;

export async function getAllSets(): Promise<FlashcardSet[]> {
  return Storage.getAllSets();
}

export async function getSet(id: string): Promise<FlashcardSet | null> {
  return Storage.getSet(id);
}

export async function createSetOnServer(data: {
  title: string;
  description: string;
  cards: { id: string; front: string; back: string }[];
}): Promise<FlashcardSet> {
  const newSet = Storage.createNewSet(data.title, data.description, data.cards);
  await Storage.saveSet(newSet);
  return newSet;
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
  const set = await Storage.getSet(id);
  if (!set) throw new Error("Set not found");

  if (data.title !== undefined) set.title = data.title;
  if (data.description !== undefined) set.description = data.description;
  if (data.cards !== undefined) set.cards = data.cards;
  if (data.knownCardIds !== undefined) set.knownCardIds = data.knownCardIds;
  
  set.updatedAt = Date.now();
  await Storage.saveSet(set);
  return set;
}

export async function deleteSetOnServer(id: string): Promise<void> {
  await Storage.deleteSet(id);
}

export async function updateKnownCards(
  setId: string,
  knownCardIds: string[]
): Promise<void> {
  await Storage.updateKnownCards(setId, knownCardIds);
}

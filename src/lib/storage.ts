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

export function getAllSets(): FlashcardSet[] {
  try {
    const raw = localStorage.getItem(SETS_KEY);
    if (!raw) return [];
    const sets: FlashcardSet[] = JSON.parse(raw);
    return sets.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (e) {
    console.error("Error reading from localStorage", e);
    return [];
  }
}

export function getSet(id: string): FlashcardSet | null {
  const sets = getAllSets();
  return sets.find((s) => s.id === id) ?? null;
}

export function saveSet(set: FlashcardSet): void {
  const sets = getAllSets();
  const idx = sets.findIndex((s) => s.id === set.id);
  if (idx >= 0) {
    sets[idx] = set;
  } else {
    sets.push(set);
  }
  localStorage.setItem(SETS_KEY, JSON.stringify(sets));
}

export function deleteSet(id: string): void {
  const sets = getAllSets();
  const filtered = sets.filter((s) => s.id !== id);
  localStorage.setItem(SETS_KEY, JSON.stringify(filtered));
}

export function createNewSet(
  title: string,
  description: string,
  cards: { front: string; back: string }[]
): FlashcardSet {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title,
    description,
    cards: cards.map((c) => ({
      id: crypto.randomUUID(),
      front: c.front,
      back: c.back,
    })),
    createdAt: now,
    updatedAt: now,
    knownCardIds: [],
  };
}

export function updateKnownCards(
  setId: string,
  knownCardIds: string[]
): void {
  const set = getSet(setId);
  if (!set) return;
  set.knownCardIds = knownCardIds;
  set.updatedAt = Date.now();
  saveSet(set);
}

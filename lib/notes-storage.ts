import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export interface ContentBlock {
  id: string;
  type: "text" | "bullet" | "numbered" | "checkbox" | "heading";
  content: string;
  checked?: boolean;
}

export interface NoteTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: number;
}

export interface Note {
  id: string;
  title: string;
  content: ContentBlock[];
  notebookId: string | null;
  tags: string[];
  tasks: NoteTask[];
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
}

export interface Notebook {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  createdAt: number;
  updatedAt: number;
}

const NOTES_KEY = "flashmind_notes";
const NOTEBOOKS_KEY = "flashmind_notebooks";

const NOTEBOOK_COLORS = [
  "#1B6B4A",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#84CC16",
];

export function getRandomColor(): string {
  return NOTEBOOK_COLORS[Math.floor(Math.random() * NOTEBOOK_COLORS.length)];
}

export async function getAllNotes(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(NOTES_KEY);
  if (!raw) return [];
  const notes: Note[] = JSON.parse(raw);
  return notes.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt - a.updatedAt;
  });
}

export async function getNote(id: string): Promise<Note | null> {
  const notes = await getAllNotes();
  return notes.find((n) => n.id === id) ?? null;
}

export async function saveNote(note: Note): Promise<void> {
  const raw = await AsyncStorage.getItem(NOTES_KEY);
  const notes: Note[] = raw ? JSON.parse(raw) : [];
  const idx = notes.findIndex((n) => n.id === note.id);
  if (idx >= 0) {
    notes[idx] = note;
  } else {
    notes.push(note);
  }
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export async function deleteNote(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(NOTES_KEY);
  if (!raw) return;
  const notes: Note[] = JSON.parse(raw);
  const filtered = notes.filter((n) => n.id !== id);
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
}

export function createNewNote(
  title: string,
  notebookId: string | null = null
): Note {
  const now = Date.now();
  return {
    id: Crypto.randomUUID(),
    title,
    content: [
      {
        id: Crypto.randomUUID(),
        type: "text",
        content: "",
      },
    ],
    notebookId,
    tags: [],
    tasks: [],
    createdAt: now,
    updatedAt: now,
    isPinned: false,
  };
}

export async function getAllNotebooks(): Promise<Notebook[]> {
  const raw = await AsyncStorage.getItem(NOTEBOOKS_KEY);
  if (!raw) return [];
  const notebooks: Notebook[] = JSON.parse(raw);
  return notebooks.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getNotebook(id: string): Promise<Notebook | null> {
  const notebooks = await getAllNotebooks();
  return notebooks.find((n) => n.id === id) ?? null;
}

export async function saveNotebook(notebook: Notebook): Promise<void> {
  const raw = await AsyncStorage.getItem(NOTEBOOKS_KEY);
  const notebooks: Notebook[] = raw ? JSON.parse(raw) : [];
  const idx = notebooks.findIndex((n) => n.id === notebook.id);
  if (idx >= 0) {
    notebooks[idx] = notebook;
  } else {
    notebooks.push(notebook);
  }
  await AsyncStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(notebooks));
}

export async function deleteNotebook(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(NOTEBOOKS_KEY);
  if (!raw) return;
  const notebooks: Notebook[] = JSON.parse(raw);
  const filtered = notebooks.filter((n) => n.id !== id);
  await AsyncStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(filtered));

  const notesRaw = await AsyncStorage.getItem(NOTES_KEY);
  if (notesRaw) {
    const notes: Note[] = JSON.parse(notesRaw);
    const updated = notes.map((n) =>
      n.notebookId === id ? { ...n, notebookId: null } : n
    );
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
  }
}

export function createNewNotebook(
  name: string,
  parentId: string | null = null
): Notebook {
  const now = Date.now();
  return {
    id: Crypto.randomUUID(),
    name,
    parentId,
    color: getRandomColor(),
    createdAt: now,
    updatedAt: now,
  };
}

export function getNotebookTree(notebooks: Notebook[]): {
  roots: Notebook[];
  children: Record<string, Notebook[]>;
} {
  const children: Record<string, Notebook[]> = {};
  const roots: Notebook[] = [];

  notebooks.forEach((nb) => {
    if (nb.parentId) {
      if (!children[nb.parentId]) children[nb.parentId] = [];
      children[nb.parentId].push(nb);
    } else {
      roots.push(nb);
    }
  });

  return { roots, children };
}

export function searchNotes(
  notes: Note[],
  query: string,
  filters?: {
    notebookId?: string;
    tag?: string;
  }
): Note[] {
  let filtered = notes;

  if (filters?.notebookId) {
    filtered = filtered.filter((n) => n.notebookId === filters.notebookId);
  }

  if (filters?.tag) {
    filtered = filtered.filter((n) =>
      n.tags.some((t) => t.toLowerCase() === filters.tag!.toLowerCase())
    );
  }

  if (!query.trim()) return filtered;

  const lower = query.toLowerCase();

  const tagMatch = lower.match(/#(\w+)/g);
  const notebookMatch = lower.match(/notebook:(\w+)/g);

  let textQuery = lower
    .replace(/#\w+/g, "")
    .replace(/notebook:\w+/g, "")
    .trim();

  return filtered.filter((note) => {
    let matches = true;

    if (tagMatch) {
      const searchTags = tagMatch.map((t) => t.replace("#", "").toLowerCase());
      matches = searchTags.every((st) =>
        note.tags.some((nt) => nt.toLowerCase().includes(st))
      );
    }

    if (matches && textQuery) {
      const titleMatch = note.title.toLowerCase().includes(textQuery);
      const contentMatch = note.content.some((block) =>
        block.content.toLowerCase().includes(textQuery)
      );
      const taskMatch = note.tasks.some((task) =>
        task.title.toLowerCase().includes(textQuery)
      );
      matches = titleMatch || contentMatch || taskMatch;
    }

    return matches;
  });
}

export function getNotePreview(note: Note): string {
  const textBlocks = note.content.filter((b) => b.content.trim());
  if (textBlocks.length === 0) return "No content";
  return textBlocks
    .slice(0, 2)
    .map((b) => {
      if (b.type === "checkbox") return `${b.checked ? "✓" : "○"} ${b.content}`;
      if (b.type === "bullet") return `• ${b.content}`;
      return b.content;
    })
    .join("\n");
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

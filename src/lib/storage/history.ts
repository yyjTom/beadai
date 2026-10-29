import type { PatternHistoryEntry } from '@/types/pattern';

const STORAGE_KEY = 'beadai.history.v1';
const MAX_ENTRIES = 5;

export const readHistory = (): PatternHistoryEntry[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PatternHistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch (error) {
    console.error('[history] could not read local history', error);
    return [];
  }
};

export const writeHistory = (entries: PatternHistoryEntry[]): PatternHistoryEntry[] => {
  const next = entries.slice(0, MAX_ENTRIES);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('[history] local storage is full; keeping the newest entries only', error);
      return next.slice(0, 2);
    }
  }

  return next;
};

export const pushHistoryEntry = (entry: PatternHistoryEntry): PatternHistoryEntry[] => {
  const existing = readHistory().filter((item) => item.id !== entry.id);
  return writeHistory([entry, ...existing]);
};

export const removeHistoryEntry = (id: string): PatternHistoryEntry[] => {
  return writeHistory(readHistory().filter((entry) => entry.id !== id));
};

export const clearHistory = (): PatternHistoryEntry[] => writeHistory([]);

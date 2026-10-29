import { EMPTY_CELL, type BeadUsage, type PatternResult } from '@/types/pattern';
import { findPaletteColor } from '@/lib/color/palettes';
import type { PaletteBrand, PatternSwapMap } from '@/types/pattern';

export const applySwapMap = (cells: string[], swapMap: PatternSwapMap): string[] => {
  const entries = Object.entries(swapMap);
  if (entries.length === 0) return cells;
  return cells.map((cell) => swapMap[cell] ?? cell);
};

export interface ResolvedPattern {
  cells: string[];
  usage: BeadUsage[];
  totalBeads: number;
  distinctColors: number;
}

export const computeUsage = (cells: string[], brand: PaletteBrand): ResolvedPattern => {
  const counts = new Map<string, number>();

  for (const cell of cells) {
    if (cell === EMPTY_CELL) continue;
    counts.set(cell, (counts.get(cell) ?? 0) + 1);
  }

  const usage: BeadUsage[] = [];
  for (const [id, count] of counts) {
    const color = findPaletteColor(brand, id);
    if (!color) continue;
    usage.push({ color, count });
  }

  usage.sort((a, b) => b.count - a.count || a.color.code.localeCompare(b.color.code));

  const totalBeads = usage.reduce((sum, entry) => sum + entry.count, 0);

  return {
    cells,
    usage,
    totalBeads,
    distinctColors: usage.length,
  };
};

export const resolvePattern = (
  base: PatternResult,
  swapMap: PatternSwapMap,
  brand: PaletteBrand,
): PatternResult => {
  const resolved = computeUsage(applySwapMap(base.cells, swapMap), brand);
  return {
    width: base.width,
    height: base.height,
    cells: resolved.cells,
    usage: resolved.usage,
    totalBeads: resolved.totalBeads,
    distinctColors: resolved.distinctColors,
  };
};

export const withSwap = (
  swapMap: PatternSwapMap,
  fromId: string,
  toId: string,
): PatternSwapMap => {
  const next: PatternSwapMap = { ...swapMap };
  if (toId === fromId) {
    delete next[fromId];
    return next;
  }
  next[fromId] = toId;
  return next;
};

export const resetSwap = (swapMap: PatternSwapMap, fromId: string): PatternSwapMap => {
  const next: PatternSwapMap = { ...swapMap };
  delete next[fromId];
  return next;
};

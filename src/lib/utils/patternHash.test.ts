import { describe, expect, it } from 'vitest';
import { hashPattern } from './patternHash';
import type { PatternResult } from '@/types/pattern';

const pattern = (cells: string[], width = 2, height = 2): PatternResult => ({
  width,
  height,
  cells,
  usage: [],
  totalBeads: cells.length,
  distinctColors: 1,
});

describe('hashPattern', () => {
  it('returns a stable sha-256 hex digest', async () => {
    const hash = await hashPattern(pattern(['a', 'b', 'c', 'd']), 'perler');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashPattern(pattern(['a', 'b', 'c', 'd']), 'perler')).toBe(hash);
  });

  it('changes when the cells change', async () => {
    const before = await hashPattern(pattern(['a', 'b', 'c', 'd']), 'perler');
    const after = await hashPattern(pattern(['a', 'b', 'c', 'e']), 'perler');
    expect(after).not.toBe(before);
  });

  it('changes when the brand changes', async () => {
    const perler = await hashPattern(pattern(['a', 'b', 'c', 'd']), 'perler');
    const artkal = await hashPattern(pattern(['a', 'b', 'c', 'd']), 'artkal');
    expect(artkal).not.toBe(perler);
  });

  it('changes when the grid size changes', async () => {
    const small = await hashPattern(pattern(['a', 'b', 'c', 'd'], 2, 2), 'perler');
    const wide = await hashPattern(pattern(['a', 'b', 'c', 'd'], 4, 1), 'perler');
    expect(wide).not.toBe(small);
  });
});

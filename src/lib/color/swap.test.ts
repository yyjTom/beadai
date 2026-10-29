import { describe, expect, it } from 'vitest';
import { applySwapMap, computeUsage, resetSwap, resolvePattern, withSwap } from './swap';
import { EMPTY_CELL, type PatternResult } from '@/types/pattern';

const basePattern = (cells: string[]): PatternResult => ({
  width: 3,
  height: 1,
  cells,
  usage: [],
  totalBeads: 0,
  distinctColors: 0,
});

describe('applySwapMap', () => {
  it('returns the input unchanged when there is no swap', () => {
    const cells = ['perler-white', 'perler-cream'];
    expect(applySwapMap(cells, {})).toBe(cells);
  });

  it('replaces only the mapped ids', () => {
    const cells = ['perler-white', 'perler-cream', 'perler-white'];
    expect(applySwapMap(cells, { 'perler-white': 'perler-cheddar' })).toEqual([
      'perler-cheddar',
      'perler-cream',
      'perler-cheddar',
    ]);
  });
});

describe('computeUsage', () => {
  it('counts beads and skips empty cells', () => {
    const result = computeUsage(
      ['perler-white', 'perler-white', EMPTY_CELL, 'perler-cream'],
      'perler',
    );
    expect(result.totalBeads).toBe(3);
    expect(result.distinctColors).toBe(2);
    expect(result.usage[0]).toMatchObject({ count: 2 });
  });

  it('sorts usage by count descending', () => {
    const result = computeUsage(
      ['perler-cream', 'perler-white', 'perler-white', 'perler-white'],
      'perler',
    );
    expect(result.usage.map((entry) => entry.count)).toEqual([3, 1]);
  });

  it('reports zero for an all-empty board', () => {
    const result = computeUsage([EMPTY_CELL, EMPTY_CELL], 'perler');
    expect(result.totalBeads).toBe(0);
    expect(result.distinctColors).toBe(0);
  });
});

describe('resolvePattern', () => {
  it('recomputes counts after a swap', () => {
    const base = basePattern(['perler-white', 'perler-white', 'perler-cream']);
    const resolved = resolvePattern(base, { 'perler-white': 'perler-cream' }, 'perler');

    expect(resolved.cells).toEqual(['perler-cream', 'perler-cream', 'perler-cream']);
    expect(resolved.totalBeads).toBe(3);
    expect(resolved.distinctColors).toBe(1);
    expect(resolved.width).toBe(3);
  });
});

describe('swap map helpers', () => {
  it('adds a swap', () => {
    expect(withSwap({}, 'perler-white', 'perler-cream')).toEqual({
      'perler-white': 'perler-cream',
    });
  });

  it('removes the swap when target equals source', () => {
    expect(withSwap({ 'perler-white': 'perler-cream' }, 'perler-white', 'perler-white')).toEqual(
      {},
    );
  });

  it('resets a single swap and keeps the others', () => {
    const map = { 'perler-white': 'perler-cream', 'perler-butter': 'perler-cheddar' };
    expect(resetSwap(map, 'perler-white')).toEqual({ 'perler-butter': 'perler-cheddar' });
  });
});

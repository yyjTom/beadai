import { describe, expect, it } from 'vitest';
import { BOARD_SPLIT_THRESHOLD, needsBoardPlans, splitBoards } from './boardPlan';

describe('needsBoardPlans', () => {
  it('keeps the default board on a single page', () => {
    expect(needsBoardPlans(50, 50)).toBe(false);
  });

  it('splits anything past the readable page threshold', () => {
    expect(needsBoardPlans(116, 116)).toBe(true);
    expect(needsBoardPlans(BOARD_SPLIT_THRESHOLD + 1, 50)).toBe(true);
    expect(needsBoardPlans(50, BOARD_SPLIT_THRESHOLD + 1)).toBe(true);
  });
});

describe('splitBoards', () => {
  it('returns one tile for a board that fits', () => {
    const tiles = splitBoards(29, 29);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]).toMatchObject({ index: 1, row: 0, col: 0, x0: 0, y0: 0, width: 29, height: 29 });
  });

  it('splits a 116 × 116 poster into sixteen boards', () => {
    const tiles = splitBoards(116, 116);
    expect(tiles).toHaveLength(16);
    expect(tiles[0].index).toBe(1);
    expect(tiles[15].index).toBe(16);
    expect(tiles[15]).toMatchObject({ row: 3, col: 3, x0: 87, y0: 87, width: 29, height: 29 });
  });

  it('trims the final column and row instead of padding with empty cells', () => {
    const tiles = splitBoards(50, 50);
    expect(tiles).toHaveLength(4);
    expect(tiles[3]).toMatchObject({ row: 1, col: 1, x0: 29, y0: 29, width: 21, height: 21 });
  });

  it('covers every cell exactly once', () => {
    const width = 61;
    const height = 73;
    const tiles = splitBoards(width, height);
    const covered = new Set<string>();

    for (const tile of tiles) {
      for (let y = 0; y < tile.height; y += 1) {
        for (let x = 0; x < tile.width; x += 1) {
          covered.add(`${tile.x0 + x}:${tile.y0 + y}`);
        }
      }
    }

    expect(covered.size).toBe(width * height);
  });
});

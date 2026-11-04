import { describe, expect, it } from 'vitest';
import {
  SUMMARY_GAP,
  SUMMARY_MIN_BLOCK,
  SUMMARY_ROW_HEIGHT,
  layoutPaletteSummary,
  type PaletteSwatch,
} from './paletteSummary';

const swatch = (code: string, count: number): PaletteSwatch => ({
  code,
  rgb: [0, 0, 0],
  count,
});

const fixedMeasure = (text: string, fontSize: number): number => text.length * fontSize * 0.6;

describe('layoutPaletteSummary', () => {
  it('keeps every card at least the minimum width', () => {
    const layout = layoutPaletteSummary([swatch('P1', 5)], 2000, fixedMeasure);
    expect(layout.rows).toHaveLength(1);
    expect(layout.rows[0][0].width).toBeGreaterThanOrEqual(SUMMARY_MIN_BLOCK);
  });

  it('wraps to a new row when the next card would overflow', () => {
    const cards = Array.from({ length: 8 }, (_, index) => swatch(`P${index}`, 100));
    const narrow = layoutPaletteSummary(cards, SUMMARY_MIN_BLOCK * 2, fixedMeasure);
    const wide = layoutPaletteSummary(cards, SUMMARY_MIN_BLOCK * 8 + SUMMARY_GAP * 7, fixedMeasure);

    expect(narrow.rows.length).toBeGreaterThan(1);
    expect(wide.rows).toHaveLength(1);
  });

  it('grows the total height with each row', () => {
    const cards = Array.from({ length: 8 }, (_, index) => swatch(`P${index}`, 100));
    const layout = layoutPaletteSummary(cards, SUMMARY_MIN_BLOCK * 2, fixedMeasure);
    const expected =
      layout.rows.length * SUMMARY_ROW_HEIGHT + (layout.rows.length - 1) * SUMMARY_GAP;
    expect(layout.height).toBe(expected);
  });

  it('never exceeds the content width on a row', () => {
    const cards = Array.from({ length: 12 }, (_, index) => swatch(`P${index}`, 50 + index));
    const contentWidth = SUMMARY_MIN_BLOCK * 3 + SUMMARY_GAP * 2;
    const layout = layoutPaletteSummary(cards, contentWidth, fixedMeasure);

    for (const row of layout.rows) {
      const last = row[row.length - 1];
      expect(last.x + last.width).toBeLessThanOrEqual(contentWidth);
    }
  });

  it('returns zero height for an empty list', () => {
    expect(layoutPaletteSummary([], 800, fixedMeasure)).toEqual({ rows: [], height: 0 });
  });
});

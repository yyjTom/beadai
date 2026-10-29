import { describe, expect, it } from 'vitest';
import { deltaE76, rgbToLab } from './lab';
import { matchRgbToPalette, rankedPaletteMatches } from './match';
import { getPalette } from './palettes';
import type { PaletteColor } from '@/types/pattern';

const findColor = (brand: 'perler' | 'artkal', id: string): PaletteColor => {
  const color = getPalette(brand).find((entry) => entry.id === id);
  if (!color) throw new Error(`missing palette entry ${id}`);
  return color;
};

describe('matchRgbToPalette', () => {
  it('returns the exact entry when the rgb is already in the palette', () => {
    const white = findColor('perler', 'perler-white');
    const match = matchRgbToPalette(white.rgb[0], white.rgb[1], white.rgb[2], 'perler');
    expect(match.id).toBe('perler-white');
  });

  it('always returns a palette colour for arbitrary input', () => {
    for (const rgb of [
      [0, 0, 0],
      [17, 200, 33],
      [255, 128, 255],
    ] as const) {
      const match = matchRgbToPalette(rgb[0], rgb[1], rgb[2], 'artkal');
      expect(match.id).toBeTruthy();
      expect(match.rgb).toHaveLength(3);
    }
  });

  it('picks a dark colour for near-black input', () => {
    const match = matchRgbToPalette(6, 6, 6, 'perler');
    const luminance = 0.299 * match.rgb[0] + 0.587 * match.rgb[1] + 0.114 * match.rgb[2];
    expect(luminance).toBeLessThan(90);
  });

  it('keeps brands separate', () => {
    const perler = matchRgbToPalette(90, 120, 90, 'perler');
    const artkal = matchRgbToPalette(90, 120, 90, 'artkal');
    expect(perler.id.startsWith('perler-')).toBe(true);
    expect(artkal.id.startsWith('artkal-')).toBe(true);
  });
});

describe('rankedPaletteMatches', () => {
  it('returns alternatives sorted by increasing colour distance', () => {
    const source = findColor('perler', 'perler-white');
    const sourceLab = rgbToLab(source.rgb[0], source.rgb[1], source.rgb[2]);

    const ranked = rankedPaletteMatches('perler-white', 'perler');
    expect(ranked.length).toBeGreaterThan(1);

    const distances = ranked.map((color) =>
      deltaE76(sourceLab, rgbToLab(color.rgb[0], color.rgb[1], color.rgb[2])),
    );

    for (let index = 1; index < distances.length; index += 1) {
      expect(distances[index]).toBeGreaterThanOrEqual(distances[index - 1]);
    }
  });

  it('never includes the source colour itself', () => {
    const ranked = rankedPaletteMatches('perler-white', 'perler');
    expect(ranked.some((color) => color.id === 'perler-white')).toBe(false);
  });

  it('respects the limit', () => {
    expect(rankedPaletteMatches('perler-white', 'perler', 3)).toHaveLength(3);
  });

  it('returns an empty list for an unknown colour id', () => {
    expect(rankedPaletteMatches('not-a-colour', 'perler')).toEqual([]);
  });
});

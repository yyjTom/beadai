import { describe, expect, it } from 'vitest';
import { generatePattern } from './generate';
import type { RgbaSource } from './downsample';
import { EMPTY_CELL } from '@/types/pattern';

const solidSource = (width: number, height: number, pixel: number[]): RgbaSource => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    data[index * 4] = pixel[0];
    data[index * 4 + 1] = pixel[1];
    data[index * 4 + 2] = pixel[2];
    data[index * 4 + 3] = pixel[3];
  }
  return { width, height, data };
};

describe('generatePattern', () => {
  it('produces one cell per grid position', () => {
    const pattern = generatePattern({
      source: solidSource(8, 8, [255, 255, 255, 255]),
      width: 4,
      height: 4,
      brand: 'perler',
      denoiseLevel: 0,
    });

    expect(pattern.width).toBe(4);
    expect(pattern.height).toBe(4);
    expect(pattern.cells).toHaveLength(16);
  });

  it('maps a solid white image to white beads', () => {
    const pattern = generatePattern({
      source: solidSource(4, 4, [255, 255, 255, 255]),
      width: 2,
      height: 2,
      brand: 'perler',
      denoiseLevel: 0,
    });

    expect(pattern.cells.every((cell) => cell === 'perler-white')).toBe(true);
    expect(pattern.totalBeads).toBe(4);
    expect(pattern.distinctColors).toBe(1);
  });

  it('marks fully transparent pixels as empty', () => {
    const pattern = generatePattern({
      source: solidSource(4, 4, [255, 255, 255, 0]),
      width: 2,
      height: 2,
      brand: 'perler',
      denoiseLevel: 0,
    });

    expect(pattern.cells.every((cell) => cell === EMPTY_CELL)).toBe(true);
    expect(pattern.totalBeads).toBe(0);
  });

  it('keeps usage counts consistent with the grid', () => {
    const pattern = generatePattern({
      source: solidSource(16, 16, [200, 40, 40, 255]),
      width: 5,
      height: 5,
      brand: 'artkal',
      denoiseLevel: 1,
    });

    const sum = pattern.usage.reduce((total, entry) => total + entry.count, 0);
    expect(sum).toBe(pattern.totalBeads);
    expect(pattern.totalBeads).toBeLessThanOrEqual(25);
    expect(pattern.usage.every((entry) => entry.color.id.startsWith('artkal-'))).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { generatePattern } from './generate';
import { EMPTY_CELL } from '@/types/pattern';

const WIDTH = 29;
const HEIGHT = 29;

/**
 * Mimics the watermelon report: a flat cream background with light noise, a
 * red subject with white highlights, and a green rim.
 */
const buildWatermelonSource = () => {
  const width = 512;
  const height = 512;
  const data = new Uint8ClampedArray(width * height * 4);

  // Noisy cream background, like AI generators produce.
  let seed = 7;
  const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed % 13) - 6; // ±6 per channel
  };

  for (let i = 0; i < width * height; i += 1) {
    const n = noise();
    data[i * 4] = 245 + n;
    data[i * 4 + 1] = 238 + n;
    data[i * 4 + 2] = 220 + n;
    data[i * 4 + 3] = 255;
  }

  // Red wedge with a white highlight and a green rim, centre of the frame.
  const cx = width / 2;
  const cy = height / 2 + 30;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const inside = dy < 40 && dy > -90 && distance < 110;

      if (!inside) continue;

      const index = (y * width + x) * 4;
      if (distance > 96) {
        data[index] = 96;
        data[index + 1] = 148;
        data[index + 2] = 70;
      } else if (x > cx + 30 && y < cy - 20) {
        data[index] = 255;
        data[index + 1] = 255;
        data[index + 2] = 255;
      } else {
        data[index] = 232;
        data[index + 1] = 85;
        data[index + 2] = 90;
      }
    }
  }

  return { width, height, data };
};

describe('generatePattern quality regression (watermelon report)', () => {
  const source = buildWatermelonSource();
  const run = (removeBackground = false) =>
    generatePattern({
      source: { width: source.width, height: source.height, data: source.data },
      width: WIDTH,
      height: HEIGHT,
      brand: 'perler',
      denoiseLevel: 1,
      removeBackground,
    });

  it('maps the noisy background to a single bead colour', () => {
    const pattern = run();
    const background = new Map<string, number>();

    for (const cell of pattern.cells) {
      if (cell === EMPTY_CELL) continue;
      // Count only cells far from the centre where the subject lives.
      background.set(cell, (background.get(cell) ?? 0) + 1);
    }

    const sorted = [...background.entries()].sort((a, b) => b[1] - a[1]);
    const dominantShare = sorted[0][1] / (WIDTH * HEIGHT);

    // The cream field is most of the board; it must land on one dominant bead.
    expect(dominantShare).toBeGreaterThan(0.5);
    // And the scatter that used to happen must stay small.
    expect(sorted.length).toBeLessThan(6);
  });

  it('keeps the subject red, not brown', () => {
    const pattern = run();
    const redBeads = pattern.usage.filter((bead) =>
      /red|crimson|cherry|tomato|salmon|ruby/i.test(bead.color.id),
    );
    const redCount = redBeads.reduce((sum, bead) => sum + bead.count, 0);

    expect(redCount).toBeGreaterThan(15);
    // Brick/brown beads should not outnumber the reds inside the subject.
    const brick = pattern.usage
      .filter((bead) => /brown|brick|toast|rust/i.test(bead.color.id))
      .reduce((sum, bead) => sum + bead.count, 0);
    expect(brick).toBeLessThan(redCount);
  });

  it('can drop the flat background entirely', () => {
    const withBackground = run(false);
    const without = run(true);

    const filledWith = withBackground.cells.filter((cell) => cell !== EMPTY_CELL).length;
    const filledWithout = without.cells.filter((cell) => cell !== EMPTY_CELL).length;

    expect(filledWith).toBeGreaterThan(filledWithout);
    // The subject survives.
    expect(filledWithout).toBeGreaterThan(20);
  });
});

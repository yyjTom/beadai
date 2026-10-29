import { describe, expect, it } from 'vitest';
import { deltaE, deltaE76, deltaE2000, rgbToLab } from './lab';

describe('rgbToLab', () => {
  it('maps white to L ≈ 100 with neutral chroma', () => {
    const [lightness, a, b] = rgbToLab(255, 255, 255);
    expect(lightness).toBeCloseTo(100, 1);
    expect(Math.abs(a)).toBeLessThan(1);
    expect(Math.abs(b)).toBeLessThan(1);
  });

  it('maps black to L ≈ 0', () => {
    expect(rgbToLab(0, 0, 0)[0]).toBeCloseTo(0, 1);
  });

  it('gives red a positive a* and blue a negative b*', () => {
    expect(rgbToLab(255, 0, 0)[1]).toBeGreaterThan(0);
    expect(rgbToLab(0, 0, 255)[2]).toBeLessThan(0);
  });
});

describe('deltaE', () => {
  it('is zero for identical colours', () => {
    const lab = rgbToLab(120, 80, 200);
    expect(deltaE76(lab, lab)).toBe(0);
    expect(deltaE2000(lab, lab)).toBe(0);
  });

  it('is symmetric under both formulas', () => {
    const a = rgbToLab(20, 90, 140);
    const b = rgbToLab(210, 200, 40);
    expect(deltaE76(a, b)).toBeCloseTo(deltaE76(b, a), 10);
    expect(deltaE2000(a, b)).toBeCloseTo(deltaE2000(b, a), 6);
  });

  it('reports a bigger distance for obviously different colours', () => {
    const white = rgbToLab(255, 255, 255);
    expect(deltaE(white, rgbToLab(0, 0, 0))).toBeGreaterThan(
      deltaE(white, rgbToLab(250, 250, 250)),
    );
  });

  it('switches formula on request', () => {
    const red = rgbToLab(255, 0, 0);
    const green = rgbToLab(0, 255, 0);
    expect(deltaE(red, green, 'ciede2000')).not.toBe(deltaE(red, green));
  });
});

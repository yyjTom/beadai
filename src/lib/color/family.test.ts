import { describe, expect, it } from 'vitest';
import { COLOR_FAMILY_LABELS, COLOR_FAMILY_ORDER, colorFamily } from './family';

describe('colorFamily', () => {
  it('sends near-white, near-black and greys to neutral', () => {
    expect(colorFamily([255, 255, 255])).toBe('neutral');
    expect(colorFamily([250, 250, 252])).toBe('neutral');
    expect(colorFamily([10, 10, 12])).toBe('neutral');
    expect(colorFamily([128, 128, 128])).toBe('neutral');
  });

  it('classifies saturated primaries by hue', () => {
    expect(colorFamily([220, 30, 30])).toBe('red');
    expect(colorFamily([240, 140, 20])).toBe('orange');
    expect(colorFamily([240, 220, 40])).toBe('yellow');
    expect(colorFamily([40, 170, 70])).toBe('green');
    expect(colorFamily([30, 90, 220])).toBe('blue');
    expect(colorFamily([140, 60, 200])).toBe('purple');
  });

  it('keeps pink in the red family', () => {
    expect(colorFamily([240, 120, 170])).toBe('red');
  });

  it('keeps brown with its hue family rather than neutral', () => {
    expect(colorFamily([120, 70, 30])).toBe('orange');
  });

  it('orders and labels every family exactly once', () => {
    expect(new Set(COLOR_FAMILY_ORDER).size).toBe(COLOR_FAMILY_ORDER.length);
    for (const family of COLOR_FAMILY_ORDER) {
      expect(COLOR_FAMILY_LABELS[family]).toBeTruthy();
    }
  });
});

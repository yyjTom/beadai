import { deltaE76, rgbToLab, type Lab } from '@/lib/color/lab';
import { PALETTES } from '@/lib/color/palettes';
import type { PaletteBrand, PaletteColor } from '@/types/pattern';

export interface PaletteIndex {
  brand: PaletteBrand;
  colors: PaletteColor[];
  labs: Lab[];
}

const cache = new Map<PaletteBrand, PaletteIndex>();

export const getPaletteIndex = (brand: PaletteBrand): PaletteIndex => {
  const existing = cache.get(brand);
  if (existing) return existing;

  const colors = PALETTES[brand];
  const index: PaletteIndex = {
    brand,
    colors,
    labs: colors.map((color) => rgbToLab(color.rgb[0], color.rgb[1], color.rgb[2])),
  };
  cache.set(brand, index);
  return index;
};

export const matchRgbToPalette = (
  r: number,
  g: number,
  b: number,
  brand: PaletteBrand,
): PaletteColor => {
  const { colors, labs } = getPaletteIndex(brand);
  const target = rgbToLab(r, g, b);

  let bestIndex = 0;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (let i = 0; i < labs.length; i += 1) {
    const lab = labs[i];
    const delta =
      (target[0] - lab[0]) ** 2 + (target[1] - lab[1]) ** 2 + (target[2] - lab[2]) ** 2;
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = i;
    }
  }

  return colors[bestIndex];
};

export const rankedPaletteMatches = (
  sourceId: string,
  brand: PaletteBrand,
  limit = 24,
): PaletteColor[] => {
  const { colors, labs } = getPaletteIndex(brand);
  const sourceIndex = colors.findIndex((color) => color.id === sourceId);
  if (sourceIndex < 0) return [];

  const sourceLab = labs[sourceIndex];
  return colors
    .map((color, index) => ({ color, delta: deltaE76(sourceLab, labs[index]) }))
    .filter((entry) => entry.color.id !== sourceId)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, limit)
    .map((entry) => entry.color);
};

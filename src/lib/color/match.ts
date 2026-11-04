import { colorFamily, type ColorFamily } from '@/lib/color/family';
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

  // Custom (C-prefixed) shades exist only so older patterns keep rendering;
  // they must never win a match, or the shopping list sends people looking for
  // a bead number that no supplier sells.
  const colors = PALETTES[brand].filter((color) => !color.code.startsWith('C'));
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

export interface ColorFamilyGroup {
  family: ColorFamily;
  colors: PaletteColor[];
}

/**
 * Alternatives grouped by colour family, so swapping a shade stays inside the
 * family the user is working in. The source family comes first with a deeper
 * list; the rest are ordered by how close their best match is.
 */
export const groupedPaletteMatches = (
  sourceId: string,
  brand: PaletteBrand,
  options: { perFamily?: number; sourceFamilyLimit?: number; maxFamilies?: number } = {},
): ColorFamilyGroup[] => {
  const { perFamily = 4, sourceFamilyLimit = 8, maxFamilies = 4 } = options;
  const { colors, labs } = getPaletteIndex(brand);
  const sourceIndex = colors.findIndex((color) => color.id === sourceId);
  if (sourceIndex < 0) return [];

  const sourceLab = labs[sourceIndex];
  const ownFamily = colorFamily(colors[sourceIndex].rgb);

  const buckets = new Map<ColorFamily, Array<{ color: PaletteColor; delta: number }>>();
  colors.forEach((color, index) => {
    if (color.id === sourceId) return;
    const family = colorFamily(color.rgb);
    const entry = { color, delta: deltaE76(sourceLab, labs[index]) };
    const bucket = buckets.get(family);
    if (bucket) bucket.push(entry);
    else buckets.set(family, [entry]);
  });

  return Array.from(buckets.entries())
    .map(([family, entries]) => ({
      family,
      entries: entries.sort((a, b) => a.delta - b.delta),
    }))
    .sort((a, b) => {
      if (a.family === ownFamily) return -1;
      if (b.family === ownFamily) return 1;
      return a.entries[0].delta - b.entries[0].delta;
    })
    .slice(0, maxFamilies)
    .map(({ family, entries }) => ({
      family,
      colors: entries
        .slice(0, family === ownFamily ? sourceFamilyLimit : perFamily)
        .map((entry) => entry.color),
    }))
    .filter((group) => group.colors.length > 0);
};

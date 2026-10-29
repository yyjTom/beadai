import { matchRgbToPalette } from '@/lib/color/match';
import { denoiseCells } from '@/lib/color/denoise';
import { computeUsage } from '@/lib/color/swap';
import { downsampleToGrid, type RgbaSource } from '@/lib/pattern/downsample';
import { EMPTY_CELL, type DenoiseLevel, type PatternResult } from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';

export interface GeneratePatternInput {
  source: RgbaSource;
  width: number;
  height: number;
  brand: PaletteBrand;
  denoiseLevel: DenoiseLevel;
}

export const generatePattern = (input: GeneratePatternInput): PatternResult => {
  const { source, width, height, brand, denoiseLevel } = input;

  const cells = downsampleToGrid(source, width, height).map((cell) =>
    cell.empty ? EMPTY_CELL : matchRgbToPalette(cell.r, cell.g, cell.b, brand).id,
  );

  const cleaned = denoiseCells(cells, width, height, denoiseLevel);
  const resolved = computeUsage(cleaned, brand);

  return {
    width,
    height,
    cells: resolved.cells,
    usage: resolved.usage,
    totalBeads: resolved.totalBeads,
    distinctColors: resolved.distinctColors,
  };
};

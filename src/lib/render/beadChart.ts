import { findPaletteColor } from '@/lib/color/palettes';
import { EMPTY_CELL, type PaletteBrand, type PatternResult } from '@/types/pattern';

/** Warm cream behind every chart, matching the studio card background. */
export const BEAD_CHART_BG = '#F6F1E7';

/** Hairline between beads so large boards stay countable on screen. */
export const BEAD_CELL_GAP = 1;

export interface BeadChartPaintOptions {
  pattern: PatternResult;
  brand: PaletteBrand;
  cellSize: number;
  showGrid: boolean;
  showCodes?: boolean;
  selectedColorId?: string | null;
}

const luminance = (rgb: [number, number, number]): number =>
  (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;

/**
 * Paints a bead chart onto an already-sized canvas context. The context must be
 * reset to logical pixels by the caller (setTransform for device pixel ratio);
 * this function only draws in CSS pixel coordinates.
 */
export const paintBeadChart = (
  ctx: CanvasRenderingContext2D,
  { pattern, brand, cellSize, showGrid, showCodes = false, selectedColorId = null }: BeadChartPaintOptions,
): void => {
  const width = pattern.width * cellSize;
  const height = pattern.height * cellSize;

  ctx.fillStyle = BEAD_CHART_BG;
  ctx.fillRect(0, 0, width, height);

  const gap = showGrid ? BEAD_CELL_GAP : 0;
  const size = cellSize - gap;
  // findPaletteColor walks the palette array; look each id up once instead of
  // once per cell (116 × 116 would be 13,456 linear scans).
  const colors = new Map<string, ReturnType<typeof findPaletteColor>>();

  for (let y = 0; y < pattern.height; y += 1) {
    for (let x = 0; x < pattern.width; x += 1) {
      const colorId = pattern.cells[y * pattern.width + x];
      if (colorId === EMPTY_CELL) continue;

      let color = colors.get(colorId);
      if (color === undefined) {
        color = findPaletteColor(brand, colorId);
        colors.set(colorId, color);
      }
      if (!color) continue;

      const px = x * cellSize;
      const py = y * cellSize;

      ctx.fillStyle = `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`;
      ctx.fillRect(px, py, size, size);

      if (selectedColorId && selectedColorId === colorId) {
        ctx.strokeStyle = '#7C5CFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, Math.max(0, size - 2), Math.max(0, size - 2));
      }

      if (showCodes && cellSize >= 12) {
        ctx.fillStyle =
          luminance(color.rgb) > 0.6 ? 'rgba(43,42,41,0.75)' : 'rgba(255,255,255,0.85)';
        ctx.font = `700 ${Math.max(6, Math.round(cellSize * 0.3))}px Poppins, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(color.code, px + size / 2, py + size / 2);
      }
    }
  }
};

/**
 * Largest whole-pixel cell that fits the available width, clamped so the chart
 * never renders microscopic beads or one bead per screen.
 */
export const fitCellSize = (
  availableWidth: number,
  columns: number,
  showGrid: boolean,
  bounds: { min?: number; max?: number } = {},
): number => {
  const { min = 5, max = 22 } = bounds;
  const gap = showGrid ? BEAD_CELL_GAP : 0;
  const usable = availableWidth - (columns - 1) * gap;
  const fit = Math.floor(usable / columns);
  return Math.max(min, Math.min(max, Number.isFinite(fit) ? fit : min));
};

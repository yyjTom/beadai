import { findPaletteColor } from '@/lib/color/palettes';
import { EMPTY_CELL, type PatternResult } from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';

const CELL_PX = 32;
const HEADER_PX = 104;
const FOOTER_PX = 64;
const PADDING_PX = 32;

export interface PngExportOptions {
  fileName?: string;
}

/**
 * Raster export for the current grid. Available to everyone for boards inside
 * their plan limit; the printable PDF stays a Pro feature.
 */
export const exportPatternPng = async (
  pattern: PatternResult,
  brand: PaletteBrand,
  options: PngExportOptions = {},
): Promise<void> => {
  const gridWidth = pattern.width * CELL_PX;
  const gridHeight = pattern.height * CELL_PX;

  const canvas = document.createElement('canvas');
  canvas.width = gridWidth + PADDING_PX * 2;
  canvas.height = gridHeight + HEADER_PX + FOOTER_PX;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');

  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#2B2A29';
  ctx.font = 'bold 34px Poppins, system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${pattern.width} × ${pattern.height} bead pattern`, PADDING_PX, 52);

  ctx.fillStyle = '#6B6660';
  ctx.font = '22px Poppins, system-ui, sans-serif';
  ctx.fillText(
    `${brand === 'perler' ? 'Perler' : 'Artkal'} colours · ${pattern.distinctColors} colours · ${pattern.totalBeads} beads`,
    PADDING_PX,
    84,
  );

  ctx.strokeStyle = '#2B2A29';
  ctx.lineWidth = 1;

  for (let y = 0; y < pattern.height; y += 1) {
    for (let x = 0; x < pattern.width; x += 1) {
      const colorId = pattern.cells[y * pattern.width + x];
      const px = PADDING_PX + x * CELL_PX;
      const py = HEADER_PX + y * CELL_PX;

      if (colorId === EMPTY_CELL) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py, CELL_PX, CELL_PX);
        ctx.strokeStyle = '#DCD8D0';
        ctx.strokeRect(px + 0.5, py + 0.5, CELL_PX - 1, CELL_PX - 1);
        ctx.strokeStyle = '#2B2A29';
        continue;
      }

      const color = findPaletteColor(brand, colorId);
      if (!color) continue;

      ctx.fillStyle = `rgb(${color.rgb.join(', ')})`;
      ctx.fillRect(px, py, CELL_PX, CELL_PX);
      ctx.strokeRect(px + 0.5, py + 0.5, CELL_PX - 1, CELL_PX - 1);

      const luminance =
        (0.299 * color.rgb[0] + 0.587 * color.rgb[1] + 0.114 * color.rgb[2]) / 255;
      ctx.fillStyle = luminance > 0.6 ? '#2B2A29' : '#FAFAFA';
      ctx.font = '11px Poppins, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(color.code, px + CELL_PX / 2, py + CELL_PX / 2 + 4);
      ctx.textAlign = 'left';
    }
  }

  ctx.fillStyle = '#6B6660';
  ctx.font = '20px Poppins, system-ui, sans-serif';
  ctx.fillText('Generated with beadai.app', PADDING_PX, canvas.height - 26);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/png');
  });

  if (!blob) throw new Error('png_encoding_failed');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = options.fileName ?? `beadai-${pattern.width}x${pattern.height}.png`;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

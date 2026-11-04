import { findPaletteColor } from '@/lib/color/palettes';
import {
  SUMMARY_BLOCK_PADDING,
  SUMMARY_CHIP_GAP,
  SUMMARY_CHIP_SIZE,
  SUMMARY_CODE_FONT,
  SUMMARY_COUNT_FONT,
  SUMMARY_GAP,
  SUMMARY_ROW_HEIGHT,
  layoutPaletteSummary,
  type PaletteSwatch,
} from '@/lib/export/paletteSummary';
import { EMPTY_CELL, type PatternResult } from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';

const HEADER_PX = 104;
const FOOTER_PX = 64;
const PADDING_PX = 32;
const SUMMARY_TOP_GAP = 40;
const SUMMARY_TITLE_HEIGHT = 46;
const SUMMARY_SUBTITLE_HEIGHT = 36;
const CARD_RADIUS = 12;
const CHIP_RADIUS = 10;

/**
 * Browsers start failing `toBlob` around 16M pixels (Safari lower still), so a
 * 116 × 116 board at 32px would be 66MB of canvas. Drop the cell size instead of
 * white-screening the tab.
 */
const MAX_GRID_PIXELS = 12_000_000;

export const pickCellPx = (width: number, height: number): number => {
  for (const cellPx of [32, 24, 16]) {
    if (width * cellPx * height * cellPx <= MAX_GRID_PIXELS) return cellPx;
  }
  return 16;
};

export interface PngExportOptions {
  fileName?: string;
}

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

/**
 * Raster export for the current grid, free at every board size. The printable
 * PDF stays a paid feature.
 */
export const exportPatternPng = async (
  pattern: PatternResult,
  brand: PaletteBrand,
  options: PngExportOptions = {},
): Promise<void> => {
  const cellPx = pickCellPx(pattern.width, pattern.height);
  const gridWidth = pattern.width * cellPx;
  const gridHeight = pattern.height * cellPx;
  const contentWidth = gridWidth;
  const brandLabel = brand === 'perler' ? 'Perler Beads' : 'Artkal Beads';

  const swatches: PaletteSwatch[] = [...pattern.usage]
    .sort((a, b) => b.count - a.count)
    .map(({ color, count }) => ({ code: color.code, rgb: color.rgb, count }));

  // Measure with a throwaway context: the real canvas height depends on how the
  // summary wraps, so it has to be laid out first.
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) throw new Error('canvas_unavailable');

  const layout = layoutPaletteSummary(swatches, contentWidth, (text, fontSize, weight) => {
    measureCtx.font = `${weight} ${fontSize}px Poppins, system-ui, sans-serif`;
    return measureCtx.measureText(text).width;
  });

  const summaryHeight =
    swatches.length > 0
      ? SUMMARY_TOP_GAP + SUMMARY_TITLE_HEIGHT + SUMMARY_SUBTITLE_HEIGHT + layout.height
      : 0;

  const canvas = document.createElement('canvas');
  canvas.width = gridWidth + PADDING_PX * 2;
  canvas.height = HEADER_PX + gridHeight + summaryHeight + FOOTER_PX;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');

  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#2B2A29';
  ctx.font = 'bold 34px Poppins, system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillText(`${pattern.width} × ${pattern.height} bead pattern`, PADDING_PX, 52);

  ctx.fillStyle = '#6B6660';
  ctx.font = '22px Poppins, system-ui, sans-serif';
  ctx.fillText(
    `${brand === 'perler' ? 'Perler' : 'Artkal'} colours · ${pattern.distinctColors} colours · ${pattern.totalBeads} beads`,
    PADDING_PX,
    84,
  );

  const codeFont = Math.max(8, Math.round(cellPx * 0.34));
  const showCellCodes = cellPx >= 20;

  for (let y = 0; y < pattern.height; y += 1) {
    for (let x = 0; x < pattern.width; x += 1) {
      const colorId = pattern.cells[y * pattern.width + x];
      const px = PADDING_PX + x * cellPx;
      const py = HEADER_PX + y * cellPx;

      if (colorId === EMPTY_CELL) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py, cellPx, cellPx);
        ctx.strokeStyle = '#DCD8D0';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, cellPx - 1, cellPx - 1);
        continue;
      }

      const color = findPaletteColor(brand, colorId);
      if (!color) continue;

      ctx.fillStyle = `rgb(${color.rgb.join(', ')})`;
      ctx.fillRect(px, py, cellPx, cellPx);
      ctx.strokeStyle = '#2B2A29';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, cellPx - 1, cellPx - 1);

      if (showCellCodes) {
        const luminance =
          (0.299 * color.rgb[0] + 0.587 * color.rgb[1] + 0.114 * color.rgb[2]) / 255;
        ctx.fillStyle = luminance > 0.6 ? '#2B2A29' : '#FAFAFA';
        ctx.font = `${codeFont}px Poppins, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(color.code, px + cellPx / 2, py + cellPx / 2 + codeFont * 0.35);
        ctx.textAlign = 'left';
      }
    }
  }

  if (swatches.length > 0) {
    const summaryTop = HEADER_PX + gridHeight + SUMMARY_TOP_GAP;

    ctx.fillStyle = '#2B2A29';
    ctx.font = 'bold 34px Poppins, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(brandLabel, PADDING_PX, summaryTop + 30);

    ctx.fillStyle = '#6B6660';
    ctx.font = '20px Poppins, system-ui, sans-serif';
    ctx.fillText(
      `${pattern.distinctColors} colours · ${pattern.totalBeads} beads`,
      PADDING_PX,
      summaryTop + SUMMARY_TITLE_HEIGHT + 22,
    );

    const rowsTop = summaryTop + SUMMARY_TITLE_HEIGHT + SUMMARY_SUBTITLE_HEIGHT;

    layout.rows.forEach((row, rowIndex) => {
      const y = rowsTop + rowIndex * (SUMMARY_ROW_HEIGHT + SUMMARY_GAP);

      for (const { swatch, x, width } of row) {
        const cardX = PADDING_PX + x;

        roundedRect(ctx, cardX, y, width, SUMMARY_ROW_HEIGHT, CARD_RADIUS);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#E6E1D8';
        ctx.lineWidth = 1;
        ctx.stroke();

        const chipX = cardX + SUMMARY_BLOCK_PADDING;
        const chipY = y + (SUMMARY_ROW_HEIGHT - SUMMARY_CHIP_SIZE) / 2;

        roundedRect(ctx, chipX, chipY, SUMMARY_CHIP_SIZE, SUMMARY_CHIP_SIZE, CHIP_RADIUS);
        ctx.fillStyle = `rgb(${swatch.rgb.join(', ')})`;
        ctx.fill();
        ctx.strokeStyle = '#DCD8D0';
        ctx.stroke();

        ctx.fillStyle = '#2B2A29';
        ctx.font = `bold ${SUMMARY_CODE_FONT}px Poppins, system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(
          swatch.code,
          chipX + SUMMARY_CHIP_SIZE + SUMMARY_CHIP_GAP,
          y + SUMMARY_ROW_HEIGHT / 2 + 8,
        );

        ctx.fillStyle = '#6B6660';
        ctx.font = `${SUMMARY_COUNT_FONT}px Poppins, system-ui, sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(
          `×${swatch.count}`,
          cardX + width - SUMMARY_BLOCK_PADDING,
          y + SUMMARY_ROW_HEIGHT / 2 + 8,
        );
        ctx.textAlign = 'left';
      }
    });
  }

  ctx.fillStyle = '#6B6660';
  ctx.font = '20px Poppins, system-ui, sans-serif';
  ctx.textAlign = 'left';
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

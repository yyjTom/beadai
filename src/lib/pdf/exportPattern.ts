import { jsPDF } from 'jspdf';
import { findPaletteColor } from '@/lib/color/palettes';
import { STANDARD_BOARD, needsBoardPlans, splitBoards } from '@/lib/pdf/boardPlan';
import { EMPTY_CELL, type BeadUsage, type PatternResult } from '@/types/pattern';
import type { PaletteBrand } from '@/types/pattern';

const MARGIN_MM = 12;

export interface ExportOptions {
  fileName?: string;
  title?: string;
}

/**
 * Draws a vector grid: every bead is a rectangle with its colour code printed
 * inside, so the chart stays crisp at any print size.
 */
export const exportPatternPdf = (
  pattern: PatternResult,
  brand: PaletteBrand,
  options: ExportOptions = {},
): void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const availableWidth = pageWidth - MARGIN_MM * 2;
  const headerHeight = 26;
  const availableHeight = pageHeight - MARGIN_MM * 2 - headerHeight;

  const cellSize = Math.min(availableWidth / pattern.width, availableHeight / pattern.height);
  const gridWidth = cellSize * pattern.width;
  const gridHeight = cellSize * pattern.height;
  const originX = (pageWidth - gridWidth) / 2;
  const originY = MARGIN_MM + headerHeight;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(options.title ?? `${pattern.width} × ${pattern.height} bead pattern`, MARGIN_MM, MARGIN_MM + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `${brand === 'perler' ? 'Perler' : 'Artkal'} colours · ${pattern.distinctColors} colours · ${pattern.totalBeads} beads`,
    MARGIN_MM,
    MARGIN_MM + 13,
  );
  doc.text('Generated with beadai.app', MARGIN_MM, MARGIN_MM + 19);

  doc.setDrawColor(43, 42, 41);
  doc.setLineWidth(0.1);

  for (let y = 0; y < pattern.height; y += 1) {
    for (let x = 0; x < pattern.width; x += 1) {
      const colorId = pattern.cells[y * pattern.width + x];
      const px = originX + x * cellSize;
      const py = originY + y * cellSize;

      if (colorId === EMPTY_CELL) {
        doc.setDrawColor(220, 216, 208);
        doc.setFillColor(255, 255, 255);
        doc.rect(px, py, cellSize, cellSize, 'S');
        doc.setDrawColor(43, 42, 41);
        continue;
      }

      const color = findPaletteColor(brand, colorId);
      if (!color) continue;

      doc.setFillColor(color.rgb[0], color.rgb[1], color.rgb[2]);
      doc.rect(px, py, cellSize, cellSize, 'F');
      doc.rect(px, py, cellSize, cellSize, 'S');

      if (cellSize >= 4.2) {
        const luminance =
          (0.299 * color.rgb[0] + 0.587 * color.rgb[1] + 0.114 * color.rgb[2]) / 255;
        doc.setTextColor(luminance > 0.6 ? 43 : 250, luminance > 0.6 ? 42 : 250, luminance > 0.6 ? 41 : 250);
        doc.setFontSize(Math.max(2.2, Math.min(4.4, cellSize * 0.34)));
        doc.text(
          color.code,
          px + cellSize / 2,
          py + cellSize / 2 + cellSize * 0.12,
          { align: 'center' },
        );
        doc.setTextColor(43, 42, 41);
      }
    }
  }

  if (needsBoardPlans(pattern.width, pattern.height)) {
    appendBoardPages(doc, pattern, brand, pageWidth, pageHeight);
  }

  appendShoppingList(doc, pattern.usage, brand, pageWidth, pageHeight);

  doc.save(options.fileName ?? `beadai-${pattern.width}x${pattern.height}.pdf`);
};

const appendShoppingList = (
  doc: jsPDF,
  usage: BeadUsage[],
  brand: PaletteBrand,
  pageWidth: number,
  pageHeight: number,
): void => {
  if (usage.length === 0) return;

  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Shopping list', MARGIN_MM, MARGIN_MM + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `${brand === 'perler' ? 'Perler' : 'Artkal'} colour codes with exact bead counts.`,
    MARGIN_MM,
    MARGIN_MM + 13,
  );

  let y = MARGIN_MM + 24;
  const rowHeight = 8;

  for (const entry of usage) {
    if (y > pageHeight - MARGIN_MM - rowHeight) {
      doc.addPage();
      y = MARGIN_MM + 10;
    }

    doc.setFillColor(entry.color.rgb[0], entry.color.rgb[1], entry.color.rgb[2]);
    doc.rect(MARGIN_MM, y - 4.5, 6, 6, 'F');
    doc.rect(MARGIN_MM, y - 4.5, 6, 6, 'S');

    doc.setFontSize(11);
    doc.text(`${entry.color.code} · ${entry.color.name}`, MARGIN_MM + 10, y);
    doc.text(`${entry.count}`, pageWidth - MARGIN_MM, y, { align: 'right' });

    y += rowHeight;
  }
};

/**
 * One page per physical pegboard. The heading carries the chart-wide column and
 * row range (so people know which tile they are holding), while the rulers next
 * to the grid count 1..N inside that tile — the only numbers that map onto the
 * board in someone's hands.
 */
const appendBoardPages = (
  doc: jsPDF,
  pattern: PatternResult,
  brand: PaletteBrand,
  pageWidth: number,
  pageHeight: number,
): void => {
  const tiles = splitBoards(pattern.width, pattern.height);
  if (tiles.length <= 1) return;

  const headerHeight = 22;
  const rulerGutter = 10;
  const boardColumns = Math.ceil(pattern.width / STANDARD_BOARD);
  const boardRows = Math.ceil(pattern.height / STANDARD_BOARD);

  for (const tile of tiles) {
    doc.addPage();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(43, 42, 41);
    doc.text(`Board ${tile.index} of ${tiles.length}`, MARGIN_MM, MARGIN_MM + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 102, 96);
    doc.text(
      `columns ${tile.x0 + 1}–${tile.x0 + tile.width} · rows ${tile.y0 + 1}–${tile.y0 + tile.height}`,
      pageWidth - MARGIN_MM,
      MARGIN_MM + 6,
      { align: 'right' },
    );
    doc.setTextColor(43, 42, 41);

    const availableWidth = pageWidth - MARGIN_MM * 2 - rulerGutter;
    const availableHeight = pageHeight - MARGIN_MM * 2 - headerHeight - rulerGutter * 2;
    const cellSize = Math.min(availableWidth / tile.width, availableHeight / tile.height);
    const gridWidth = cellSize * tile.width;
    const gridHeight = cellSize * tile.height;
    const originX = (pageWidth - gridWidth) / 2;
    const originY = MARGIN_MM + headerHeight + rulerGutter;

    doc.setFontSize(Math.max(4, Math.min(6.5, cellSize * 0.45)));
    for (let col = 0; col < tile.width; col += 1) {
      if (col !== 0 && (col + 1) % 5 !== 0) continue;
      doc.text(String(col + 1), originX + col * cellSize + cellSize / 2, originY - 2, {
        align: 'center',
      });
    }
    for (let row = 0; row < tile.height; row += 1) {
      if (row !== 0 && (row + 1) % 5 !== 0) continue;
      doc.text(String(row + 1), originX - 1.5, originY + row * cellSize + cellSize / 2 + 1, {
        align: 'right',
      });
    }

    doc.setDrawColor(43, 42, 41);
    doc.setLineWidth(0.1);

    for (let y = 0; y < tile.height; y += 1) {
      for (let x = 0; x < tile.width; x += 1) {
        const colorId = pattern.cells[(tile.y0 + y) * pattern.width + (tile.x0 + x)];
        const px = originX + x * cellSize;
        const py = originY + y * cellSize;

        if (colorId === EMPTY_CELL) {
          doc.setDrawColor(220, 216, 208);
          doc.setFillColor(255, 255, 255);
          doc.rect(px, py, cellSize, cellSize, 'S');
          doc.setDrawColor(43, 42, 41);
          continue;
        }

        const color = findPaletteColor(brand, colorId);
        if (!color) continue;

        doc.setFillColor(color.rgb[0], color.rgb[1], color.rgb[2]);
        doc.rect(px, py, cellSize, cellSize, 'F');
        doc.rect(px, py, cellSize, cellSize, 'S');

        if (cellSize >= 3.5) {
          const luminance =
            (0.299 * color.rgb[0] + 0.587 * color.rgb[1] + 0.114 * color.rgb[2]) / 255;
          const ink = luminance > 0.6;
          doc.setTextColor(ink ? 43 : 250, ink ? 42 : 250, ink ? 41 : 250);
          doc.setFontSize(Math.max(2.6, Math.min(5, cellSize * 0.4)));
          doc.text(color.code, px + cellSize / 2, py + cellSize / 2 + cellSize * 0.12, {
            align: 'center',
          });
          doc.setTextColor(43, 42, 41);
        }
      }
    }

    // Thicker edges on the sides that butt against another board, so the join
    // direction is obvious without reading the heading.
    doc.setLineWidth(0.5);
    if (tile.col < boardColumns - 1) {
      doc.line(originX + gridWidth, originY, originX + gridWidth, originY + gridHeight);
    }
    if (tile.row < boardRows - 1) {
      doc.line(originX, originY + gridHeight, originX + gridWidth, originY + gridHeight);
    }
    doc.setLineWidth(0.1);
  }
};

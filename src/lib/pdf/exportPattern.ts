import { jsPDF } from 'jspdf';
import { findPaletteColor } from '@/lib/color/palettes';
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

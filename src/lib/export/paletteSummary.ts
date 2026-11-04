export interface PaletteSwatch {
  code: string;
  rgb: [number, number, number];
  count: number;
}

export interface PlacedSwatch {
  swatch: PaletteSwatch;
  /** Offset inside the content area, not the canvas. */
  x: number;
  width: number;
}

export interface PaletteSummaryLayout {
  rows: PlacedSwatch[][];
  height: number;
}

/** (text, fontSize, fontWeight) -> pixel width. Injected so layout is testable. */
export type MeasureText = (text: string, fontSize: number, weight: number) => number;

export const SUMMARY_ROW_HEIGHT = 56;
export const SUMMARY_GAP = 12;
export const SUMMARY_BLOCK_PADDING = 14;
export const SUMMARY_CHIP_SIZE = 40;
export const SUMMARY_CHIP_GAP = 8;
export const SUMMARY_CODE_COUNT_GAP = 12;
export const SUMMARY_MIN_BLOCK = 172;
export const SUMMARY_CODE_FONT = 22;
export const SUMMARY_COUNT_FONT = 20;

const defaultMeasure: MeasureText = (text, fontSize) => text.length * fontSize * 0.58;

const blockWidth = (swatch: PaletteSwatch, measure: MeasureText): number => {
  const codeWidth = measure(swatch.code, SUMMARY_CODE_FONT, 700);
  const countWidth = measure(`×${swatch.count}`, SUMMARY_COUNT_FONT, 400);
  const content =
    SUMMARY_BLOCK_PADDING * 2 +
    SUMMARY_CHIP_SIZE +
    SUMMARY_CHIP_GAP +
    codeWidth +
    SUMMARY_CODE_COUNT_GAP +
    countWidth;
  return Math.max(SUMMARY_MIN_BLOCK, Math.ceil(content));
};

/**
 * Flows swatch cards across lines within `contentWidth`. Widths are measured
 * from real text so a long code like "P109" never overlaps its count.
 */
export const layoutPaletteSummary = (
  swatches: PaletteSwatch[],
  contentWidth: number,
  measure: MeasureText = defaultMeasure,
): PaletteSummaryLayout => {
  const rows: PlacedSwatch[][] = [];
  let current: PlacedSwatch[] = [];
  let cursor = 0;

  for (const swatch of swatches) {
    const width = blockWidth(swatch, measure);

    if (current.length > 0 && cursor + SUMMARY_GAP + width > contentWidth) {
      rows.push(current);
      current = [];
      cursor = 0;
    }

    const x = current.length === 0 ? 0 : cursor + SUMMARY_GAP;
    current.push({ swatch, x, width });
    cursor = x + width;
  }

  if (current.length > 0) rows.push(current);

  const height =
    rows.length === 0
      ? 0
      : rows.length * SUMMARY_ROW_HEIGHT + (rows.length - 1) * SUMMARY_GAP;

  return { rows, height };
};

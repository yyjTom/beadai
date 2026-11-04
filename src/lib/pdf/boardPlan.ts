/** Physical pegboard size the charts are assembled on. */
export const STANDARD_BOARD = 29;

/**
 * Above this many cells per side a single A4 page can no longer show readable
 * colour codes, so the chart is split into board-by-board pages. 50 × 50 fits
 * on one page at roughly 3.7mm per cell — splitting it would only add paper.
 */
export const BOARD_SPLIT_THRESHOLD = 58;

export interface BoardTile {
  /** 1-based, used directly in the "Board 3 of 16" heading. */
  index: number;
  row: number;
  col: number;
  x0: number;
  y0: number;
  width: number;
  height: number;
}

export const needsBoardPlans = (width: number, height: number): boolean =>
  width > BOARD_SPLIT_THRESHOLD || height > BOARD_SPLIT_THRESHOLD;

/**
 * Splits a chart into pegboard-sized tiles. The last column and row are trimmed
 * to the real size so no page prints empty cells.
 */
export const splitBoards = (
  width: number,
  height: number,
  boardSize: number = STANDARD_BOARD,
): BoardTile[] => {
  const columns = Math.ceil(width / boardSize);
  const rows = Math.ceil(height / boardSize);
  const tiles: BoardTile[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x0 = col * boardSize;
      const y0 = row * boardSize;

      tiles.push({
        index: tiles.length + 1,
        row,
        col,
        x0,
        y0,
        width: Math.min(boardSize, width - x0),
        height: Math.min(boardSize, height - y0),
      });
    }
  }

  return tiles;
};

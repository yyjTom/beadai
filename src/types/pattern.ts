export type PaletteBrand = 'perler' | 'artkal';

export interface PaletteColor {
  id: string;
  code: string;
  name: string;
  rgb: [number, number, number];
  brand: PaletteBrand;
}

export type DenoiseLevel = 0 | 1 | 2 | 3;

export interface PatternSettings {
  width: number;
  height: number;
  brand: PaletteBrand;
  denoiseLevel: DenoiseLevel;
}

export interface BeadUsage {
  color: PaletteColor;
  count: number;
}

export interface PatternResult {
  width: number;
  height: number;
  /** Palette ids per cell. Empty cells use the `EMPTY_CELL` sentinel. */
  cells: string[];
  usage: BeadUsage[];
  totalBeads: number;
  distinctColors: number;
}

export type PatternSwapMap = Record<string, string>;

export interface PatternHistoryEntry {
  id: string;
  title: string;
  source: 'upload' | 'ai';
  createdAt: number;
  width: number;
  height: number;
  brand: PaletteBrand;
  denoiseLevel: DenoiseLevel;
  totalBeads: number;
  thumbnail: string;
  cells: string[];
  swapMap: PatternSwapMap;
  usage: BeadUsage[];
}

export const EMPTY_CELL = '__empty__';

export const GRID_PRESETS = [
  {
    key: 'standard',
    width: 50,
    height: 50,
    label: '50 × 50',
    hint: 'Free · four standard pegboards.',
  },
  {
    key: 'wall',
    width: 116,
    height: 116,
    label: '116 × 116',
    hint: 'Free · poster scale, sixteen pegboards.',
  },
] as const;

/** Board size a new session starts on. 50 × 50 reads a subject without a wall. */
export const DEFAULT_GRID = 50;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const estimatePegboards = (width: number, height: number): number =>
  Math.max(1, Math.ceil(width / 29) * Math.ceil(height / 29));

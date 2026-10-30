import { getPaletteIndex, matchRgbToPalette } from '@/lib/color/match';
import { denoiseCells } from '@/lib/color/denoise';
import { computeUsage } from '@/lib/color/swap';
import { rgbToLab, type Lab } from '@/lib/color/lab';
import { downsampleToGrid, type DownsampledCell, type RgbaSource } from '@/lib/pattern/downsample';
import { EMPTY_CELL, type DenoiseLevel, type PatternResult } from '@/types/pattern';
import type { PaletteBrand, PaletteColor } from '@/types/pattern';

export interface GeneratePatternInput {
  source: RgbaSource;
  width: number;
  height: number;
  brand: PaletteBrand;
  denoiseLevel: DenoiseLevel;
  /** Turn the dominant border colour (and shades of it) into empty cells. */
  removeBackground?: boolean;
}

/** Cluster count ceiling: enough for photo shading, few enough to kill noise. */
const QUANT_CLUSTERS = 16;
const KMEANS_ITERATIONS = 4;
const OUTLIER_DELTA = 20;

const EDGE_BACKGROUND_SHARE = 0.4;
const BACKGROUND_DELTA = 12;

const dist2 = (a: Lab, b: Lab): number =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

const nearestBead = (lab: Lab, brand: PaletteBrand): PaletteColor => {
  const { colors, labs } = getPaletteIndex(brand);

  let best = 0;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let i = 0; i < labs.length; i += 1) {
    const delta = dist2(lab, labs[i]);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  }
  return colors[best];
};

interface FrequencyEntry {
  r: number;
  g: number;
  b: number;
  n: number;
}

const frequencyTop = (
  values: Iterable<DownsampledCell>,
  limit: number,
  shift: number,
): FrequencyEntry[] => {
  const freq = new Map<number, FrequencyEntry>();

  for (const cell of values) {
    const key =
      ((cell.r >> shift) << (8 - shift * 2)) |
      ((cell.g >> shift) << (8 - shift)) |
      (cell.b >> shift);
    const entry = freq.get(key);
    if (entry) {
      entry.r += cell.r;
      entry.g += cell.g;
      entry.b += cell.b;
      entry.n += 1;
    } else {
      freq.set(key, { r: cell.r, g: cell.g, b: cell.b, n: 1 });
    }
  }

  return [...freq.values()].sort((a, b) => b.n - a.n).slice(0, limit);
};

/**
 * Global quantisation step. Matching every cell against the palette on its own
 * lets near-identical shades (noisy cream backgrounds, JPEG halos) hop between
 * white, cream and sand beads. Clustering the sampled cells first means one
 * shade of noise always lands on one bead colour, while outlier cells — small
 * high-contrast details — still match the palette individually.
 */
const quantizeCellBeads = (
  cells: DownsampledCell[],
  brand: PaletteBrand,
): (PaletteColor | null)[] => {
  const fallback = cells.map((cell) =>
    cell.empty ? null : matchRgbToPalette(cell.r, cell.g, cell.b, brand),
  );

  const filled = cells.filter((cell) => !cell.empty);
  if (filled.length <= QUANT_CLUSTERS) return fallback;

  const labs: (Lab | null)[] = cells.map((cell) =>
    cell.empty ? null : rgbToLab(cell.r, cell.g, cell.b),
  );

  let centers: Lab[] = frequencyTop(filled, QUANT_CLUSTERS, 4).map((entry) =>
    rgbToLab(Math.round(entry.r / entry.n), Math.round(entry.g / entry.n), Math.round(entry.b / entry.n)),
  );
  if (centers.length === 0) return fallback;

  for (let iteration = 0; iteration < KMEANS_ITERATIONS; iteration += 1) {
    const sums = centers.map(() => [0, 0, 0, 0]);

    for (let index = 0; index < cells.length; index += 1) {
      const lab = labs[index];
      if (!lab) continue;

      let best = 0;
      let bestDelta = Number.POSITIVE_INFINITY;
      for (let c = 0; c < centers.length; c += 1) {
        const delta = dist2(lab, centers[c]);
        if (delta < bestDelta) {
          bestDelta = delta;
          best = c;
        }
      }

      const sum = sums[best];
      sum[0] += lab[0];
      sum[1] += lab[1];
      sum[2] += lab[2];
      sum[3] += 1;
    }

    centers = centers.map(
      (center, c) =>
        (sums[c][3] > 0
          ? [sums[c][0] / sums[c][3], sums[c][1] / sums[c][3], sums[c][2] / sums[c][3]]
          : center) as Lab,
    );
  }

  const clusterBeads = centers.map((center) => nearestBead(center, brand));
  const outlierSquared = OUTLIER_DELTA * OUTLIER_DELTA;

  return cells.map((cell, index) => {
    const lab = labs[index];
    if (cell.empty || !lab) return null;

    let best = 0;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (let c = 0; c < centers.length; c += 1) {
      const delta = dist2(lab, centers[c]);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = c;
      }
    }

    // Detail the clusters cannot represent keeps its own palette match.
    if (bestDelta > outlierSquared) return fallback[index];
    return clusterBeads[best];
  });
};

/**
 * The background of flat artwork is whatever colour owns the border. Only
 * reported when it clearly dominates, so photos never lose their edges.
 */
const detectBackground = (
  cells: DownsampledCell[],
  width: number,
  height: number,
): Lab | null => {
  const edge: DownsampledCell[] = [];

  for (let x = 0; x < width; x += 1) {
    edge.push(cells[x], cells[(height - 1) * width + x]);
  }
  for (let y = 1; y < height - 1; y += 1) {
    edge.push(cells[y * width], cells[y * width + width - 1]);
  }

  const filled = edge.filter((cell) => !cell.empty);
  if (filled.length === 0) return null;

  const dominant = frequencyTop(filled, 1, 3)[0];
  if (!dominant || dominant.n / filled.length < EDGE_BACKGROUND_SHARE) return null;

  return rgbToLab(
    Math.round(dominant.r / dominant.n),
    Math.round(dominant.g / dominant.n),
    Math.round(dominant.b / dominant.n),
  );
};

export const generatePattern = (input: GeneratePatternInput): PatternResult => {
  const { source, width, height, brand, denoiseLevel } = input;

  const sampled = downsampleToGrid(source, width, height);

  let masked = sampled;
  if (input.removeBackground) {
    const background = detectBackground(sampled, width, height);
    if (background) {
      const threshold = BACKGROUND_DELTA * BACKGROUND_DELTA;
      masked = sampled.map((cell) => {
        if (cell.empty) return cell;
        const lab = rgbToLab(cell.r, cell.g, cell.b);
        return dist2(lab, background) < threshold
          ? { r: 255, g: 255, b: 255, empty: true }
          : cell;
      });
    }
  }

  const beads = quantizeCellBeads(masked, brand);
  const cells = beads.map((bead) => (bead ? bead.id : EMPTY_CELL));

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

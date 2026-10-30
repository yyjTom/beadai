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
  /** Crop flat backdrops away so small boards spend every cell on the subject. */
  autoCrop?: boolean;
}

/** Cluster count ceiling: enough for photo shading, few enough to kill noise. */
const QUANT_CLUSTERS = 16;
const KMEANS_ITERATIONS = 4;
const OUTLIER_DELTA = 20;

const EDGE_BACKGROUND_SHARE = 0.4;
const BACKGROUND_DELTA = 12;
const ALPHA_VISIBLE = 24;

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

const CROP_PADDING_RATIO = 0.06;
/** Squared RGB distance at which a pixel counts as subject, not backdrop. */
const SUBJECT_PIXEL_DISTANCE = 42;
const BORDER_DOMINANT_SHARE = 0.5;

interface RgbPoint {
  r: number;
  g: number;
  b: number;
}

/**
 * Flat illustrations usually sit on a large plain backdrop (AI generators love
 * a cream circle). At 29 × 29 that backdrop eats most of the board, so the
 * subject gets a few dozen cells and turns to mush. Cropping to the subject's
 * bounding box gives every cell back to the artwork. Photos without a plain
 * border are returned untouched.
 */
const cropToSubject = (source: RgbaSource): RgbaSource => {
  const { data, width, height } = source;

  const freq = new Map<number, FrequencyEntry>();
  let borderSamples = 0;
  const sampleBorder = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    if (data[index + 3] < ALPHA_VISIBLE) return;
    borderSamples += 1;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const entry = freq.get(key);
    if (entry) {
      entry.r += r;
      entry.g += g;
      entry.b += b;
      entry.n += 1;
    } else {
      freq.set(key, { r, g, b, n: 1 });
    }
  };

  const step = Math.max(1, Math.floor(Math.min(width, height) / 64));
  for (let x = 0; x < width; x += step) {
    sampleBorder(x, 0);
    sampleBorder(x, height - 1);
  }
  for (let y = 0; y < height; y += step) {
    sampleBorder(0, y);
    sampleBorder(width - 1, y);
  }

  if (borderSamples === 0) return source;

  // Average border colour, then check how tightly the border hugs it. Bucket
  // voting is too brittle here: ±6 of sensor noise spans several 8-level bins.
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (const entry of freq.values()) {
    sumR += entry.r;
    sumG += entry.g;
    sumB += entry.b;
  }
  const mean: RgbPoint = { r: sumR / borderSamples, g: sumG / borderSamples, b: sumB / borderSamples };

  let nearMean = 0;
  for (const entry of freq.values()) {
    const dr = entry.r / entry.n - mean.r;
    const dg = entry.g / entry.n - mean.g;
    const db = entry.b / entry.n - mean.b;
    if (dr * dr + dg * dg + db * db <= SUBJECT_PIXEL_DISTANCE * SUBJECT_PIXEL_DISTANCE) {
      nearMean += entry.n;
    }
  }
  if (nearMean / borderSamples < BORDER_DOMINANT_SHARE) return source;

  const background = mean;
  const threshold = SUBJECT_PIXEL_DISTANCE * SUBJECT_PIXEL_DISTANCE;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (data[index + 3] < ALPHA_VISIBLE) continue;

      const dr = data[index] - background.r;
      const dg = data[index + 1] - background.g;
      const db = data[index + 2] - background.b;
      if (dr * dr + dg * dg + db * db <= threshold) continue;

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) return source;

  const padX = Math.round((maxX - minX) * CROP_PADDING_RATIO);
  const padY = Math.round((maxY - minY) * CROP_PADDING_RATIO);
  const x0 = Math.max(0, minX - padX);
  const y0 = Math.max(0, minY - padY);
  const x1 = Math.min(width - 1, maxX + padX);
  const y1 = Math.min(height - 1, maxY + padY);

  const cropWidth = x1 - x0 + 1;
  const cropHeight = y1 - y0 + 1;
  if (cropWidth >= width && cropHeight >= height && cropWidth === cropHeight) return source;

  const cropped = new Uint8ClampedArray(cropWidth * cropHeight * 4);
  for (let y = 0; y < cropHeight; y += 1) {
    const sourceRow = ((y0 + y) * width + x0) * 4;
    cropped.set(data.subarray(sourceRow, sourceRow + cropWidth * 4), y * cropWidth * 4);
  }

  if (cropWidth === cropHeight) return { width: cropWidth, height: cropHeight, data: cropped };

  // Boards are square, so a wide crop would have been stretched. Pad the short
  // side with the backdrop colour and keep the subject's real proportions.
  const side = Math.max(cropWidth, cropHeight);
  const squared = new Uint8ClampedArray(side * side * 4);
  const fill = [Math.round(background.r), Math.round(background.g), Math.round(background.b), 255];
  for (let index = 0; index < side * side; index += 1) {
    squared.set(fill, index * 4);
  }

  const offsetX = Math.floor((side - cropWidth) / 2);
  const offsetY = Math.floor((side - cropHeight) / 2);
  for (let y = 0; y < cropHeight; y += 1) {
    const from = y * cropWidth * 4;
    squared.set(cropped.subarray(from, from + cropWidth * 4), ((y + offsetY) * side + offsetX) * 4);
  }

  return { width: side, height: side, data: squared };
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
  const { width, height, brand, denoiseLevel } = input;

  // Crop first: the background detector and every cell then see the subject.
  const source = input.autoCrop ? cropToSubject(input.source) : input.source;
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

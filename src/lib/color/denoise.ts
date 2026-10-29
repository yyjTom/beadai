import type { DenoiseLevel } from '@/types/pattern';

export interface DenoiseProfile {
  level: DenoiseLevel;
  label: string;
  description: string;
  blobThreshold: number;
  passes: number;
}

export const DENOISE_PROFILES: Record<DenoiseLevel, DenoiseProfile> = {
  0: {
    level: 0,
    label: 'Off',
    description: 'Keep every matched bead exactly as the image sampled it.',
    blobThreshold: 0,
    passes: 0,
  },
  1: {
    level: 1,
    label: 'Light',
    description: 'Removes lone stray beads so a colour never stands alone.',
    blobThreshold: 1,
    passes: 1,
  },
  2: {
    level: 2,
    label: 'Balanced',
    description: 'Merges stray beads and tiny 2-bead flecks into solid blocks.',
    blobThreshold: 2,
    passes: 2,
  },
  3: {
    level: 3,
    label: 'Strong',
    description: 'Best for photos: clears small speckles until blocks are easy to place.',
    blobThreshold: 4,
    passes: 3,
  },
};

const NEIGHBORS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

const neighborCounts = (cells: string[], width: number, height: number, index: number): Map<string, number> => {
  const x = index % width;
  const y = Math.floor(index / width);
  const counts = new Map<string, number>();

  for (const [dx, dy] of NEIGHBORS) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    const neighborIndex = ny * width + nx;
    const value = cells[neighborIndex];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
};

const dominantNeighbor = (cells: string[], width: number, height: number, index: number): string | null => {
  const counts = neighborCounts(cells, width, height, index);
  let best: string | null = null;
  let bestCount = 0;

  for (const [value, count] of counts) {
    if (count > bestCount || (count === bestCount && best !== null && value < best)) {
      best = value;
      bestCount = count;
    }
  }

  return bestCount > 0 ? best : null;
};

const componentSizes = (
  cells: string[],
  width: number,
  height: number,
): { sizes: number[]; owner: Int32Array } => {
  const total = width * height;
  const owner = new Int32Array(total).fill(-1);
  const sizes: number[] = [];

  const stack: number[] = [];

  for (let start = 0; start < total; start += 1) {
    if (owner[start] !== -1) continue;

    const value = cells[start];
    const id = sizes.length;
    let size = 0;
    stack.push(start);
    owner[start] = id;

    while (stack.length > 0) {
      const index = stack.pop() as number;
      size += 1;
      const x = index % width;
      const y = Math.floor(index / width);

      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const neighborIndex = ny * width + nx;
        if (owner[neighborIndex] !== -1 || cells[neighborIndex] !== value) continue;
        owner[neighborIndex] = id;
        stack.push(neighborIndex);
      }
    }

    sizes.push(size);
  }

  return { sizes, owner };
};

/**
 * Deterministic denoiser: isolated cells are replaced by the dominant neighbour
 * colour, then small connected components are absorbed into their strongest
 * neighbour block. Identical input always produces identical output.
 */
export const denoiseCells = (
  input: string[],
  width: number,
  height: number,
  level: DenoiseLevel,
): string[] => {
  const profile = DENOISE_PROFILES[level];
  if (profile.passes === 0) return input.slice();

  let cells = input.slice();
  const total = width * height;

  for (let pass = 0; pass < profile.passes; pass += 1) {
    for (let index = 0; index < total; index += 1) {
      const counts = neighborCounts(cells, width, height, index);
      const ownColor = cells[index];
      if ((counts.get(ownColor) ?? 0) > 0) continue;
      const replacement = dominantNeighbor(cells, width, height, index);
      if (replacement && replacement !== ownColor) {
        cells[index] = replacement;
      }
    }

    if (profile.blobThreshold <= 1) continue;

    const { sizes, owner } = componentSizes(cells, width, height);

    for (let index = 0; index < total; index += 1) {
      const componentId = owner[index];
      if (componentId < 0) continue;
      if (sizes[componentId] > profile.blobThreshold) continue;

      const replacement = dominantNeighbor(cells, width, height, index);
      if (replacement && replacement !== cells[index]) {
        cells[index] = replacement;
      }
    }
  }

  return cells;
};

export const DENOISE_LEVELS: DenoiseLevel[] = [0, 1, 2, 3];

export interface RgbaSource {
  width: number;
  height: number;
  /** RGBA bytes, length = width * height * 4. */
  data: Uint8ClampedArray;
}

export interface DownsampledCell {
  r: number;
  g: number;
  b: number;
  empty: boolean;
}

const ALPHA_EMPTY_THRESHOLD = 24;

/** 8 levels per channel: absorbs AI noise / JPEG artefacts inside one bucket. */
const BUCKET_SHIFT = 5;

const bucketKey = (r: number, g: number, b: number): number =>
  ((r >> BUCKET_SHIFT) << 10) | ((g >> BUCKET_SHIFT) << 5) | (b >> BUCKET_SHIFT);

interface Bucket {
  r: number;
  g: number;
  b: number;
  n: number;
}

/**
 * Dominant-colour downsample. Each cell quantises its pixels into coarse
 * buckets; when one colour holds at least half the cell, that bucket's own
 * average becomes the bead colour instead of the blend of everything inside.
 *
 * Plain averaging turns a flat watermark-red into a muddy brick because white
 * highlights and background bleed into every cell, and it lets a lightly noisy
 * background scatter across near-identical bead shades. Dominant sampling keeps
 * flat artwork flat while photos (where no colour dominates) still get the
 * blend behaviour.
 */
export const downsampleToGrid = (
  source: RgbaSource,
  targetWidth: number,
  targetHeight: number,
): DownsampledCell[] => {
  const cells: DownsampledCell[] = new Array(targetWidth * targetHeight);
  const { data, width, height } = source;

  for (let ty = 0; ty < targetHeight; ty += 1) {
    const yStart = Math.floor((ty * height) / targetHeight);
    const yEnd = Math.max(yStart + 1, Math.floor(((ty + 1) * height) / targetHeight));

    for (let tx = 0; tx < targetWidth; tx += 1) {
      const xStart = Math.floor((tx * width) / targetWidth);
      const xEnd = Math.max(xStart + 1, Math.floor(((tx + 1) * width) / targetWidth));

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let sumA = 0;
      let samples = 0;
      const buckets = new Map<number, Bucket>();

      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];

          sumR += r;
          sumG += g;
          sumB += b;
          sumA += data[index + 3];
          samples += 1;

          const key = bucketKey(r, g, b);
          const bucket = buckets.get(key);
          if (bucket) {
            bucket.r += r;
            bucket.g += g;
            bucket.b += b;
            bucket.n += 1;
          } else {
            buckets.set(key, { r, g, b, n: 1 });
          }
        }
      }

      if (samples === 0 || sumA / samples < ALPHA_EMPTY_THRESHOLD) {
        cells[ty * targetWidth + tx] = { r: 255, g: 255, b: 255, empty: true };
        continue;
      }

      let dominant: Bucket | null = null;
      for (const bucket of buckets.values()) {
        if (!dominant || bucket.n > dominant.n) dominant = bucket;
      }

      cells[ty * targetWidth + tx] =
        dominant && dominant.n / samples >= 0.5
          ? {
              r: Math.round(dominant.r / dominant.n),
              g: Math.round(dominant.g / dominant.n),
              b: Math.round(dominant.b / dominant.n),
              empty: false,
            }
          : {
              r: Math.round(sumR / samples),
              g: Math.round(sumG / samples),
              b: Math.round(sumB / samples),
              empty: false,
            };
    }
  }

  return cells;
};

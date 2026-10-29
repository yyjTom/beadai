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

/**
 * Box-average downsample. Averaging (instead of nearest neighbour) keeps smooth
 * gradients readable and avoids aliasing when a large photo becomes 29 beads.
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

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let samples = 0;

      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          const index = (y * width + x) * 4;
          const alpha = data[index + 3];
          r += data[index];
          g += data[index + 1];
          b += data[index + 2];
          a += alpha;
          samples += 1;
        }
      }

      const avgAlpha = samples > 0 ? a / samples : 0;
      const isEmpty = avgAlpha < ALPHA_EMPTY_THRESHOLD;

      cells[ty * targetWidth + tx] = isEmpty
        ? { r: 255, g: 255, b: 255, empty: true }
        : {
            r: Math.round(r / samples),
            g: Math.round(g / samples),
            b: Math.round(b / samples),
            empty: false,
          };
    }
  }

  return cells;
};

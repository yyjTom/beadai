export type ColorFamily = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'neutral';

type Rgb = [number, number, number];

const toHsl = (rgb: Rgb): { h: number; s: number; l: number } => {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const spread = max - min;

  if (spread === 0) return { h: 0, s: 0, l: lightness };

  const saturation = lightness > 0.5 ? spread / (2 - max - min) : spread / (max + min);

  let hue: number;
  if (max === r) hue = ((g - b) / spread) % 6;
  else if (max === g) hue = (b - r) / spread + 2;
  else hue = (r - g) / spread + 4;

  hue *= 60;
  if (hue < 0) hue += 360;

  return { h: hue, s: saturation, l: lightness };
};

/**
 * Buckets a bead colour into the family a shopper would look in. Near-greyscale
 * and near-black/white shades go to `neutral` regardless of hue, because their
 * hue is numerically unstable and visually meaningless.
 */
export const colorFamily = (rgb: Rgb): ColorFamily => {
  const { h, s, l } = toHsl(rgb);

  if (s < 0.12 || l < 0.1 || l > 0.94) return 'neutral';

  if (h >= 290 || h < 15) return 'red';
  if (h < 45) return 'orange';
  if (h < 70) return 'yellow';
  if (h < 170) return 'green';
  if (h < 260) return 'blue';
  return 'purple';
};

export const COLOR_FAMILY_ORDER: ColorFamily[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'neutral',
];

export const COLOR_FAMILY_LABELS: Record<ColorFamily, string> = {
  red: 'Reds',
  orange: 'Oranges',
  yellow: 'Yellows',
  green: 'Greens',
  blue: 'Blues',
  purple: 'Purples',
  neutral: 'Neutrals',
};

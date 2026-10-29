export type Lab = [number, number, number];

export const rgbToLab = (r: number, g: number, b: number): Lab => {
  const sr = r / 255;
  const sg = g / 255;
  const sb = b / 255;

  const lr = sr > 0.04045 ? Math.pow((sr + 0.055) / 1.055, 2.4) : sr / 12.92;
  const lg = sg > 0.04045 ? Math.pow((sg + 0.055) / 1.055, 2.4) : sg / 12.92;
  const lb = sb > 0.04045 ? Math.pow((sb + 0.055) / 1.055, 2.4) : sb / 12.92;

  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) * 100;
  const y = (lr * 0.2126 + lg * 0.7152 + lb * 0.0722) * 100;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) * 100;

  const xn = x / 95.047;
  const yn = y / 100;
  const zn = z / 108.883;

  const fx = xn > 0.008856 ? Math.cbrt(xn) : 7.787 * xn + 16 / 116;
  const fy = yn > 0.008856 ? Math.cbrt(yn) : 7.787 * yn + 16 / 116;
  const fz = zn > 0.008856 ? Math.cbrt(zn) : 7.787 * zn + 16 / 116;

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};

/** CIE76: fast and stable for plastic bead perception. */
export const deltaE76 = (a: Lab, b: Lab): number =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

/** CIEDE2000: available behind the same interface for higher perceptual accuracy. */
export const deltaE2000 = (a: Lab, b: Lab): number => {
  const [l1, a1, b1] = a;
  const [l2, a2, b2] = b;

  const c1 = Math.sqrt(a1 * a1 + b1 * b1);
  const c2 = Math.sqrt(a2 * a2 + b2 * b2);
  const cBar = (c1 + c2) / 2;

  const g = 0.5 * (1 - Math.sqrt(cBar ** 7 / (cBar ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + g);
  const a2p = a2 * (1 + g);

  const c1p = Math.sqrt(a1p * a1p + b1 * b1);
  const c2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = (Math.atan2(b1, a1p) * 180) / Math.PI;
  const h2p = (Math.atan2(b2, a2p) * 180) / Math.PI;
  const h1 = h1p < 0 ? h1p + 360 : h1p;
  const h2 = h2p < 0 ? h2p + 360 : h2p;

  const dL = l2 - l1;
  const dC = c2p - c1p;

  let dh = 0;
  if (c1p * c2p !== 0) {
    const diff = h2 - h1;
    if (Math.abs(diff) <= 180) dh = diff;
    else if (diff > 180) dh = diff - 360;
    else dh = diff + 360;
  }

  const dH = 2 * Math.sqrt(c1p * c2p) * Math.sin((dh * Math.PI) / 360);

  const lBar = (l1 + l2) / 2;
  const cBarP = (c1p + c2p) / 2;

  let hBar = h1 + h2;
  if (c1p * c2p !== 0) {
    if (Math.abs(h1 - h2) > 180) hBar = h1 + h2 + 360;
    hBar /= 2;
  }

  const t =
    1 -
    0.17 * Math.cos(((hBar - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * hBar * Math.PI) / 180) +
    0.32 * Math.cos(((3 * hBar + 6) * Math.PI) / 180) -
    0.2 * Math.cos(((4 * hBar - 63) * Math.PI) / 180);

  const dTheta = 30 * Math.exp(-(((hBar - 275) / 25) ** 2));
  const rC = 2 * Math.sqrt(cBarP ** 7 / (cBarP ** 7 + 25 ** 7));
  const sL = 1 + (0.015 * (lBar - 50) ** 2) / Math.sqrt(20 + (lBar - 50) ** 2);
  const sC = 1 + 0.045 * cBarP;
  const sH = 1 + 0.015 * cBarP * t;
  const rT = -Math.sin((2 * dTheta * Math.PI) / 180) * rC;

  return Math.sqrt(
    (dL / sL) ** 2 + (dC / sC) ** 2 + (dH / sH) ** 2 + rT * (dC / sC) * (dH / sH),
  );
};

export type DeltaFormula = 'cie76' | 'ciede2000';

export const deltaE = (a: Lab, b: Lab, formula: DeltaFormula = 'cie76'): number =>
  formula === 'ciede2000' ? deltaE2000(a, b) : deltaE76(a, b);

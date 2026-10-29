import type { PaletteBrand, PatternResult } from '@/types/pattern';

/**
 * Stable fingerprint for a generated pattern. The server never sees the image or the
 * grid, so the client derives a hash from the resolved cells and we record that hash
 * when a one-time unlock is purchased.
 */
export const hashPattern = async (
  pattern: PatternResult,
  brand: PaletteBrand,
): Promise<string> => {
  const fingerprint = `${pattern.width}x${pattern.height}|${brand}|${pattern.cells.join('')}`;
  const bytes = new TextEncoder().encode(fingerprint);

  if (!globalThis.crypto?.subtle) return '';

  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

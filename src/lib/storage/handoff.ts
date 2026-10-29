const HANDOFF_KEY = 'beadai.handoff.image';
const MAX_EDGE = 640;
const MAX_STORED_CHARS = 1_500_000;

/**
 * Shrinks a data URL so it comfortably fits in sessionStorage.
 * The pattern engine downsamples anyway, so quality loss here is irrelevant.
 */
const downscale = async (dataUrl: string): Promise<string> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('Could not decode image for handoff.'));
    element.src = dataUrl;
  });

  const longestEdge = Math.max(image.width, image.height);
  const scale = Math.min(1, MAX_EDGE / longestEdge);

  if (scale === 1 && dataUrl.length <= MAX_STORED_CHARS) return dataUrl;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  if (!context) return dataUrl;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
};

/**
 * Caches the source image so /studio can pick it up without a second upload.
 * Returns false when the browser refuses (private mode, quota) — callers must degrade quietly.
 */
export const cacheHandoffImage = async (dataUrl: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  try {
    const compact = await downscale(dataUrl);
    window.sessionStorage.setItem(HANDOFF_KEY, compact);
    return true;
  } catch {
    return false;
  }
};

/** Reads and removes the cached handoff image. */
export const takeHandoffImage = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.sessionStorage.getItem(HANDOFF_KEY);
    if (value) window.sessionStorage.removeItem(HANDOFF_KEY);
    return value;
  } catch {
    return null;
  }
};

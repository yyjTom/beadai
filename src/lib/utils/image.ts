import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from '@/types/pattern';

export interface LoadedImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  sourceUrl: string;
}

export class ImageValidationError extends Error {}

export const validateImageFile = (file: File): void => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageValidationError('Please upload a PNG, JPG or WEBP image.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError('Images must be 10MB or smaller.');
  }
};

const MAX_SOURCE_PIXELS = 40_000_000;

/**
 * Longest edge of the preview copy of the photo. Encoding a 10MP source as PNG
 * blocks the main thread for about a second; the pattern itself is still built
 * from the full-resolution pixels below.
 */
const PREVIEW_MAX_EDGE = 1024;

const encodePreview = (source: HTMLCanvasElement, width: number, height: number): string => {
  const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(width, height));
  const previewWidth = Math.max(1, Math.round(width * scale));
  const previewHeight = Math.max(1, Math.round(height * scale));

  if (previewWidth === width && previewHeight === height) {
    return source.toDataURL('image/png');
  }

  const preview = document.createElement('canvas');
  preview.width = previewWidth;
  preview.height = previewHeight;

  const context = preview.getContext('2d');
  if (!context) return source.toDataURL('image/png');

  // JPEG has no alpha channel; without a base coat, transparent PNGs go black.
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, previewWidth, previewHeight);
  context.drawImage(source, 0, 0, previewWidth, previewHeight);

  return preview.toDataURL('image/jpeg', 0.9);
};

export const loadImageData = async (file: File): Promise<LoadedImage> => {
  validateImageFile(file);

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  if (width * height > MAX_SOURCE_PIXELS) {
    bitmap.close?.();
    throw new ImageValidationError('That image is too large to process safely.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    bitmap.close?.();
    throw new ImageValidationError('Your browser blocked canvas access for this image.');
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const imageData = context.getImageData(0, 0, width, height);

  return {
    width,
    height,
    data: imageData.data,
    sourceUrl: encodePreview(canvas, width, height),
  };
};

export const loadImageDataFromUrl = async (url: string): Promise<LoadedImage> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ImageValidationError('We could not read the generated image.');
  }

  const blob = await response.blob();
  const file = new File([blob], 'ai-image.png', { type: blob.type || 'image/png' });
  return loadImageData(file);
};

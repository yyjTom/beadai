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
    sourceUrl: canvas.toDataURL('image/png'),
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

import { env } from '@/lib/env';
import { togetherProvider } from '@/lib/ai/together';
import type { ImageProvider } from '@/types/ai';

/**
 * Returns the configured provider. The UI never imports a vendor directly, so
 * swapping Together AI for another host stays a single-file change.
 */
export const getImageProvider = (): ImageProvider | null => {
  if (!env.togetherApiKey) return null;
  return togetherProvider;
};

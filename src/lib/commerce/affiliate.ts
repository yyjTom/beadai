import { env } from '@/lib/env';
import type { PaletteColor } from '@/types/pattern';

export interface PurchaseLink {
  url: string;
  label: string;
  configured: boolean;
}

/**
 * Builds a shopping link from configuration only. When no affiliate tag is
 * configured the UI shows a disabled state instead of guessing a store URL.
 */
export const buildPurchaseLink = (color: PaletteColor): PurchaseLink => {
  const query = `${color.brand} beads ${color.code} ${color.name}`;
  const encoded = encodeURIComponent(query);

  if (!env.affiliateTag) {
    return {
      url: '',
      label: 'Configure affiliate links',
      configured: false,
    };
  }

  const base = env.affiliateBaseUrl.includes('{code}')
    ? env.affiliateBaseUrl.replace('{code}', encoded)
    : `${env.affiliateBaseUrl}${env.affiliateBaseUrl.includes('?') ? '&' : '?'}k=${encoded}`;

  const url = `${base}${base.includes('?') ? '&' : '?'}tag=${env.affiliateTag}`;

  return { url, label: 'Buy this colour', configured: true };
};

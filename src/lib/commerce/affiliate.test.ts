import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaletteColor } from '@/types/pattern';

const color: PaletteColor = {
  id: 'perler-white',
  code: '01',
  name: 'White',
  rgb: [255, 255, 255],
  brand: 'perler',
};

const loadAffiliate = async (tag: string | undefined) => {
  vi.resetModules();
  if (tag) process.env.AMAZON_ASSOCIATES_TAG = tag;
  else delete process.env.AMAZON_ASSOCIATES_TAG;
  return import('./affiliate');
};

describe('buildPurchaseLink', () => {
  const originalTag = process.env.AMAZON_ASSOCIATES_TAG;

  beforeEach(() => {
    delete process.env.AMAZON_ASSOCIATES_TAG;
  });

  afterEach(() => {
    if (originalTag) process.env.AMAZON_ASSOCIATES_TAG = originalTag;
    else delete process.env.AMAZON_ASSOCIATES_TAG;
  });

  it('reports itself unconfigured without a tag', async () => {
    const { buildPurchaseLink } = await loadAffiliate(undefined);
    const link = buildPurchaseLink(color);

    expect(link.configured).toBe(false);
    expect(link.url).toBe('');
  });

  it('builds a tagged search url when a tag is set', async () => {
    const { buildPurchaseLink } = await loadAffiliate('beadai-20');
    const link = buildPurchaseLink(color);

    expect(link.configured).toBe(true);
    expect(link.url).toContain('tag=beadai-20');
    expect(link.url).toContain(encodeURIComponent('perler beads 01 White'));
  });

  it('appends the tag with & when the base url already has a query', async () => {
    vi.resetModules();
    process.env.AMAZON_ASSOCIATES_TAG = 'beadai-20';
    process.env.AFFILIATE_BASE_URL = 'https://example.com/search?ref=beadai';
    const { buildPurchaseLink } = await import('./affiliate');

    expect(buildPurchaseLink(color).url).toContain('&tag=beadai-20');
    delete process.env.AFFILIATE_BASE_URL;
  });
});

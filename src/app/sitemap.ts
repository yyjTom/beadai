import type { MetadataRoute } from 'next';
import { canonicalUrl } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: canonicalUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: canonicalUrl('/studio'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: canonicalUrl('/pricing'), lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: canonicalUrl('/faq'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: canonicalUrl('/login'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}

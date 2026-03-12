import type { MetadataRoute } from 'next';

import { getCollections, getPublicCities } from '@/lib/catalog/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  ['en', 'it'].forEach((locale) => {
    entries.push({ url: `http://localhost:3000/${locale}` });
    getPublicCities().forEach((city) => {
      entries.push({ url: `http://localhost:3000/${locale}/${city.slug}` });
      entries.push({ url: `http://localhost:3000/${locale}/${city.slug}/classes` });
      getCollections(city.slug).forEach((collection) => {
        entries.push({ url: `http://localhost:3000/${locale}/${city.slug}/collections/${collection.slug}` });
      });
    });
  });

  return entries;
}

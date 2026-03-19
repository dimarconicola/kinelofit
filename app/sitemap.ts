import type { MetadataRoute } from 'next';

import { getCollections, getPublicCities } from '@/lib/catalog/server-data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const cities = await getPublicCities();

  for (const locale of ['en', 'it']) {
    entries.push({ url: `http://localhost:3000/${locale}` });
    entries.push({ url: `http://localhost:3000/${locale}/who-we-are` });
    entries.push({ url: `http://localhost:3000/${locale}/suggest-calendar` });
    for (const city of cities) {
      entries.push({ url: `http://localhost:3000/${locale}/${city.slug}` });
      entries.push({ url: `http://localhost:3000/${locale}/${city.slug}/classes` });
      const collections = await getCollections(city.slug);
      collections.forEach((collection) => {
        entries.push({ url: `http://localhost:3000/${locale}/${city.slug}/collections/${collection.slug}` });
      });
    }
  }

  return entries;
}

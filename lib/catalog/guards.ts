import { notFound } from 'next/navigation';

import { getCity } from '@/lib/catalog/data';

export const requirePublicCity = (citySlug: string) => {
  const city = getCity(citySlug);
  if (!city || city.status !== 'public') {
    notFound();
  }
  return city;
};

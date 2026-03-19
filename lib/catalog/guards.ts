import { notFound } from 'next/navigation';

import { getCity } from '@/lib/catalog/data';
import { getCity as getServerCity } from '@/lib/catalog/server-data';

export const requirePublicCity = (citySlug: string) => {
  const city = getCity(citySlug);
  if (!city || city.status !== 'public') {
    notFound();
  }
  return city;
};

export const requirePublicCityServer = async (citySlug: string) => {
  const city = await getServerCity(citySlug);
  if (!city || city.status !== 'public') {
    notFound();
  }
  return city;
};

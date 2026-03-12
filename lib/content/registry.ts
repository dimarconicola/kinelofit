import type { Locale } from '@/lib/catalog/types';

import EnglishSpeakingEn from '@/content/collections/palermo/english-speaking-classes.en.mdx';
import EnglishSpeakingIt from '@/content/collections/palermo/english-speaking-classes.it.mdx';
import NewThisWeekEn from '@/content/collections/palermo/new-this-week.en.mdx';
import NewThisWeekIt from '@/content/collections/palermo/new-this-week.it.mdx';
import TodayNearbyEn from '@/content/collections/palermo/today-nearby.en.mdx';
import TodayNearbyIt from '@/content/collections/palermo/today-nearby.it.mdx';

const registry = {
  palermo: {
    'today-nearby': { en: TodayNearbyEn, it: TodayNearbyIt },
    'new-this-week': { en: NewThisWeekEn, it: NewThisWeekIt },
    'english-speaking-classes': { en: EnglishSpeakingEn, it: EnglishSpeakingIt }
  }
} as const;

export const getEditorialComponent = (citySlug: string, slug: string, locale: Locale) => {
  const cityRegistry = registry[citySlug as keyof typeof registry];
  if (!cityRegistry) return null;
  const item = cityRegistry[slug as keyof typeof cityRegistry];
  if (!item) return null;
  return item[locale];
};

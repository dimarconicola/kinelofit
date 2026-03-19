import { notFound } from 'next/navigation';

import { defaultLocale, locales } from '@/lib/catalog/constants';
import type { Locale } from '@/lib/catalog/types';

export const resolveLocale = (value: string): Locale => {
  if (locales.includes(value as Locale)) return value as Locale;
  notFound();
};

export const switchLocalePath = (pathname: string, locale: Locale) => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return `/${locale}`;
  if (locales.includes(segments[0] as Locale)) {
    segments[0] = locale;
    return `/${segments.join('/')}`;
  }
  return `/${locale}${pathname}`;
};

export { defaultLocale, locales };

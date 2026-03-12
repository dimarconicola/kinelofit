import { DateTime } from 'luxon';

import type { Locale } from '@/lib/catalog/types';

export const formatSessionTime = (iso: string, locale: Locale) =>
  DateTime.fromISO(iso)
    .setZone('Europe/Rome')
    .setLocale(locale)
    .toFormat(locale === 'it' ? 'ccc d LLL • HH:mm' : 'ccc d LLL • HH:mm');

export const formatVerifiedAt = (iso: string, locale: Locale) =>
  DateTime.fromISO(iso)
    .setZone('Europe/Rome')
    .setLocale(locale)
    .toRelativeCalendar() ?? iso;

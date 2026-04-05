import type { Locale } from '@/lib/catalog/types';
import { env } from '@/lib/env';

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '');

export const buildSessionHref = ({
  locale,
  citySlug,
  sessionId
}: {
  locale: Locale;
  citySlug: string;
  sessionId: string;
}) => `/${locale}/${citySlug}/classes/${sessionId}`;

export const buildAbsoluteSessionHref = (args: {
  locale: Locale;
  citySlug: string;
  sessionId: string;
}) => `${normalizeBaseUrl(env.siteUrl)}${buildSessionHref(args)}`;

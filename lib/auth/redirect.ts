import { resolveLocale } from '@/lib/i18n/routing';

export const buildPostAuthPath = (rawLocale: string) => {
  const locale = resolveLocale(rawLocale);
  return `/${locale}/favorites`;
};

export const buildAuthCallbackUrl = (request: Request, rawLocale: string) => {
  const callbackUrl = new URL('/auth/callback', request.url);
  callbackUrl.searchParams.set('next', buildPostAuthPath(rawLocale));
  return callbackUrl.toString();
};

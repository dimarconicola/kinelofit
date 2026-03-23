import { z } from 'zod';

import { getSessionUser } from '@/lib/auth/session';
import { getCatalogSnapshot } from '@/lib/catalog/repository';
import { apiHandler } from '@/lib/errors/api-handler';
import { AppError } from '@/lib/errors/handler';
import { getRuntimeCapabilities } from '@/lib/runtime/capabilities';
import { getDigestSubscription, removeDigestSubscription, upsertDigestSubscription } from '@/lib/runtime/store';

const digestSchema = z.object({
  citySlug: z.string().min(1).max(80),
  locale: z.enum(['it', 'en']),
  preferences: z.array(z.string()).default([])
});

export const GET = apiHandler(async (request) => {
  const capabilities = await getRuntimeCapabilities();
  if (capabilities.authMode === 'unavailable' || capabilities.storeMode !== 'database') {
    throw new AppError('Digest temporaneamente non disponibile.', 503, 'STORE_UNAVAILABLE');
  }

  const user = await getSessionUser();
  if (!user) {
    throw new AppError('Accesso richiesto.', 401, 'AUTH_REQUIRED');
  }

  const url = new URL(request.url);
  const citySlug = url.searchParams.get('citySlug');
  if (!citySlug) {
    throw new AppError('Città non valida.', 400, 'VALIDATION_ERROR');
  }

  const subscription = await getDigestSubscription(user.email, citySlug);
  return {
    status: 200,
    data: {
      subscribed: Boolean(subscription),
      subscription
    }
  };
});

export const POST = apiHandler(async (request) => {
  const capabilities = await getRuntimeCapabilities();
  if (capabilities.authMode === 'unavailable' || capabilities.storeMode !== 'database') {
    throw new AppError('Digest temporaneamente non disponibile.', 503, 'STORE_UNAVAILABLE');
  }

  const user = await getSessionUser();
  if (!user) {
    throw new AppError('Accesso richiesto.', 401, 'AUTH_REQUIRED');
  }

  const parsed = digestSchema.parse(await request.json());
  const catalog = await getCatalogSnapshot();
  if (!catalog.cities.some((city) => city.slug === parsed.citySlug)) {
    throw new AppError('Città non valida.', 400, 'VALIDATION_ERROR');
  }

  const result = await upsertDigestSubscription({
    email: user.email,
    locale: parsed.locale,
    citySlug: parsed.citySlug,
    preferences: parsed.preferences,
    createdAt: new Date().toISOString()
  });

  return {
    status: 200,
    data: {
      code: result.created ? 'DIGEST_SUBSCRIBED' : 'DIGEST_UPDATED',
      subscribed: true
    }
  };
});

export const DELETE = apiHandler(async (request) => {
  const capabilities = await getRuntimeCapabilities();
  if (capabilities.authMode === 'unavailable' || capabilities.storeMode !== 'database') {
    throw new AppError('Digest temporaneamente non disponibile.', 503, 'STORE_UNAVAILABLE');
  }

  const user = await getSessionUser();
  if (!user) {
    throw new AppError('Accesso richiesto.', 401, 'AUTH_REQUIRED');
  }

  const url = new URL(request.url);
  const citySlug = url.searchParams.get('citySlug');
  if (!citySlug) {
    throw new AppError('Città non valida.', 400, 'VALIDATION_ERROR');
  }

  await removeDigestSubscription(user.email, citySlug);
  return {
    status: 200,
    data: {
      code: 'DIGEST_REMOVED',
      subscribed: false
    }
  };
});

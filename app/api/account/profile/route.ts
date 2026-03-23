import { z } from 'zod';

import { getSessionUser } from '@/lib/auth/session';
import { getCatalogSnapshot } from '@/lib/catalog/repository';
import { apiHandler } from '@/lib/errors/api-handler';
import { AppError } from '@/lib/errors/handler';
import { getRuntimeCapabilities } from '@/lib/runtime/capabilities';
import { getUserProfile, listUserFavorites, listUserSchedule, upsertUserProfile } from '@/lib/runtime/store';

const profileSchema = z.object({
  displayName: z.string().trim().max(120).optional().default(''),
  homeCitySlug: z.string().min(1).max(80)
});

export const GET = apiHandler(async () => {
  const capabilities = await getRuntimeCapabilities();
  if (capabilities.authMode === 'unavailable' || capabilities.storeMode !== 'database') {
    throw new AppError('Account temporaneamente non disponibile.', 503, 'STORE_UNAVAILABLE');
  }

  const user = await getSessionUser();
  if (!user) {
    throw new AppError('Accesso richiesto.', 401, 'AUTH_REQUIRED');
  }

  const [profile, favorites, schedule] = await Promise.all([
    getUserProfile(user.id, user.email),
    listUserFavorites(user.id),
    listUserSchedule(user.id)
  ]);

  return {
    status: 200,
    data: {
      profile,
      counts: {
        favorites: favorites.length,
        schedule: schedule.length
      }
    }
  };
});

export const POST = apiHandler(async (request) => {
  const capabilities = await getRuntimeCapabilities();
  if (capabilities.authMode === 'unavailable' || capabilities.storeMode !== 'database') {
    throw new AppError('Account temporaneamente non disponibile.', 503, 'STORE_UNAVAILABLE');
  }

  const user = await getSessionUser();
  if (!user) {
    throw new AppError('Accesso richiesto.', 401, 'AUTH_REQUIRED');
  }

  const parsed = profileSchema.parse(await request.json());
  const catalog = await getCatalogSnapshot();

  if (!catalog.cities.some((city) => city.slug === parsed.homeCitySlug)) {
    throw new AppError('Città non valida.', 400, 'VALIDATION_ERROR');
  }

  const profile = await upsertUserProfile({
    userId: user.id,
    email: user.email,
    displayName: parsed.displayName,
    homeCitySlug: parsed.homeCitySlug
  });

  return {
    status: 200,
    data: {
      code: 'PROFILE_UPDATED',
      profile
    }
  };
});

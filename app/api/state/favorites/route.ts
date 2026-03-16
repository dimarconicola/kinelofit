import { z } from 'zod';
import { apiHandler } from '@/lib/errors/api-handler';
import { logger } from '@/lib/observability/logger';
import { getSessionUser } from '@/lib/auth/session';
import { isUserFavorite, toggleUserFavorite } from '@/lib/runtime/store';

const querySchema = z.object({
  entityType: z.enum(['venue', 'session', 'instructor'], { message: 'Invalid entity type' }),
  entitySlug: z.string().min(1, 'Entity slug is required')
});

export const GET = apiHandler(async (request) => {
  const user = await getSessionUser();
  if (!user) {
    logger.info('Unauthorized favorites check - no session');
    const error = new Error('Authentication required') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  const url = new URL(request.url);
  const parsed = querySchema.parse({
    entityType: url.searchParams.get('entityType'),
    entitySlug: url.searchParams.get('entitySlug')
  });

  const saved = await isUserFavorite(user.id, parsed.entityType, parsed.entitySlug);

  return {
    status: 200,
    data: {
      saved,
      entityType: parsed.entityType,
      entitySlug: parsed.entitySlug
    }
  };
});

export const POST = apiHandler(async (request) => {
  const user = await getSessionUser();
  if (!user) {
    logger.info('Unauthorized favorite toggle - no session');
    const error = new Error('Authentication required') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }

  const parsed = querySchema.parse(await request.json());
  const saved = await toggleUserFavorite(user.id, parsed.entityType, parsed.entitySlug);

  logger.info('User favorite toggled', {
    userId: user.id,
    entityType: parsed.entityType,
    entitySlug: parsed.entitySlug,
    saved
  });

  return {
    status: 200,
    data: {
      saved,
      entityType: parsed.entityType,
      entitySlug: parsed.entitySlug,
      message: saved ? 'Added to favorites' : 'Removed from favorites'
    }
  };
});

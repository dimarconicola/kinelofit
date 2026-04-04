import { logger } from '@/lib/observability/logger';

export const safeAdminRead = async <T>(label: string, reader: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await reader();
  } catch (error) {
    logger.error(`Admin read failed: ${label}`, error as Error);
    return fallback;
  }
};

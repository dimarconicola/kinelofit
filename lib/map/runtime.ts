import type { MapRenderMode } from '@/components/discovery/classes-results.types';
import { env } from '@/lib/env';

const isPreviewDeployment = env.vercelEnv === 'preview';
const isLocalDevelopment = env.nodeEnv === 'development' && !env.vercelEnv;
const isProductionDeployment = env.vercelEnv === 'production' || (env.nodeEnv === 'production' && !isPreviewDeployment);

export const getMapRenderMode = (): MapRenderMode => {
  if (env.mapboxToken) return 'interactive';
  if (isLocalDevelopment || isPreviewDeployment) return 'fallback';
  if (isProductionDeployment) return 'unavailable';
  return 'fallback';
};

export const isInteractiveMapEnabled = () => getMapRenderMode() === 'interactive';

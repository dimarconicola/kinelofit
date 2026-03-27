import type { MapRenderMode } from '@/components/discovery/classes-results.types';
import { getMapTileConfig, isMapTileConfigValid } from '@/lib/map/config';

export const getMapRenderMode = (): MapRenderMode => (isMapTileConfigValid() ? 'interactive' : 'unavailable');

export const isInteractiveMapEnabled = () => getMapRenderMode() === 'interactive';

export const getMapRuntimeDetail = () => {
  const config = getMapTileConfig();

  return {
    renderMode: getMapRenderMode(),
    engine: config.engine,
    tileUrl: config.tileUrl,
    usingDefaultProvider: !process.env.NEXT_PUBLIC_MAP_TILE_URL,
    hasCustomAttribution: Boolean(process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION)
  };
};

import { afterEach, describe, expect, it, vi } from 'vitest';

describe('map runtime policy', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('uses default Carto tiles when no env override exists', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAP_TILE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_MAP_TILE_ATTRIBUTION', '');
    vi.stubEnv('NEXT_PUBLIC_MAP_TILE_SUBDOMAINS', '');

    const { getMapTileConfig } = await import('@/lib/map/config');
    const { getMapRenderMode } = await import('@/lib/map/runtime');

    expect(getMapTileConfig().tileUrl).toContain('cartocdn.com/light_all');
    expect(getMapRenderMode()).toBe('interactive');
  });

  it('accepts a valid custom tile override', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAP_TILE_URL', 'https://tiles.example.com/{z}/{x}/{y}.png');
    vi.stubEnv('NEXT_PUBLIC_MAP_TILE_ATTRIBUTION', 'Example');
    vi.stubEnv('NEXT_PUBLIC_MAP_TILE_SUBDOMAINS', 'a,b');

    const { getMapTileConfig } = await import('@/lib/map/config');
    const { getMapRuntimeDetail } = await import('@/lib/map/runtime');

    expect(getMapTileConfig().tileUrl).toBe('https://tiles.example.com/{z}/{x}/{y}.png');
    expect(getMapTileConfig().subdomains).toEqual(['a', 'b']);
    expect(getMapRuntimeDetail().usingDefaultProvider).toBe(false);
    expect(getMapRuntimeDetail().renderMode).toBe('interactive');
  });

  it('marks map unavailable when the custom tile url is malformed', async () => {
    vi.stubEnv('NEXT_PUBLIC_MAP_TILE_URL', 'https://tiles.example.com/static.png');

    const { getMapRenderMode } = await import('@/lib/map/runtime');
    expect(getMapRenderMode()).toBe('unavailable');
  });
});

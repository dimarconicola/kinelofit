import { afterEach, describe, expect, it, vi } from 'vitest';

describe('map runtime policy', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('keeps fallback map enabled on preview without token', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_TOKEN', '');

    const { getMapRenderMode } = await import('@/lib/map/runtime');
    expect(getMapRenderMode()).toBe('fallback');
  });

  it('fails map availability in production when token is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_TOKEN', '');

    const { getMapRenderMode } = await import('@/lib/map/runtime');
    expect(getMapRenderMode()).toBe('unavailable');
  });

  it('enables interactive mode when token exists', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_TOKEN', 'pk.test-token');

    const { getMapRenderMode } = await import('@/lib/map/runtime');
    expect(getMapRenderMode()).toBe('interactive');
  });
});

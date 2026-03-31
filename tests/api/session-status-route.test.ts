import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSessionUser = vi.fn();
const getRuntimeCapabilities = vi.fn();

vi.mock('@/lib/auth/session', () => ({
  getSessionUser
}));

vi.mock('@/lib/runtime/capabilities', () => ({
  getRuntimeCapabilities
}));

describe('session status route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns anonymous state without cache for signed-out visitors', async () => {
    getSessionUser.mockResolvedValue(null);
    getRuntimeCapabilities.mockResolvedValue({
      authMode: 'supabase',
      storeMode: 'database'
    });

    const { GET } = await import('@/app/api/session/status/route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    await expect(response.json()).resolves.toMatchObject({
      runtimeCapabilities: {
        authMode: 'supabase',
        storeMode: 'database'
      }
    });
  });

  it('returns signed-in email when a session exists', async () => {
    getSessionUser.mockResolvedValue({
      id: 'user-1',
      email: 'ciao@example.com',
      provider: 'supabase'
    });
    getRuntimeCapabilities.mockResolvedValue({
      authMode: 'supabase',
      storeMode: 'database'
    });

    const { GET } = await import('@/app/api/session/status/route');
    const response = await GET();

    await expect(response.json()).resolves.toMatchObject({
      signedInEmail: 'ciao@example.com',
      provider: 'supabase'
    });
  });
});

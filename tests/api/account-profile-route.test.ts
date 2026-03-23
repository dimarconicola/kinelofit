import { beforeEach, describe, expect, it, vi } from 'vitest';

const getRuntimeCapabilities = vi.fn();
const getSessionUser = vi.fn();
const getUserProfile = vi.fn();
const upsertUserProfile = vi.fn();
const listUserFavorites = vi.fn();
const listUserSchedule = vi.fn();
const getCatalogSnapshot = vi.fn();

vi.mock('@/lib/runtime/capabilities', () => ({
  getRuntimeCapabilities
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionUser
}));

vi.mock('@/lib/runtime/store', () => ({
  getUserProfile,
  upsertUserProfile,
  listUserFavorites,
  listUserSchedule
}));

vi.mock('@/lib/catalog/repository', () => ({
  getCatalogSnapshot
}));

describe('account profile route contract', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('GET returns AUTH_REQUIRED when session is missing', async () => {
    getRuntimeCapabilities.mockResolvedValue({
      authMode: 'supabase',
      storeMode: 'database'
    });
    getSessionUser.mockResolvedValue(null);

    const { GET } = await import('@/app/api/account/profile/route');
    const response = await GET(new Request('http://localhost:3000/api/account/profile'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'AUTH_REQUIRED' }
    });
  });

  it('GET returns profile payload and saved counts', async () => {
    getRuntimeCapabilities.mockResolvedValue({
      authMode: 'supabase',
      storeMode: 'database'
    });
    getSessionUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      provider: 'supabase'
    });
    getUserProfile.mockResolvedValue({
      userId: 'user-1',
      email: 'test@example.com',
      displayName: 'Nicola',
      homeCitySlug: 'palermo',
      createdAt: '2026-03-23T08:00:00.000Z',
      updatedAt: '2026-03-23T08:00:00.000Z'
    });
    listUserFavorites.mockResolvedValue([{ entityType: 'venue', entitySlug: 'yoga-city', createdAt: '2026-03-23T08:00:00.000Z' }]);
    listUserSchedule.mockResolvedValue(['session-1', 'session-2']);

    const { GET } = await import('@/app/api/account/profile/route');
    const response = await GET(new Request('http://localhost:3000/api/account/profile'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        profile: {
          displayName: 'Nicola',
          homeCitySlug: 'palermo'
        },
        counts: {
          favorites: 1,
          schedule: 2
        }
      }
    });
  });

  it('POST returns VALIDATION_ERROR for unsupported city', async () => {
    getRuntimeCapabilities.mockResolvedValue({
      authMode: 'supabase',
      storeMode: 'database'
    });
    getSessionUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      provider: 'supabase'
    });
    getCatalogSnapshot.mockResolvedValue({
      cities: [{ slug: 'palermo' }]
    });

    const { POST } = await import('@/app/api/account/profile/route');
    const response = await POST(
      new Request('http://localhost:3000/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Nicola',
          homeCitySlug: 'rome'
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' }
    });
  });

  it('POST upserts the profile and returns PROFILE_UPDATED', async () => {
    getRuntimeCapabilities.mockResolvedValue({
      authMode: 'supabase',
      storeMode: 'database'
    });
    getSessionUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      provider: 'supabase'
    });
    getCatalogSnapshot.mockResolvedValue({
      cities: [{ slug: 'palermo' }, { slug: 'catania' }]
    });
    upsertUserProfile.mockResolvedValue({
      userId: 'user-1',
      email: 'test@example.com',
      displayName: 'Nicola',
      homeCitySlug: 'catania',
      createdAt: '2026-03-23T08:00:00.000Z',
      updatedAt: '2026-03-23T08:05:00.000Z'
    });

    const { POST } = await import('@/app/api/account/profile/route');
    const response = await POST(
      new Request('http://localhost:3000/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Nicola',
          homeCitySlug: 'catania'
        })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        code: 'PROFILE_UPDATED',
        profile: {
          homeCitySlug: 'catania'
        }
      }
    });
  });
});

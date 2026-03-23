import { beforeEach, describe, expect, it, vi } from 'vitest';

const getRuntimeCapabilities = vi.fn();
const getSessionUser = vi.fn();
const getCatalogSnapshot = vi.fn();
const getDigestSubscription = vi.fn();
const upsertDigestSubscription = vi.fn();
const removeDigestSubscription = vi.fn();

vi.mock('@/lib/runtime/capabilities', () => ({
  getRuntimeCapabilities
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionUser
}));

vi.mock('@/lib/catalog/repository', () => ({
  getCatalogSnapshot
}));

vi.mock('@/lib/runtime/store', () => ({
  getDigestSubscription,
  upsertDigestSubscription,
  removeDigestSubscription
}));

describe('account digest route contract', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('GET returns subscription state for the signed-in user', async () => {
    getRuntimeCapabilities.mockResolvedValue({ authMode: 'supabase', storeMode: 'database' });
    getSessionUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com', provider: 'supabase' });
    getDigestSubscription.mockResolvedValue({
      email: 'test@example.com',
      locale: 'it',
      citySlug: 'palermo',
      preferences: ['english'],
      createdAt: '2026-03-23T08:00:00.000Z'
    });

    const { GET } = await import('@/app/api/account/digest/route');
    const response = await GET(new Request('http://localhost:3000/api/account/digest?citySlug=palermo'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        subscribed: true,
        subscription: {
          citySlug: 'palermo'
        }
      }
    });
  });

  it('POST validates city slug and returns updated code', async () => {
    getRuntimeCapabilities.mockResolvedValue({ authMode: 'supabase', storeMode: 'database' });
    getSessionUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com', provider: 'supabase' });
    getCatalogSnapshot.mockResolvedValue({ cities: [{ slug: 'palermo' }] });
    upsertDigestSubscription.mockResolvedValue({ created: false });

    const { POST } = await import('@/app/api/account/digest/route');
    const response = await POST(
      new Request('http://localhost:3000/api/account/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citySlug: 'palermo',
          locale: 'it',
          preferences: ['beginner']
        })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        code: 'DIGEST_UPDATED',
        subscribed: true
      }
    });
  });

  it('DELETE removes the digest for the signed-in user', async () => {
    getRuntimeCapabilities.mockResolvedValue({ authMode: 'supabase', storeMode: 'database' });
    getSessionUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com', provider: 'supabase' });

    const { DELETE } = await import('@/app/api/account/digest/route');
    const response = await DELETE(new Request('http://localhost:3000/api/account/digest?citySlug=palermo', { method: 'DELETE' }));

    expect(response.status).toBe(200);
    expect(removeDigestSubscription).toHaveBeenCalledWith('test@example.com', 'palermo');
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        code: 'DIGEST_REMOVED',
        subscribed: false
      }
    });
  });
});

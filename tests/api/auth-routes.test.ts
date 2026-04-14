import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  isSupabaseConfigured: false
}));

const getSupabaseServerClient = vi.fn();
const getAuthMode = vi.fn();
const encodeSession = vi.fn(() => 'encoded-session-token');

vi.mock('@/lib/auth/supabase', () => ({
  getSupabaseServerClient,
  get isSupabaseConfigured() {
    return mockState.isSupabaseConfigured;
  }
}));

vi.mock('@/lib/runtime/capabilities', () => ({
  getAuthMode
}));

vi.mock('@/lib/auth/session', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/session')>('@/lib/auth/session');
  return {
    ...actual,
    encodeSession
  };
});

describe('auth route contracts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockState.isSupabaseConfigured = false;
  });

  it('magic-link preserves locale when email is missing or auth is unavailable', async () => {
    const { POST } = await import('@/app/api/auth/magic-link/route');

    const missingEmail = await POST(
      new Request('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        body: new FormData()
      })
    );
    expect(missingEmail.headers.get('location')).toBe('http://localhost:3000/it/sign-in');

    const formData = new FormData();
    formData.set('email', 'test@example.com');
    formData.set('locale', 'it');
    const unavailable = await POST(
      new Request('http://localhost:3000/api/auth/magic-link', {
        method: 'POST',
        body: formData
      })
    );
    expect(unavailable.headers.get('location')).toBe('http://localhost:3000/it/sign-in');
  });

  it('magic-link builds callback URLs from the request origin', async () => {
    mockState.isSupabaseConfigured = true;
    const signInWithOtp = vi.fn().mockResolvedValue({});
    getSupabaseServerClient.mockResolvedValue({
      auth: { signInWithOtp }
    });

    const { POST } = await import('@/app/api/auth/magic-link/route');

    const formData = new FormData();
    formData.set('email', 'mobile@example.com');
    formData.set('locale', 'it');

    const response = await POST(
      new Request('https://kinelofit.vercel.app/api/auth/magic-link', {
        method: 'POST',
        body: formData
      })
    );

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'mobile@example.com',
      options: {
        emailRedirectTo: 'https://kinelofit.vercel.app/auth/callback?next=%2Fit%2Ffavorites'
      }
    });
    expect(response.headers.get('location')).toBe('https://kinelofit.vercel.app/it/sign-in?checkEmail=1');
  });

  it('oauth preserves locale on unavailable or failed provider setup', async () => {
    const { POST } = await import('@/app/api/auth/oauth/route');

    const unavailableForm = new FormData();
    unavailableForm.set('locale', 'it');
    const unavailable = await POST(
      new Request('http://localhost:3000/api/auth/oauth', {
        method: 'POST',
        body: unavailableForm
      })
    );
    expect(unavailable.headers.get('location')).toBe('http://localhost:3000/it/sign-in');

    mockState.isSupabaseConfigured = true;
    getSupabaseServerClient.mockResolvedValue({
      auth: {
        signInWithOAuth: vi.fn().mockRejectedValue(new Error('boom'))
      }
    });

    const failedForm = new FormData();
    failedForm.set('locale', 'it');
    const failed = await POST(
      new Request('http://localhost:3000/api/auth/oauth', {
        method: 'POST',
        body: failedForm
      })
    );
    expect(failed.headers.get('location')).toBe('http://localhost:3000/it/sign-in?error=1');
  });

  it('oauth builds callback URLs from the request origin', async () => {
    mockState.isSupabaseConfigured = true;
    const signInWithOAuth = vi.fn().mockResolvedValue({
      data: {
        url: 'https://accounts.google.com/mock'
      }
    });
    getSupabaseServerClient.mockResolvedValue({
      auth: { signInWithOAuth }
    });

    const { POST } = await import('@/app/api/auth/oauth/route');

    const formData = new FormData();
    formData.set('locale', 'it');
    formData.set('provider', 'google');

    const response = await POST(
      new Request('https://kinelofit.vercel.app/api/auth/oauth', {
        method: 'POST',
        body: formData
      })
    );

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://kinelofit.vercel.app/auth/callback?next=%2Fit%2Ffavorites'
      }
    });
    expect(response.headers.get('location')).toBe('https://accounts.google.com/mock');
  });

  it('signout preserves locale and clears the session cookie', async () => {
    const { POST } = await import('@/app/api/auth/signout/route');

    const formData = new FormData();
    formData.set('locale', 'it');

    const response = await POST(
      new Request('http://localhost:3000/api/auth/signout', {
        method: 'POST',
        body: formData
      })
    );

    expect(response.headers.get('location')).toBe('http://localhost:3000/it');
    expect(response.headers.get('set-cookie')).toContain('kinelo_session=');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('dev demo auth preserves locale and sets a session cookie', async () => {
    getAuthMode.mockReturnValue('dev-local');
    const { POST } = await import('@/app/api/auth/demo/route');

    const formData = new FormData();
    formData.set('email', 'demo@example.com');
    formData.set('locale', 'it');

    const response = await POST(
      new Request('http://localhost:3000/api/auth/demo', {
        method: 'POST',
        body: formData
      })
    );

    expect(response.headers.get('location')).toBe('http://localhost:3000/it/favorites');
    expect(encodeSession).toHaveBeenCalledWith('demo@example.com');
    expect(response.headers.get('set-cookie')).toContain('kinelo_session=');
  });
});

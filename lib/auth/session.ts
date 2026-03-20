import { createHmac, timingSafeEqual } from 'node:crypto';
import { cache } from 'react';

import { cookies } from 'next/headers';

import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/auth/supabase';
import { env } from '@/lib/env';

const COOKIE_NAME = 'kinelo_session';

const sign = (value: string) => createHmac('sha256', env.sessionSecret).update(value).digest('hex');

export interface SessionUser {
  id: string;
  email: string;
  provider: 'supabase' | 'demo';
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export const encodeSession = (email: string) => {
  const payload = JSON.stringify({ email, createdAt: new Date().toISOString() });
  const token = Buffer.from(payload).toString('base64url');
  return `${token}.${sign(token)}`;
};

export const decodeSession = (token: string) => {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email: string; createdAt: string };
  } catch {
    return null;
  }
};

const hasSupabaseAuthCookie = (store: CookieStore) =>
  store.getAll().some((cookie) => cookie.name.startsWith('sb-') || cookie.name.startsWith('supabase-auth-token'));

export const getSessionUser = cache(async () => {
  const store = await cookies();

  if (isSupabaseConfigured && hasSupabaseAuthCookie(store)) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (user?.email) {
        return {
          id: user.id,
          email: user.email,
          provider: 'supabase'
        } satisfies SessionUser;
      }
    }
  }

  const raw = store.get(COOKIE_NAME)?.value;
  const decoded = raw ? decodeSession(raw) : null;
  if (!decoded?.email) return null;

  return {
    id: decoded.email,
    email: decoded.email,
    provider: 'demo'
  } satisfies SessionUser;
});

export const sessionCookieName = COOKIE_NAME;

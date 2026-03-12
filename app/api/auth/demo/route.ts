import { NextResponse } from 'next/server';

import { encodeSession, sessionCookieName } from '@/lib/auth/session';

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const locale = String(formData.get('locale') ?? 'en');

  if (!email) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }

  const response = NextResponse.redirect(new URL(`/${locale}/favorites`, request.url));
  response.cookies.set(sessionCookieName, encodeSession(email), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}

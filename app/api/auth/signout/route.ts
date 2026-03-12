import { NextResponse } from 'next/server';

import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/auth/supabase';
import { sessionCookieName } from '@/lib/auth/session';

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = String(formData.get('locale') ?? 'en');

  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  const response = NextResponse.redirect(new URL(`/${locale}`, request.url));
  response.cookies.set(sessionCookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  return response;
}

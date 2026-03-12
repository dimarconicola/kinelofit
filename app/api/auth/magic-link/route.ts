import { NextResponse } from 'next/server';

import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/auth/supabase';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const locale = String(formData.get('locale') ?? 'en');

  if (!email) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }

  const next = encodeURIComponent(`/${locale}/favorites`);
  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${env.siteUrl}/auth/callback?next=${next}`
    }
  });

  return NextResponse.redirect(new URL(`/${locale}/sign-in?checkEmail=1`, request.url));
}

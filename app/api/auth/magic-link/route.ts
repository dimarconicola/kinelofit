import { NextResponse } from 'next/server';

import { buildAuthCallbackUrl } from '@/lib/auth/redirect';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/auth/supabase';

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const locale = String(formData.get('locale') ?? 'it');

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

  try {
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(request, locale)
      }
    });
  } catch {
    return NextResponse.redirect(new URL(`/${locale}/sign-in?error=1`, request.url));
  }

  return NextResponse.redirect(new URL(`/${locale}/sign-in?checkEmail=1`, request.url));
}

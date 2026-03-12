import { NextResponse } from 'next/server';

import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/auth/supabase';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = String(formData.get('locale') ?? 'en');
  const provider = String(formData.get('provider') ?? 'google');

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }

  const next = encodeURIComponent(`/${locale}/favorites`);
  const { data } = await supabase.auth.signInWithOAuth({
    provider: provider === 'google' ? 'google' : 'google',
    options: {
      redirectTo: `${env.siteUrl}/auth/callback?next=${next}`
    }
  });

  if (!data.url) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }

  return NextResponse.redirect(data.url);
}

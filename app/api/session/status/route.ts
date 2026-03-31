import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/auth/session';
import { getRuntimeCapabilities } from '@/lib/runtime/capabilities';

export async function GET() {
  const [user, runtimeCapabilities] = await Promise.all([getSessionUser(), getRuntimeCapabilities()]);

  return NextResponse.json(
    {
      signedInEmail: user?.email,
      provider: user?.provider,
      runtimeCapabilities
    },
    {
      headers: {
        'cache-control': 'private, no-store, max-age=0'
      }
    }
  );
}

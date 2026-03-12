import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionUser } from '@/lib/auth/session';
import { isUserFavorite, toggleUserFavorite } from '@/lib/runtime/store';

const querySchema = z.object({
  entityType: z.enum(['venue', 'session', 'instructor']),
  entitySlug: z.string().min(1)
});

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ saved: false }, { status: 401 });

  const url = new URL(request.url);
  const parsed = querySchema.parse({
    entityType: url.searchParams.get('entityType'),
    entitySlug: url.searchParams.get('entitySlug')
  });

  const saved = await isUserFavorite(user.id, parsed.entityType, parsed.entitySlug);
  return NextResponse.json({ saved });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ saved: false }, { status: 401 });

  const parsed = querySchema.parse(await request.json());
  const saved = await toggleUserFavorite(user.id, parsed.entityType, parsed.entitySlug);
  return NextResponse.json({ saved });
}

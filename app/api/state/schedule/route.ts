import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionUser } from '@/lib/auth/session';
import { isUserScheduleSaved, toggleUserSchedule } from '@/lib/runtime/store';

const querySchema = z.object({
  sessionId: z.string().min(1)
});

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ saved: false }, { status: 401 });

  const url = new URL(request.url);
  const parsed = querySchema.parse({
    sessionId: url.searchParams.get('sessionId')
  });

  const saved = await isUserScheduleSaved(user.id, parsed.sessionId);
  return NextResponse.json({ saved });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ saved: false }, { status: 401 });

  const parsed = querySchema.parse(await request.json());
  const saved = await toggleUserSchedule(user.id, parsed.sessionId);
  return NextResponse.json({ saved });
}

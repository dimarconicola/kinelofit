import { NextResponse } from 'next/server';
import { z } from 'zod';

import { appendDigestSubscription } from '@/lib/runtime/store';

const schema = z.object({
  email: z.string().email(),
  locale: z.enum(['en', 'it']),
  citySlug: z.string().min(1),
  preferences: z.array(z.string()).default([])
});

export async function POST(request: Request) {
  const parsed = schema.parse(await request.json());
  await appendDigestSubscription({ ...parsed, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}

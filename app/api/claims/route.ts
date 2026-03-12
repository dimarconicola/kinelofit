import { NextResponse } from 'next/server';
import { z } from 'zod';

import { appendClaim } from '@/lib/runtime/store';

const schema = z.object({
  studioSlug: z.string().min(1),
  locale: z.enum(['en', 'it']),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  notes: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = schema.parse(await request.json());
  await appendClaim({ ...parsed, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}

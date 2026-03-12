import { NextResponse } from 'next/server';
import { z } from 'zod';

import { appendOutboundEvent } from '@/lib/runtime/store';

const schema = z.object({
  sessionId: z.string().optional(),
  venueSlug: z.string().min(1),
  citySlug: z.string().min(1),
  categorySlug: z.string().min(1),
  targetType: z.enum(['direct', 'platform', 'whatsapp', 'phone', 'email', 'website']),
  href: z.string().min(1)
});

export async function POST(request: Request) {
  const raw = request.headers.get('content-type')?.includes('application/json') ? await request.json() : JSON.parse(await request.text());
  const parsed = schema.parse(raw);
  await appendOutboundEvent({ ...parsed, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { appendCalendarSubmission } from '@/lib/runtime/store';

const schema = z.object({
  locale: z.enum(['en', 'it']),
  citySlug: z.string().min(1),
  submitterType: z.enum(['studio', 'teacher']),
  organizationName: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().trim().optional(),
  sourceUrls: z.array(z.string().url()).min(1),
  scheduleText: z.string().min(8),
  consent: z.literal(true)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.parse(body);

  await appendCalendarSubmission({
    ...parsed,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({ ok: true });
}

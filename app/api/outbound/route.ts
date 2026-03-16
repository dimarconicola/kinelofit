import { z } from 'zod';
import { apiHandler } from '@/lib/errors/api-handler';
import { appendOutboundEvent } from '@/lib/runtime/store';

const schema = z.object({
  sessionId: z.string().optional(),
  venueSlug: z.string().min(1, 'Venue slug is required'),
  citySlug: z.string().min(1, 'City slug is required'),
  categorySlug: z.string().min(1, 'Category slug is required'),
  targetType: z.enum(['direct', 'platform', 'whatsapp', 'phone', 'email', 'website'], {
    message: 'Invalid target type'
  }),
  href: z.string().url('Invalid URL')
});

export const POST = apiHandler(async (request) => {
  // Handle both JSON and form-encoded content types
  const raw = request.headers.get('content-type')?.includes('application/json')
    ? await request.json()
    : JSON.parse(await request.text());

  const parsed = schema.parse(raw);

  await appendOutboundEvent({
    ...parsed,
    createdAt: new Date().toISOString()
  });

  return {
    status: 200,
    data: {
      ok: true,
      message: 'Outbound click recorded',
      venueSlug: parsed.venueSlug
    }
  };
});

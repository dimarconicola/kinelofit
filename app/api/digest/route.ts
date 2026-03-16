import { z } from 'zod';
import { apiHandler } from '@/lib/errors/api-handler';
import { appendDigestSubscription } from '@/lib/runtime/store';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  locale: z.enum(['en', 'it'], { message: 'Locale must be "en" or "it"' }),
  citySlug: z.string().min(1, 'City slug is required'),
  preferences: z.array(z.string()).default([])
});

export const POST = apiHandler(async (request) => {
  const parsed = schema.parse(await request.json());

  await appendDigestSubscription({
    ...parsed,
    createdAt: new Date().toISOString()
  });

  return {
    status: 201,
    data: {
      ok: true,
      message: 'Digest subscription created successfully',
      email: parsed.email
    }
  };
});

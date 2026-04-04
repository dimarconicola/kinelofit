import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { AppError, createErrorResponse, getStatusCode } from '@/lib/errors/handler';
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
  let locale: 'it' | 'en' = 'it';

  try {
    const body = await request.json();
    locale = body?.locale === 'en' ? 'en' : 'it';
    const parsed = schema.parse(body);

    await appendCalendarSubmission({
      ...parsed,
      phone: parsed.phone?.trim() || undefined,
      organizationName: parsed.organizationName.trim(),
      contactName: parsed.contactName.trim(),
      scheduleText: parsed.scheduleText.trim(),
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        code: 'CALENDAR_SUBMISSION_CREATED'
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const message =
        fieldErrors.sourceUrls?.[0] ??
        fieldErrors.email?.[0] ??
        fieldErrors.scheduleText?.[0] ??
        fieldErrors.organizationName?.[0] ??
        fieldErrors.contactName?.[0] ??
        fieldErrors.consent?.[0] ??
        (locale === 'it' ? 'Controlla i campi richiesti e riprova.' : 'Check the required fields and try again.');

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message,
            fieldErrors
          }
        },
        { status: 400 }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(createErrorResponse(error), { status: getStatusCode(error) });
    }

    const appError = new AppError(
      locale === 'it' ? 'Invio temporaneamente non disponibile. Riprova tra poco.' : 'Submission is temporarily unavailable. Try again shortly.',
      503,
      'STORE_UNAVAILABLE'
    );
    return NextResponse.json(createErrorResponse(appError), { status: 503 });
  }
}

import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createErrorResponse, getStatusCode } from '@/lib/errors/handler';
import { createImportBatch } from '@/lib/imports/service';

const schema = z.object({
  citySlug: z.string().min(1).default('palermo'),
  locale: z.enum(['en', 'it']).default('it'),
  fileName: z.string().min(1).default('manual-admin-import.csv'),
  sourceLabel: z.string().trim().optional(),
  csv: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const parsed = schema.parse({
      citySlug: formData.get('citySlug') ?? 'palermo',
      locale: formData.get('locale') ?? 'it',
      fileName: formData.get('fileName') ?? 'manual-admin-import.csv',
      sourceLabel: formData.get('sourceLabel') ?? undefined,
      csv: formData.get('csv') ?? ''
    });

    const result = await createImportBatch({
      citySlug: parsed.citySlug,
      locale: parsed.locale,
      fileName: parsed.fileName,
      sourceLabel: parsed.sourceLabel?.trim() || undefined,
      csvContent: parsed.csv
    });

    revalidatePath(`/${parsed.locale}/admin/imports`);
    revalidatePath(`/${parsed.locale}/admin`);

    return NextResponse.json({ ok: true, batchId: result.id, validation: result.validation }, { status: 201 });
  } catch (error) {
    return NextResponse.json(createErrorResponse(error), { status: getStatusCode(error) });
  }
}

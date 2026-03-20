import { NextResponse } from 'next/server';

import { importOptionalHeaders, importRequiredHeaders, validateImportCsv } from '@/lib/catalog/import-validator';

export async function POST(request: Request) {
  const formData = await request.formData();
  const csv = String(formData.get('csv') ?? '');
  const result = validateImportCsv(csv);

  return NextResponse.json({
    ok: result.ok,
    rows: result.rows,
    missingHeaders: result.missingHeaders,
    warnings: result.warnings,
    errors: result.errors,
    requiredHeaders: importRequiredHeaders,
    optionalHeaders: importOptionalHeaders
  });
}

import { desc, eq } from 'drizzle-orm';

import type { ImportBatch, ReviewStatus } from '@/lib/catalog/types';
import { validateImportCsv } from '@/lib/catalog/import-validator';
import { getDb } from '@/lib/data/db';
import { importBatches } from '@/lib/data/schema';

const toIso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : undefined);

export const createImportBatch = async (payload: {
  citySlug: string;
  locale: 'en' | 'it';
  fileName: string;
  sourceLabel?: string;
  csvContent: string;
}) => {
  const db = getDb();
  if (!db) {
    throw new Error('Import review requires a configured database.');
  }

  const validation = validateImportCsv(payload.csvContent);
  const inserted = await db
    .insert(importBatches)
    .values({
      citySlug: payload.citySlug,
      locale: payload.locale,
      fileName: payload.fileName,
      sourceLabel: payload.sourceLabel ?? null,
      csvContent: payload.csvContent,
      rowsCount: validation.rows,
      errorsCount: validation.errors.length,
      warningsCount: validation.warnings.length,
      validationSummary: validation as unknown as Record<string, unknown>,
      reviewStatus: validation.ok ? 'reviewing' : 'new',
      createdAt: new Date()
    })
    .returning({ id: importBatches.id });

  return {
    id: inserted[0]?.id,
    validation
  };
};

export const listImportBatches = async (citySlug: string, limit = 40): Promise<ImportBatch[]> => {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(importBatches)
    .where(eq(importBatches.citySlug, citySlug))
    .orderBy(desc(importBatches.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    citySlug: row.citySlug,
    locale: row.locale as 'en' | 'it',
    fileName: row.fileName,
    sourceLabel: row.sourceLabel ?? undefined,
    csvContent: row.csvContent,
    rowsCount: row.rowsCount,
    errorsCount: row.errorsCount,
    warningsCount: row.warningsCount,
    validationSummary: row.validationSummary,
    reviewStatus: row.reviewStatus as ReviewStatus,
    assignedTo: row.assignedTo ?? undefined,
    reviewNotes: row.reviewNotes ?? undefined,
    reviewedAt: toIso(row.reviewedAt),
    importedAt: toIso(row.importedAt),
    createdAt: new Date(row.createdAt).toISOString()
  }));
};

export const updateImportBatchReview = async (
  id: string,
  payload: {
    reviewStatus: ReviewStatus;
    assignedTo?: string;
    reviewNotes?: string;
  }
) => {
  const db = getDb();
  if (!db) {
    throw new Error('Import review requires a configured database.');
  }

  await db
    .update(importBatches)
    .set({
      reviewStatus: payload.reviewStatus,
      assignedTo: payload.assignedTo ?? null,
      reviewNotes: payload.reviewNotes ?? null,
      reviewedAt: new Date(),
      importedAt: payload.reviewStatus === 'imported' ? new Date() : null
    })
    .where(eq(importBatches.id, id));
};

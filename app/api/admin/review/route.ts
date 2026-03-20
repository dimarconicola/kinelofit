import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { updateDiscoveryLeadReview } from '@/lib/freshness/service';
import { updateImportBatchReview } from '@/lib/imports/service';
import { updateCalendarSubmissionReview, updateClaimReview } from '@/lib/runtime/store';

const formSchema = z.object({
  entityType: z.enum(['claim', 'calendar_submission', 'discovery_lead', 'import_batch']),
  entityId: z.string().min(1),
  status: z.string().min(1),
  assignedTo: z.string().trim().optional(),
  reviewNotes: z.string().trim().optional(),
  redirectTo: z.string().min(1).default('/it/admin')
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = formSchema.parse({
    entityType: formData.get('entityType'),
    entityId: formData.get('entityId'),
    status: formData.get('status'),
    assignedTo: formData.get('assignedTo') ?? undefined,
    reviewNotes: formData.get('reviewNotes') ?? undefined,
    redirectTo: formData.get('redirectTo') ?? '/it/admin'
  });

  const assignedTo = parsed.assignedTo?.trim() || undefined;
  const reviewNotes = parsed.reviewNotes?.trim() || undefined;

  if (parsed.entityType === 'claim') {
    await updateClaimReview(parsed.entityId, {
      reviewStatus: parsed.status as 'new' | 'reviewing' | 'approved' | 'rejected' | 'imported' | 'resolved',
      assignedTo,
      reviewNotes
    });
  } else if (parsed.entityType === 'calendar_submission') {
    await updateCalendarSubmissionReview(parsed.entityId, {
      reviewStatus: parsed.status as 'new' | 'reviewing' | 'approved' | 'rejected' | 'imported' | 'resolved',
      assignedTo,
      reviewNotes
    });
  } else if (parsed.entityType === 'import_batch') {
    await updateImportBatchReview(parsed.entityId, {
      reviewStatus: parsed.status as 'new' | 'reviewing' | 'approved' | 'rejected' | 'imported' | 'resolved',
      assignedTo,
      reviewNotes
    });
  } else {
    await updateDiscoveryLeadReview(parsed.entityId, {
      status: parsed.status as 'new' | 'reviewed' | 'imported' | 'rejected',
      assignedTo,
      reviewNotes
    });
  }

  revalidatePath(parsed.redirectTo);
  revalidatePath('/it/admin');
  revalidatePath('/it/admin/claims');
  revalidatePath('/it/admin/inbox');
  revalidatePath('/it/admin/imports');
  revalidatePath('/it/admin/sources');

  return NextResponse.redirect(new URL(parsed.redirectTo, request.url), { status: 303 });
}

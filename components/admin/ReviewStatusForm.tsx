import type { DiscoveryLeadStatus, ReviewStatus } from '@/lib/catalog/types';

type StatusValue = DiscoveryLeadStatus | ReviewStatus;

export function ReviewStatusForm({
  entityType,
  entityId,
  currentStatus,
  assignedTo,
  reviewNotes,
  redirectTo,
  statusOptions,
  submitLabel = 'Aggiorna'
}: {
  entityType: 'claim' | 'calendar_submission' | 'discovery_lead';
  entityId: string;
  currentStatus: StatusValue;
  assignedTo?: string;
  reviewNotes?: string;
  redirectTo: string;
  statusOptions: readonly StatusValue[];
  submitLabel?: string;
}) {
  return (
    <form action="/api/admin/review" method="post" className="form-stack admin-review-form">
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityId" value={entityId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="filter-grid filter-grid-expanded">
        <label>
          Stato
          <select name="status" defaultValue={currentStatus}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Assegnato a
          <input name="assignedTo" defaultValue={assignedTo ?? ''} placeholder="nicola" />
        </label>
      </div>
      <label>
        Note review
        <textarea name="reviewNotes" rows={3} defaultValue={reviewNotes ?? ''} placeholder="Azioni, contesto, follow-up." />
      </label>
      <button className="button button-secondary" type="submit">{submitLabel}</button>
    </form>
  );
}

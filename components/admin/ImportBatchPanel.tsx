import { DateTime } from 'luxon';

import { ReviewStatusForm } from '@/components/admin/ReviewStatusForm';
import { listImportBatches } from '@/lib/imports/service';

const reviewStatuses = ['new', 'reviewing', 'approved', 'rejected', 'imported', 'resolved'] as const;

export async function ImportBatchPanel({ locale }: { locale: 'en' | 'it' }) {
  const batches = await listImportBatches('palermo', 30);

  return (
    <div className="stack-list">
      {batches.length === 0 ? (
        <p className="muted">Nessun batch import registrato.</p>
      ) : (
        batches.map((batch) => {
          const summary = batch.validationSummary as {
            warnings?: Array<{ row: number; field?: string; message: string }>;
            errors?: Array<{ row: number; field?: string; message: string }>;
          };

          return (
            <article className="metric-card" key={batch.id}>
              <strong>{batch.fileName}</strong>
              <span className="muted">
                {batch.rowsCount} righe · {batch.errorsCount} errori · {batch.warningsCount} warning · creato {DateTime.fromISO(batch.createdAt).toFormat('dd LLL yyyy HH:mm')}
              </span>
              {batch.sourceLabel ? <span className="muted">Fonte: {batch.sourceLabel}</span> : null}
              {summary.errors?.slice(0, 3).map((issue, index) => (
                <span className="muted" key={`error-${index}`}>Errore riga {issue.row}{issue.field ? ` (${issue.field})` : ''}: {issue.message}</span>
              ))}
              {summary.warnings?.slice(0, 2).map((issue, index) => (
                <span className="muted" key={`warning-${index}`}>Warning riga {issue.row}{issue.field ? ` (${issue.field})` : ''}: {issue.message}</span>
              ))}
              <ReviewStatusForm
                entityType="import_batch"
                entityId={batch.id}
                currentStatus={batch.reviewStatus}
                assignedTo={batch.assignedTo}
                reviewNotes={batch.reviewNotes}
                redirectTo={`/${locale}/admin/imports`}
                statusOptions={reviewStatuses}
                submitLabel="Aggiorna batch"
              />
            </article>
          );
        })
      )}
    </div>
  );
}

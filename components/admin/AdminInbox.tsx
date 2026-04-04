import { DateTime } from 'luxon';

import { ReviewStatusForm } from '@/components/admin/ReviewStatusForm';
import { safeAdminRead } from '@/lib/admin/safe';
import { listDiscoveryLeadSummaries } from '@/lib/freshness/service';
import { isPersistentStoreConfigured, listCalendarSubmissions, listClaims, listDigestSubscriptions, listOutboundEvents } from '@/lib/runtime/store';

const reviewStatuses = ['new', 'reviewing', 'approved', 'rejected', 'imported', 'resolved'] as const;
const discoveryStatuses = ['new', 'reviewed', 'imported', 'rejected'] as const;

export async function AdminInbox({ redirectPath }: { redirectPath: string }) {
  const [claims, submissions, leads, digests, outbound] = await Promise.all([
    safeAdminRead('claims', () => listClaims(), []),
    safeAdminRead('calendar submissions', () => listCalendarSubmissions(), []),
    safeAdminRead('discovery leads', () => listDiscoveryLeadSummaries('palermo', 40), []),
    safeAdminRead('digest subscriptions', () => listDigestSubscriptions(), []),
    safeAdminRead('outbound events', () => listOutboundEvents(), [])
  ]);

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">{isPersistentStoreConfigured() ? 'Inbox persistente' : 'Inbox fallback'}</p>
        <h1>Moderazione operativa</h1>
        <p className="muted">
          Claims, proposte calendario e lead discovery devono passare da qui prima di diventare dato pubblico affidabile.
        </p>
      </section>

      <section className="admin-grid">
        <article className="panel stat-card">
          <p className="eyebrow">Claims</p>
          <h3>{claims.length}</h3>
        </article>
        <article className="panel stat-card">
          <p className="eyebrow">Calendari inviati</p>
          <h3>{submissions.length}</h3>
        </article>
        <article className="panel stat-card">
          <p className="eyebrow">Lead discovery</p>
          <h3>{leads.length}</h3>
        </article>
        <article className="panel stat-card">
          <p className="eyebrow">Digest signup</p>
          <h3>{digests.length}</h3>
        </article>
      </section>

      <section className="saved-grid">
        <div className="panel">
          <p className="eyebrow">Claims studio</p>
          <div className="stack-list">
            {claims.length > 0 ? claims.map((claim) => (
              <article className="metric-card" key={claim.id ?? `${claim.email}-${claim.createdAt}`}>
                <strong>{claim.name} · {claim.role}</strong>
                <span className="muted">{claim.email} · studio {claim.studioSlug}</span>
                <span className="muted">Creato {DateTime.fromISO(claim.createdAt).toFormat('dd LLL yyyy HH:mm')}</span>
                <span className="muted">{claim.notes}</span>
                <ReviewStatusForm
                  entityType="claim"
                  entityId={claim.id ?? claim.createdAt}
                  currentStatus={claim.reviewStatus ?? 'new'}
                  assignedTo={claim.assignedTo}
                  reviewNotes={claim.reviewNotes}
                  redirectTo={redirectPath}
                  statusOptions={reviewStatuses}
                />
              </article>
            )) : <p className="muted">Nessuna claim ricevuta.</p>}
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">Suggerimenti calendario</p>
          <div className="stack-list">
            {submissions.length > 0 ? submissions.map((submission) => (
              <article className="metric-card" key={submission.id ?? `${submission.email}-${submission.createdAt}`}>
                <strong>{submission.organizationName} · {submission.submitterType}</strong>
                <span className="muted">{submission.contactName} · {submission.email}</span>
                <span className="muted">{submission.sourceUrls.join(' · ')}</span>
                <span className="muted">{submission.scheduleText}</span>
                {submission.reviewNotes ? <span className="muted">Note review: {submission.reviewNotes}</span> : null}
                <span className="muted">Creato {DateTime.fromISO(submission.createdAt).toFormat('dd LLL yyyy HH:mm')}</span>
                  <ReviewStatusForm
                    entityType="calendar_submission"
                    entityId={submission.id ?? submission.createdAt}
                    currentStatus={submission.reviewStatus ?? 'new'}
                    assignedTo={submission.assignedTo}
                    reviewNotes={submission.reviewNotes}
                    redirectTo={redirectPath}
                    statusOptions={reviewStatuses}
                  />
              </article>
            )) : <p className="muted">Nessun calendario in moderazione.</p>}
          </div>
        </div>
      </section>

      <section className="saved-grid">
        <div className="panel">
          <p className="eyebrow">Lead discovery</p>
          <div className="stack-list">
            {leads.length > 0 ? leads.map((lead) => (
              <article className="metric-card" key={lead.id}>
                <strong>{lead.title}</strong>
                <span className="muted">{lead.sourceUrl}</span>
                <span className="muted">{lead.tags.join(', ')} · confidenza {lead.confidence.toFixed(3)}</span>
                <span className="muted">Ultimo check {DateTime.fromISO(lead.lastSeenAt).toFormat('dd LLL yyyy HH:mm')}</span>
                <ReviewStatusForm
                  entityType="discovery_lead"
                  entityId={lead.id}
                  currentStatus={lead.status}
                  assignedTo={lead.assignedTo}
                  reviewNotes={lead.reviewNotes}
                  redirectTo={redirectPath}
                  statusOptions={discoveryStatuses}
                />
              </article>
            )) : <p className="muted">Nessun lead discovery registrato.</p>}
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">Segnali consumer</p>
          <div className="stack-list">
            {digests.length > 0 ? digests.slice(0, 12).map((digest) => (
              <article className="metric-card" key={`${digest.email}-${digest.createdAt}`}>
                <strong>{digest.email}</strong>
                <span className="muted">{digest.citySlug} · {digest.preferences.join(', ') || 'nessuna preferenza'}</span>
              </article>
            )) : <p className="muted">Nessuna iscrizione digest.</p>}
            {outbound.length > 0 ? outbound.slice(0, 12).map((event) => (
              <article className="metric-card" key={`${event.href}-${event.createdAt}`}>
                <strong>{event.venueSlug}</strong>
                <span className="muted">{event.targetType} · {DateTime.fromISO(event.createdAt).toFormat('dd LLL yyyy HH:mm')}</span>
              </article>
            )) : <p className="muted">Nessun outbound click registrato.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

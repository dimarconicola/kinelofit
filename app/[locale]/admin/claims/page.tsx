import { isPersistentStoreConfigured, listCalendarSubmissions, listClaims, listDigestSubscriptions, listOutboundEvents } from '@/lib/runtime/store';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function AdminClaimsPage({ params }: { params: Promise<{ locale: string }> }) {
  resolveLocale((await params).locale);
  const claims = await listClaims();
  const submissions = await listCalendarSubmissions();
  const digests = await listDigestSubscriptions();
  const outbound = await listOutboundEvents();

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">{isPersistentStoreConfigured() ? 'Persistent inbox' : 'Fallback inbox'}</p>
        <h1>Claims, digests, and outbound intent</h1>
      </section>
      <section className="saved-grid">
        <div className="panel">
          <p className="eyebrow">Claims</p>
          <div className="stack-list">
            {claims.length > 0 ? claims.map((claim) => (
              <div className="metric-card" key={`${claim.email}-${claim.createdAt}`}>
                <strong>{claim.name} · {claim.role}</strong>
                <span className="muted">{claim.email} · {claim.studioSlug}</span>
                <span className="muted">{claim.notes}</span>
              </div>
            )) : <p className="muted">No claims yet.</p>}
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">Calendar submissions</p>
          <div className="stack-list">
            {submissions.length > 0 ? submissions.map((submission) => (
              <div className="metric-card" key={`${submission.email}-${submission.createdAt}`}>
                <strong>{submission.organizationName} · {submission.submitterType}</strong>
                <span className="muted">{submission.contactName} · {submission.email}</span>
                <span className="muted">{submission.sourceUrls.join(' · ')}</span>
                <span className="muted">{submission.scheduleText}</span>
              </div>
            )) : <p className="muted">No calendar submissions yet.</p>}
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">Digest signups</p>
          <div className="stack-list">
            {digests.length > 0 ? digests.map((digest) => (
              <div className="metric-card" key={`${digest.email}-${digest.createdAt}`}>
                <strong>{digest.email}</strong>
                <span className="muted">{digest.citySlug} · {digest.preferences.join(', ') || 'no preferences'}</span>
              </div>
            )) : <p className="muted">No digest signups yet.</p>}
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">Outbound events</p>
          <div className="stack-list">
            {outbound.length > 0 ? outbound.slice(0, 10).map((event) => (
              <div className="metric-card" key={`${event.href}-${event.createdAt}`}>
                <strong>{event.venueSlug}</strong>
                <span className="muted">{event.targetType} · {event.createdAt}</span>
              </div>
            )) : <p className="muted">No outbound clicks captured yet.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

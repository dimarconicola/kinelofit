import { DateTime } from 'luxon';

import { getSourceRegistrySnapshot, listDiscoveryLeadSummaries } from '@/lib/freshness/service';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function AdminSourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const citySlug = 'palermo';

  const [registry, leads] = await Promise.all([
    getSourceRegistrySnapshot(citySlug),
    listDiscoveryLeadSummaries(citySlug)
  ]);

  const copy =
    locale === 'it'
      ? {
          title: 'Sorgenti e lead discovery',
          subtitle: 'Registry per cadenza + queue dei candidati scoperti nel sweep trimestrale.',
          modeDb: 'Database',
          modeSeed: 'Seed',
          totalSources: 'Sorgenti attive',
          catalogSources: 'Sorgenti catalogo',
          discoverySources: 'Sorgenti discovery',
          daily: 'Daily',
          weekly: 'Weekly',
          quarterly: 'Quarterly',
          noLeads: 'Nessun lead discovery registrato.',
          leads: 'Lead discovery',
          status: 'Stato',
          confidence: 'Confidenza',
          lastSeen: 'Ultimo avvistamento'
        }
      : {
          title: 'Sources and discovery leads',
          subtitle: 'Cadence-based registry plus quarterly sweep candidate queue.',
          modeDb: 'Database',
          modeSeed: 'Seed',
          totalSources: 'Active sources',
          catalogSources: 'Catalog sources',
          discoverySources: 'Discovery sources',
          daily: 'Daily',
          weekly: 'Weekly',
          quarterly: 'Quarterly',
          noLeads: 'No discovery leads recorded yet.',
          leads: 'Discovery leads',
          status: 'Status',
          confidence: 'Confidence',
          lastSeen: 'Last seen'
        };

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">{copy.title}</p>
        <h1>{citySlug}</h1>
        <p className="muted">{copy.subtitle}</p>
        <p className="muted">{registry.mode === 'database' ? copy.modeDb : copy.modeSeed}</p>
      </section>

      <section className="admin-grid">
        <article className="panel stat-card">
          <p className="eyebrow">{copy.totalSources}</p>
          <h3>{registry.totalSources}</h3>
        </article>
        <article className="panel stat-card">
          <p className="eyebrow">{copy.catalogSources}</p>
          <h3>{registry.byPurpose.catalog}</h3>
        </article>
        <article className="panel stat-card">
          <p className="eyebrow">{copy.discoverySources}</p>
          <h3>{registry.byPurpose.discovery}</h3>
        </article>
        <article className="panel stat-card">
          <p className="eyebrow">{copy.daily}</p>
          <h3>{registry.byCadence.daily}</h3>
        </article>
        <article className="panel stat-card">
          <p className="eyebrow">{copy.weekly}</p>
          <h3>{registry.byCadence.weekly}</h3>
        </article>
        <article className="panel stat-card">
          <p className="eyebrow">{copy.quarterly}</p>
          <h3>{registry.byCadence.quarterly}</h3>
        </article>
      </section>

      <section className="panel">
        <div className="detail-header">
          <div>
            <p className="eyebrow">Source registry</p>
            <h2>{registry.entries.length}</h2>
          </div>
        </div>
        <div className="stack-list">
          {registry.entries.map((entry) => (
            <article className="metric-card" key={entry.sourceUrl}>
              <strong>{entry.sourceUrl}</strong>
              <span className="muted">
                {entry.cadence} · {entry.purpose} · {entry.trustTier} · {entry.sourceType}
              </span>
              {entry.parserAdapter ? <span className="muted">adapter: {entry.parserAdapter}</span> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="detail-header">
          <div>
            <p className="eyebrow">{copy.leads}</p>
            <h2>{leads.length}</h2>
          </div>
        </div>
        {leads.length === 0 ? (
          <p className="muted">{copy.noLeads}</p>
        ) : (
          <div className="stack-list">
            {leads.map((lead) => (
              <article className="metric-card" key={lead.id}>
                <strong>{lead.title}</strong>
                <span className="muted">{lead.sourceUrl}</span>
                <span className="muted">
                  {copy.status}: {lead.status} · {copy.confidence}: {lead.confidence.toFixed(3)} · {copy.lastSeen}:{' '}
                  {DateTime.fromISO(lead.lastSeenAt).toFormat('dd LLL yyyy HH:mm')}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

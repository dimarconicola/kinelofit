import { DateTime } from 'luxon';
import { and, desc, eq, isNull, or } from 'drizzle-orm';

import { sessions, venues } from '@/lib/catalog/seed';
import { getCatalogSourceMode } from '@/lib/catalog/server-data';
import { getDb } from '@/lib/data/db';
import { sessions as sessionTable } from '@/lib/data/schema';
import { getLatestFreshnessSnapshot, getSourceRegistrySnapshot, listRecentFreshnessRunSources } from '@/lib/freshness/service';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function AdminFreshnessPage({ params }: { params: Promise<{ locale: string }> }) {
  resolveLocale((await params).locale);
  const citySlug = 'palermo';
  const db = getDb();

  const [latestSnapshot, sourceMode, recentSourceChecks, registry] = await Promise.all([
    getLatestFreshnessSnapshot(citySlug),
    getCatalogSourceMode(),
    listRecentFreshnessRunSources(citySlug, 40),
    getSourceRegistrySnapshot(citySlug)
  ]);

  let staleSessions = sessions
    .filter((session) => session.verificationStatus === 'stale')
    .map((session) => ({
      id: session.id,
      title: session.title.en,
      lastVerifiedAt: session.lastVerifiedAt
    }));

  let brokenLinks = venues.filter((venue) => !venue.bookingTargetOrder[0]).length;

  if (db) {
    const staleRows = await db
      .select({
        id: sessionTable.id,
        title: sessionTable.title,
        lastVerifiedAt: sessionTable.lastVerifiedAt
      })
      .from(sessionTable)
      .where(and(eq(sessionTable.citySlug, citySlug), eq(sessionTable.verificationStatus, 'stale')))
      .orderBy(desc(sessionTable.lastVerifiedAt))
      .limit(80);

    staleSessions = staleRows.map((row) => ({
      id: row.id,
      title: row.title.en,
      lastVerifiedAt: row.lastVerifiedAt.toISOString()
    }));

    const brokenRows = await db
      .select({ id: sessionTable.id })
      .from(sessionTable)
      .where(and(eq(sessionTable.citySlug, citySlug), or(isNull(sessionTable.bookingTargetSlug), eq(sessionTable.bookingTargetSlug, ''))));
    brokenLinks = brokenRows.length;
  }

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">Freshness queue</p>
        <h1>Keep Palermo trustworthy</h1>
        {latestSnapshot ? (
          <p className="muted">
            Latest run {DateTime.fromISO(latestSnapshot.createdAt).toFormat('dd LLL yyyy HH:mm')} ·
            Cadence {latestSnapshot.cadence} ·
            Sources checked {latestSnapshot.totalSources} ·
            Sessions tracked {latestSnapshot.totalSessions} ·
            Changed {latestSnapshot.changedSources} ·
            Unreachable {latestSnapshot.unreachableSources} ·
            Impacted {latestSnapshot.impactedSources} ·
            Adapter runs {latestSnapshot.adapterSourcesChecked} ·
            Auto reverified {latestSnapshot.autoReverified} ·
            Registry seeds {latestSnapshot.registrySourcesSeeded} ·
            Discovery leads {latestSnapshot.discoveryLeadsDiscovered}
          </p>
        ) : (
          <p className="muted">No automated freshness run has been recorded yet.</p>
        )}
        <p className="muted">Catalog source: {sourceMode}</p>
      </section>
      <section className="saved-grid">
        <div className="panel">
          <p className="eyebrow">Scheduled ops</p>
          <p className="muted">
            Due now {registry.dueNow} · daily {registry.overdueByCadence.daily} · weekly {registry.overdueByCadence.weekly} · quarterly {registry.overdueByCadence.quarterly}
          </p>
          <p className="muted">
            Cron endpoint accepts `cadence=daily|weekly|quarterly` and `respectSchedule=1` by default.
          </p>
        </div>
        <div className="panel">
          <p className="eyebrow">Stale sessions</p>
          <div className="stack-list">
            {staleSessions.map((session) => (
              <div className="metric-card" key={session.id ?? session.title}>
                <strong>{session.title}</strong>
                <span className="muted">Last verified {DateTime.fromISO(session.lastVerifiedAt).toFormat('dd LLL HH:mm')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">Broken links</p>
          {brokenLinks === 0 ? <p className="muted">No broken links in the current dataset.</p> : <p className="muted">{brokenLinks} sessions without a valid booking target.</p>}
        </div>
      </section>
      <section className="panel">
        <p className="eyebrow">Recent source checks</p>
        {recentSourceChecks.length === 0 ? (
          <p className="muted">No per-source freshness checks stored yet.</p>
        ) : (
          <div className="stack-list">
            {recentSourceChecks.map((check) => (
              <article className="metric-card" key={`${check.runId}-${check.sourceUrl}`}>
                <strong>{check.sourceUrl}</strong>
                <span className="muted">
                  {check.reachable ? 'reachable' : 'unreachable'} · status {check.status} · changed {check.changed ? 'yes' : 'no'} · impacted {check.impacted ? 'yes' : 'no'}
                </span>
                <span className="muted">
                  parser signals {check.parserSignals} · auto reverified {check.autoReverified} · checked {DateTime.fromISO(check.checkedAt).toFormat('dd LLL HH:mm')}
                </span>
                {check.error ? <span className="muted">{check.error}</span> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

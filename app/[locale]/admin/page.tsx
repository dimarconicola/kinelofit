import Link from 'next/link';

import { StatCard } from '@/components/admin/StatCard';
import { safeAdminRead } from '@/lib/admin/safe';
import { getRuntimeHealth } from '@/lib/ops/health';
import { getCatalogSourceMode, getCollections, getPublicCities, getSeedCities } from '@/lib/catalog/server-data';
import { getCityReadinessServer } from '@/lib/catalog/readiness';
import { isPersistentStoreConfigured, listCalendarSubmissions, listClaims, listDigestSubscriptions, listOutboundEvents } from '@/lib/runtime/store';
import { listDiscoveryLeadSummaries } from '@/lib/freshness/service';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const [claims, submissions, leads, digests, outbound, readiness, sourceMode, publicCities, seedCities, collections, health] = await Promise.all([
    safeAdminRead('claims', () => listClaims(), []),
    safeAdminRead('calendar submissions', () => listCalendarSubmissions(), []),
    safeAdminRead('discovery leads', () => listDiscoveryLeadSummaries('palermo', 60), []),
    safeAdminRead('digest subscriptions', () => listDigestSubscriptions(), []),
    safeAdminRead('outbound clicks', () => listOutboundEvents(), []),
    safeAdminRead('city readiness', () => getCityReadinessServer('palermo'), {
      citySlug: 'palermo',
      venues: 0,
      upcomingSessions: 0,
      neighborhoods: 0,
      styles: 0,
      ctaCoverage: 0,
      passesGate: false
    }),
    safeAdminRead('catalog source mode', () => getCatalogSourceMode(), 'seed'),
    safeAdminRead('public cities', () => getPublicCities(), []),
    safeAdminRead('seed cities', () => getSeedCities(), []),
    safeAdminRead('collections', () => getCollections('palermo'), []),
    safeAdminRead('runtime health', () => getRuntimeHealth('palermo'), { checks: [], hasFailures: true, hasWarnings: true })
  ]);

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">Admin overview</p>
        <h1>Operational truth before expansion.</h1>
      </section>
      <section className="admin-grid">
        <StatCard label="Public cities" value={String(publicCities.length)} detail="Only Palermo is public in v1." />
        <StatCard label="Seed cities" value={String(seedCities.length)} detail="Hidden until supply density is real." />
        <StatCard label="Supply gate" value={readiness.passesGate ? 'Passed' : 'Blocked'} detail={`${readiness.upcomingSessions} sessions over 7 days`} />
        <StatCard label="Catalog source" value={sourceMode} detail="Internal runtime source mode." />
        <StatCard
          label="Operator inbox"
          value={String(claims.length + submissions.length + leads.length)}
          detail={isPersistentStoreConfigured() ? 'Claims, submissions, and lead review stored in Postgres.' : 'Operational queues are on fallback storage.'}
        />
        <StatCard label="Outbound clicks" value={String(outbound.length)} detail="Intent tracking captured via click-out CTAs." />
        <StatCard label="Collections" value={String(collections.length)} detail="Rule-based and editorial surfaces." />
        <StatCard label="Runtime health" value={health.hasFailures ? 'Fail' : health.hasWarnings ? 'Warn' : 'OK'} detail={`${health.checks.length} release checks`} />
        <StatCard label="Digest signups" value={String(digests.length)} detail="Retention signal before monetization." />
      </section>
      <section className="card-grid">
        <Link href={`/${locale}/admin/imports`} className="admin-link">Import spec and CSV validation</Link>
        <Link href={`/${locale}/admin/health`} className="admin-link">Release health and env checks</Link>
        <Link href={`/${locale}/admin/freshness`} className="admin-link">Freshness queue and broken-link review</Link>
        <Link href={`/${locale}/admin/sources`} className="admin-link">Source registry and discovery leads</Link>
        <Link href={`/${locale}/admin/inbox`} className="admin-link">Unified moderation inbox</Link>
        <Link href={`/${locale}/admin/collections`} className="admin-link">Editorial collections</Link>
        <Link href={`/${locale}/admin/taxonomy`} className="admin-link">Category visibility and city rules</Link>
      </section>
    </div>
  );
}

import Link from 'next/link';

import { StatCard } from '@/components/admin/StatCard';
import { getCatalogSourceMode, getCollections, getPublicCities, getSeedCities } from '@/lib/catalog/server-data';
import { getCityReadinessServer } from '@/lib/catalog/readiness';
import { isPersistentStoreConfigured, listClaims, listDigestSubscriptions, listOutboundEvents } from '@/lib/runtime/store';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const claims = await listClaims();
  const digests = await listDigestSubscriptions();
  const outbound = await listOutboundEvents();
  const [readiness, sourceMode, publicCities, seedCities, collections] = await Promise.all([
    getCityReadinessServer('palermo'),
    getCatalogSourceMode(),
    getPublicCities(),
    getSeedCities(),
    getCollections('palermo')
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
          value={String(claims.length + digests.length)}
          detail={isPersistentStoreConfigured() ? 'Claims and digest signups stored in Postgres.' : 'Claims and digest signups stored in local fallback files.'}
        />
        <StatCard label="Outbound clicks" value={String(outbound.length)} detail="Intent tracking captured via click-out CTAs." />
        <StatCard label="Collections" value={String(collections.length)} detail="Rule-based and editorial surfaces." />
      </section>
      <section className="card-grid">
        <Link href={`/${locale}/admin/imports`} className="admin-link">Import spec and CSV validation</Link>
        <Link href={`/${locale}/admin/freshness`} className="admin-link">Freshness queue and broken-link review</Link>
        <Link href={`/${locale}/admin/sources`} className="admin-link">Source registry and discovery leads</Link>
        <Link href={`/${locale}/admin/claims`} className="admin-link">Claims and calendar submissions inbox</Link>
        <Link href={`/${locale}/admin/collections`} className="admin-link">Editorial collections</Link>
        <Link href={`/${locale}/admin/taxonomy`} className="admin-link">Category visibility and city rules</Link>
      </section>
    </div>
  );
}

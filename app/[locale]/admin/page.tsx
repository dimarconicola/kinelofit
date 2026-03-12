import Link from 'next/link';

import { StatCard } from '@/components/admin/StatCard';
import { getCollections, getPublicCities, getSeedCities } from '@/lib/catalog/data';
import { getCityReadiness } from '@/lib/catalog/readiness';
import { isPersistentStoreConfigured, listClaims, listDigestSubscriptions, listOutboundEvents } from '@/lib/runtime/store';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const readiness = getCityReadiness('palermo');
  const claims = await listClaims();
  const digests = await listDigestSubscriptions();
  const outbound = await listOutboundEvents();

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">Admin overview</p>
        <h1>Operational truth before expansion.</h1>
      </section>
      <section className="admin-grid">
        <StatCard label="Public cities" value={String(getPublicCities().length)} detail="Only Palermo is public in v1." />
        <StatCard label="Seed cities" value={String(getSeedCities().length)} detail="Hidden until supply density is real." />
        <StatCard label="Supply gate" value={readiness.passesGate ? 'Passed' : 'Blocked'} detail={`${readiness.upcomingSessions} sessions over 7 days`} />
        <StatCard
          label="Operator inbox"
          value={String(claims.length + digests.length)}
          detail={isPersistentStoreConfigured() ? 'Claims and digest signups stored in Postgres.' : 'Claims and digest signups stored in local fallback files.'}
        />
        <StatCard label="Outbound clicks" value={String(outbound.length)} detail="Intent tracking captured via click-out CTAs." />
        <StatCard label="Collections" value={String(getCollections('palermo').length)} detail="Rule-based and editorial surfaces." />
      </section>
      <section className="card-grid">
        <Link href={`/${locale}/admin/imports`} className="admin-link">Import spec and CSV validation</Link>
        <Link href={`/${locale}/admin/freshness`} className="admin-link">Freshness queue and broken-link review</Link>
        <Link href={`/${locale}/admin/claims`} className="admin-link">Claim approvals and operator inbox</Link>
        <Link href={`/${locale}/admin/collections`} className="admin-link">Editorial collections</Link>
        <Link href={`/${locale}/admin/taxonomy`} className="admin-link">Category visibility and city rules</Link>
      </section>
    </div>
  );
}

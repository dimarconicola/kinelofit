import Link from 'next/link';

import { DigestForm } from '@/components/forms/DigestForm';
import { SessionCard } from '@/components/discovery/SessionCard';
import { StatCard } from '@/components/admin/StatCard';
import { getSessionUser } from '@/lib/auth/session';
import { getCityMetrics, getCollections, getFeaturedSessions, getLocaleLabel, getNeighborhoods, getPublicCategories } from '@/lib/catalog/data';
import { requirePublicCity } from '@/lib/catalog/guards';
import { getCityReadiness } from '@/lib/catalog/readiness';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function CityPage({ params }: { params: Promise<{ locale: string; city: string }> }) {
  const { locale: rawLocale, city: citySlug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const city = requirePublicCity(citySlug);
  const metrics = getCityMetrics(citySlug);
  const readiness = getCityReadiness(citySlug);
  const categories = getPublicCategories(citySlug);
  const neighborhoods = getNeighborhoods(citySlug);
  const collections = getCollections(citySlug);
  const user = await getSessionUser();

  return (
    <div className="stack-list">
      <section className="city-hero">
        <div className="hero-copy">
          <p className="eyebrow">{getLocaleLabel(locale, city.name)}</p>
          <h1>{getLocaleLabel(locale, city.hero)}</h1>
          <p>{dict.browseWithoutSignup}</p>
          <div className="site-actions">
            <Link href={`/${locale}/${citySlug}/classes`} className="button button-primary">
              {dict.exploreClasses}
            </Link>
            <Link href={`/${locale}/${citySlug}/collections/today-nearby`} className="button button-ghost">
              {dict.todayNearby}
            </Link>
          </div>
        </div>
        <div className="hero-copy">
          <div className="hero-metrics">
            <StatCard label="Weekly classes" value={String(metrics.sessions)} detail="Visible across the next seven days." />
            <StatCard label="Studios" value={String(metrics.venues)} detail="Verified for Palermo v1 coverage." />
            <StatCard label={dict.supplyGate} value={readiness.passesGate ? 'Passed' : 'Blocked'} detail={`${Math.round(readiness.ctaCoverage * 100)}% CTA coverage`} />
          </div>
        </div>
      </section>

      <section className="detail-hero">
        <div className="panel">
          <div className="detail-header">
            <div>
              <p className="eyebrow">Featured classes</p>
              <h2>Useful now, not someday.</h2>
            </div>
            <Link href={`/${locale}/${citySlug}/classes`} className="inline-link">
              See full calendar
            </Link>
          </div>
          <div className="stack-list">
            {getFeaturedSessions(citySlug).slice(0, 4).map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                locale={locale}
                signedInEmail={user?.email}
                saveLabel={dict.save}
                savedLabel={dict.unsave}
                scheduleLabel={dict.saveSchedule}
              />
            ))}
          </div>
        </div>
        <div className="stack-list">
          <div className="panel">
            <p className="eyebrow">Categories</p>
            <div className="card-grid">
              {categories.map((category) => (
                <Link key={category.slug} href={`/${locale}/${citySlug}/categories/${category.slug}`} className="collection-card">
                  <strong>{getLocaleLabel(locale, category.name)}</strong>
                  <span className="muted">{getLocaleLabel(locale, category.description)}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="panel">
            <p className="eyebrow">Neighborhoods</p>
            <div className="card-grid">
              {neighborhoods.map((item) => (
                <Link key={item.slug} href={`/${locale}/${citySlug}/neighborhoods/${item.slug}`} className="collection-card">
                  <strong>{getLocaleLabel(locale, item.name)}</strong>
                  <span className="muted">{getLocaleLabel(locale, item.description)}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="panel">
            <p className="eyebrow">Collections</p>
            <div className="stack-list">
              {collections.map((collection) => (
                <Link key={collection.slug} href={`/${locale}/${citySlug}/collections/${collection.slug}`} className="collection-card">
                  <strong>{getLocaleLabel(locale, collection.title)}</strong>
                  <span className="muted">{getLocaleLabel(locale, collection.description)}</span>
                </Link>
              ))}
            </div>
          </div>
          <DigestForm citySlug={citySlug} locale={locale} />
        </div>
      </section>
    </div>
  );
}

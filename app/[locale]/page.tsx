import Link from 'next/link';

import { DigestForm } from '@/components/forms/DigestForm';
import { getPublicCities, getSeedCities, getCityMetrics, getLocaleLabel } from '@/lib/catalog/data';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const publicCities = getPublicCities();
  const seedCities = getSeedCities();

  return (
    <div className="stack-list">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Palermo-seeded discovery</p>
          <h1>{dict.cityFinder}</h1>
          <p>
            kinelo.fit launches as a sharply edited city utility: map-led, bilingual, and built around schedule trust rather than booking theatrics.
          </p>
          <div className="site-actions">
            <Link href={`/${locale}/palermo/classes`} className="button button-primary">
              {dict.exploreClasses}
            </Link>
            <Link href={`/${locale}/palermo`} className="button button-ghost">
              Palermo hub
            </Link>
          </div>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Why it is different</p>
          <div className="stack-list">
            <div className="metric-card">
              <strong>Local density first</strong>
              <span className="muted">One city gets useful before the next one appears publicly.</span>
            </div>
            <div className="metric-card">
              <strong>Yoga-led, wellness-ready</strong>
              <span className="muted">Brand stays broad while the first consumer wedge stays narrow and strong.</span>
            </div>
            <div className="metric-card">
              <strong>Freshness as trust</strong>
              <span className="muted">Every surface emphasizes verification, source quality, and click-out confidence.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="locale-home-grid">
        <div className="panel">
          <p className="eyebrow">Public city</p>
          <div className="card-grid">
            {publicCities.map((city) => {
              const metrics = getCityMetrics(city.slug);
              return (
                <Link className="city-card" key={city.slug} href={`/${locale}/${city.slug}`}>
                  <p className="eyebrow">{getLocaleLabel(locale, city.name)}</p>
                  <h3>{metrics.sessions}</h3>
                  <p>{getLocaleLabel(locale, city.hero)}</p>
                  <p className="muted">{metrics.venues} venues · {metrics.neighborhoods} neighborhoods · {metrics.styles} styles</p>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">Seed pipeline</p>
          <div className="stack-list">
            {seedCities.map((city) => (
              <div className="metric-card" key={city.slug}>
                <strong>{getLocaleLabel(locale, city.name)}</strong>
                <span className="muted">{dict.comingSoon}</span>
              </div>
            ))}
          </div>
          <DigestForm citySlug="palermo" locale={locale} />
        </div>
      </section>
    </div>
  );
}

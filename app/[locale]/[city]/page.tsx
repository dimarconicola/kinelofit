import NextLink from 'next/link';
import { Button, Card, CardBody, Link } from '@heroui/react';

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
  const copy =
    locale === 'it'
      ? {
          weeklyClasses: 'Classi settimanali',
          weeklyClassesDetail: 'Visibili nei prossimi sette giorni.',
          studios: 'Studi',
          studiosDetail: 'Verificati per la copertura Palermo v1.',
          gatePassed: 'Superata',
          gateBlocked: 'Bloccata',
          featured: 'Classi in evidenza',
          featuredTitle: 'Utili oggi, non in teoria.',
          fullCalendar: 'Apri calendario completo',
          categories: 'Categorie',
          neighborhoods: 'Quartieri',
          collections: 'Collezioni',
          ctaCoverage: 'Copertura CTA'
        }
      : {
          weeklyClasses: 'Weekly classes',
          weeklyClassesDetail: 'Visible across the next seven days.',
          studios: 'Studios',
          studiosDetail: 'Verified for Palermo v1 coverage.',
          gatePassed: 'Passed',
          gateBlocked: 'Blocked',
          featured: 'Featured classes',
          featuredTitle: 'Useful now, not someday.',
          fullCalendar: 'See full calendar',
          categories: 'Categories',
          neighborhoods: 'Neighborhoods',
          collections: 'Collections',
          ctaCoverage: 'CTA coverage'
        };

  return (
    <div className="stack-list city-page">
      <section className="city-hero city-hero-refresh">
        <div className="hero-copy city-hero-main">
          <p className="eyebrow">{getLocaleLabel(locale, city.name)}</p>
          <h1>{getLocaleLabel(locale, city.hero)}</h1>
          <p>{dict.browseWithoutSignup}</p>
          <div className="site-actions">
            <Button as={NextLink} href={`/${locale}/${citySlug}/classes`} color="primary" radius="full" className="button button-primary">
              {dict.exploreClasses}
            </Button>
            <Button
              as={NextLink}
              href={`/${locale}/${citySlug}/collections/today-nearby`}
              variant="ghost"
              radius="full"
              className="button button-ghost"
            >
              {dict.todayNearby}
            </Button>
          </div>
        </div>
        <div className="hero-copy city-hero-metrics">
          <div className="hero-metrics">
            <StatCard label={copy.weeklyClasses} value={String(metrics.sessions)} detail={copy.weeklyClassesDetail} />
            <StatCard label={copy.studios} value={String(metrics.venues)} detail={copy.studiosDetail} />
            <StatCard
              label={dict.supplyGate}
              value={readiness.passesGate ? copy.gatePassed : copy.gateBlocked}
              detail={`${Math.round(readiness.ctaCoverage * 100)}% ${copy.ctaCoverage}`}
            />
          </div>
        </div>
      </section>

      <section className="detail-hero city-detail-grid">
        <div className="panel">
          <div className="detail-header">
            <div>
              <p className="eyebrow">{copy.featured}</p>
              <h2>{copy.featuredTitle}</h2>
            </div>
            <Link as={NextLink} href={`/${locale}/${citySlug}/classes`} className="inline-link">
              {copy.fullCalendar}
            </Link>
          </div>
          <div className="stack-list">
            {getFeaturedSessions(citySlug).slice(0, 4).map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                locale={locale}
                signedInEmail={user?.email}
                scheduleLabel={dict.saveSchedule}
              />
            ))}
          </div>
        </div>
        <div className="stack-list">
          <div className="panel">
            <p className="eyebrow">{copy.categories}</p>
            <div className="card-grid">
              {categories.map((category) => (
                <Card as={NextLink} key={category.slug} href={`/${locale}/${citySlug}/categories/${category.slug}`} isPressable className="collection-card">
                  <CardBody>
                    <strong>{getLocaleLabel(locale, category.name)}</strong>
                    <span className="muted">{getLocaleLabel(locale, category.description)}</span>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
          <div className="panel">
            <p className="eyebrow">{copy.neighborhoods}</p>
            <div className="card-grid">
              {neighborhoods.map((item) => (
                <Card as={NextLink} key={item.slug} href={`/${locale}/${citySlug}/neighborhoods/${item.slug}`} isPressable className="collection-card">
                  <CardBody>
                    <strong>{getLocaleLabel(locale, item.name)}</strong>
                    <span className="muted">{getLocaleLabel(locale, item.description)}</span>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
          <div className="panel">
            <p className="eyebrow">{copy.collections}</p>
            <div className="stack-list">
              {collections.map((collection) => (
                <Card as={NextLink} key={collection.slug} href={`/${locale}/${citySlug}/collections/${collection.slug}`} isPressable className="collection-card">
                  <CardBody>
                    <strong>{getLocaleLabel(locale, collection.title)}</strong>
                    <span className="muted">{getLocaleLabel(locale, collection.description)}</span>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
          <DigestForm citySlug={citySlug} locale={locale} />
        </div>
      </section>
    </div>
  );
}

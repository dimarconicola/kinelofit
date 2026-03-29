import { notFound } from 'next/navigation';

import { DigestForm } from '@/components/forms/DigestForm';
import { SessionCard } from '@/components/discovery/SessionCard';
import { LoopVideo } from '@/components/media/LoopVideo';
import { StatCard } from '@/components/admin/StatCard';
import { ServerButtonLink, ServerCardLink, ServerLink } from '@/components/ui/server';
import { getSessionUser } from '@/lib/auth/session';
import { applySessionFilters } from '@/lib/catalog/filters';
import { getCatalogSnapshot } from '@/lib/catalog/repository';
import { resolveSessionCardDataFromSnapshot } from '@/lib/catalog/session-card-data';
import { getLocaleLabel } from '@/lib/catalog/server-data';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';
import { pexelsVideos } from '@/lib/media/pexels-videos';
import { getRuntimeCapabilities } from '@/lib/runtime/capabilities';

export default async function CityPage({ params }: { params: Promise<{ locale: string; city: string }> }) {
  const { locale: rawLocale, city: citySlug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const catalog = await getCatalogSnapshot();
  const city = catalog.cities.find((item) => item.slug === citySlug);
  if (!city || city.status !== 'public') {
    notFound();
  }
  const categories = catalog.categories.filter((item) => item.citySlug === citySlug && item.visibility !== 'hidden');
  const neighborhoods = catalog.neighborhoods.filter((item) => item.citySlug === citySlug);
  const collections = catalog.collections.filter((item) => item.citySlug === citySlug);
  const instructors = catalog.instructors
    .filter((item) => item.citySlug === citySlug)
    .sort((left, right) => left.name.localeCompare(right.name, 'it', { sensitivity: 'base' }));
  const visibleCategorySlugs = new Set(categories.map((item) => item.slug));
  const visibleSessions = catalog.sessions.filter(
    (session) => session.citySlug === citySlug && session.verificationStatus !== 'hidden' && visibleCategorySlugs.has(session.categorySlug)
  );
  const weekSessions = applySessionFilters(visibleSessions, { date: 'week' });
  const featuredSessionPreview = weekSessions.slice(0, 4);
  const cityVenues = catalog.venues.filter((venue) => venue.citySlug === citySlug);
  const metrics = {
    venues: cityVenues.length,
    sessions: weekSessions.length,
    neighborhoods: new Set(cityVenues.map((venue) => venue.neighborhoodSlug)).size,
    styles: new Set(weekSessions.map((session) => session.styleSlug)).size
  };
  const [user, resolvedFeaturedSessions, runtimeCapabilities] = await Promise.all([
    getSessionUser(),
    Promise.resolve(resolveSessionCardDataFromSnapshot(catalog, featuredSessionPreview)),
    getRuntimeCapabilities()
  ]);
  const copy =
    locale === 'it'
      ? {
          weeklyClasses: 'Classi settimanali',
          weeklyClassesDetail: 'Nei prossimi 7 giorni',
          studios: 'Studi',
          studiosDetail: 'Verificati a Palermo.',
          neighborhoods: 'Quartieri coperti',
          neighborhoodsDetail: 'Zone utili gia presenti in guida.',
          featured: 'Classi in evidenza',
          featuredTitle: 'Utili oggi.',
          fullCalendar: 'Apri calendario completo',
          categories: 'Categorie',
          neighborhoodsSection: 'Quartieri',
          collections: 'Collezioni',
          studiosSection: 'Studi',
          studiosTitle: 'Luoghi da scegliere prima ancora dell’orario.',
          studiosLead: 'Una directory studio-centrica con lista, mappa e ritmo settimanale per capire dove tornare davvero.',
          openStudios: 'Apri elenco completo',
          teachers: 'Insegnanti',
          teachersTitle: 'Le Persone dietro lo studio.',
          teachersLead: 'Profili alfabetici per capire chi guida le pratiche prima di scegliere una lezione.',
          openTeachers: 'Apri elenco completo',
          movementTitle: 'Una città che si muove in tanti registri',
          movementBody: 'Stretching dolce, discipline aeree e pratiche che cambiano tono senza perdere chiarezza.',
          movementCta: 'Apri tutte le classi'
        }
      : {
          weeklyClasses: 'Weekly classes',
          weeklyClassesDetail: 'Across the next 7 days',
          studios: 'Studios',
          studiosDetail: 'Verified for Palermo.',
          neighborhoods: 'Neighborhoods covered',
          neighborhoodsDetail: 'Areas already useful in the guide.',
          featured: 'Featured classes',
          featuredTitle: 'Useful now, not someday.',
          fullCalendar: 'See full calendar',
          categories: 'Categories',
          neighborhoodsSection: 'Neighborhoods',
          collections: 'Collections',
          studiosSection: 'Studios',
          studiosTitle: 'Places worth choosing before the slot.',
          studiosLead: 'A studio-first directory with list, map, and weekly rhythm so you can decide where you want to come back.',
          openStudios: 'Open full directory',
          teachers: 'Teachers',
          teachersTitle: 'People, not just slots.',
          teachersLead: 'Alphabetical profiles to understand who leads each practice before choosing a class.',
          openTeachers: 'Open full directory',
          movementTitle: 'One city, many tempos',
          movementBody: 'Gentle stretching, aerial work, and sharper practices all live in the same clear discovery flow.',
          movementCta: 'Open all classes'
        };

  return (
    <div className="stack-list city-page">
      <section className="city-hero city-hero-refresh">
        <div className="hero-copy city-hero-main">
          <p className="eyebrow">{getLocaleLabel(locale, city.name)}</p>
          <h1>{getLocaleLabel(locale, city.hero)}</h1>
          <p>{dict.browseWithoutSignup}</p>
          <div className="site-actions">
            <ServerButtonLink href={`/${locale}/${citySlug}/classes`} className="button-primary">
              {dict.exploreClasses}
            </ServerButtonLink>
            <ServerButtonLink href={`/${locale}/${citySlug}/collections/today-nearby`} className="button-ghost">
              {dict.todayNearby}
            </ServerButtonLink>
          </div>
        </div>
        <div className="hero-copy city-hero-metrics">
          <div className="hero-metrics">
            <StatCard label={copy.weeklyClasses} value={String(metrics.sessions)} detail={copy.weeklyClassesDetail} detailClassName="stat-card-detail-subtle" />
            <StatCard label={copy.studios} value={String(metrics.venues)} detail={copy.studiosDetail} />
            <StatCard label={copy.neighborhoods} value={String(metrics.neighborhoods)} detail={copy.neighborhoodsDetail} />
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
            <ServerLink href={`/${locale}/${citySlug}/classes`} className="inline-link">
              {copy.fullCalendar}
            </ServerLink>
          </div>
          <div className="stack-list">
            {featuredSessionPreview.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                locale={locale}
                resolved={resolvedFeaturedSessions.get(session.id)!}
                signedInEmail={user?.email}
                scheduleLabel={dict.saveSchedule}
                runtimeCapabilities={runtimeCapabilities}
              />
            ))}
          </div>
        </div>
        <div className="stack-list">
          <div className="panel city-motion-panel">
            <div className="city-motion-copy">
              <p className="eyebrow">{getLocaleLabel(locale, city.name)}</p>
              <h2>{copy.movementTitle}</h2>
              <p className="muted">{copy.movementBody}</p>
              <ServerLink href={`/${locale}/${citySlug}/classes`} className="inline-link">
                {copy.movementCta}
              </ServerLink>
            </div>
            <div className="city-motion-grid" aria-hidden="true">
              <div className="city-motion-media city-motion-media-tall">
                <LoopVideo src={pexelsVideos.stretching} label="Stretching class" poster="/home-hero.jpg" className="city-motion-video" />
              </div>
              <div className="city-motion-media">
                <LoopVideo src={pexelsVideos.aerial} label="Aerial practice" poster="/home-hero.jpg" className="city-motion-video" />
              </div>
            </div>
          </div>
          <div className="panel">
            <p className="eyebrow">{copy.categories}</p>
            <div className="card-grid">
              {categories.map((category) => (
                <ServerCardLink key={category.slug} href={`/${locale}/${citySlug}/categories/${category.slug}`} className="collection-card">
                  <strong>{getLocaleLabel(locale, category.name)}</strong>
                  <span className="muted">{getLocaleLabel(locale, category.description)}</span>
                </ServerCardLink>
              ))}
            </div>
          </div>
          <div className="panel">
            <p className="eyebrow">{copy.neighborhoodsSection}</p>
            <div className="card-grid">
              {neighborhoods.map((item) => (
                <ServerCardLink key={item.slug} href={`/${locale}/${citySlug}/neighborhoods/${item.slug}`} className="collection-card">
                  <strong>{getLocaleLabel(locale, item.name)}</strong>
                  <span className="muted">{getLocaleLabel(locale, item.description)}</span>
                </ServerCardLink>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="detail-header">
              <div>
                <p className="eyebrow">{copy.studiosSection}</p>
                <h2>{copy.studiosTitle}</h2>
                <p className="muted">{copy.studiosLead}</p>
              </div>
              <ServerLink href={`/${locale}/${citySlug}/studios`} className="inline-link">
                {copy.openStudios}
              </ServerLink>
            </div>
            <div className="card-grid">
              {cityVenues.slice(0, 4).map((venue) => (
                <ServerCardLink key={venue.slug} href={`/${locale}/${citySlug}/studios/${venue.slug}`} className="collection-card">
                  <strong>{venue.name}</strong>
                  <span className="muted">{venue.tagline[locale]}</span>
                </ServerCardLink>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="detail-header">
              <div>
                <p className="eyebrow">{copy.teachers}</p>
                <h2>{copy.teachersTitle}</h2>
                <p className="muted">{copy.teachersLead}</p>
              </div>
              <ServerLink href={`/${locale}/${citySlug}/teachers`} className="inline-link">
                {copy.openTeachers}
              </ServerLink>
            </div>
            <div className="card-grid">
              {instructors.slice(0, 4).map((instructor) => (
                <ServerCardLink key={instructor.slug} href={`/${locale}/${citySlug}/teachers/${instructor.slug}`} className="collection-card">
                  <strong>{instructor.name}</strong>
                  <span className="muted">{instructor.shortBio[locale]}</span>
                </ServerCardLink>
              ))}
            </div>
          </div>
          <div className="panel">
            <p className="eyebrow">{copy.collections}</p>
            <div className="stack-list">
              {collections.map((collection) => (
                <ServerCardLink key={collection.slug} href={`/${locale}/${citySlug}/collections/${collection.slug}`} className="collection-card">
                  <strong>{getLocaleLabel(locale, collection.title)}</strong>
                  <span className="muted">{getLocaleLabel(locale, collection.description)}</span>
                </ServerCardLink>
              ))}
            </div>
          </div>
          <DigestForm citySlug={citySlug} locale={locale} />
        </div>
      </section>
    </div>
  );
}

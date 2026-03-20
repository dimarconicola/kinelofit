import Image from 'next/image';
import { DateTime } from 'luxon';

import { DigestForm } from '@/components/forms/DigestForm';
import { ServerButtonLink, ServerCard, ServerCardLink, ServerChip } from '@/components/ui/server';
import { getCityMetrics, getFeaturedSessions, getStyle, getVenue } from '@/lib/catalog/server-data';
import { resolveLocale } from '@/lib/i18n/routing';

type IconName = 'map' | 'calendar' | 'mail' | 'leaf' | 'heart' | 'sun';

function InlineIcon({ name }: { name: IconName }) {
  if (name === 'map') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 7.5 8.5 5l7 2.5L21 5v11.5l-5.5 2.5-7-2.5L3 19V7.5Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8.5 5v11.5m7-9V19" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  if (name === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="15" rx="2.6" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 3.5v4m8-4v4M3.5 9.5h17" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  if (name === 'mail') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.6" stroke="currentColor" strokeWidth="1.7" />
        <path d="m4.5 7 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  if (name === 'leaf') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M19.5 4.5C13.5 4.7 8 7.2 5.5 12.5A7 7 0 0 0 18 19c3-2.5 4.5-8 1.5-14.5Z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 14c2.5-.8 4.8-2.2 7-4.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  if (name === 'heart') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 8.9 5.5c1.5 0 2.5.6 3.1 1.7.6-1.1 1.7-1.7 3.1-1.7a4.4 4.4 0 0 1 4.4 4.4C19.5 15.4 12 20 12 20Z" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="5.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 2.8v2.8M12 18.4v2.8M4.8 12h2.8m8.8 0h2.8M6.7 6.7 8.7 8.7m6.6 6.6 2 2m0-10.6-2 2m-6.6 6.6-2 2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const [metrics, featured] = await Promise.all([getCityMetrics('palermo'), getFeaturedSessions('palermo')]);

  const levelLabel = (level: string) => {
    if (locale === 'it') {
      if (level === 'beginner') return 'Principianti';
      if (level === 'intermediate') return 'Intermedio';
      if (level === 'advanced') return 'Avanzato';
      return 'Aperti a tutti';
    }
    if (level === 'beginner') return 'Beginner';
    if (level === 'intermediate') return 'Intermediate';
    if (level === 'advanced') return 'Advanced';
    return 'All Levels';
  };

  const copy =
    locale === 'it'
      ? {
          heroBadge: 'Discovery locale Palermo-first',
          heroTitle: 'Scopri la lezione ideale nella tua città.',
          heroBody:
            'kinelo.fit è un utility cittadino: mappa, calendario verificato e percorsi diretti verso prenotazione o contatto.',
          ctaPrimary: 'Esplora le classi',
          ctaSecondary: 'Palermo hub',
          featuresEyebrow: 'Perché è diverso',
          featuresTitle: 'Guida cittadini selezionata e curata con amore.',
          featuresBody:
            'Calendario selezionato delle lezioni di yoga e altre attività di benessere, nella tua città.',
          cityTitle: 'Palermo Hub',
          cityBody: 'Il calendario cittadino per yoga, mind-body e attività benessere affidabili.',
          classes: 'Classi',
          venues: 'Studi',
          neighborhoods: 'Quartieri',
          styles: 'Stili',
          viewDetails: 'Apri dettaglio',
          fullSchedule: 'Vedi calendario completo',
          newsletterTitle: 'Muoviti meglio, ogni settimana',
          newsletterBody:
            'Aggiornamenti mirati: lezioni verificate, variazioni orarie, nuove aperture e selezioni curate per Palermo.',
          newsletterOne: 'Aggiornamenti utili, zero rumore',
          newsletterTwo: 'Niente spam',
          weeklyArticles: 'Aggiornamenti settimanali',
          weeklyArticlesBody: 'Novità, nuove attività e variazioni di calendario in un unico digest.',
          noSpam: 'Solo contenuti rilevanti',
          noSpamBody: 'Ti scriviamo solo quando c’è qualcosa di davvero utile da sapere.'
        }
      : {
          heroBadge: 'Palermo-seeded discovery',
          heroTitle: 'Find the right class in your city',
          heroBody:
            'kinelo.fit is a sharply edited city utility: map-led discovery, verified schedules, and clear action paths.',
          ctaPrimary: 'Explore classes',
          ctaSecondary: 'Palermo hub',
          featuresEyebrow: 'Why it is different',
          featuresTitle: 'A sharply edited city utility',
          featuresBody:
            'We believe finding the right mind-body practice should be as calming as the practice itself. No noise, just clarity.',
          cityTitle: 'Palermo Hub',
          cityBody: 'The citywide yoga and mind-body calendar for Palermo.',
          classes: 'Classes',
          venues: 'Venues',
          neighborhoods: 'Neighborhoods',
          styles: 'Styles',
          viewDetails: 'View details',
          fullSchedule: 'View full schedule',
          newsletterTitle: 'Stay close to the best-fit classes.',
          newsletterBody:
            'Get only useful updates: verified classes, timetable changes, new openings, and curated picks for Palermo.',
          newsletterOne: 'Useful updates only',
          newsletterTwo: 'No spam',
          weeklyArticles: 'Weekly articles',
          weeklyArticlesBody: 'Insights on wellness, new studio openings, and instructor spotlights.',
          noSpam: 'No spam',
          noSpamBody: 'We respect your inbox. Only high-quality, relevant updates.'
        };

  const features = [
    {
      icon: 'map' as const,
      title: locale === 'it' ? 'Per quartiere, non per scroll' : 'Map-led Discovery',
      description:
        locale === 'it'
          ? 'Trova classi vicino a te. Mappa e prossimità al centro.'
          : 'Find classes in your neighborhood. We prioritize location and proximity over endless scrolling.'
    },
    {
      icon: 'calendar' as const,
      title: locale === 'it' ? 'Orari affidabili' : 'Schedule Trust',
      description:
        locale === 'it'
          ? 'Calendario aggiornato, contatti diretti. Nessuna sorpresa.'
          : 'A citywide calendar you can rely on. No booking theatrics, just accurate times and venues.'
    },
    {
      icon: 'mail' as const,
      title: locale === 'it' ? 'Digest settimanale' : 'Weekly Digest',
      description:
        locale === 'it'
          ? 'Nuove classi, variazioni e aperture in un unico aggiornamento curato.'
          : 'Stay close to the best-fit classes with our curated weekly updates sent straight to your inbox.'
    },
    {
      icon: 'leaf' as const,
      title: locale === 'it' ? 'Solo mind-body' : 'Organic Growth',
      description:
        locale === 'it'
          ? 'Yoga, pilates, meditazione e pratiche benessere complementari.'
          : 'Seed pipeline approach ensures we only list quality, verified venues and instructors.'
    },
    {
      icon: 'heart' as const,
      title: locale === 'it' ? 'Catalogo selezionato' : 'Mind-Body Focus',
      description:
        locale === 'it'
          ? 'Cresce solo quando qualità e copertura locale sono solide.'
          : 'Specialized in yoga, pilates, meditation, and holistic wellness practices.'
    },
    {
      icon: 'sun' as const,
      title: locale === 'it' ? 'Strumento pubblico' : 'Public City Utility',
      description:
        locale === 'it'
          ? 'Gratuito, accessibile, pensato per la comunità di Palermo.'
          : 'Built as a public good for the community, making wellness accessible and transparent.'
    }
  ];

  return (
    <div className="home-v2">
      <section className="home-v2-hero">
        <div className="home-v2-shell">
          <div className="home-v2-hero-grid">
            <div className="home-v2-hero-copy">
              <div className="home-v2-badge">
                <InlineIcon name="map" />
                <span>{copy.heroBadge}</span>
              </div>
              <h1>{copy.heroTitle}</h1>
              <p>{copy.heroBody}</p>
              <div className="home-v2-hero-actions">
                <ServerButtonLink href={`/${locale}/palermo/classes`} className="home-v2-btn home-v2-btn-primary">
                  <span>{copy.ctaPrimary}</span>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </ServerButtonLink>
                <ServerButtonLink href={`/${locale}/palermo`} className="home-v2-btn home-v2-btn-secondary">
                  {copy.ctaSecondary}
                </ServerButtonLink>
              </div>
            </div>
            <div className="home-v2-hero-visual">
              <div className="home-v2-photo-wrap">
                <Image
                  src="/home-hero.jpg"
                  alt="Yoga class in Palermo"
                  fill
                  sizes="(max-width: 960px) 100vw, 44vw"
                  priority
                />
                <div className="home-v2-photo-ring" aria-hidden />
              </div>
              <div className="home-v2-photo-glow home-v2-photo-glow-left" aria-hidden />
              <div className="home-v2-photo-glow home-v2-photo-glow-right" aria-hidden />
            </div>
          </div>
        </div>
      </section>

      <section className="home-v2-features">
        <div className="home-v2-shell">
          <div className="home-v2-features-head">
            <p>{copy.featuresEyebrow}</p>
            <h2>{copy.featuresTitle}</h2>
            <p>{copy.featuresBody}</p>
          </div>
          <div className="home-v2-features-grid">
            {features.map((feature) => (
              <ServerCard key={feature.title} className="home-v2-feature-item">
                <div className="home-v2-feature-icon">
                  <InlineIcon name={feature.icon} />
                </div>
                <div className="p-0">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </ServerCard>
            ))}
          </div>
        </div>
      </section>

      <section className="home-v2-cityhub">
        <div className="home-v2-shell">
          <div className="home-v2-cityhub-head">
            <h2>{copy.cityTitle}</h2>
            <p>{copy.cityBody}</p>
            <div className="home-v2-metric-pills">
              <ServerChip>
                {metrics.sessions} {copy.classes}
              </ServerChip>
              <ServerChip>
                {metrics.venues} {copy.venues}
              </ServerChip>
              <ServerChip>
                {metrics.neighborhoods} {copy.neighborhoods}
              </ServerChip>
              <ServerChip>
                {metrics.styles} {copy.styles}
              </ServerChip>
            </div>
          </div>
          <div className="home-v2-cards-grid">
            {(await Promise.all(
              featured.slice(0, 4).map(async (session) => {
                const [venue, style] = await Promise.all([getVenue(session.venueSlug), getStyle(session.styleSlug)]);
              if (!venue || !style) return null;
              const start = DateTime.fromISO(session.startAt).setZone('Europe/Rome');
              const end = DateTime.fromISO(session.endAt).setZone('Europe/Rome');

              return (
                <ServerCard key={session.id} className="home-v2-class-card">
                  <div className="home-v2-class-top">
                    <time>{start.toFormat('HH:mm')} - {end.toFormat('HH:mm')}</time>
                    <span>{levelLabel(session.level)}</span>
                  </div>
                  <h3>{session.title[locale]}</h3>
                  <div className="home-v2-class-meta">
                    <p>{venue.name}</p>
                    <p>{style.name[locale]}</p>
                  </div>
                  <ServerCardLink href={`/${locale}/${session.citySlug}/studios/${venue.slug}`} className="home-v2-class-link">
                    {copy.viewDetails}
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </ServerCardLink>
                </ServerCard>
              );
              })
            ))}
          </div>
          <div className="home-v2-cityhub-cta">
            <ServerButtonLink href={`/${locale}/palermo/classes`} className="home-v2-btn home-v2-btn-secondary">
              {copy.fullSchedule}
            </ServerButtonLink>
          </div>
        </div>
      </section>

      <section id="newsletter-digest" className="home-v2-newsletter">
        <div className="home-v2-shell">
          <div className="home-v2-newsletter-grid">
            <div className="home-v2-newsletter-copy">
              <h2>{copy.newsletterTitle}</h2>
              <p>{copy.newsletterBody}</p>
              <div className="home-v2-newsletter-pills">
                <span>{copy.newsletterOne}</span>
                <span>{copy.newsletterTwo}</span>
              </div>
            </div>
            <div className="home-v2-newsletter-form">
              <DigestForm citySlug="palermo" locale={locale} showIntro={false} compact className="newsletter-inline-digest" surface="plain" />
              <div className="home-v2-newsletter-notes">
                <article>
                  <h3>{copy.weeklyArticles}</h3>
                  <p>{copy.weeklyArticlesBody}</p>
                </article>
                <article>
                  <h3>{copy.noSpam}</h3>
                  <p>{copy.noSpamBody}</p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

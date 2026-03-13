import Link from 'next/link';

import { DigestForm } from '@/components/forms/DigestForm';
import { getCityMetrics, getLocaleLabel, getPublicCities, getSeedCities } from '@/lib/catalog/data';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const publicCities = getPublicCities();
  const seedCities = getSeedCities();

  const copy =
    locale === 'it'
      ? {
          heroEyebrow: 'Discovery locale Palermo-first',
          heroTitle: 'Scopri la lezione ideale nella tua città.',
          heroLead:
            'kinelo.fit è un utility cittadino: mappa, calendario verificato e percorsi diretti verso prenotazione o contatto.',
          heroPrimary: 'Esplora le classi',
          heroSecondary: 'Palermo hub',
          whyEyebrow: 'Perché è diverso',
          whyTitle: 'Utility cittadino selezionato al millimetro.',
          whyLead: 'Trovare la pratica perfetta deve essere semplice e piacevole quanto praticarla.',
          features: [
            {
              title: 'Per quartiere, non per scroll',
              body: 'Trova classi vicino a te. Mappa e prossimità al centro.'
            },
            {
              title: 'Orari affidabili',
              body: 'Calendario aggiornato, contatti diretti. Nessuna sorpresa.'
            },
            {
              title: 'Digest settimanale',
              body: 'Nuove classi, variazioni e aperture in un unico aggiornamento curato.'
            },
            {
              title: 'Solo mind-body',
              body: 'Yoga, pilates, meditazione e pratiche benessere complementari.'
            },
            {
              title: 'Catalogo selezionato',
              body: 'Cresce solo quando qualità e copertura locale sono solide.'
            },
            {
              title: 'Strumento pubblico',
              body: 'Gratuito, accessibile, pensato per la comunità di Palermo.'
            }
          ],
          publicCities: 'Città pubbliche',
          seedPipeline: 'Pipeline seed',
          comingSoon: 'Coming soon'
        }
      : {
          heroEyebrow: 'Local Palermo-first discovery',
          heroTitle: 'Discover the ideal class in your city.',
          heroLead: 'kinelo.fit is a city utility: map-led discovery, verified schedule, and direct booking/contact paths.',
          heroPrimary: 'Explore classes',
          heroSecondary: 'Palermo hub',
          whyEyebrow: 'Why it is different',
          whyTitle: 'A sharply edited city utility.',
          whyLead: 'Finding the right practice should be simple and pleasant.',
          features: [
            {
              title: 'By neighborhood, not by scroll',
              body: 'Find classes near you. Map and proximity first.'
            },
            {
              title: 'Reliable schedule',
              body: 'Updated calendar, direct contacts, no surprises.'
            },
            {
              title: 'Weekly digest',
              body: 'New classes, updates, and openings in one curated feed.'
            },
            {
              title: 'Mind-body only',
              body: 'Yoga, pilates, meditation, and complementary wellness practices.'
            },
            {
              title: 'Curated catalog',
              body: 'It grows only when quality and local coverage are truly solid.'
            },
            {
              title: 'Public utility',
              body: 'Free, accessible, and designed for the Palermo community.'
            }
          ],
          publicCities: 'Public cities',
          seedPipeline: 'Seed pipeline',
          comingSoon: 'Coming soon'
        };

  return (
    <div className="stack-list">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{copy.heroEyebrow}</p>
          <h1>{copy.heroTitle}</h1>
          <p>{copy.heroLead}</p>
          <div className="site-actions">
            <Link href={`/${locale}/palermo/classes`} className="button button-primary">
              {copy.heroPrimary}
            </Link>
            <Link href={`/${locale}/palermo`} className="button button-ghost">
              {copy.heroSecondary}
            </Link>
          </div>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">{copy.whyEyebrow}</p>
          <h2>{copy.whyTitle}</h2>
          <p className="lead">{copy.whyLead}</p>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">{copy.whyEyebrow}</p>
        <div className="card-grid">
          {copy.features.map((feature) => (
            <article key={feature.title} className="metric-card">
              <strong>{feature.title}</strong>
              <span className="muted">{feature.body}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="locale-home-grid">
        <div className="panel">
          <p className="eyebrow">{copy.publicCities}</p>
          <div className="card-grid">
            {publicCities.map((city) => {
              const metrics = getCityMetrics(city.slug);
              return (
                <Link className="city-card" key={city.slug} href={`/${locale}/${city.slug}`}>
                  <p className="eyebrow">{getLocaleLabel(locale, city.name)}</p>
                  <h3>{metrics.sessions}</h3>
                  <p>{getLocaleLabel(locale, city.hero)}</p>
                  <p className="muted">
                    {locale === 'it'
                      ? `${metrics.venues} studi · ${metrics.neighborhoods} quartieri · ${metrics.styles} stili`
                      : `${metrics.venues} studios · ${metrics.neighborhoods} neighborhoods · ${metrics.styles} styles`}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <p className="eyebrow">{copy.seedPipeline}</p>
          <div className="stack-list">
            {seedCities.map((city) => (
              <div className="metric-card" key={city.slug}>
                <strong>{getLocaleLabel(locale, city.name)}</strong>
                <span className="muted">{copy.comingSoon}</span>
              </div>
            ))}
          </div>
          <DigestForm citySlug="palermo" locale={locale} />
        </div>
      </section>
    </div>
  );
}

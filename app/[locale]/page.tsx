import Link from 'next/link';

import { DigestForm } from '@/components/forms/DigestForm';
import { getCity, getCityMetrics, getLocaleLabel, getPublicCities } from '@/lib/catalog/data';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const publicCities = getPublicCities();
  const catania = getCity('catania');
  const labels =
    locale === 'it'
      ? {
          venues: 'studi',
          neighborhoods: 'quartieri',
          styles: 'stili'
        }
      : {
          venues: 'venues',
          neighborhoods: 'neighborhoods',
          styles: 'styles'
        };

  return (
    <div className="stack-list locale-home">
      <section className="hero locale-hero">
        <div className="hero-copy hero-copy-primary">
          <p className="eyebrow">{locale === 'it' ? 'Discovery locale' : 'Local discovery'}</p>
          <h1>{dict.cityFinder}</h1>
          <p>
            {locale === 'it'
              ? 'kinelo.fit parte da Palermo con un catalogo verificato: orari chiari, filtri utili e percorsi di prenotazione reali.'
              : 'kinelo.fit starts in Palermo with verified schedules, practical filters, and real booking/contact paths.'}
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
        <div className="hero-copy hero-copy-secondary">
          <p className="eyebrow">{locale === 'it' ? 'Perche usarlo' : 'Why it works'}</p>
          <div className="stack-list">
            <div className="metric-card">
              <strong>{locale === 'it' ? 'Copertura locale prima di tutto' : 'Local density first'}</strong>
              <p className="muted">
                {locale === 'it'
                  ? 'Una citta deve essere utile prima di aprire la successiva.'
                  : 'One city must become useful before opening the next one.'}
              </p>
            </div>
            <div className="metric-card">
              <strong>{locale === 'it' ? 'Yoga + benessere urbano' : 'Yoga-led, wellness-ready'}</strong>
              <p className="muted">
                {locale === 'it'
                  ? 'Il prodotto resta focalizzato su classi affidabili e facilmente prenotabili.'
                  : 'The product stays focused on trustworthy classes with clear action paths.'}
              </p>
            </div>
            <div className="metric-card">
              <strong>{locale === 'it' ? 'Freschezza come fiducia' : 'Freshness as trust'}</strong>
              <p className="muted">
                {locale === 'it'
                  ? 'Mostriamo fonti, verifiche e contatti sempre aggiornabili.'
                  : 'Source quality and freshness stay visible on every surface.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="locale-home-grid">
        <div className="panel">
          <p className="eyebrow">{locale === 'it' ? 'Citta pubbliche' : 'Public cities'}</p>
          <div className="card-grid">
            {publicCities.map((city) => {
              const metrics = getCityMetrics(city.slug);
              return (
                <Link className="city-card" key={city.slug} href={`/${locale}/${city.slug}`}>
                  <p className="eyebrow">{getLocaleLabel(locale, city.name)}</p>
                  <h3>{metrics.sessions}</h3>
                  <p>{getLocaleLabel(locale, city.hero)}</p>
                  <p className="muted">
                    {metrics.venues} {labels.venues} · {metrics.neighborhoods} {labels.neighborhoods} · {metrics.styles} {labels.styles}
                  </p>
                </Link>
              );
            })}
            {catania ? (
              <div className="city-card" aria-label="Catania coming soon">
                <p className="eyebrow">{getLocaleLabel(locale, catania.name)}</p>
                <h3>{locale === 'it' ? 'In arrivo' : 'Coming soon'}</h3>
                <p>{getLocaleLabel(locale, catania.hero)}</p>
                <p className="muted">{locale === 'it' ? 'Attivazione quando la copertura raggiunge la stessa soglia di Palermo.' : 'Launches after reaching the same supply and freshness gate as Palermo.'}</p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">{locale === 'it' ? 'Aggiornamenti' : 'Stay updated'}</p>
          <p className="lead">
            {locale === 'it'
              ? 'Ricevi ogni settimana le nuove classi verificate e gli aggiornamenti di calendario.'
              : 'Get weekly updates with newly verified classes and timetable changes.'}
          </p>
          <DigestForm citySlug="palermo" locale={locale} />
        </div>
      </section>
    </div>
  );
}

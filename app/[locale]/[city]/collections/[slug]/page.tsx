import { notFound } from 'next/navigation';

import { SessionCard } from '@/components/discovery/SessionCard';
import { getSessionUser } from '@/lib/auth/session';
import { getCollectionSessions, getCollections } from '@/lib/catalog/data';
import { requirePublicCity } from '@/lib/catalog/guards';
import { getEditorialComponent } from '@/lib/content/registry';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function CollectionPage({ params }: { params: Promise<{ locale: string; city: string; slug: string }> }) {
  const { locale: rawLocale, city: citySlug, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  requirePublicCity(citySlug);
  const collection = getCollections(citySlug).find((item) => item.slug === slug);
  if (!collection) notFound();
  const sessions = getCollectionSessions(citySlug, slug);
  const Component = getEditorialComponent(citySlug, slug, locale);
  const user = await getSessionUser();

  return (
    <div className="stack-list">
      <section className="collection-layout">
        <div className="panel">
          <p className="eyebrow">Collection</p>
          <h1>{collection.title[locale]}</h1>
          <p className="lead">{collection.description[locale]}</p>
          {Component ? <Component /> : null}
        </div>
        <div className="panel">
          <p className="eyebrow">What this surface does</p>
          <p className="lead">Collections give the product a curated layer without forcing a recommendation engine too early.</p>
        </div>
      </section>
      <section className="panel">
        <div className="stack-list">
          {sessions.map((session) => (
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
      </section>
    </div>
  );
}

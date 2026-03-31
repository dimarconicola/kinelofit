import { notFound } from 'next/navigation';
import { SessionCard } from '@/components/discovery/SessionCard';
import { ServerButtonLink } from '@/components/ui/server';
import { resolveSessionCardData } from '@/lib/catalog/session-card-data';
import { getCategory, getCategorySessions } from '@/lib/catalog/server-data';
import { requirePublicCityServer } from '@/lib/catalog/guards';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; city: string; slug: string }> }) {
  const { locale: rawLocale, city: citySlug, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  await requirePublicCityServer(citySlug);
  const [category, sessions] = await Promise.all([getCategory(slug), getCategorySessions(citySlug, slug)]);
  if (!category || category.visibility === 'hidden') notFound();
  const resolvedSessions = await resolveSessionCardData(sessions);
  const labels = locale === 'it' ? { category: 'Categoria' } : { category: 'Category' };

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">{labels.category}</p>
        <h1>{category.name[locale]}</h1>
        <p className="lead">{category.description[locale]}</p>
        <p className="muted">{category.heroMetric[locale]}</p>
        <div className="site-actions">
          <ServerButtonLink href={`/${locale}/${citySlug}/classes?category=${category.slug}`} className="button-primary">
            {dict.exploreClasses}
          </ServerButtonLink>
        </div>
      </section>
      <section className="panel">
        <div className="stack-list">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} locale={locale} resolved={resolvedSessions.get(session.id)!} scheduleLabel={dict.saveSchedule} />
          ))}
        </div>
      </section>
    </div>
  );
}

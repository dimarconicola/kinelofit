import { notFound } from 'next/navigation';

import { SessionCard } from '@/components/discovery/SessionCard';
import { getSessionUser } from '@/lib/auth/session';
import { getCategory, getCategorySessions } from '@/lib/catalog/data';
import { requirePublicCity } from '@/lib/catalog/guards';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; city: string; slug: string }> }) {
  const { locale: rawLocale, city: citySlug, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  requirePublicCity(citySlug);
  const category = getCategory(slug);
  if (!category || category.visibility === 'hidden') notFound();
  const sessions = getCategorySessions(citySlug, slug);
  const user = await getSessionUser();
  const labels = locale === 'it' ? { category: 'Categoria' } : { category: 'Category' };

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">{labels.category}</p>
        <h1>{category.name[locale]}</h1>
        <p className="lead">{category.description[locale]}</p>
        <p className="muted">{category.heroMetric[locale]}</p>
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

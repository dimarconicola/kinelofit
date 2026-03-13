import Link from 'next/link';

import { getSessionUser } from '@/lib/auth/session';
import { sessions } from '@/lib/catalog/seed';
import { resolveLocale } from '@/lib/i18n/routing';
import { listUserSchedule } from '@/lib/runtime/store';
import { formatSessionTime } from '@/lib/ui/format';

export default async function SchedulePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const user = await getSessionUser();
  const copy =
    locale === 'it'
      ? {
          signInNeeded: 'Accedi per salvare la tua agenda personale.',
          signIn: 'Accedi',
          eyebrow: 'Agenda',
          title: 'Agenda salvata',
          lead: 'Qui trovi solo le lezioni con orario che hai salvato per pianificare la settimana.',
          empty: 'Nessuna lezione salvata in agenda. Aggiungila dalle card delle classi.'
        }
      : {
          signInNeeded: 'Sign in to save your personal schedule.',
          signIn: 'Sign in',
          eyebrow: 'Schedule',
          title: 'Saved schedule',
          lead: 'This page only shows time slots you saved to plan your week.',
          empty: 'No classes saved in your schedule yet. Add them from class cards.'
        };

  if (!user) {
    return (
      <div className="empty-state">
        <p>{copy.signInNeeded}</p>
        <Link href={`/${locale}/sign-in`} className="button button-primary">
          {copy.signIn}
        </Link>
      </div>
    );
  }

  const scheduleRows = await listUserSchedule(user.id);
  const scheduleItems = scheduleRows
    .map((sessionId) => sessions.find((session) => session.id === sessionId))
    .filter((session): session is NonNullable<typeof session> => Boolean(session))
    .map((session) => ({
      key: session.id,
      href: `/${locale}/${session.citySlug}/studios/${session.venueSlug}`,
      title: session.title[locale],
      meta: formatSessionTime(session.startAt, locale)
    }));

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="lead">{copy.lead}</p>
      </section>

      <section className="panel">
        {scheduleItems.length > 0 ? (
          <div className="stack-list">
            {scheduleItems.map((item) => (
              <Link href={item.href} key={item.key} className="list-link">
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">{copy.empty}</p>
        )}
      </section>
    </div>
  );
}

import NextLink from 'next/link';
import { Button } from '@heroui/react';

import { SavedScheduleClient } from '@/components/state/SavedScheduleClient';
import { getSessionUser } from '@/lib/auth/session';
import { getCatalogSnapshot } from '@/lib/catalog/repository';
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
        <Button as={NextLink} href={`/${locale}/sign-in`} color="primary" radius="full" className="button button-primary">
          {copy.signIn}
        </Button>
      </div>
    );
  }

  const scheduleRows = await listUserSchedule(user.id);
  const catalog = await getCatalogSnapshot();
  const sessionItems = catalog.sessions.map((session) => ({
    id: session.id,
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
        <SavedScheduleClient signedInEmail={user.email} initialScheduleIds={scheduleRows} sessions={sessionItems} emptyLabel={copy.empty} />
      </section>
    </div>
  );
}

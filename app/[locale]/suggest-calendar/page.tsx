import { CalendarSubmissionForm } from '@/components/forms/CalendarSubmissionForm';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function SuggestCalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);

  const copy =
    locale === 'it'
      ? {
          eyebrow: 'Per studi e insegnanti',
          title: 'Invia il tuo calendario',
          lead:
            'Se hai classi a Palermo, inviaci le fonti pubbliche e gli orari. Verifichiamo e pubblichiamo nel catalogo locale.'
        }
      : {
          eyebrow: 'For studios and teachers',
          title: 'Submit your calendar',
          lead:
            'If you run classes in Palermo, send public sources and timetable details. We verify before publishing.'
        };

  return (
    <section className="detail-hero">
      <div className="panel stack-list">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="lead">{copy.lead}</p>
      </div>
      <CalendarSubmissionForm locale={locale} citySlug="palermo" />
    </section>
  );
}

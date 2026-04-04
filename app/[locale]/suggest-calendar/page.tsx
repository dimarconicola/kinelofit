import { CalendarSubmissionForm } from '@/components/forms/CalendarSubmissionForm';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function SuggestCalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const copy =
    locale === 'it'
        ? {
          eyebrow: 'Per studi e insegnanti',
          title: 'Suggerisci il tuo calendario',
          lead:
            'Se gestisci classi a Palermo, inviaci fonti pubbliche e orari. Verifichiamo prima di pubblicare nel catalogo.',
          cta: 'Scrivici via email',
          formTitle: 'Invio rapido'
        }
      : {
          eyebrow: 'For studios and teachers',
          title: 'Suggest your calendar',
          lead:
            'If you run classes in Palermo, send public sources and schedules. We verify before publishing in the catalog.',
          cta: 'Email us',
          formTitle: 'Quick submission'
        };

  return (
    <div className="stack-list">
      <section className="panel stack-list">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="lead">{copy.lead}</p>
        <div className="site-actions">
          <a href="mailto:hello@kinelo.fit" className="button button-primary">
            {copy.cta}
          </a>
        </div>
      </section>
      <section className="panel stack-list">
        <p className="eyebrow">{copy.formTitle}</p>
        <CalendarSubmissionForm locale={locale} citySlug="palermo" />
      </section>
    </div>
  );
}

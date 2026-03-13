import { resolveLocale } from '@/lib/i18n/routing';

export default async function WhoWeArePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const copy =
    locale === 'it'
      ? {
          eyebrow: 'Chi siamo',
          title: 'Un progetto locale, pensato per Palermo.',
          lead:
            'kinelo.fit nasce per rendere la discovery di yoga e mind-body più affidabile: orari verificati, mappe utili e azioni dirette.'
        }
      : {
          eyebrow: 'Who we are',
          title: 'A local project designed for Palermo.',
          lead:
            'kinelo.fit exists to make yoga and mind-body discovery more reliable: verified schedules, useful maps, and direct actions.'
        };

  return (
    <section className="panel stack-list">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="lead">{copy.lead}</p>
    </section>
  );
}

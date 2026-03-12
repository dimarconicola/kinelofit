import { resolveLocale } from '@/lib/i18n/routing';

export default async function WhoWeArePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);

  const copy =
    locale === 'it'
      ? {
          eyebrow: 'Chi siamo',
          title: 'Un team locale ossessionato dalla qualita del calendario.',
          lead:
            'kinelo.fit nasce a Palermo per rendere immediato trovare classi affidabili, con orari chiari e CTA reali.',
          points: [
            'Verifichiamo fonti pubbliche e aggiorniamo i calendari con segnali di freschezza.',
            'Mostriamo solo sessioni utili, con percorso diretto verso prenotazione o contatto.',
            'Costruiamo una guida bilingue per locali ed expat, senza frizioni inutili.'
          ]
        }
      : {
          eyebrow: 'Who we are',
          title: 'A local team obsessed with schedule quality.',
          lead:
            'kinelo.fit started in Palermo to make class discovery reliable, fast, and grounded in real booking/contact paths.',
          points: [
            'We verify public sources and keep timetable freshness visible.',
            'We only surface sessions with a direct action path.',
            'We build bilingual discovery for both locals and expats.'
          ]
        };

  return (
    <section className="detail-hero">
      <div className="panel stack-list">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="lead">{copy.lead}</p>
      </div>
      <div className="panel">
        <ul className="mdx-list">
          {copy.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

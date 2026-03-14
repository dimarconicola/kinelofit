import { resolveLocale } from '@/lib/i18n/routing';

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const copy =
    locale === 'it'
      ? {
          eyebrow: 'Privacy Policy',
          title: 'Come trattiamo i dati su kinelo.fit',
          lead:
            'kinelo.fit raccoglie il minimo necessario per fornire discovery locale, preferiti, agenda salvata e richieste inviate dal form.',
          sections: [
            {
              title: 'Dati raccolti',
              body: 'Possiamo trattare email di accesso, preferiti, agenda salvata, form di contatto e metriche tecniche di base necessarie al funzionamento del servizio.'
            },
            {
              title: 'Finalita',
              body: 'Usiamo questi dati per autenticazione, persistenza delle preferenze, gestione delle segnalazioni calendario, analisi operativa e sicurezza della piattaforma.'
            },
            {
              title: 'Conservazione',
              body: 'I dati vengono conservati solo per il tempo utile al servizio o agli obblighi tecnici e amministrativi. In ambienti preview alcune preferenze possono usare storage locale del browser.'
            },
            {
              title: 'Contatti',
              body: 'Per richieste su privacy, rettifica o rimozione dati, contatta il team kinelo.fit tramite i canali pubblicati sul sito.'
            }
          ]
        }
      : {
          eyebrow: 'Privacy Policy',
          title: 'How kinelo.fit handles data',
          lead:
            'kinelo.fit collects the minimum necessary to provide local discovery, favorites, saved schedule, and submission workflows.',
          sections: [
            {
              title: 'Data collected',
              body: 'We may process sign-in email, favorites, saved schedule, submission form data, and essential technical analytics needed to operate the service.'
            },
            {
              title: 'Purpose',
              body: 'We use this data for authentication, preference persistence, calendar submission handling, operational analytics, and platform security.'
            },
            {
              title: 'Retention',
              body: 'Data is retained only for the time useful to the service or required by technical and administrative obligations. In preview environments some preferences may use browser-local storage.'
            },
            {
              title: 'Contact',
              body: 'For privacy, correction, or deletion requests, contact the kinelo.fit team through the public site channels.'
            }
          ]
        };

  return (
    <section className="panel stack-list">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="lead">{copy.lead}</p>
      {copy.sections.map((section) => (
        <section key={section.title} className="stack-list">
          <h2>{section.title}</h2>
          <p className="muted">{section.body}</p>
        </section>
      ))}
    </section>
  );
}

import Image from 'next/image';
import { DateTime } from 'luxon';
import { notFound } from 'next/navigation';

import { ServerCardLink, ServerChip, ServerLink } from '@/components/ui/server';
import { getPublicCitySnapshot } from '@/lib/catalog/public-read-models';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function TeachersIndexPage({ params }: { params: Promise<{ locale: string; city: string }> }) {
  const { locale: rawLocale, city: citySlug } = await params;
  const locale = resolveLocale(rawLocale);
  const snapshot = await getPublicCitySnapshot(citySlug);
  if (!snapshot) notFound();

  const instructors = snapshot.instructors;
  const teacherSummaryBySlug = new Map(snapshot.teacherSummaries.map((summary) => [summary.instructorSlug, summary] as const));

  const copy =
    locale === 'it'
      ? {
          eyebrow: 'Insegnanti',
          title: 'Le tue guide a Palermo',
          lead:
            'Elenco alfabetico degli insegnanti oggi presenti nella lista, con profili, prossime lezioni e link esterni se disponibili.',
          sessions: 'sessioni in calendario',
          next: 'Prossima lezione',
          open: 'Apri profilo',
          verifiedLink: 'Link verificato',
          noNext: 'Calendario pubblico non ancora attivo per questo profilo.'
        }
      : {
          eyebrow: 'Teachers',
          title: 'Who leads practice in Palermo',
          lead:
            'Alphabetical teacher directory with concise profiles, upcoming classes, and verified external links when available.',
          sessions: 'scheduled sessions',
          next: 'Next class',
          open: 'Open profile',
          verifiedLink: 'Verified link',
          noNext: 'No public upcoming session is currently active for this profile.'
        };

  return (
    <div className="stack-list teachers-directory-page">
      <section className="panel teachers-directory-hero">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="lead">{copy.lead}</p>
      </section>

      <section className="teachers-directory-grid">
        {instructors.map((instructor) => {
          const summary = teacherSummaryBySlug.get(instructor.slug);
          const nextLabel = summary?.nextSessionStartAt
            ? DateTime.fromISO(summary.nextSessionStartAt).setZone('Europe/Rome').toFormat(locale === 'it' ? 'ccc d LLL · HH:mm' : 'ccc d LLL · HH:mm')
            : null;
          const socialLink = instructor.socialLinks?.[0];

          return (
            <article key={instructor.slug} className="panel teacher-directory-card">
              <div className="teacher-directory-top">
                {instructor.headshot ? (
                  <div className="teacher-directory-media">
                    <Image
                      src={instructor.headshot.url}
                      alt={instructor.headshot.alt[locale]}
                      width={144}
                      height={144}
                      className="teacher-directory-image"
                    />
                  </div>
                ) : (
                  <div className="teacher-directory-placeholder" aria-hidden="true">
                    {instructor.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                )}

                <div className="teacher-directory-copy">
                  <p className="eyebrow">{instructor.name}</p>
                  <p className="lead">{instructor.shortBio[locale]}</p>
                  <div className="teacher-directory-tags">
                    {instructor.languages.map((language) => (
                      <ServerChip key={`${instructor.slug}-${language}`} tone="meta">
                        {language}
                      </ServerChip>
                    ))}
                    <ServerChip tone="meta">
                      {summary?.sessionCount ?? 0} {copy.sessions}
                    </ServerChip>
                  </div>
                </div>
              </div>

              <div className="teacher-directory-meta">
                <div>
                  <p className="eyebrow">{copy.next}</p>
                  <p className="muted">{nextLabel ?? copy.noNext}</p>
                </div>
                {socialLink ? (
                  <div>
                    <p className="eyebrow">{copy.verifiedLink}</p>
                    <ServerLink href={socialLink.href} target="_blank" rel="noreferrer" className="inline-link">
                      {socialLink.label[locale]}
                    </ServerLink>
                  </div>
                ) : null}
              </div>

              <ServerCardLink href={`/${locale}/${citySlug}/teachers/${instructor.slug}`} className="teacher-directory-link-card">
                <strong>{copy.open}</strong>
                <span className="muted">{instructor.name}</span>
              </ServerCardLink>
            </article>
          );
        })}
      </section>
    </div>
  );
}

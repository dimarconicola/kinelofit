import { notFound } from 'next/navigation';
import NextLink from 'next/link';
import { Button } from '@heroui/react';

import { ClaimForm } from '@/components/forms/ClaimForm';
import { getVenue } from '@/lib/catalog/server-data';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function ClaimStudioPage({ params }: { params: Promise<{ locale: string; studioSlug: string }> }) {
  const { locale: rawLocale, studioSlug } = await params;
  const locale = resolveLocale(rawLocale);
  const venue = await getVenue(studioSlug);
  if (!venue) notFound();
  const copy =
    locale === 'it'
      ? {
          eyebrow: 'Rivendica il tuo studio',
          lead:
            'Accesso claim leggero: verifica proprietà, aggiorna i dettagli e mantieni affidabile il calendario senza migrare software.',
          back: 'Torna allo studio'
        }
      : {
          eyebrow: 'Claim your studio',
          lead:
            'Claim access is intentionally lightweight: verify ownership, fix details, and keep the schedule trustworthy without migrating software.',
          back: 'Back to studio'
        };

  return (
    <section className="detail-hero">
      <div className="panel">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{venue.name}</h1>
        <p className="lead">{copy.lead}</p>
        <div className="site-actions">
          <Button as={NextLink} href={`/${locale}/${venue.citySlug}/studios/${venue.slug}`} variant="ghost" radius="full" className="button button-ghost">
            {copy.back}
          </Button>
        </div>
      </div>
      <ClaimForm studioSlug={studioSlug} locale={locale} />
    </section>
  );
}

import { notFound } from 'next/navigation';

import { ClaimForm } from '@/components/forms/ClaimForm';
import { getVenue } from '@/lib/catalog/data';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function ClaimStudioPage({ params }: { params: Promise<{ locale: string; studioSlug: string }> }) {
  const { locale: rawLocale, studioSlug } = await params;
  const locale = resolveLocale(rawLocale);
  const venue = getVenue(studioSlug);
  if (!venue) notFound();

  return (
    <section className="detail-hero">
      <div className="panel">
        <p className="eyebrow">Claim your studio</p>
        <h1>{venue.name}</h1>
        <p className="lead">Claim access is lightweight by design: verify ownership, correct details, and keep the schedule trustworthy without forcing a software migration.</p>
      </div>
      <ClaimForm studioSlug={studioSlug} locale={locale} />
    </section>
  );
}

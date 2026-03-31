import { notFound } from 'next/navigation';

import { ClassesResultsClient } from '@/components/discovery/ClassesResultsClient';
import { ServerButtonLink, ServerChip } from '@/components/ui/server';
import { parseFilters } from '@/lib/catalog/filters';
import { applyPublicCityFilters } from '@/lib/catalog/public-models';
import { getPublicCitySnapshot } from '@/lib/catalog/public-read-models';
import type { ClassView } from '@/lib/catalog/types';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { resolveLocale } from '@/lib/i18n/routing';
import { getMapRenderMode } from '@/lib/map/runtime';

const isClassView = (value: string | null): value is ClassView => value === 'list' || value === 'map' || value === 'calendar';

const flattenParams = (raw: Record<string, string | string[] | undefined>) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      params.set(key, value);
      continue;
    }

    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      params.set(key, value[0]);
    }
  }

  return params;
};

export default async function ClassesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale, city: citySlug } = await params;
  const locale = resolveLocale(rawLocale);
  const dict = getDictionary(locale);
  const rawSearch = await searchParams;
  const urlParams = flattenParams(rawSearch);
  const filters = parseFilters(rawSearch);

  const requestedView = urlParams.get('view');
  const view: ClassView = isClassView(requestedView) ? requestedView : 'list';
  const requestedPage = Number.parseInt(urlParams.get('page') ?? '1', 10);
  const requestedWeekOffset = Number.parseInt(urlParams.get('week_offset') ?? '0', 10);
  const requestedVenueSlug = urlParams.get('venue') ?? undefined;
  const weekOffset = Number.isFinite(requestedWeekOffset) ? Math.max(0, requestedWeekOffset) : 0;

  const snapshot = await getPublicCitySnapshot(citySlug);
  if (!snapshot) notFound();

  const filteredSessions = applyPublicCityFilters(snapshot, filters);
  const visibleVenueCount = new Set(filteredSessions.map((session) => session.venueSlug)).size;
  const visibleStyleCount = new Set(filteredSessions.map((session) => session.styleSlug)).size;
  const initialPage = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const intro =
    locale === 'it'
      ? 'Classi verificate, con filtri condivisi tra lista, mappa e calendario.'
      : 'Verified classes with a shared filter layer across list, map, and calendar.';
  const badgeCopy =
    locale === 'it'
      ? { matches: 'corrispondenze', venues: 'studi', styles: 'stili attivi', back: 'Torna alla città' }
      : { matches: 'matches', venues: 'venues', styles: 'live styles', back: 'Back to city' };

  return (
    <div className="stack-list classes-page classes-page-refresh">
      <section className="classes-hero classes-hero-single">
        <div className="hero-copy classes-hero-main">
          <p className="eyebrow">{snapshot.city.name[locale]}</p>
          <h1>{dict.classes}</h1>
          <p className="lead">{intro}</p>
          <div className="badge-row classes-hero-badges">
            <ServerChip tone="meta">
              {filteredSessions.length} {badgeCopy.matches}
            </ServerChip>
            <ServerChip tone="meta">
              {visibleVenueCount} {badgeCopy.venues}
            </ServerChip>
            <ServerChip tone="meta">
              {visibleStyleCount} {badgeCopy.styles}
            </ServerChip>
          </div>
          <div className="site-actions classes-hero-actions">
            <ServerButtonLink href={`/${locale}/${citySlug}`} className="button-ghost">
              {badgeCopy.back}
            </ServerButtonLink>
            <ServerButtonLink href={`/${locale}/${citySlug}/collections/today-nearby`} className="button-secondary">
              {dict.todayNearby}
            </ServerButtonLink>
          </div>
        </div>
      </section>

      <ClassesResultsClient
        locale={locale}
        citySlug={citySlug}
        cityName={snapshot.city.name[locale]}
        bounds={snapshot.city.bounds}
        snapshot={snapshot}
        searchIndexEndpoint={`/api/public/cities/${citySlug}/search-index`}
        initialView={view}
        initialWeekOffset={weekOffset}
        initialPage={initialPage}
        initialFilters={filters}
        initialSelectedVenueSlug={requestedVenueSlug}
        mapRenderMode={getMapRenderMode()}
        scheduleLabel={locale === 'it' ? 'Aggiungi in agenda' : 'Add to schedule'}
        noResultsLabel={dict.noResults}
      />
    </div>
  );
}

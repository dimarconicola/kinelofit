'use client';

import NextLink from 'next/link';

import { SessionCard } from '@/components/discovery/SessionCard';
import type { ResolvedSessionCardData } from '@/lib/catalog/session-card-data.shared';
import type { Locale, Session } from '@/lib/catalog/types';

interface ListResultsViewProps {
  locale: Locale;
  pagedSessions: Session[];
  resolvedSessionCards: Record<string, ResolvedSessionCardData>;
  scheduleLabel: string;
  noResultsLabel: string;
  totalPages: number;
  currentPage: number;
  prevHref?: string;
  nextHref?: string;
  onPrevPage?: () => void;
  onNextPage?: () => void;
}

export function ListResultsView({
  locale,
  pagedSessions,
  resolvedSessionCards,
  scheduleLabel,
  noResultsLabel,
  totalPages,
  currentPage,
  prevHref,
  nextHref,
  onPrevPage,
  onNextPage
}: ListResultsViewProps) {
  const labels =
    locale === 'it'
      ? { page: 'Pagina', previous: 'Precedente', next: 'Successiva' }
      : { page: 'Page', previous: 'Previous', next: 'Next' };

  return (
    <>
      <section className="stack-list">
        {pagedSessions.length > 0 ? (
          pagedSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              locale={locale}
              resolved={resolvedSessionCards[session.id]}
              scheduleLabel={scheduleLabel}
            />
          ))
        ) : (
          <div className="empty-state">
            <p>{noResultsLabel}</p>
          </div>
        )}
      </section>

      {totalPages > 1 ? (
        <section className="panel pagination-row">
          <span className="muted">
            {labels.page} {currentPage} / {totalPages}
          </span>
          <div className="site-actions">
            {prevHref ? (
              <NextLink href={prevHref} className="button button-ghost">
                {labels.previous}
              </NextLink>
            ) : onPrevPage ? (
              <button type="button" className="button button-ghost" onClick={onPrevPage}>
                {labels.previous}
              </button>
            ) : null}
            {nextHref ? (
              <NextLink href={nextHref} className="button button-primary">
                {labels.next}
              </NextLink>
            ) : onNextPage ? (
              <button type="button" className="button button-primary" onClick={onNextPage}>
                {labels.next}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}

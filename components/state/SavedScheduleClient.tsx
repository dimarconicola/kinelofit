'use client';

import NextLink from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { PersonalCollectionActions } from '@/components/state/PersonalCollectionActions';
import { readStoredSchedule } from '@/components/state/storage';
import type { Locale } from '@/lib/catalog/types';

interface SavedScheduleClientProps {
  locale: Locale;
  signedInEmail: string;
  initialScheduleIds: string[];
  sessions: Array<{ id: string; title: string; href: string; meta: string; startAt: string; endAt: string; venueName: string; address: string }>;
  emptyLabel: string;
  shareLabel: string;
  copiedLabel: string;
  exportLabel: string;
}

export function SavedScheduleClient({
  locale,
  signedInEmail,
  initialScheduleIds,
  sessions,
  emptyLabel,
  shareLabel,
  copiedLabel,
  exportLabel
}: SavedScheduleClientProps) {
  const [scheduleIds, setScheduleIds] = useState(initialScheduleIds);

  useEffect(() => {
    const localScheduleIds = readStoredSchedule(signedInEmail);
    setScheduleIds([...new Set([...initialScheduleIds, ...localScheduleIds])]);
  }, [initialScheduleIds, signedInEmail]);

  const scheduleItems = useMemo(
    () => scheduleIds.map((id) => sessions.find((session) => session.id === id)).filter(Boolean) as typeof sessions,
    [scheduleIds, sessions]
  );
  const shareTitle = locale === 'it' ? 'Agenda salvata kinelo.fit' : 'kinelo.fit saved schedule';
  const shareText = useMemo(() => {
    const topLines = scheduleItems.slice(0, 8).map((item) => `• ${item.title} — ${item.meta}`);
    const more = scheduleItems.length > 8 ? `\n${locale === 'it' ? `+ altre ${scheduleItems.length - 8} lezioni` : `+ ${scheduleItems.length - 8} more classes`}` : '';
    return `${locale === 'it' ? 'La mia agenda salvata su kinelo.fit:' : 'My saved kinelo.fit schedule:'}\n${topLines.join('\n')}${more}`.trim();
  }, [locale, scheduleItems]);
  const calendarEvents = useMemo(
    () =>
      scheduleItems.map((item) => ({
        id: item.id,
        title: item.title,
        startAt: item.startAt,
        endAt: item.endAt,
        location: `${item.venueName}, ${item.address}`,
        description: `${item.title}\n${item.meta}`,
        url: typeof window === 'undefined' ? item.href : new URL(item.href, window.location.origin).toString()
      })),
    [scheduleItems]
  );

  if (scheduleItems.length === 0) {
    return <p className="muted saved-empty-copy">{emptyLabel}</p>;
  }

  return (
    <div className="stack-list">
      <PersonalCollectionActions
        shareTitle={shareTitle}
        shareText={shareText}
        shareLabel={shareLabel}
        copiedLabel={copiedLabel}
        calendarLabel={exportLabel}
        calendarEvents={calendarEvents}
        calendarFileName="kinelofit-agenda.ics"
        calendarName={locale === 'it' ? 'Agenda kinelo.fit' : 'kinelo.fit schedule'}
      />
      {scheduleItems.map((item) => (
        <NextLink href={item.href} key={item.id} className="list-link">
          <strong>{item.title}</strong>
          <span>{item.meta}</span>
        </NextLink>
      ))}
    </div>
  );
}

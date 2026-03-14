'use client';

import NextLink from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Link } from '@heroui/react';

import { readStoredSchedule } from '@/components/state/storage';

interface SavedScheduleClientProps {
  signedInEmail: string;
  initialScheduleIds: string[];
  sessions: Array<{ id: string; title: string; href: string; meta: string }>;
  emptyLabel: string;
}

export function SavedScheduleClient({ signedInEmail, initialScheduleIds, sessions, emptyLabel }: SavedScheduleClientProps) {
  const [scheduleIds, setScheduleIds] = useState(initialScheduleIds);

  useEffect(() => {
    const localScheduleIds = readStoredSchedule(signedInEmail);
    setScheduleIds([...new Set([...initialScheduleIds, ...localScheduleIds])]);
  }, [initialScheduleIds, signedInEmail]);

  const scheduleItems = useMemo(
    () => scheduleIds.map((id) => sessions.find((session) => session.id === id)).filter(Boolean) as typeof sessions,
    [scheduleIds, sessions]
  );

  if (scheduleItems.length === 0) {
    return <p className="muted">{emptyLabel}</p>;
  }

  return (
    <div className="stack-list">
      {scheduleItems.map((item) => (
        <Link as={NextLink} href={item.href} key={item.id} className="list-link">
          <strong>{item.title}</strong>
          <span>{item.meta}</span>
        </Link>
      ))}
    </div>
  );
}

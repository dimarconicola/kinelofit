'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { readStoredSchedule, syncStoredSchedule, toggleStoredSchedule } from '@/components/state/storage';

interface ScheduleButtonProps {
  sessionId: string;
  locale: string;
  signedInEmail?: string;
  label: string;
}

export function ScheduleButton({ sessionId, locale, signedInEmail, label }: ScheduleButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!signedInEmail) return;
    setSaved(readStoredSchedule(signedInEmail).includes(sessionId));

    const controller = new AbortController();
    void fetch(`/api/state/schedule?sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { saved: boolean };
        setSaved(Boolean(payload.saved));
        syncStoredSchedule(signedInEmail, sessionId, Boolean(payload.saved));
      })
      .catch(() => {});

    return () => {
      controller.abort();
    };
  }, [sessionId, signedInEmail]);

  const toggle = async () => {
    if (!signedInEmail) {
      router.push(`/${locale}/sign-in`);
      return;
    }

    setPending(true);
    const optimisticSaved = toggleStoredSchedule(signedInEmail, sessionId);
    const previousSaved = saved;
    setSaved(optimisticSaved);
    try {
      const response = await fetch('/api/state/schedule', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      if (!response.ok) {
        if (response.status === 401) router.push(`/${locale}/sign-in`);
        setSaved(previousSaved);
        syncStoredSchedule(signedInEmail, sessionId, previousSaved);
        return;
      }

      const payload = (await response.json()) as { saved: boolean };
      setSaved(Boolean(payload.saved));
      syncStoredSchedule(signedInEmail, sessionId, Boolean(payload.saved));
    } catch {
      setSaved(previousSaved);
      syncStoredSchedule(signedInEmail, sessionId, previousSaved);
    } finally {
      setPending(false);
    }
  };

  return (
    <button className="button button-secondary" type="button" onClick={toggle} disabled={pending} aria-pressed={saved} aria-busy={pending}>
      {saved ? (locale === 'it' ? 'Salvata' : 'Saved') : label}
    </button>
  );
}

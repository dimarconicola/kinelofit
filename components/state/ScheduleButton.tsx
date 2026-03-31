'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStatus } from '@/components/providers/AuthStatusProvider';
import { readStoredSchedule, syncStoredSchedule, toggleStoredSchedule } from '@/components/state/storage';
import { readApiErrorCode } from '@/lib/errors/api-client';

interface ScheduleButtonProps {
  sessionId: string;
  locale: string;
  label: string;
  savedLabel?: string;
}

export function ScheduleButton({ sessionId, locale, label, savedLabel }: ScheduleButtonProps) {
  const router = useRouter();
  const { signedInEmail, runtimeCapabilities, loading } = useAuthStatus();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const copy =
    locale === 'it'
      ? {
          unavailable: 'Agenda temporaneamente non disponibile.',
          authRequired: 'Accedi per salvare in agenda.'
        }
      : {
          unavailable: 'Schedule is temporarily unavailable.',
          authRequired: 'Sign in to save to schedule.'
        };

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
    setNotice(null);

    if (loading) {
      return;
    }

    if (runtimeCapabilities?.storeMode === 'unavailable' || runtimeCapabilities?.authMode === 'unavailable') {
      setNotice(copy.unavailable);
      return;
    }

    if (!signedInEmail) {
      if (runtimeCapabilities?.authMode === 'dev-local' || runtimeCapabilities?.authMode === 'supabase' || !runtimeCapabilities) {
        router.push(`/${locale}/sign-in`);
      } else {
        setNotice(copy.authRequired);
      }
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
        const code = await readApiErrorCode(response);
        if (response.status === 401 || code === 'AUTH_REQUIRED') {
          router.push(`/${locale}/sign-in`);
        } else {
          setNotice(copy.unavailable);
        }
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
      setNotice(copy.unavailable);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="action-control">
      <button className="button button-secondary" type="button" onClick={toggle} disabled={pending} aria-pressed={saved} aria-busy={pending}>
        {saved ? (savedLabel ?? (locale === 'it' ? 'In agenda' : 'In schedule')) : label}
      </button>
      {notice ? (
        <span className="action-feedback" aria-live="polite">
          {notice}
        </span>
      ) : null}
    </div>
  );
}

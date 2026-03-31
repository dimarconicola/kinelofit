'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStatus } from '@/components/providers/AuthStatusProvider';
import { readStoredFavorites, syncStoredFavorite, toFavoriteKey, toggleStoredFavorite } from '@/components/state/storage';
import { readApiErrorCode } from '@/lib/errors/api-client';

interface FavoriteButtonProps {
  entitySlug: string;
  entityType: 'venue' | 'session' | 'instructor';
  locale: string;
  label: string;
  savedLabel: string;
}

export function FavoriteButton({ entitySlug, entityType, locale, label, savedLabel }: FavoriteButtonProps) {
  const router = useRouter();
  const { signedInEmail, runtimeCapabilities, loading } = useAuthStatus();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const storageKey = signedInEmail ? toFavoriteKey(entityType, entitySlug) : null;
  const copy =
    locale === 'it'
      ? {
          unavailable: 'Preferiti temporaneamente non disponibili.',
          authRequired: 'Accedi per salvare tra i preferiti.'
        }
      : {
          unavailable: 'Favorites are temporarily unavailable.',
          authRequired: 'Sign in to save favorites.'
        };

  useEffect(() => {
    if (!signedInEmail) return;
    setSaved(readStoredFavorites(signedInEmail).includes(toFavoriteKey(entityType, entitySlug)));

    const controller = new AbortController();
    void fetch(`/api/state/favorites?entityType=${encodeURIComponent(entityType)}&entitySlug=${encodeURIComponent(entitySlug)}`, {
      method: 'GET',
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { saved: boolean };
        setSaved(Boolean(payload.saved));
        syncStoredFavorite(signedInEmail, toFavoriteKey(entityType, entitySlug), Boolean(payload.saved));
      })
      .catch(() => {});

    return () => {
      controller.abort();
    };
  }, [entitySlug, entityType, signedInEmail]);

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
    const optimisticSaved = storageKey ? toggleStoredFavorite(signedInEmail, storageKey) : false;
    const previousSaved = saved;
    setSaved(optimisticSaved);
    try {
      const response = await fetch('/api/state/favorites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entityType, entitySlug })
      });
      if (!response.ok) {
        const code = await readApiErrorCode(response);
        if (response.status === 401 || code === 'AUTH_REQUIRED') {
          router.push(`/${locale}/sign-in`);
        } else {
          setNotice(copy.unavailable);
        }
        setSaved(previousSaved);
        if (storageKey) syncStoredFavorite(signedInEmail, storageKey, previousSaved);
        return;
      }

      const payload = (await response.json()) as { saved: boolean };
      setSaved(Boolean(payload.saved));
      if (storageKey) syncStoredFavorite(signedInEmail, storageKey, Boolean(payload.saved));
    } catch {
      setSaved(previousSaved);
      if (storageKey) syncStoredFavorite(signedInEmail, storageKey, previousSaved);
      setNotice(copy.unavailable);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="action-control">
      <button className="button button-ghost" onClick={toggle} type="button" disabled={pending} aria-pressed={saved} aria-busy={pending}>
        {saved ? savedLabel : label}
      </button>
      {notice ? (
        <span className="action-feedback" aria-live="polite">
          {notice}
        </span>
      ) : null}
    </div>
  );
}

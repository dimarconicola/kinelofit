'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { readStoredFavorites, syncStoredFavorite, toFavoriteKey, toggleStoredFavorite } from '@/components/state/storage';

interface FavoriteButtonProps {
  entitySlug: string;
  entityType: 'venue' | 'session' | 'instructor';
  locale: string;
  signedInEmail?: string;
  label: string;
  savedLabel: string;
}

export function FavoriteButton({ entitySlug, entityType, locale, signedInEmail, label, savedLabel }: FavoriteButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const storageKey = signedInEmail ? toFavoriteKey(entityType, entitySlug) : null;

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
    if (!signedInEmail) {
      router.push(`/${locale}/sign-in`);
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
        if (response.status === 401) router.push(`/${locale}/sign-in`);
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
    } finally {
      setPending(false);
    }
  };

  return (
    <button className="button button-ghost" onClick={toggle} type="button" disabled={pending} aria-pressed={saved} aria-busy={pending}>
      {saved ? savedLabel : label}
    </button>
  );
}

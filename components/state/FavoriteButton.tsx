'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';

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
    setSaved(optimisticSaved);
    try {
      const response = await fetch('/api/state/favorites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entityType, entitySlug })
      });
      if (!response.ok) {
        if (response.status === 401) router.push(`/${locale}/sign-in`);
        return;
      }

      const payload = (await response.json()) as { saved: boolean };
      setSaved(Boolean(payload.saved));
      if (storageKey) syncStoredFavorite(signedInEmail, storageKey, Boolean(payload.saved));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button className="button button-ghost" variant="ghost" radius="full" onPress={toggle} type="button" isDisabled={pending}>
      {saved ? savedLabel : label}
    </Button>
  );
}

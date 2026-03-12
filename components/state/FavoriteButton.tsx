'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  useEffect(() => {
    if (!signedInEmail) return;

    const controller = new AbortController();
    void fetch(`/api/state/favorites?entityType=${encodeURIComponent(entityType)}&entitySlug=${encodeURIComponent(entitySlug)}`, {
      method: 'GET',
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { saved: boolean };
        setSaved(Boolean(payload.saved));
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
    } finally {
      setPending(false);
    }
  };

  return (
    <button className="button button-ghost" onClick={toggle} type="button" disabled={pending}>
      {saved ? savedLabel : label}
    </button>
  );
}

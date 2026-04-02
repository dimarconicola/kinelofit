'use client';

import NextLink from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { PersonalCollectionActions } from '@/components/state/PersonalCollectionActions';
import { readStoredFavorites } from '@/components/state/storage';
import type { Locale } from '@/lib/catalog/types';

interface FavoritesCollectionsClientProps {
  locale: Locale;
  signedInEmail: string;
  initialFavoriteKeys: string[];
  venues: Array<{ slug: string; title: string; href: string; meta: string }>;
  instructors: Array<{ slug: string; title: string; href: string; meta: string }>;
  sessions: Array<{ id: string; title: string; href: string; meta: string }>;
  copy: {
    favoritesStudios: string;
    favoritesTeachers: string;
    favoritesClasses: string;
    noFavorites: string;
    shareLabel: string;
    copiedLabel: string;
  };
}

export function FavoritesCollectionsClient({
  locale,
  signedInEmail,
  initialFavoriteKeys,
  venues,
  instructors,
  sessions,
  copy
}: FavoritesCollectionsClientProps) {
  const [favoriteKeys, setFavoriteKeys] = useState(initialFavoriteKeys);

  useEffect(() => {
    const localFavoriteKeys = readStoredFavorites(signedInEmail);

    setFavoriteKeys([...new Set([...initialFavoriteKeys, ...localFavoriteKeys])]);
  }, [initialFavoriteKeys, signedInEmail]);

  const venueFavorites = useMemo(
    () =>
      favoriteKeys
        .filter((key) => key.startsWith('venue:'))
        .map((key) => venues.find((venue) => venue.slug === key.replace('venue:', '')))
        .filter((item): item is (typeof venues)[number] => Boolean(item)),
    [favoriteKeys, venues]
  );
  const instructorFavorites = useMemo(
    () =>
      favoriteKeys
        .filter((key) => key.startsWith('instructor:'))
        .map((key) => instructors.find((instructor) => instructor.slug === key.replace('instructor:', '')))
        .filter((item): item is (typeof instructors)[number] => Boolean(item)),
    [favoriteKeys, instructors]
  );
  const sessionFavorites = useMemo(
    () =>
      favoriteKeys
        .filter((key) => key.startsWith('session:'))
        .map((key) => sessions.find((session) => session.id === key.replace('session:', '')))
        .filter((item): item is (typeof sessions)[number] => Boolean(item)),
    [favoriteKeys, sessions]
  );
  const shareText = useMemo(() => {
    const parts = [
      venueFavorites.slice(0, 3).map((item) => item.title),
      instructorFavorites.slice(0, 3).map((item) => item.title),
      sessionFavorites.slice(0, 3).map((item) => item.title)
    ].flat();
    const preview = parts.slice(0, 6).map((item) => `• ${item}`).join('\n');
    return `${locale === 'it' ? 'Sto seguendo questi preferiti su kinelo.fit:' : 'These are my kinelo.fit favorites:'}\n${preview}`.trim();
  }, [instructorFavorites, locale, sessionFavorites, venueFavorites]);

  return (
    <section className="saved-grid">
      {venueFavorites.length + instructorFavorites.length + sessionFavorites.length > 0 ? (
        <section className="panel saved-section-panel saved-actions-panel">
          <PersonalCollectionActions
            shareTitle={locale === 'it' ? 'Preferiti kinelo.fit' : 'kinelo.fit favorites'}
            shareText={shareText}
            shareLabel={copy.shareLabel}
            copiedLabel={copy.copiedLabel}
          />
        </section>
      ) : null}
      <section className="panel saved-section-panel">
        <div className="saved-section-header">
          <p className="eyebrow">{copy.favoritesStudios}</p>
        </div>
        {venueFavorites.length > 0 ? (
          <div className="stack-list">
            {venueFavorites.map((item) => (
              <NextLink href={item.href} key={`venue:${item.href}`} className="list-link">
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </NextLink>
            ))}
          </div>
        ) : (
          <p className="muted saved-empty-copy">{copy.noFavorites}</p>
        )}
      </section>

      <section className="panel saved-section-panel">
        <div className="saved-section-header">
          <p className="eyebrow">{copy.favoritesTeachers}</p>
        </div>
        {instructorFavorites.length > 0 ? (
          <div className="stack-list">
            {instructorFavorites.map((item) => (
              <NextLink href={item.href} key={`instructor:${item.href}`} className="list-link">
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </NextLink>
            ))}
          </div>
        ) : (
          <p className="muted saved-empty-copy">{copy.noFavorites}</p>
        )}
      </section>

      <section className="panel saved-section-panel">
        <div className="saved-section-header">
          <p className="eyebrow">{copy.favoritesClasses}</p>
        </div>
        {sessionFavorites.length > 0 ? (
          <div className="stack-list">
            {sessionFavorites.map((item) => (
              <NextLink href={item.href} key={`session:${item.href}`} className="list-link">
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </NextLink>
            ))}
          </div>
        ) : (
          <p className="muted saved-empty-copy">{copy.noFavorites}</p>
        )}
      </section>
    </section>
  );
}

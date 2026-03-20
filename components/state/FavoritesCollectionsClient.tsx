'use client';

import NextLink from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { readStoredFavorites, readStoredSchedule } from '@/components/state/storage';

interface FavoritesCollectionsClientProps {
  signedInEmail: string;
  initialFavoriteKeys: string[];
  initialScheduleIds: string[];
  venues: Array<{ slug: string; title: string; href: string; meta: string }>;
  instructors: Array<{ slug: string; title: string; href: string; meta: string }>;
  sessions: Array<{ id: string; title: string; href: string; meta: string }>;
  copy: {
    favoritesStudios: string;
    favoritesTeachers: string;
    favoritesClasses: string;
    savedSchedule: string;
    noFavorites: string;
    noSchedule: string;
  };
}

export function FavoritesCollectionsClient({
  signedInEmail,
  initialFavoriteKeys,
  initialScheduleIds,
  venues,
  instructors,
  sessions,
  copy
}: FavoritesCollectionsClientProps) {
  const [favoriteKeys, setFavoriteKeys] = useState(initialFavoriteKeys);
  const [scheduleIds, setScheduleIds] = useState(initialScheduleIds);

  useEffect(() => {
    const localFavoriteKeys = readStoredFavorites(signedInEmail);
    const localScheduleIds = readStoredSchedule(signedInEmail);

    setFavoriteKeys([...new Set([...initialFavoriteKeys, ...localFavoriteKeys])]);
    setScheduleIds([...new Set([...initialScheduleIds, ...localScheduleIds])]);
  }, [initialFavoriteKeys, initialScheduleIds, signedInEmail]);

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
  const scheduleItems = useMemo(
    () => scheduleIds.map((id) => sessions.find((session) => session.id === id)).filter(Boolean) as typeof sessions,
    [scheduleIds, sessions]
  );

  return (
    <section className="saved-grid">
      <section className="panel">
        <p className="eyebrow">{copy.favoritesStudios}</p>
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
          <p className="muted">{copy.noFavorites}</p>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">{copy.favoritesTeachers}</p>
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
          <p className="muted">{copy.noFavorites}</p>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">{copy.favoritesClasses}</p>
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
          <p className="muted">{copy.noFavorites}</p>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">{copy.savedSchedule}</p>
        {scheduleItems.length > 0 ? (
          <div className="stack-list">
            {scheduleItems.map((item) => (
              <NextLink href={item.href} key={item.id} className="list-link">
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </NextLink>
            ))}
          </div>
        ) : (
          <p className="muted">{copy.noSchedule}</p>
        )}
      </section>
    </section>
  );
}

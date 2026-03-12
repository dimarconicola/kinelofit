'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface SavedEntitiesProps {
  locale: string;
  signedInEmail?: string;
  sessions: Array<{ id: string; title: string; href: string; meta: string }>;
  venues: Array<{ slug: string; title: string; href: string; meta: string }>;
  instructors: Array<{ slug: string; title: string; href: string; meta: string }>;
}

export function SavedEntities({ locale, signedInEmail, sessions, venues, instructors }: SavedEntitiesProps) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);

  useEffect(() => {
    if (!signedInEmail) return;
    setFavorites(JSON.parse(localStorage.getItem(`kinelo:${signedInEmail}:favorites`) ?? '[]'));
    setSchedule(JSON.parse(localStorage.getItem(`kinelo:${signedInEmail}:schedule`) ?? '[]'));
  }, [signedInEmail]);

  const favoriteItems = useMemo(() => {
    const items = favorites.map((favorite) => {
      const [entityType, slug] = favorite.split(':');
      if (entityType === 'venue') return venues.find((item) => item.slug === slug);
      if (entityType === 'session') return sessions.find((item) => item.id === slug);
      if (entityType === 'instructor') return instructors.find((item) => item.slug === slug);
      return null;
    });

    return items.filter(Boolean) as Array<{ title: string; href: string; meta: string }>;
  }, [favorites, instructors, sessions, venues]);

  const scheduleItems = useMemo(
    () => schedule.map((id) => sessions.find((session) => session.id === id)).filter(Boolean) as Array<{ title: string; href: string; meta: string }>,
    [schedule, sessions]
  );

  if (!signedInEmail) {
    return (
      <div className="empty-state">
        <p>Sign in to save favorites and keep a weekly routine.</p>
        <Link href={`/${locale}/sign-in`} className="button button-primary">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="saved-grid">
      <section className="panel">
        <p className="eyebrow">Favorites</p>
        {favoriteItems.length > 0 ? (
          <div className="stack-list">
            {favoriteItems.map((item) => (
              <Link href={item.href} key={item.href} className="list-link">
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">No saved items yet.</p>
        )}
      </section>
      <section className="panel">
        <p className="eyebrow">Saved schedule</p>
        {scheduleItems.length > 0 ? (
          <div className="stack-list">
            {scheduleItems.map((item) => (
              <Link href={item.href} key={item.href} className="list-link">
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">Add classes from the calendar to build a routine.</p>
        )}
      </section>
    </div>
  );
}

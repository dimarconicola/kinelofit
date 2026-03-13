'use client';

import { useState } from 'react';

import type { Locale } from '@/lib/catalog/types';

interface DigestFormProps {
  citySlug: string;
  locale: Locale;
  className?: string;
  showIntro?: boolean;
  surface?: 'panel' | 'plain';
  compact?: boolean;
}

export function DigestForm({ citySlug, locale, className, showIntro = true, surface = 'panel', compact = false }: DigestFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const copy =
    locale === 'it'
      ? {
          eyebrow: 'Digest settimanale',
          title: 'Muoviti meglio, ogni settimana',
          lead: 'Aggiornamenti mirati: lezioni verificate, variazioni orarie, nuove aperture e selezioni curate per Palermo.',
          email: 'Email',
          english: 'Classi in inglese',
          beginner: 'Adatte a principianti',
          weekend: 'Weekend picks',
          saving: 'Salvataggio…',
          cta: 'Iscriviti al digest',
          done: 'Perfetto. Ti avviseremo con gli aggiornamenti utili della settimana.'
        }
      : {
          eyebrow: 'Weekly digest',
          title: 'Move better, every week',
          lead: 'Targeted updates: verified classes, schedule changes, new openings, and curated Palermo picks.',
          email: 'Email',
          english: 'English-friendly',
          beginner: 'Beginner-friendly',
          weekend: 'Weekend picks',
          saving: 'Saving…',
          cta: 'Join the digest',
          done: 'Great. You are in for practical weekly updates.'
        };

  return (
    <form
      className={`${surface === 'panel' ? 'panel ' : ''}digest-form${className ? ` ${className}` : ''}`}
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus('loading');
        const formData = new FormData(event.currentTarget);
        const payload = Object.fromEntries(formData.entries());
        const preferences = formData.getAll('preferences') as string[];
        await fetch('/api/digest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, preferences, citySlug, locale })
        });
        setStatus('done');
        event.currentTarget.reset();
      }}
    >
      {showIntro ? (
        <>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h3>{copy.title}</h3>
          <p className="muted">{copy.lead}</p>
        </>
      ) : null}
      <label>
        {copy.email}
        <input name="email" type="email" required />
      </label>
      {compact ? null : (
        <div className="chip-row">
          <label className="chip-option"><input type="checkbox" name="preferences" value="english" /> {copy.english}</label>
          <label className="chip-option"><input type="checkbox" name="preferences" value="beginner" /> {copy.beginner}</label>
          <label className="chip-option"><input type="checkbox" name="preferences" value="weekend" /> {copy.weekend}</label>
        </div>
      )}
      <button className="button button-primary" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? copy.saving : copy.cta}
      </button>
      {status === 'done' ? <p className="muted">{copy.done}</p> : null}
    </form>
  );
}

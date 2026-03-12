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
  const labels =
    locale === 'it'
      ? {
          eyebrow: 'Digest settimanale',
          title: 'Resta aggiornat* sulle classi piu adatte a te.',
          email: 'Email',
          english: 'Classi in inglese',
          beginner: 'Adatte ai principianti',
          weekend: 'Selezione weekend',
          saving: 'Salvataggio...',
          submit: 'Iscriviti al digest',
          done: 'Ricevuto. Ti invieremo aggiornamenti settimanali sulle classi verificate.'
        }
      : {
          eyebrow: 'Weekly digest',
          title: 'Stay close to the best-fit classes.',
          email: 'Email',
          english: 'English-friendly',
          beginner: 'Beginner-friendly',
          weekend: 'Weekend picks',
          saving: 'Saving...',
          submit: 'Join the digest',
          done: 'Saved. You will receive weekly updates for verified classes.'
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
          <p className="eyebrow">{labels.eyebrow}</p>
          <h3>{labels.title}</h3>
        </>
      ) : null}
      <label>
        {labels.email}
        <input name="email" type="email" required />
      </label>
      {compact ? null : (
        <div className="chip-row">
          <label className="chip-option"><input type="checkbox" name="preferences" value="english" /> {labels.english}</label>
          <label className="chip-option"><input type="checkbox" name="preferences" value="beginner" /> {labels.beginner}</label>
          <label className="chip-option"><input type="checkbox" name="preferences" value="weekend" /> {labels.weekend}</label>
        </div>
      )}
      <button className="button button-primary" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? labels.saving : labels.submit}
      </button>
      {status === 'done' ? <p className="muted">{labels.done}</p> : null}
    </form>
  );
}

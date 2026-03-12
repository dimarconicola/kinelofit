'use client';

import { useState } from 'react';

import type { Locale } from '@/lib/catalog/types';

export function DigestForm({ citySlug, locale }: { citySlug: string; locale: Locale }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  return (
    <form
      className="panel digest-form"
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
      <p className="eyebrow">Weekly digest</p>
      <h3>Stay close to the best-fit classes.</h3>
      <label>
        Email
        <input name="email" type="email" required />
      </label>
      <div className="chip-row">
        <label className="chip-option"><input type="checkbox" name="preferences" value="english" /> English-friendly</label>
        <label className="chip-option"><input type="checkbox" name="preferences" value="beginner" /> Beginner-friendly</label>
        <label className="chip-option"><input type="checkbox" name="preferences" value="weekend" /> Weekend picks</label>
      </div>
      <button className="button button-primary" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Saving…' : 'Join the digest'}
      </button>
      {status === 'done' ? <p className="muted">Saved. The email is stored locally in the runtime inbox for follow-up.</p> : null}
    </form>
  );
}

'use client';

import { useState } from 'react';

import type { UserProfile } from '@/lib/catalog/types';

interface AccountProfileFormProps {
  locale: 'en' | 'it';
  profile: UserProfile;
  cityOptions: Array<{ slug: string; label: string }>;
}

export function AccountProfileForm({ locale, profile, cityOptions }: AccountProfileFormProps) {
  const copy =
    locale === 'it'
      ? {
          name: 'Nome visibile',
          city: 'Città principale',
          submit: 'Salva profilo',
          saving: 'Salvataggio...',
          done: 'Profilo aggiornato.',
          error: 'Non siamo riusciti a salvare il profilo. Riprova tra poco.'
        }
      : {
          name: 'Display name',
          city: 'Primary city',
          submit: 'Save profile',
          saving: 'Saving...',
          done: 'Profile updated.',
          error: 'We could not save your profile. Please try again shortly.'
        };

  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [homeCitySlug, setHomeCitySlug] = useState(profile.homeCitySlug);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  return (
    <form
      className="form-stack"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
          const response = await fetch('/api/account/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              displayName,
              homeCitySlug
            })
          });
          const payload = (await response.json().catch(() => null)) as { success?: boolean } | null;
          if (!response.ok || !payload?.success) {
            setStatus('error');
            setMessage(copy.error);
            return;
          }

          setStatus('done');
          setMessage(copy.done);
        } catch {
          setStatus('error');
          setMessage(copy.error);
        }
      }}
    >
      <label>
        <span>{copy.name}</span>
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} placeholder="Nicola" />
      </label>
      <label>
        <span>{copy.city}</span>
        <select value={homeCitySlug} onChange={(event) => setHomeCitySlug(event.target.value)}>
          {cityOptions.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={status === 'loading'} className="button button-primary">
        {status === 'loading' ? copy.saving : copy.submit}
      </button>
      {message ? <p className={`digest-feedback digest-feedback-${status === 'error' ? 'error' : 'success'}`}>{message}</p> : null}
    </form>
  );
}

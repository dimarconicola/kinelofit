'use client';

import { useState } from 'react';

import type { DigestSubscription, Locale } from '@/lib/catalog/types';

interface AccountDigestFormProps {
  locale: Locale;
  citySlug: string;
  subscription: DigestSubscription | null;
}

const preferenceOptions = (locale: Locale) =>
  locale === 'it'
    ? [
        { value: 'english', label: 'Classi in inglese' },
        { value: 'beginner', label: 'Adatte a principianti' },
        { value: 'weekend', label: 'Weekend picks' }
      ]
    : [
        { value: 'english', label: 'English-friendly' },
        { value: 'beginner', label: 'Beginner-friendly' },
        { value: 'weekend', label: 'Weekend picks' }
      ];

export function AccountDigestForm({ locale, citySlug, subscription }: AccountDigestFormProps) {
  const copy =
    locale === 'it'
      ? {
          title: 'Digest settimanale',
          lead: 'Ricevi aggiornamenti verificati e selezioni utili per la tua città base.',
          saving: 'Salvataggio...',
          subscribe: 'Attiva digest',
          update: 'Aggiorna digest',
          remove: 'Disattiva digest',
          done: 'Preferenze digest aggiornate.',
          removed: 'Digest disattivato.',
          error: 'Non siamo riusciti ad aggiornare il digest. Riprova tra poco.'
        }
      : {
          title: 'Weekly digest',
          lead: 'Get verified updates and useful picks for your home city.',
          saving: 'Saving...',
          subscribe: 'Enable digest',
          update: 'Update digest',
          remove: 'Turn off digest',
          done: 'Digest preferences updated.',
          removed: 'Digest turned off.',
          error: 'We could not update the digest. Please try again shortly.'
        };

  const [preferences, setPreferences] = useState<string[]>(subscription?.preferences ?? []);
  const [subscribed, setSubscribed] = useState(Boolean(subscription));
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const options = preferenceOptions(locale);

  const togglePreference = (value: string) => {
    setPreferences((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  return (
    <div className="form-stack">
      <div>
        <p className="eyebrow">{copy.title}</p>
        <p className="muted">{copy.lead}</p>
      </div>
      <div className="chip-row digest-preferences">
        {options.map((option) => (
          <label key={option.value} className="chip-option">
            <input
              type="checkbox"
              checked={preferences.includes(option.value)}
              onChange={() => togglePreference(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <div className="site-actions profile-side-actions">
        <button
          type="button"
          className="button button-primary"
          disabled={status === 'loading'}
          onClick={async () => {
            setStatus('loading');
            setMessage('');
            try {
              const response = await fetch('/api/account/digest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  citySlug,
                  locale,
                  preferences
                })
              });
              const payload = (await response.json().catch(() => null)) as { success?: boolean } | null;
              if (!response.ok || !payload?.success) {
                setStatus('error');
                setMessage(copy.error);
                return;
              }
              setSubscribed(true);
              setStatus('success');
              setMessage(copy.done);
            } catch {
              setStatus('error');
              setMessage(copy.error);
            }
          }}
        >
          {status === 'loading' ? copy.saving : subscribed ? copy.update : copy.subscribe}
        </button>
        {subscribed ? (
          <button
            type="button"
            className="button button-ghost"
            disabled={status === 'loading'}
            onClick={async () => {
              setStatus('loading');
              setMessage('');
              try {
                const response = await fetch(`/api/account/digest?citySlug=${encodeURIComponent(citySlug)}`, {
                  method: 'DELETE'
                });
                const payload = (await response.json().catch(() => null)) as { success?: boolean } | null;
                if (!response.ok || !payload?.success) {
                  setStatus('error');
                  setMessage(copy.error);
                  return;
                }
                setSubscribed(false);
                setStatus('success');
                setMessage(copy.removed);
              } catch {
                setStatus('error');
                setMessage(copy.error);
              }
            }}
          >
            {copy.remove}
          </button>
        ) : null}
      </div>
      {message ? <p className={`digest-feedback digest-feedback-${status === 'error' ? 'error' : 'success'}`}>{message}</p> : null}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';

import type { Locale } from '@/lib/catalog/types';

interface CalendarSubmissionFormProps {
  locale: Locale;
  citySlug: string;
}

export function CalendarSubmissionForm({ locale, citySlug }: CalendarSubmissionFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const labels = useMemo(
    () =>
      locale === 'it'
        ? {
            title: 'Segnala il tuo calendario',
            type: 'Tipo profilo',
            studio: 'Studio',
            teacher: 'Insegnante privato',
            org: 'Nome studio o progetto',
            contact: 'Nome referente',
            email: 'Email',
            phone: 'Telefono (opzionale)',
            urls: 'URL fonti calendario (una per riga)',
            schedule: 'Dettagli orari e note',
            consent: 'Confermo che i dati inviati sono pubblici o autorizzati alla verifica.',
            submit: 'Invia calendario',
            submitting: 'Invio in corso...',
            done: 'Ricevuto. Il team verifica e inserisce il calendario nella coda editoriale.',
            error: 'Invio non riuscito. Controlla i campi e riprova.'
          }
        : {
            title: 'Suggest your calendar',
            type: 'Profile type',
            studio: 'Studio',
            teacher: 'Private teacher',
            org: 'Studio or project name',
            contact: 'Contact person',
            email: 'Email',
            phone: 'Phone (optional)',
            urls: 'Calendar source URLs (one per line)',
            schedule: 'Schedule details and notes',
            consent: 'I confirm the submitted data is public or authorized for verification.',
            submit: 'Submit calendar',
            submitting: 'Submitting...',
            done: 'Received. The team will verify and queue your calendar.',
            error: 'Submission failed. Check fields and try again.'
          },
    [locale]
  );

  return (
    <form
      className="form-stack calendar-submission-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus('loading');

        const formData = new FormData(event.currentTarget);
        const sourceUrlsRaw = String(formData.get('sourceUrls') ?? '');
        const sourceUrls = sourceUrlsRaw
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean);

        try {
          const response = await fetch('/api/calendar-submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              locale,
              citySlug,
              submitterType: String(formData.get('submitterType') ?? ''),
              organizationName: String(formData.get('organizationName') ?? ''),
              contactName: String(formData.get('contactName') ?? ''),
              email: String(formData.get('email') ?? ''),
              phone: String(formData.get('phone') ?? ''),
              sourceUrls,
              scheduleText: String(formData.get('scheduleText') ?? ''),
              consent: formData.get('consent') === 'true'
            })
          });

          if (!response.ok) throw new Error('request_failed');

          setStatus('done');
          event.currentTarget.reset();
        } catch {
          setStatus('error');
        }
      }}
    >
      <h2>{labels.title}</h2>

      <label>
        <span>{labels.type}</span>
        <select name="submitterType" defaultValue="studio" required>
          <option value="studio">{labels.studio}</option>
          <option value="teacher">{labels.teacher}</option>
        </select>
      </label>

      <label>
        <span>{labels.org}</span>
        <input name="organizationName" required />
      </label>

      <label>
        <span>{labels.contact}</span>
        <input name="contactName" required />
      </label>

      <label>
        <span>{labels.email}</span>
        <input name="email" type="email" required />
      </label>

      <label>
        <span>{labels.phone}</span>
        <input name="phone" type="tel" />
      </label>

      <label>
        <span>{labels.urls}</span>
        <textarea name="sourceUrls" rows={4} required placeholder="https://example.com/schedule" />
      </label>

      <label>
        <span>{labels.schedule}</span>
        <textarea name="scheduleText" rows={5} required />
      </label>

      <label className="checkbox-field calendar-consent">
        <input name="consent" type="checkbox" value="true" required />
        <span>{labels.consent}</span>
      </label>

      <button className="button button-primary" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? labels.submitting : labels.submit}
      </button>
      <div aria-live="polite">
        {status === 'done' ? <p className="muted">{labels.done}</p> : null}
        {status === 'error' ? <p className="muted">{labels.error}</p> : null}
      </div>
    </form>
  );
}

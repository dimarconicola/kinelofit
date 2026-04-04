'use client';

import { useMemo, useState } from 'react';

import type { Locale } from '@/lib/catalog/types';

interface CalendarSubmissionFormProps {
  locale: Locale;
  citySlug: string;
}

export function CalendarSubmissionForm({ locale, citySlug }: CalendarSubmissionFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'organizationName' | 'contactName' | 'email' | 'sourceUrls' | 'scheduleText' | 'consent', string>>>({});

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
            urlsHelp: 'Serve almeno una fonte pubblica perché kinelo.fit verifica orari e pagine prima di pubblicare il calendario.',
            schedule: 'Dettagli orari e note',
            consent: 'Confermo che i dati inviati sono pubblici o autorizzati alla verifica.',
            submit: 'Invia calendario',
            submitting: 'Invio in corso...',
            done: 'Ricevuto. Il team verifica e inserisce il calendario nella coda editoriale.',
            error: 'Invio non riuscito.',
            genericFieldError: 'Controlla i campi evidenziati e riprova.'
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
            urlsHelp: 'At least one public source is required because kinelo.fit verifies schedules before publishing them.',
            schedule: 'Schedule details and notes',
            consent: 'I confirm the submitted data is public or authorized for verification.',
            submit: 'Submit calendar',
            submitting: 'Submitting...',
            done: 'Received. The team will verify and queue your calendar.',
            error: 'Submission failed.',
            genericFieldError: 'Check the highlighted fields and try again.'
          },
    [locale]
  );

  return (
    <form
      className="form-stack calendar-submission-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus('loading');
        setErrorMessage(null);
        setFieldErrors({});

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
              organizationName: String(formData.get('organizationName') ?? '').trim(),
              contactName: String(formData.get('contactName') ?? '').trim(),
              email: String(formData.get('email') ?? '').trim(),
              phone: String(formData.get('phone') ?? '').trim(),
              sourceUrls,
              scheduleText: String(formData.get('scheduleText') ?? '').trim(),
              consent: formData.get('consent') === 'true'
            })
          });

          const payload = (await response.json().catch(() => null)) as
            | { error?: { message?: string; fieldErrors?: Record<string, string[] | undefined> } }
            | null;

          if (!response.ok) {
            const nextFieldErrors: Partial<Record<'organizationName' | 'contactName' | 'email' | 'sourceUrls' | 'scheduleText' | 'consent', string>> = {};

            if (payload?.error?.fieldErrors) {
              for (const key of ['organizationName', 'contactName', 'email', 'sourceUrls', 'scheduleText', 'consent'] as const) {
                const value = payload.error.fieldErrors[key];
                if (value?.[0]) nextFieldErrors[key] = value[0];
              }
            }

            setFieldErrors(nextFieldErrors);
            setErrorMessage(payload?.error?.message ?? labels.genericFieldError);
            setStatus('error');
            return;
          }

          setStatus('done');
          setErrorMessage(null);
          setFieldErrors({});
          event.currentTarget.reset();
        } catch {
          setErrorMessage(labels.genericFieldError);
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
        {fieldErrors.organizationName ? <small className="form-error">{fieldErrors.organizationName}</small> : null}
      </label>

      <label>
        <span>{labels.contact}</span>
        <input name="contactName" required />
        {fieldErrors.contactName ? <small className="form-error">{fieldErrors.contactName}</small> : null}
      </label>

      <label>
        <span>{labels.email}</span>
        <input name="email" type="email" required />
        {fieldErrors.email ? <small className="form-error">{fieldErrors.email}</small> : null}
      </label>

      <label>
        <span>{labels.phone}</span>
        <input name="phone" type="tel" />
      </label>

      <label>
        <span>{labels.urls}</span>
        <textarea name="sourceUrls" rows={4} required placeholder="https://example.com/schedule" />
        <small className="muted">{labels.urlsHelp}</small>
        {fieldErrors.sourceUrls ? <small className="form-error">{fieldErrors.sourceUrls}</small> : null}
      </label>

      <label>
        <span>{labels.schedule}</span>
        <textarea name="scheduleText" rows={5} required />
        {fieldErrors.scheduleText ? <small className="form-error">{fieldErrors.scheduleText}</small> : null}
      </label>

      <label className="checkbox-field calendar-consent">
        <span className="checkbox-control">
          <input name="consent" type="checkbox" value="true" required />
        </span>
        <span className="checkbox-copy">{labels.consent}</span>
      </label>
      {fieldErrors.consent ? <small className="form-error">{fieldErrors.consent}</small> : null}

      <button className="button button-primary" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? labels.submitting : labels.submit}
      </button>
      <div aria-live="polite">
        {status === 'done' ? <p className="muted">{labels.done}</p> : null}
        {status === 'error' ? <p className="muted">{`${labels.error} ${errorMessage ?? labels.genericFieldError}`.trim()}</p> : null}
      </div>
    </form>
  );
}

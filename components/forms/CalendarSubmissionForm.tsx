'use client';

import { useMemo, useState } from 'react';
import { Button, Checkbox, Input, Select, SelectItem, Textarea } from '@heroui/react';

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

      <Select name="submitterType" label={labels.type} defaultSelectedKeys={['studio']} isRequired>
        <SelectItem key="studio">{labels.studio}</SelectItem>
        <SelectItem key="teacher">{labels.teacher}</SelectItem>
      </Select>

      <Input name="organizationName" label={labels.org} isRequired />

      <Input name="contactName" label={labels.contact} isRequired />

      <Input name="email" type="email" label={labels.email} isRequired />

      <Input name="phone" type="tel" label={labels.phone} />

      <Textarea name="sourceUrls" label={labels.urls} minRows={4} isRequired placeholder="https://example.com/schedule" />

      <Textarea name="scheduleText" label={labels.schedule} minRows={5} isRequired />

      <Checkbox name="consent" value="true" isRequired className="calendar-consent">
        {labels.consent}
      </Checkbox>

      <Button className="button button-primary" color="primary" radius="full" type="submit" isDisabled={status === 'loading'}>
        {status === 'loading' ? labels.submitting : labels.submit}
      </Button>
      {status === 'done' ? <p className="muted">{labels.done}</p> : null}
      {status === 'error' ? <p className="muted">{labels.error}</p> : null}
    </form>
  );
}

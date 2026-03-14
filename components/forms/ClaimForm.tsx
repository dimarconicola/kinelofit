'use client';

import { useState } from 'react';
import { Button, Input, Textarea } from '@heroui/react';

import type { Locale } from '@/lib/catalog/types';

export function ClaimForm({
  studioSlug,
  locale,
  panel = true
}: {
  studioSlug: string;
  locale: Locale;
  panel?: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const labels =
    locale === 'it'
      ? {
          name: 'Nome',
          email: 'Email',
          role: 'Ruolo',
          rolePlaceholder: 'Proprietario, manager, insegnante',
          notes: 'Note',
          notesPlaceholder: 'Indica cosa vuoi aggiornare o verificare.',
          submitting: 'Invio in corso...',
          submit: 'Invia richiesta',
          done: 'Richiesta inviata. Il team la verificherà prima della pubblicazione.'
        }
      : {
          name: 'Name',
          email: 'Email',
          role: 'Role',
          rolePlaceholder: 'Owner, manager, teacher',
          notes: 'Notes',
          notesPlaceholder: 'Tell us what you want to update or verify.',
          submitting: 'Submitting...',
          submit: 'Submit claim',
          done: 'Claim submitted. The team will review it before publishing updates.'
        };

  return (
    <form
      className={panel ? 'panel form-stack' : 'form-stack'}
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus('loading');
        const formData = new FormData(event.currentTarget);
        const payload = Object.fromEntries(formData.entries());
        await fetch('/api/claims', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, studioSlug, locale })
        });
        setStatus('done');
        event.currentTarget.reset();
      }}
    >
      <Input name="name" label={labels.name} required />
      <Input name="email" type="email" label={labels.email} required />
      <Input name="role" label={labels.role} placeholder={labels.rolePlaceholder} required />
      <Textarea name="notes" label={labels.notes} minRows={4} placeholder={labels.notesPlaceholder} required />
      <Button className="button button-primary" color="primary" radius="full" type="submit" isDisabled={status === 'loading'}>
        {status === 'loading' ? labels.submitting : labels.submit}
      </Button>
      {status === 'done' ? <p className="muted">{labels.done}</p> : null}
    </form>
  );
}

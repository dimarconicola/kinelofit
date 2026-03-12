'use client';

import { useState } from 'react';

import type { Locale } from '@/lib/catalog/types';

export function ClaimForm({ studioSlug, locale }: { studioSlug: string; locale: Locale }) {
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
          done: 'Richiesta inviata. Il team la verifichera prima della pubblicazione.'
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
      className="panel form-stack"
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
      <label>
        {labels.name}
        <input name="name" required />
      </label>
      <label>
        {labels.email}
        <input name="email" type="email" required />
      </label>
      <label>
        {labels.role}
        <input name="role" placeholder={labels.rolePlaceholder} required />
      </label>
      <label>
        {labels.notes}
        <textarea name="notes" rows={4} placeholder={labels.notesPlaceholder} required />
      </label>
      <button className="button button-primary" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? labels.submitting : labels.submit}
      </button>
      {status === 'done' ? <p className="muted">{labels.done}</p> : null}
    </form>
  );
}

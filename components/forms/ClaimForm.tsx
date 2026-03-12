'use client';

import { useState } from 'react';

import type { Locale } from '@/lib/catalog/types';

export function ClaimForm({ studioSlug, locale }: { studioSlug: string; locale: Locale }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

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
        Name
        <input name="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" required />
      </label>
      <label>
        Role
        <input name="role" placeholder="Owner, manager, teacher" required />
      </label>
      <label>
        Notes
        <textarea name="notes" rows={4} placeholder="Tell us what you want to update or verify." required />
      </label>
      <button className="button button-primary" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Submitting…' : 'Submit claim'}
      </button>
      {status === 'done' ? <p className="muted">Claim submitted. It is stored in the local runtime inbox for review.</p> : null}
    </form>
  );
}

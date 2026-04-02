import { describe, expect, it } from 'vitest';

import { buildIcsCalendar } from '@/lib/ui/calendar';

describe('buildIcsCalendar', () => {
  it('builds a valid ics payload with event fields', () => {
    const calendar = buildIcsCalendar('Agenda kinelo.fit', [
      {
        id: 'session-1',
        title: 'Yoga mattino',
        startAt: '2026-04-10T08:00:00.000Z',
        endAt: '2026-04-10T09:00:00.000Z',
        location: 'Palermo',
        description: 'Lezione prova',
        url: 'https://kinelofit.vercel.app/it/palermo/studios/example'
      }
    ]);

    expect(calendar).toContain('BEGIN:VCALENDAR');
    expect(calendar).toContain('SUMMARY:Yoga mattino');
    expect(calendar).toContain('LOCATION:Palermo');
    expect(calendar).toContain('URL:https://kinelofit.vercel.app/it/palermo/studios/example');
    expect(calendar).toContain('END:VCALENDAR');
  });
});

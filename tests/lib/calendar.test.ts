import { describe, expect, it } from 'vitest';

import { buildGoogleCalendarHref, buildIcsCalendar } from '@/lib/ui/calendar';
import { buildOpenStreetMapHref } from '@/lib/ui/maps';

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

describe('buildGoogleCalendarHref', () => {
  it('builds a prefilled Google Calendar link', () => {
    const href = buildGoogleCalendarHref({
      id: 'session-1',
      title: 'Boxe',
      startAt: '2026-04-10T18:30:00.000Z',
      endAt: '2026-04-10T19:30:00.000Z',
      location: 'Via San Basilio 17, Palermo',
      description: 'Palestra Popolare',
      url: 'https://kinelofit.vercel.app/it/palermo/studios/palestra-popolare-palermo'
    });

    expect(href).toContain('https://calendar.google.com/calendar/render?');
    expect(href).toContain('action=TEMPLATE');
    expect(href).toContain('text=Boxe');
    expect(href).toContain('location=Via+San+Basilio+17%2C+Palermo');
  });
});

describe('buildOpenStreetMapHref', () => {
  it('prefers exact coordinates when available', () => {
    const href = buildOpenStreetMapHref({
      address: 'Via San Basilio 17, Palermo',
      geo: { lat: 38.1188723, lng: 13.3610391 }
    });

    expect(href).toContain('openstreetmap.org/?mlat=38.1188723&mlon=13.3610391');
    expect(href).toContain('#map=16/38.1188723/13.3610391');
  });

  it('falls back to an address search when coordinates are missing', () => {
    const href = buildOpenStreetMapHref({
      address: 'Via San Basilio 17, Palermo'
    });

    expect(href).toBe('https://www.openstreetmap.org/search?query=Via%20San%20Basilio%2017%2C%20Palermo');
  });
});

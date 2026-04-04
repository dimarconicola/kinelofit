import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/lib/errors/handler';

const appendCalendarSubmission = vi.fn();

vi.mock('@/lib/runtime/store', () => ({
  appendCalendarSubmission
}));

describe('calendar submissions route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns success with a stable code on valid payloads', async () => {
    appendCalendarSubmission.mockResolvedValue(undefined);

    const { POST } = await import('@/app/api/calendar-submissions/route');
    const response = await POST(
      new Request('http://localhost:3000/api/calendar-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: 'it',
          citySlug: 'palermo',
          submitterType: 'studio',
          organizationName: 'Palestra Popolare',
          contactName: 'Mario Rossi',
          email: 'ciao@example.com',
          phone: '',
          sourceUrls: ['https://www.facebook.com/palestrapopolarepa/'],
          scheduleText: 'Boxe lun mer gio ven 18.30, prepugilistica lun mer ven 20.00.',
          consent: true
        })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        code: 'CALENDAR_SUBMISSION_CREATED'
      }
    });
  });

  it('returns field-level validation errors', async () => {
    const { POST } = await import('@/app/api/calendar-submissions/route');
    const response = await POST(
      new Request('http://localhost:3000/api/calendar-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: 'it',
          citySlug: 'palermo',
          submitterType: 'studio',
          organizationName: '',
          contactName: 'Mario Rossi',
          email: 'not-an-email',
          sourceUrls: [],
          scheduleText: 'short',
          consent: false
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        fieldErrors: {
          organizationName: expect.any(Array),
          email: expect.any(Array),
          sourceUrls: expect.any(Array),
          scheduleText: expect.any(Array),
          consent: expect.any(Array)
        }
      }
    });
  });

  it('returns store unavailable when persistence fails', async () => {
    appendCalendarSubmission.mockRejectedValue(new AppError('Servizio temporaneamente non disponibile.', 503, 'STORE_UNAVAILABLE'));

    const { POST } = await import('@/app/api/calendar-submissions/route');
    const response = await POST(
      new Request('http://localhost:3000/api/calendar-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: 'it',
          citySlug: 'palermo',
          submitterType: 'studio',
          organizationName: 'Palestra Popolare',
          contactName: 'Mario Rossi',
          email: 'ciao@example.com',
          sourceUrls: ['https://www.facebook.com/palestrapopolarepa/'],
          scheduleText: 'Boxe lun mer gio ven 18.30, prepugilistica lun mer ven 20.00.',
          consent: true
        })
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: 'STORE_UNAVAILABLE'
      }
    });
  });
});

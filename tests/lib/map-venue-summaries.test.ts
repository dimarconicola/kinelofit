import { describe, expect, it } from 'vitest';

import { buildMapVenueSummaries } from '@/lib/map/venue-summaries';
import { createMockSession, createMockVenue } from '../setup';

describe('buildMapVenueSummaries', () => {
  it('aggregates filtered sessions into stable venue summaries', () => {
    const sessions = [
      createMockSession({
        id: 'session-a',
        venueSlug: 'venue-1',
        instructorSlug: 'teacher-1',
        styleSlug: 'hatha',
        bookingTargetSlug: 'direct-booking',
        startAt: '2026-03-25T08:00:00.000Z',
        endAt: '2026-03-25T09:00:00.000Z',
        title: { it: 'Yoga del mattino', en: 'Morning yoga' }
      }),
      createMockSession({
        id: 'session-b',
        venueSlug: 'venue-1',
        instructorSlug: 'teacher-1',
        styleSlug: 'hatha',
        bookingTargetSlug: 'direct-booking',
        startAt: '2026-03-26T08:00:00.000Z',
        endAt: '2026-03-26T09:00:00.000Z',
        title: { it: 'Flow serale', en: 'Evening flow' }
      }),
      createMockSession({
        id: 'session-c',
        venueSlug: 'venue-2',
        instructorSlug: 'teacher-2',
        styleSlug: 'vinyasa',
        bookingTargetSlug: 'website',
        startAt: '2026-03-25T10:00:00.000Z',
        endAt: '2026-03-25T11:00:00.000Z',
        title: { it: 'Pilates forte', en: 'Strong pilates' }
      })
    ];

    const summaries = buildMapVenueSummaries({
      locale: 'it',
      citySlug: 'palermo',
      sessions,
      venues: [
        createMockVenue({
          slug: 'venue-1',
          name: 'Studio Uno',
          bookingTargetOrder: ['direct-booking']
        }),
        createMockVenue({
          slug: 'venue-2',
          name: 'Studio Due',
          neighborhoodSlug: 'centre',
          geo: { lat: 38.118, lng: 13.37 },
          bookingTargetOrder: ['website']
        }),
        createMockVenue({
          slug: 'broken',
          geo: { lat: Number.NaN, lng: 181 }
        })
      ],
      neighborhoods: [
        {
          slug: 'mondello',
          citySlug: 'palermo',
          name: { it: 'Mondello', en: 'Mondello' },
          description: { it: 'Zona mare', en: 'Seaside' },
          center: { lat: 38.2, lng: 13.3 }
        },
        {
          slug: 'centre',
          citySlug: 'palermo',
          name: { it: 'Centro', en: 'Centre' },
          description: { it: 'Centro', en: 'Centre' },
          center: { lat: 38.12, lng: 13.36 }
        }
      ],
      instructors: [
        {
          slug: 'teacher-1',
          citySlug: 'palermo',
          name: 'Anna',
          shortBio: { it: 'Bio', en: 'Bio' },
          specialties: [],
          languages: ['it']
        },
        {
          slug: 'teacher-2',
          citySlug: 'palermo',
          name: 'Luca',
          shortBio: { it: 'Bio', en: 'Bio' },
          specialties: [],
          languages: ['it']
        }
      ],
      styles: [
        {
          slug: 'hatha',
          categorySlug: 'yoga',
          name: { it: 'Hatha', en: 'Hatha' },
          description: { it: 'Hatha', en: 'Hatha' }
        },
        {
          slug: 'vinyasa',
          categorySlug: 'yoga',
          name: { it: 'Vinyasa', en: 'Vinyasa' },
          description: { it: 'Vinyasa', en: 'Vinyasa' }
        }
      ],
      bookingTargets: [
        { slug: 'direct-booking', type: 'direct', label: 'Prenota', href: 'https://example.com/book' },
        { slug: 'website', type: 'website', label: 'Sito', href: 'https://example.com/studio' }
      ]
    });

    expect(summaries).toHaveLength(2);
    expect(summaries[0].venueSlug).toBe('venue-1');
    expect(summaries[0].matchingSessionCount).toBe(2);
    expect(summaries[0].nextSession?.title).toBe('Yoga del mattino');
    expect(summaries[0].sessionsPreview).toHaveLength(2);
    expect(summaries[0].primaryCtaHref).toBe('https://example.com/book');
    expect(summaries[1].neighborhoodName).toBe('Centro');
  });
});

import '@testing-library/jest-dom';
import React from 'react';
import { afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    React.createElement('img', { src, alt, ...props })
}));

// Suppress console errors during tests (optional - remove if you want to see them)
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn((...args) => {
    // Filter out noisy errors
    if (
      args[0]?.includes?.('Warning: ReactDOM.render') ||
      args[0]?.includes?.('Warning: useLayoutEffect')
    ) {
      return;
    }
    originalError.call(console, ...args);
  });
});

afterAll(() => {
  console.error = originalError;
});

// Custom test utilities
export function createMockSessionUser(overrides = {}) {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    ...overrides
  };
}

export function createMockSession(overrides = {}) {
  return {
    id: 'session-1',
    citySlug: 'palermo',
    venueSlug: 'venue-1',
    instructorSlug: 'teacher-1',
    categorySlug: 'yoga',
    styleSlug: 'hatha',
    title: { en: 'Test Class', it: 'Classe di Prova' },
    startAt: '2024-03-20T10:00:00Z',
    endAt: '2024-03-20T11:00:00Z',
    level: 'beginner' as const,
    language: 'en',
    format: 'in_person' as const,
    bookingTargetSlug: 'direct-booking',
    sourceUrl: 'https://example.com',
    lastVerifiedAt: '2024-03-16T00:00:00Z',
    verificationStatus: 'verified' as const,
    audience: 'adults' as const,
    attendanceModel: 'drop_in' as const,
    ...overrides
  };
}

export function createMockVenue(overrides = {}) {
  return {
    slug: 'venue-1',
    citySlug: 'palermo',
    neighborhoodSlug: 'mondello',
    name: 'Test Studio',
    tagline: { en: 'A great studio', it: 'Un bellissimo studio' },
    description: { en: 'Description', it: 'Descrizione' },
    address: '123 Main St, Palermo',
    geo: { lat: 38.116, lng: 13.583 },
    amenities: ['parking', 'wifi'],
    languages: ['en', 'it'],
    styleSlugs: ['hatha', 'vinyasa'],
    categorySlugs: ['yoga'],
    bookingTargetOrder: ['direct-booking', 'website'],
    freshnessNote: { en: 'Updated today', it: 'Aggiornato oggi' },
    sourceUrl: 'https://example.com',
    lastVerifiedAt: '2024-03-16T00:00:00Z',
    ...overrides
  };
}

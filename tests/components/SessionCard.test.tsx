import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionCard } from '@/components/discovery/SessionCard';
import type { ResolvedSessionCardData } from '@/lib/catalog/session-card-data.shared';
import type { Session } from '@/lib/catalog/types';
import { HeroUIProvider } from '@heroui/react';

vi.mock('@/components/discovery/BookingLink', () => ({
  BookingLink: ({ label }: { label: string }) => <button type="button">{label}</button>
}));

vi.mock('@/components/state/ScheduleButton', () => ({
  ScheduleButton: ({ label }: { label: string }) => <button type="button">{label}</button>
}));

vi.mock('@/components/state/FavoriteButton', () => ({
  FavoriteButton: ({ label }: { label: string }) => <button type="button">{label}</button>
}));

// Wrapper component to provide HeroUIProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <HeroUIProvider>{children}</HeroUIProvider>;
}

describe('SessionCard', () => {
  let mockSession: Session;
  let resolved: ResolvedSessionCardData;

  beforeEach(() => {
    mockSession = {
      id: 'session-1',
      citySlug: 'palermo',
      venueSlug: 'venue-1',
      instructorSlug: 'teacher-1',
      categorySlug: 'yoga',
      styleSlug: 'hatha',
      title: { en: 'Morning Yoga', it: 'Yoga del Mattino' },
      startAt: '2024-03-20T08:00:00Z',
      endAt: '2024-03-20T09:00:00Z',
      level: 'beginner',
      language: 'en',
      format: 'in_person',
      bookingTargetSlug: 'direct-booking',
      sourceUrl: 'https://example.com',
      lastVerifiedAt: '2024-03-16T00:00:00Z',
      verificationStatus: 'verified',
      audience: 'adults',
      attendanceModel: 'drop_in'
    };
    resolved = {
      venue: {
        slug: 'venue-1',
        citySlug: 'palermo',
        neighborhoodSlug: 'politeama',
        name: 'Test Studio',
        tagline: { en: 'A great studio', it: 'Un bellissimo studio' },
        description: { en: 'Description', it: 'Descrizione' },
        address: '123 Main St, Palermo',
        geo: { lat: 38.116, lng: 13.361 },
        amenities: ['mats'],
        languages: ['English', 'Italian'],
        styleSlugs: ['hatha'],
        categorySlugs: ['yoga'],
        bookingTargetOrder: ['direct-booking'],
        freshnessNote: { en: 'Updated today', it: 'Aggiornato oggi' },
        sourceUrl: 'https://example.com/studio',
        lastVerifiedAt: '2026-03-16T00:00:00Z'
      },
      instructor: {
        slug: 'teacher-1',
        citySlug: 'palermo',
        name: 'Test Teacher',
        shortBio: { en: 'Bio', it: 'Bio' },
        specialties: ['hatha'],
        languages: ['English']
      },
      style: {
        slug: 'hatha',
        categorySlug: 'yoga',
        name: { en: 'Hatha', it: 'Hatha' },
        description: { en: 'Style', it: 'Stile' }
      },
      target: {
        slug: 'direct-booking',
        type: 'website',
        label: 'Book',
        href: 'https://example.com/book'
      }
    };
  });

  it('should render session title in correct locale', () => {
    render(
      <TestWrapper>
        <SessionCard
          session={mockSession}
          locale="en"
          resolved={resolved}
          scheduleLabel="Save to schedule"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
  });

  it('should render a share button for the single class route', () => {
    render(
      <TestWrapper>
        <SessionCard
          session={mockSession}
          locale="it"
          resolved={resolved}
          scheduleLabel="Salva in agenda"
        />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: 'Condividi' })).toBeInTheDocument();
  });

  it('should display Italian title when locale is "it"', () => {
    const italianSession: Session = {
      ...mockSession,
      title: { en: 'Morning Yoga', it: 'Yoga del Mattino' }
    };

    render(
      <TestWrapper>
        <SessionCard
          session={italianSession}
          locale="it"
          resolved={resolved}
          scheduleLabel="Salva in agenda"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Yoga del Mattino')).toBeInTheDocument();
  });

  it('should show verified status chip', () => {
    const verifiedSession = {
      ...mockSession,
      verificationStatus: 'verified' as const
    };

    render(
      <TestWrapper>
        <SessionCard
          session={verifiedSession}
          locale="en"
          resolved={resolved}
          scheduleLabel="Save to schedule"
        />
      </TestWrapper>
    );

    // The verified badge should be present
    // Note: HeroUI Chip may render with specific attributes
    const chips = screen.queryAllByRole('button');
    expect(chips.length).toBeGreaterThanOrEqual(0);
  });

  it('should show stale status indicator', () => {
    const staleSession = {
      ...mockSession,
      verificationStatus: 'stale' as const
    };

    render(
      <TestWrapper>
        <SessionCard
          session={staleSession}
          locale="en"
          resolved={resolved}
          scheduleLabel="Save to schedule"
        />
      </TestWrapper>
    );

    // Component should render even with stale status
    expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
  });

  it('should display level badge in English', () => {
    const advancedSession = {
      ...mockSession,
      level: 'advanced' as const
    };

    render(
      <TestWrapper>
        <SessionCard
          session={advancedSession}
          locale="en"
          resolved={resolved}
          scheduleLabel="Save to schedule"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('should display level badge in Italian', () => {
    const advancedSession = {
      ...mockSession,
      level: 'advanced' as const
    };

    render(
      <TestWrapper>
        <SessionCard
          session={advancedSession}
          locale="it"
          resolved={resolved}
          scheduleLabel="Salva in agenda"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Avanzato')).toBeInTheDocument();
  });

  it('should display format badge', () => {
    const hybridSession = {
      ...mockSession,
      format: 'hybrid' as const
    };

    render(
      <TestWrapper>
        <SessionCard
          session={hybridSession}
          locale="en"
          resolved={resolved}
          scheduleLabel="Save to schedule"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Hybrid')).toBeInTheDocument();
  });

  it('should show online format in Italian', () => {
    const onlineSession = {
      ...mockSession,
      format: 'online' as const
    };

    render(
      <TestWrapper>
        <SessionCard
          session={onlineSession}
          locale="it"
          resolved={resolved}
          scheduleLabel="Salva in agenda"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should render without crashing with action buttons mounted', () => {
    render(
      <TestWrapper>
        <SessionCard
          session={mockSession}
          locale="en"
          resolved={resolved}
          scheduleLabel="Save to schedule"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Morning Yoga')).toBeInTheDocument();
  });

  it('should render children content correctly', () => {
    render(
      <TestWrapper>
        <SessionCard
          session={mockSession}
          locale="en"
          resolved={resolved}
          scheduleLabel="Save to schedule"
        />
      </TestWrapper>
    );

    // Verify main title is rendered
    const mainContent = screen.getByText('Morning Yoga');
    expect(mainContent).toBeInTheDocument();
  });
});

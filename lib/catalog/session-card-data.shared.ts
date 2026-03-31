import type { CatalogSnapshot } from '@/lib/catalog/repository';
import type { BookingTarget, Instructor, Session, Style, Venue } from '@/lib/catalog/types';

export interface ResolvedSessionCardData {
  venue: Venue;
  instructor: Instructor;
  style: Style;
  target: BookingTarget;
}

export const resolveSessionCardDataFromSnapshot = (catalog: CatalogSnapshot, sessions: Session[]) => {
  const venueBySlug = new Map(catalog.venues.map((venue) => [venue.slug, venue] as const));
  const instructorBySlug = new Map(catalog.instructors.map((instructor) => [instructor.slug, instructor] as const));
  const styleBySlug = new Map(catalog.styles.map((style) => [style.slug, style] as const));
  const targetBySlug = new Map(catalog.bookingTargets.map((target) => [target.slug, target] as const));

  return new Map(
    sessions.flatMap((session) => {
      const venue = venueBySlug.get(session.venueSlug);
      const instructor = instructorBySlug.get(session.instructorSlug);
      const style = styleBySlug.get(session.styleSlug);
      const target = targetBySlug.get(session.bookingTargetSlug);

      if (!venue || !instructor || !style || !target) return [];

      return [
        [
          session.id,
          {
            venue,
            instructor,
            style,
            target
          } satisfies ResolvedSessionCardData
        ] as const
      ];
    })
  );
};

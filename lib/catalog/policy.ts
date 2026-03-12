import type { AttendanceModel, KidsAgeBand, Session, SessionAudience, VenueProfile } from '@/lib/catalog/types';

export const PRIMARY_CATEGORY_SLUGS = ['yoga', 'kids-activities'] as const;
export const ADJACENT_CATEGORY_SLUGS = ['pilates', 'breathwork', 'meditation', 'movement'] as const;
export const EXCLUDED_SPORT_HINTS = ['tennis', 'rugby', 'football', 'basketball', 'volleyball', 'nuoto', 'swim'] as const;

export const SUPPORTED_VENUE_PROFILES: VenueProfile[] = [
  'studio',
  'association',
  'independent_teacher',
  'gym_with_classes',
  'event_series'
];

export const KIDS_AGE_BANDS: Record<KidsAgeBand, { min: number; max: number }> = {
  '0-2': { min: 0, max: 2 },
  '3-5': { min: 3, max: 5 },
  '6-10': { min: 6, max: 10 },
  '11-14': { min: 11, max: 14 },
  'mixed-kids': { min: 3, max: 14 }
};

export const isVenueProfileSupported = (profile: VenueProfile) => SUPPORTED_VENUE_PROFILES.includes(profile);

export const isCategoryInScope = (categorySlug: string) =>
  PRIMARY_CATEGORY_SLUGS.includes(categorySlug as (typeof PRIMARY_CATEGORY_SLUGS)[number]) ||
  ADJACENT_CATEGORY_SLUGS.includes(categorySlug as (typeof ADJACENT_CATEGORY_SLUGS)[number]);

export const normalizeAttendanceModel = (value: string | null | undefined): AttendanceModel => {
  if (!value) return 'drop_in';
  if (value === 'trial' || value === 'cycle' || value === 'term' || value === 'drop_in') return value;
  return 'drop_in';
};

export const deriveKidsAgeBand = (ageMin?: number, ageMax?: number): KidsAgeBand | undefined => {
  if (typeof ageMin !== 'number' || typeof ageMax !== 'number') return undefined;
  if (ageMin <= 0 && ageMax <= 2) return '0-2';
  if (ageMin >= 3 && ageMax <= 5) return '3-5';
  if (ageMin >= 6 && ageMax <= 10) return '6-10';
  if (ageMin >= 11 && ageMax <= 14) return '11-14';
  if (ageMin >= 0 && ageMax <= 14) return 'mixed-kids';
  return undefined;
};

export const inferKidsAgeRangeFromStyle = (styleSlug: string): { min?: number; max?: number; ageBand?: KidsAgeBand } => {
  const key = styleSlug.toLowerCase();
  if (key === 'kids-dance-pedagogy') return { min: 3, max: 4, ageBand: '3-5' };
  if (key === 'circomotricita') return { min: 3, max: 10, ageBand: 'mixed-kids' };
  if (key === 'kids-theater') return { min: 6, max: 10, ageBand: '6-10' };
  if (key === 'kids-contemporary-dance' || key === 'kids-dance-foundations') return { min: 6, max: 10, ageBand: '6-10' };
  if (key === 'kids-capoeira' || key === 'aerial-kids-yoga' || key === 'kids-yoga') return { min: 6, max: 14, ageBand: 'mixed-kids' };
  return {};
};

export const inferSessionAudience = (session: Pick<Session, 'categorySlug' | 'styleSlug' | 'title'>): SessionAudience => {
  if (session.categorySlug === 'kids-activities') return 'kids';
  const style = session.styleSlug.toLowerCase();
  if (style.includes('kids') || style.includes('bimbi')) return 'kids';
  const title = `${session.title.en} ${session.title.it}`.toLowerCase();
  if (title.includes('kids') || title.includes('bimbi') || title.includes('bambin')) return 'kids';
  return 'adults';
};

export const isSessionInScope = (session: Pick<Session, 'categorySlug' | 'title' | 'attendanceModel'>) => {
  if (!isCategoryInScope(session.categorySlug)) return false;
  const title = `${session.title.en} ${session.title.it}`.toLowerCase();
  if (EXCLUDED_SPORT_HINTS.some((hint) => title.includes(hint))) return false;
  if (session.attendanceModel === 'term' && session.categorySlug !== 'kids-activities') return false;
  return true;
};

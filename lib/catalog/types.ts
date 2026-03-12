export type Locale = 'en' | 'it';
export type CityStatus = 'seed' | 'private_preview' | 'public';
export type CategoryVisibility = 'hidden' | 'beta' | 'live';
export type VerificationStatus = 'verified' | 'stale' | 'hidden';
export type SessionFormat = 'in_person' | 'online' | 'hybrid';
export type Level = 'beginner' | 'open' | 'intermediate' | 'advanced';
export type TimeBucket = 'early' | 'morning' | 'midday' | 'evening';
export type DatePreset = 'today' | 'tomorrow' | 'weekend' | 'week';

export type LocalizedText = Record<Locale, string>;

export interface City {
  slug: string;
  name: LocalizedText;
  countryCode: string;
  timezone: string;
  status: CityStatus;
  hero: LocalizedText;
  bounds: [number, number, number, number];
}

export interface Neighborhood {
  slug: string;
  citySlug: string;
  name: LocalizedText;
  description: LocalizedText;
  center: { lat: number; lng: number };
}

export interface ActivityCategory {
  slug: string;
  citySlug: string;
  name: LocalizedText;
  description: LocalizedText;
  visibility: CategoryVisibility;
  heroMetric: LocalizedText;
}

export interface Style {
  slug: string;
  categorySlug: string;
  name: LocalizedText;
  description: LocalizedText;
}

export interface Instructor {
  slug: string;
  citySlug: string;
  name: string;
  shortBio: LocalizedText;
  specialties: string[];
  languages: string[];
}

export interface BookingTarget {
  slug: string;
  type: 'direct' | 'platform' | 'whatsapp' | 'phone' | 'email' | 'website';
  label: string;
  href: string;
}

export interface Venue {
  slug: string;
  citySlug: string;
  neighborhoodSlug: string;
  name: string;
  tagline: LocalizedText;
  description: LocalizedText;
  address: string;
  geo: { lat: number; lng: number };
  amenities: string[];
  languages: string[];
  styleSlugs: string[];
  categorySlugs: string[];
  bookingTargetOrder: string[];
  freshnessNote: LocalizedText;
  sourceUrl: string;
  lastVerifiedAt: string;
}

export interface Session {
  id: string;
  citySlug: string;
  venueSlug: string;
  instructorSlug: string;
  categorySlug: string;
  styleSlug: string;
  title: LocalizedText;
  startAt: string;
  endAt: string;
  level: Level;
  language: string;
  format: SessionFormat;
  bookingTargetSlug: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  verificationStatus: VerificationStatus;
  priceNote?: LocalizedText;
}

export interface EditorialCollection {
  slug: string;
  citySlug: string;
  title: LocalizedText;
  description: LocalizedText;
  cta: LocalizedText;
  kind: 'rule' | 'editorial';
}

export interface ClaimSubmission {
  studioSlug: string;
  locale: Locale;
  name: string;
  email: string;
  role: string;
  notes: string;
  createdAt: string;
}

export interface DigestSubscription {
  email: string;
  locale: Locale;
  citySlug: string;
  preferences: string[];
  createdAt: string;
}

export interface OutboundEvent {
  sessionId?: string;
  venueSlug: string;
  citySlug: string;
  categorySlug: string;
  targetType: BookingTarget['type'];
  href: string;
  createdAt: string;
}

export interface DiscoveryFilters {
  date?: DatePreset;
  time_bucket?: TimeBucket;
  category?: string;
  style?: string;
  level?: Level;
  language?: string;
  neighborhood?: string;
  format?: SessionFormat;
  open_now?: 'true';
}

export interface CityReadiness {
  citySlug: string;
  venues: number;
  upcomingSessions: number;
  neighborhoods: number;
  styles: number;
  ctaCoverage: number;
  passesGate: boolean;
}

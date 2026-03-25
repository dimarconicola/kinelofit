import { DateTime } from 'luxon';

import palermoCatalog from '@/data/research/palermo_app_catalog.json';
import type {
  ActivityCategory,
  AttendanceModel,
  BookingTarget,
  City,
  EditorialCollection,
  Instructor,
  InstructorImage,
  InstructorSocialLink,
  KidsAgeBand,
  Neighborhood,
  Session,
  SessionAudience,
  Style,
  Venue,
  VenueImage
} from '@/lib/catalog/types';
import { normalizePriceNote } from '@/lib/catalog/price-notes';
import { deriveKidsAgeBand, inferKidsAgeRangeFromStyle, inferSessionAudience, normalizeAttendanceModel } from '@/lib/catalog/policy';

const buildLocalized = (en: string, it: string) => ({ en, it });
const buildVenueImage = (name: string, url: string, sourceUrl: string, lastVerifiedAt: string): VenueImage => ({
  url,
  sourceUrl,
  lastVerifiedAt,
  alt: buildLocalized(`${name} practice photo`, `Foto dello spazio di pratica di ${name}`)
});

const buildInstructorImage = (name: string, url: string, sourceUrl: string, lastVerifiedAt: string): InstructorImage => ({
  url,
  sourceUrl,
  lastVerifiedAt,
  alt: buildLocalized(`Portrait of ${name}`, `Ritratto di ${name}`)
});

const buildInstructorSocialLink = (
  type: InstructorSocialLink['type'],
  href: string,
  sourceUrl: string,
  lastVerifiedAt: string
): InstructorSocialLink => ({
  type,
  href,
  sourceUrl,
  lastVerifiedAt,
  label:
    type === 'instagram'
      ? buildLocalized('Instagram', 'Instagram')
      : type === 'facebook'
        ? buildLocalized('Facebook', 'Facebook')
        : buildLocalized('Official website', 'Sito ufficiale')
});

type RecurringSessionTemplate = {
  templateId: string;
  citySlug: 'palermo';
  venueSlug: string;
  instructorSlug: string;
  categorySlug: string;
  styleSlug: string;
  title: { en: string; it: string };
  weekday: string;
  startTime: string;
  endTime: string;
  level: 'beginner' | 'open' | 'intermediate' | 'advanced';
  language: string;
  format: 'in_person' | 'online' | 'hybrid';
  bookingTargetSlug: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  verificationStatus: 'verified';
  audience?: SessionAudience;
  attendanceModel?: AttendanceModel;
  ageMin?: number;
  ageMax?: number;
  ageBand?: KidsAgeBand;
  guardianRequired?: boolean;
  priceNote?: Partial<Record<'en' | 'it', string>>;
};

const generated = palermoCatalog as {
  neighborhoods: Neighborhood[];
  styles: Style[];
  instructors: Instructor[];
  bookingTargets: BookingTarget[];
  venues: Venue[];
  recurringSessions: RecurringSessionTemplate[];
};

const diariaCalendarSource = 'https://www.diariapalermo.org/corsi/calendario/';
const venueImagesVerifiedAt = '2026-03-14T12:00:00+01:00';

const venueCoverImages: Partial<Record<string, VenueImage>> = {
  'yoga-your-life': buildVenueImage(
    'Yoga Your Life',
    'https://static.wixstatic.com/media/9b23dd_1904a5b300d84aa2bdbb45c4bee5cb40~mv2.jpg/v1/fill/w_964,h_642,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/BAR_0591.jpg',
    'https://www.barbarafaludiyoga.com/corsi-in-studio',
    venueImagesVerifiedAt
  ),
  'ashtanga-shala-sicilia': buildVenueImage(
    'Ashtanga Shala Sicilia',
    'https://static.wixstatic.com/media/eae72f_8c339e15227443b19f732041163b5bfc%7Emv2.png/v1/fit/w_2500,h_1330,al_c/eae72f_8c339e15227443b19f732041163b5bfc%7Emv2.png',
    'https://www.ashtangashalasicilia.com/',
    venueImagesVerifiedAt
  ),
  'centro-cultura-rishi': buildVenueImage(
    'Centro Cultura Rishi',
    'https://www.centroculturarishi.it/wp-content/uploads/2025/06/DSCF1126_w-1536x1024.jpg',
    'https://www.centroculturarishi.it/',
    venueImagesVerifiedAt
  ),
  'centro-sportivo-ivanor': buildVenueImage(
    'Centro Sportivo Ivanor',
    'https://lirp.cdn-website.com/c9704d5b/dms3rep/multi/opt/yoga2-1920w.jpg',
    'https://www.ivanorsports.it/yoga',
    venueImagesVerifiedAt
  ),
  'grandmas-pilates': buildVenueImage(
    "Grandma's Pilates",
    'https://www.grandmaspilates.com/wp-content/uploads/2024/10/IMG_5853a-scaled-e1729511451413.jpg',
    'https://www.grandmaspilates.com/',
    venueImagesVerifiedAt
  ),
  'palermo-pilates': buildVenueImage(
    'Palermo Pilates',
    'https://www.palermopilates.it/wp-content/uploads/2023/09/palermopilates_cover-social_HOME.jpg',
    'https://www.palermopilates.it/en/contatti-eng/',
    venueImagesVerifiedAt
  ),
  'sahaja-yoga-sicilia': buildVenueImage(
    'Sahaja Yoga Sicilia',
    'https://sahajayoga.it/wp-content/uploads/2023/03/foto-sy.jpg',
    'https://sahajayoga.it/',
    venueImagesVerifiedAt
  ),
  'taiji-studio-palermo': buildVenueImage(
    'Taiji Studio Palermo',
    'https://www.taijistudiopalermo.it/wp-content/uploads/2025/11/a34ae1b5-5d87-4c5b-ae04-cb1de38a1afd-1.jpg',
    'https://www.taijistudiopalermo.it/',
    venueImagesVerifiedAt
  ),
  'yoga-ananda-palermo': buildVenueImage(
    'Yoga Ananda Palermo',
    'https://www.yoganandapalermo.it/wp-content/uploads/2019/09/slide2.jpg',
    'https://www.yoganandapalermo.it/contatti/',
    venueImagesVerifiedAt
  ),
  'yoga-city': buildVenueImage(
    'Yoga City',
    'https://www.yogacity.it/wp-content/uploads/2025/06/contatti2-1.jpg',
    'https://www.yogacity.it/contatti/',
    venueImagesVerifiedAt
  ),
  yogastudiolab: buildVenueImage(
    'Yogastudiolab',
    'https://primary.jwwb.nl/public/u/z/f/temp-pobtovotejufytvsfita/whatsapp-image-2020-05-26-at-11-20-37-1-high-xc84em.jpg?enable-io=true&enable=upscale&fit=bounds&width=1200',
    'https://www.yogastudiolab.it/contatti',
    venueImagesVerifiedAt
  ),
  'you-are-yoga': buildVenueImage(
    'You Are Yoga',
    'https://youareyoga.it/wp-content/uploads/2021/06/Marta_Yoga_Sole.jpg',
    'https://youareyoga.it/',
    venueImagesVerifiedAt
  ),
  'circo-pificio-palermo': buildVenueImage(
    'Circo Pificio',
    'https://www.circopificio.it/wp-content/uploads/2023/08/bimbi-cover.png',
    'https://www.circopificio.it/circomotricita/',
    venueImagesVerifiedAt
  ),
  'diaria-sala-venezia': buildVenueImage(
    'Diaria - Sala Venezia',
    'https://www.diariapalermo.org/new-site/wp-content/uploads/2024/09/Progetto-senza-titolo-2-819x1024.png',
    'https://www.diariapalermo.org/',
    venueImagesVerifiedAt
  ),
  'diaria-studio-gagini': buildVenueImage(
    'Diaria - Studio Gagini',
    'https://www.diariapalermo.org/new-site/wp-content/uploads/2024/09/Progetto-senza-titolo-2-819x1024.png',
    'https://www.diariapalermo.org/',
    venueImagesVerifiedAt
  )
};

const withVenueCoverImage = (venue: Venue): Venue => {
  const coverImage = venueCoverImages[venue.slug];
  return coverImage ? { ...venue, coverImage } : venue;
};

const instructorMediaVerifiedAt = '2026-03-25T15:20:00+01:00';

const palermoPilatesInstructorLinks = [
  buildInstructorSocialLink(
    'instagram',
    'https://www.instagram.com/palermo_pilates/',
    'https://www.palermopilates.it/en/team-eng/',
    instructorMediaVerifiedAt
  ),
  buildInstructorSocialLink(
    'facebook',
    'https://www.facebook.com/palermopilatesstudio/',
    'https://www.palermopilates.it/en/team-eng/',
    instructorMediaVerifiedAt
  ),
  buildInstructorSocialLink(
    'website',
    'https://www.palermopilates.it/en/team-eng/',
    'https://www.palermopilates.it/en/team-eng/',
    instructorMediaVerifiedAt
  )
];

const rishiInstructorLinks = [
  buildInstructorSocialLink(
    'instagram',
    'https://www.instagram.com/centrorishi/',
    'https://www.centroculturarishi.it/corsi/',
    instructorMediaVerifiedAt
  ),
  buildInstructorSocialLink(
    'facebook',
    'https://www.facebook.com/centrodiculturarishi',
    'https://www.centroculturarishi.it/corsi/',
    instructorMediaVerifiedAt
  ),
  buildInstructorSocialLink(
    'website',
    'https://www.centroculturarishi.it/corsi/',
    'https://www.centroculturarishi.it/corsi/',
    instructorMediaVerifiedAt
  )
];

const ashtangaInstructorLinks = [
  buildInstructorSocialLink(
    'instagram',
    'https://www.instagram.com/ashtanga_shala_sicilia/',
    'https://www.ashtangashalasicilia.com/copy-of-chi-siamo',
    instructorMediaVerifiedAt
  ),
  buildInstructorSocialLink(
    'facebook',
    'https://www.facebook.com/ashtangayogapalermo',
    'https://www.ashtangashalasicilia.com/chi-siamo',
    instructorMediaVerifiedAt
  ),
  buildInstructorSocialLink(
    'website',
    'https://www.ashtangashalasicilia.com/copy-of-chi-siamo',
    'https://www.ashtangashalasicilia.com/copy-of-chi-siamo',
    instructorMediaVerifiedAt
  )
];

const diariaInstructorLinks = [
  buildInstructorSocialLink(
    'instagram',
    'https://www.instagram.com/diariapalermo/',
    'https://www.diariapalermo.org/',
    instructorMediaVerifiedAt
  ),
  buildInstructorSocialLink(
    'facebook',
    'https://www.facebook.com/diariapalermo/',
    'https://www.diariapalermo.org/',
    instructorMediaVerifiedAt
  ),
  buildInstructorSocialLink(
    'website',
    'https://www.diariapalermo.org/',
    'https://www.diariapalermo.org/',
    instructorMediaVerifiedAt
  )
];

const yogaYourLifeInstructorLinks = [
  buildInstructorSocialLink(
    'website',
    'https://www.barbarafaludiyoga.com/',
    'https://www.barbarafaludiyoga.com/',
    instructorMediaVerifiedAt
  )
];

const yogaAnandaInstructorLinks = [
  buildInstructorSocialLink(
    'instagram',
    'https://www.instagram.com/yogananda_palermo/',
    'https://www.yoganandapalermo.it/i-maestri/',
    instructorMediaVerifiedAt
  ),
  buildInstructorSocialLink(
    'facebook',
    'https://www.facebook.com/yoganandapalermo/',
    'https://www.yoganandapalermo.it/i-maestri/',
    instructorMediaVerifiedAt
  ),
  buildInstructorSocialLink(
    'website',
    'https://www.yoganandapalermo.it/i-maestri/',
    'https://www.yoganandapalermo.it/i-maestri/',
    instructorMediaVerifiedAt
  )
];

const taijiInstructorLinks = [
  buildInstructorSocialLink(
    'website',
    'https://www.taijistudiopalermo.it/',
    'https://www.taijistudiopalermo.it/',
    instructorMediaVerifiedAt
  )
];

const sahajaInstructorLinks = [
  buildInstructorSocialLink(
    'website',
    'https://sahajayoga.it/',
    'https://sahajayoga.it/',
    instructorMediaVerifiedAt
  )
];

const circopificioInstructorLinks = [
  buildInstructorSocialLink(
    'website',
    'https://www.circopificio.it/circomotricita/',
    'https://www.circopificio.it/circomotricita/',
    instructorMediaVerifiedAt
  )
];

const spazioTerraInstructorLinks = [
  buildInstructorSocialLink(
    'facebook',
    'https://www.facebook.com/spazioterrapalermo',
    'https://www.facebook.com/spazioterrapalermo',
    instructorMediaVerifiedAt
  )
];

const instructorMedia: Partial<Record<string, Pick<Instructor, 'headshot' | 'socialLinks'>>> = {
  'valentina-lorito': {
    headshot: buildInstructorImage(
      'Valentina Lorito',
      'https://primary.jwwb.nl/public/u/z/f/temp-pobtovotejufytvsfita/whatsapp-image-2020-05-26-at-11-20-37-1-high.jpg?enable-io=true&enable=upscale&fit=bounds&width=1200',
      'https://www.yogastudiolab.it/la-mia-esperienza',
      instructorMediaVerifiedAt
    ),
    socialLinks: [
      buildInstructorSocialLink(
        'instagram',
        'https://instagram.com/vale.yoga.benessere',
        'https://www.yogastudiolab.it/la-mia-esperienza',
        instructorMediaVerifiedAt
      )
    ]
  },
  'desiree-burgio': {
    headshot: buildInstructorImage(
      'Desiree Burgio',
      'https://www.desireeburgio.it/wp-content/uploads/2025/01/desiree.jpg',
      'https://www.desireeburgio.it/desiree/',
      instructorMediaVerifiedAt
    ),
    socialLinks: [
      buildInstructorSocialLink(
        'instagram',
        'https://instagram.com/desiree_burgio_',
        'https://www.desireeburgio.it/desiree/',
        instructorMediaVerifiedAt
      ),
      buildInstructorSocialLink(
        'facebook',
        'https://www.facebook.com/DesireeBurgioFit',
        'https://www.desireeburgio.it/desiree/',
        instructorMediaVerifiedAt
      )
    ]
  },
  'marta-sto': {
    headshot: buildInstructorImage(
      'Marta Sto',
      'https://youareyoga.it/wp-content/uploads/2021/06/Marta_Yoga_Sole.jpg',
      'https://youareyoga.it/',
      instructorMediaVerifiedAt
    ),
    socialLinks: [
      buildInstructorSocialLink(
        'instagram',
        'https://www.instagram.com/martasto.youareyoga/',
        'https://youareyoga.it/',
        instructorMediaVerifiedAt
      ),
      buildInstructorSocialLink(
        'facebook',
        'https://www.facebook.com/youareyogamartasto',
        'https://youareyoga.it/',
        instructorMediaVerifiedAt
      )
    ]
  },
  'lesley-bell': {
    headshot: buildInstructorImage(
      'Lesley Bell',
      'https://www.palermopilates.it/wp-content/uploads/2023/05/TEAM-Leslie.png',
      'https://www.palermopilates.it/team/',
      instructorMediaVerifiedAt
    ),
    socialLinks: palermoPilatesInstructorLinks
  },
  'silvia-riccobono': {
    headshot: buildInstructorImage(
      'Silvia Riccobono',
      'https://www.palermopilates.it/wp-content/uploads/2024/04/TEAM-Silvia-414x414.png',
      'https://www.palermopilates.it/team/',
      instructorMediaVerifiedAt
    ),
    socialLinks: palermoPilatesInstructorLinks
  },
  'ekaterina-kaptur': {
    headshot: buildInstructorImage(
      'Ekaterina Katie Kaptur',
      'https://www.palermopilates.it/wp-content/uploads/2024/09/TEAM-Katie-1-414x414.png',
      'https://www.palermopilates.it/team/',
      instructorMediaVerifiedAt
    ),
    socialLinks: palermoPilatesInstructorLinks
  },
  'aldo-pace': {
    headshot: buildInstructorImage(
      'Aldo Pace',
      'https://www.palermopilates.it/wp-content/uploads/2025/10/TEAM-Aldo-414x414.png',
      'https://www.palermopilates.it/team/',
      instructorMediaVerifiedAt
    ),
    socialLinks: palermoPilatesInstructorLinks
  },
  'aruna-nath-giri': {
    headshot: buildInstructorImage(
      'Aruna Nath Giri',
      'https://www.centroculturarishi.it/wp-content/uploads/2024/09/DSCF5641-200x300.jpg',
      'https://www.centroculturarishi.it/corsi/',
      instructorMediaVerifiedAt
    ),
    socialLinks: rishiInstructorLinks
  },
  'antonio-rishi': {
    socialLinks: rishiInstructorLinks
  },
  'dino-coglitore': {
    socialLinks: rishiInstructorLinks
  },
  'loredana-rishi': {
    socialLinks: rishiInstructorLinks
  },
  'tanya-rishi': {
    socialLinks: rishiInstructorLinks
  },
  'centro-cultura-rishi-team': {
    headshot: buildInstructorImage(
      'Rishi teaching team',
      'https://www.centroculturarishi.it/wp-content/uploads/2024/05/DSCF5536-scaled.jpg',
      'https://www.centroculturarishi.it/corsi/',
      instructorMediaVerifiedAt
    ),
    socialLinks: rishiInstructorLinks
  },
  'sangeeta-laura-biagi': {
    socialLinks: rishiInstructorLinks
  },
  'barbara-faludi': {
    headshot: buildInstructorImage(
      'Barbara Faludi',
      'https://static.wixstatic.com/media/9b23dd_f121cd03034e46d9bb0c527fac2fdb29~mv2.jpg/v1/fill/w_330,h_330,enc_auto/file.jpeg',
      'https://www.barbarafaludiyoga.com/',
      instructorMediaVerifiedAt
    ),
    socialLinks: yogaYourLifeInstructorLinks
  },
  'claudia-santamarina': {
    socialLinks: yogaYourLifeInstructorLinks
  },
  'dario-pastore': {
    socialLinks: yogaYourLifeInstructorLinks
  },
  'delia-de-santes': {
    socialLinks: yogaYourLifeInstructorLinks
  },
  'domenico-di-chiara': {
    socialLinks: yogaYourLifeInstructorLinks
  },
  'giorgia-schillaci': {
    socialLinks: yogaYourLifeInstructorLinks
  },
  'massimiliano-provenzano': {
    socialLinks: yogaYourLifeInstructorLinks
  },
  'veronica-zarbo': {
    socialLinks: yogaYourLifeInstructorLinks
  },
  'cristina-chiummo': {
    socialLinks: ashtangaInstructorLinks
  },
  'asia-mattaliano': {
    socialLinks: ashtangaInstructorLinks
  },
  'matthew-phippen': {
    socialLinks: yogaAnandaInstructorLinks
  },
  'sujesh-valerio-costa': {
    socialLinks: yogaAnandaInstructorLinks
  },
  'giulia-pace': {
    socialLinks: taijiInstructorLinks
  },
  'ceren-dogou': {
    socialLinks: taijiInstructorLinks
  },
  'paola-cassara': {
    socialLinks: taijiInstructorLinks
  },
  'taiji-studio-palermo-team': {
    headshot: buildInstructorImage(
      'Taiji Studio Palermo team',
      'https://www.taijistudiopalermo.it/wp-content/uploads/2025/11/a34ae1b5-5d87-4c5b-ae04-cb1de38a1afd-1.jpg',
      'https://www.taijistudiopalermo.it/',
      instructorMediaVerifiedAt
    ),
    socialLinks: taijiInstructorLinks
  },
  'sahaja-yoga-sicilia-team': {
    headshot: buildInstructorImage(
      'Sahaja Yoga Palermo team',
      'https://sahajayoga.it/wp-content/uploads/2023/03/foto-sy.jpg',
      'https://sahajayoga.it/',
      instructorMediaVerifiedAt
    ),
    socialLinks: sahajaInstructorLinks
  },
  'circopificio-team': {
    headshot: buildInstructorImage(
      'Circo Pificio team',
      'https://www.circopificio.it/wp-content/uploads/2023/08/bimbi-cover.png',
      'https://www.circopificio.it/circomotricita/',
      instructorMediaVerifiedAt
    ),
    socialLinks: circopificioInstructorLinks
  },
  'spazio-terra-team': {
    socialLinks: spazioTerraInstructorLinks
  },
  'diaria-federica': {
    socialLinks: diariaInstructorLinks
  },
  'diaria-maja': {
    socialLinks: diariaInstructorLinks
  },
  'diaria-emilia': {
    socialLinks: diariaInstructorLinks
  },
  'diaria-ceren': {
    socialLinks: diariaInstructorLinks
  },
  'diaria-maria-laura': {
    socialLinks: diariaInstructorLinks
  },
  'diaria-dario': {
    socialLinks: diariaInstructorLinks
  },
  'diaria-carlotta': {
    socialLinks: diariaInstructorLinks
  },
  'diaria-ceroda': {
    socialLinks: diariaInstructorLinks
  }
};

const withInstructorMedia = (instructor: Instructor): Instructor => {
  const media = instructorMedia[instructor.slug];
  return media ? { ...instructor, ...media } : instructor;
};

export const cities: City[] = [
  {
    slug: 'palermo',
    name: buildLocalized('Palermo', 'Palermo'),
    countryCode: 'IT',
    timezone: 'Europe/Rome',
    status: 'public',
    hero: buildLocalized(
      'The citywide yoga and mind-body calendar for Palermo.',
      'Il calendario cittadino di yoga e mind-body per Palermo.'
    ),
    bounds: [13.2805, 38.085, 13.405, 38.165]
  },
  {
    slug: 'catania',
    name: buildLocalized('Catania', 'Catania'),
    countryCode: 'IT',
    timezone: 'Europe/Rome',
    status: 'seed',
    hero: buildLocalized(
      'Mind-body discovery for Catania is coming soon.',
      'La discovery mind-body per Catania e in arrivo.'
    ),
    bounds: [15.02, 37.45, 15.18, 37.57]
  }
];

export const neighborhoods: Neighborhood[] = generated.neighborhoods;

export const categories: ActivityCategory[] = [
  {
    slug: 'yoga',
    citySlug: 'palermo',
    name: buildLocalized('Yoga', 'Yoga'),
    description: buildLocalized(
      'The clearest way to explore Palermo right now, from gentle practice to stronger flows.',
      'Il modo piu chiaro per esplorare Palermo oggi, dalle pratiche dolci ai flow piu intensi.'
    ),
    visibility: 'live',
    heroMetric: buildLocalized('The broadest weekly selection in the city.', 'La selezione settimanale piu ampia in citta.')
  },
  {
    slug: 'pilates',
    citySlug: 'palermo',
    name: buildLocalized('Pilates', 'Pilates'),
    description: buildLocalized(
      'Small-group matwork and complementary practice for balance, strength, and posture.',
      'Matwork in piccoli gruppi e pratiche complementari per equilibrio, forza e postura.'
    ),
    visibility: 'beta',
    heroMetric: buildLocalized('A curated mix of recurring classes.', 'Una selezione curata di lezioni ricorrenti.')
  },
  {
    slug: 'breathwork',
    citySlug: 'palermo',
    name: buildLocalized('Breathwork', 'Breathwork'),
    description: buildLocalized(
      'Breath-led sessions, pranayama, and restorative formats that complement yoga practice.',
      'Sessioni guidate dal respiro, pranayama e formati rigenerativi che completano la pratica yoga.'
    ),
    visibility: 'beta',
    heroMetric: buildLocalized('Useful sessions for calmer, slower practice.', 'Sessioni utili per pratiche piu calme e lente.')
  },
  {
    slug: 'kids-activities',
    citySlug: 'palermo',
    name: buildLocalized('Kids Activities', 'Attivita bambini'),
    description: buildLocalized(
      'Verified children-focused sessions including yoga and movement labs.',
      'Sessioni verificate dedicate ai bambini, tra yoga e laboratori di movimento.'
    ),
    visibility: 'live',
    heroMetric: buildLocalized('For ages 0-14, with direct contact details when available.', 'Per eta 0-14, con contatti diretti quando disponibili.')
  },
  {
    slug: 'meditation',
    citySlug: 'palermo',
    name: buildLocalized('Meditation', 'Meditazione'),
    description: buildLocalized(
      'Tracked in the catalog but not foregrounded in public discovery yet.',
      'Tracciata nel catalogo ma non ancora in primo piano nella discovery pubblica.'
    ),
    visibility: 'hidden',
    heroMetric: buildLocalized('Held back until coverage improves.', 'Tenuta indietro finche la copertura non migliora.')
  },
  {
    slug: 'movement',
    citySlug: 'palermo',
    name: buildLocalized('Movement', 'Movimento'),
    description: buildLocalized(
      'Adjacent movement formats are tracked without diluting the yoga-led wedge.',
      'I formati di movimento adiacenti sono tracciati senza diluire il wedge guidato dallo yoga.'
    ),
    visibility: 'hidden',
    heroMetric: buildLocalized('Tracked, not yet foregrounded.', 'Tracciato, non ancora in primo piano.')
  }
];

const extraStyles: Style[] = [
  {
    slug: 'circomotricita',
    categorySlug: 'kids-activities',
    name: buildLocalized('Circomotricity', 'Circomotricita'),
    description: buildLocalized(
      'Play-based movement classes with circus-inspired motor skills for children.',
      'Lezioni di movimento ludico con competenze motorie ispirate al circo per bambini.'
    )
  },
  {
    slug: 'aerial-kids-yoga',
    categorySlug: 'kids-activities',
    name: buildLocalized('Aerial Kids Yoga', 'Yoga in volo bambini'),
    description: buildLocalized(
      'Kids yoga sessions using aerial fabric or suspension support under supervision.',
      'Sessioni yoga bimbi con supporti aerei o sospensioni, sempre supervisionate.'
    )
  },
  {
    slug: 'kids-theater',
    categorySlug: 'kids-activities',
    name: buildLocalized('Kids Theater', 'Teatro bambini'),
    description: buildLocalized(
      'Expressive theater sessions designed for children and pre-teens.',
      'Laboratori di teatro espressivo pensati per bambini e preadolescenti.'
    )
  },
  {
    slug: 'kids-contemporary-dance',
    categorySlug: 'kids-activities',
    name: buildLocalized('Kids Contemporary Dance', 'Danza contemporanea bambini'),
    description: buildLocalized(
      'Contemporary dance classes for children with movement and rhythm foundations.',
      'Corsi di danza contemporanea per bambini con basi di movimento e ritmo.'
    )
  },
  {
    slug: 'kids-dance-foundations',
    categorySlug: 'kids-activities',
    name: buildLocalized('Kids Dance Foundations', 'Danza base bambini'),
    description: buildLocalized(
      'Introductory dance classes for children in early school years.',
      'Lezioni introduttive di danza per bambini della prima eta scolare.'
    )
  },
  {
    slug: 'kids-dance-pedagogy',
    categorySlug: 'kids-activities',
    name: buildLocalized('Dance Pedagogy 3-4', 'Pedagogia della danza 3-4'),
    description: buildLocalized(
      'Movement pedagogy classes for early childhood focused on body awareness.',
      'Percorsi di pedagogia del movimento per la prima infanzia e consapevolezza corporea.'
    )
  },
  {
    slug: 'kids-capoeira',
    categorySlug: 'kids-activities',
    name: buildLocalized('Kids Capoeira', 'Capoeira bambini'),
    description: buildLocalized(
      'Capoeira classes for children blending rhythm, coordination, and play.',
      'Lezioni di capoeira per bambini tra ritmo, coordinazione e gioco.'
    )
  }
];

const extraInstructors: Instructor[] = [
  {
    slug: 'circopificio-team',
    citySlug: 'palermo',
    name: 'Circo Pificio team',
    shortBio: buildLocalized(
      'Verified local team running circomotricity classes for children in Palermo.',
      'Team locale verificato che conduce corsi di circomotricita per bambini a Palermo.'
    ),
    specialties: ['circomotricita', 'kids-yoga'],
    languages: ['Italian']
  },
  {
    slug: 'spazio-terra-team',
    citySlug: 'palermo',
    name: 'Spazio Terra team',
    shortBio: buildLocalized(
      'Verified team behind kids aerial yoga and family-oriented movement workshops.',
      'Team verificato per yoga bimbi in volo e laboratori di movimento per famiglie.'
    ),
    specialties: ['aerial-kids-yoga', 'kids-yoga'],
    languages: ['Italian']
  },
  {
    slug: 'diaria-federica',
    citySlug: 'palermo',
    name: 'Federica (Diaria)',
    shortBio: buildLocalized(
      'Instructor listed in Diaria schedules for hatha and pilates classes.',
      'Insegnante indicata nei calendari Diaria per classi di hatha e pilates.'
    ),
    specialties: ['hatha', 'pilates-core'],
    languages: ['Italian']
  },
  {
    slug: 'diaria-maja',
    citySlug: 'palermo',
    name: 'Maja (Diaria)',
    shortBio: buildLocalized(
      'Instructor listed in Diaria schedules for pilates and microworkout sessions.',
      'Insegnante indicata nei calendari Diaria per sessioni di pilates e microworkout.'
    ),
    specialties: ['pilates-core'],
    languages: ['Italian']
  },
  {
    slug: 'diaria-emilia',
    citySlug: 'palermo',
    name: 'Emilia (Diaria)',
    shortBio: buildLocalized(
      'Instructor listed for Diaria pilates formats and children dance activities.',
      'Insegnante indicata per format pilates Diaria e attivita danza bambini.'
    ),
    specialties: ['pilates-core', 'kids-contemporary-dance', 'kids-dance-pedagogy'],
    languages: ['Italian']
  },
  {
    slug: 'diaria-ceren',
    citySlug: 'palermo',
    name: 'Ceren (Diaria)',
    shortBio: buildLocalized(
      'For updated classes and details, visit diaria.it.',
      'Per classi aggiornate e maggiori informazioni, visita diaria.it.'
    ),
    specialties: ['vinyasa'],
    languages: ['Italian']
  },
  {
    slug: 'diaria-maria-laura',
    citySlug: 'palermo',
    name: 'Maria Laura (Diaria)',
    shortBio: buildLocalized(
      'Instructor listed in Diaria ashtanga yoga slots.',
      'Insegnante indicata negli slot ashtanga yoga di Diaria.'
    ),
    specialties: ['ashtanga'],
    languages: ['Italian']
  },
  {
    slug: 'diaria-dario',
    citySlug: 'palermo',
    name: 'Dario (Diaria)',
    shortBio: buildLocalized(
      'Instructor listed in Diaria kids theater sessions.',
      'Insegnante indicato nelle sessioni teatro bambini di Diaria.'
    ),
    specialties: ['kids-theater'],
    languages: ['Italian']
  },
  {
    slug: 'diaria-carlotta',
    citySlug: 'palermo',
    name: 'Carlotta (Diaria)',
    shortBio: buildLocalized(
      'Instructor listed in Diaria dance classes for younger children.',
      'Insegnante indicata nelle classi di danza Diaria per i piu piccoli.'
    ),
    specialties: ['kids-dance-foundations'],
    languages: ['Italian']
  },
  {
    slug: 'diaria-ceroda',
    citySlug: 'palermo',
    name: 'Ceroda (Diaria)',
    shortBio: buildLocalized(
      'Instructor listed in Diaria kids capoeira classes.',
      'Insegnante indicato nelle classi capoeira bambini di Diaria.'
    ),
    specialties: ['kids-capoeira'],
    languages: ['Italian']
  }
];

const extraBookingTargets: BookingTarget[] = [
  {
    slug: 'circopificio-website',
    type: 'website',
    label: 'Visit website',
    href: 'https://www.circopificio.it/circomotricita/'
  },
  {
    slug: 'spazio-terra-facebook',
    type: 'website',
    label: 'Open source page',
    href: 'https://www.facebook.com/spazioterrapalermo'
  },
  {
    slug: 'diaria-iscrizione',
    type: 'direct',
    label: 'Iscriviti',
    href: 'https://www.diariapalermo.org/iscrizione-corsi/'
  },
  {
    slug: 'diaria-whatsapp',
    type: 'whatsapp',
    label: 'WhatsApp',
    href: 'https://wa.me/393517066792'
  },
  {
    slug: 'diaria-calendario',
    type: 'website',
    label: 'CalenDiaria',
    href: diariaCalendarSource
  }
];

const extraVenues: Venue[] = [
  {
    slug: 'circo-pificio-palermo',
    citySlug: 'palermo',
    neighborhoodSlug: 'notarbartolo',
    name: 'Circo Pificio',
    tagline: buildLocalized('Kids circomotricity in Palermo.', 'Circomotricita bimbi a Palermo.'),
    description: buildLocalized(
      'Circo Pificio offers children-focused circomotricity sessions with source-backed public program details.',
      'Circo Pificio propone sessioni di circomotricita per bambini con dettagli programma verificabili da fonte pubblica.'
    ),
    address: 'Via Serradifalco 130, Palermo',
    geo: { lat: 38.1239, lng: 13.3394 },
    amenities: ['Kids programming', 'Small-group classes', 'Movement lab'],
    languages: ['Italian'],
    styleSlugs: ['circomotricita'],
    categorySlugs: ['kids-activities', 'movement'],
    bookingTargetOrder: ['circopificio-website'],
    freshnessNote: buildLocalized(
      'Checked against a current public source on 2026-03-12.',
      'Controllato su una fonte pubblica corrente il 2026-03-12.'
    ),
    sourceUrl: 'https://www.circopificio.it/circomotricita/',
    lastVerifiedAt: '2026-03-12T12:00:00+01:00'
  },
  {
    slug: 'spazio-terra-palermo',
    citySlug: 'palermo',
    neighborhoodSlug: 'politeama',
    name: 'Spazio Terra',
    tagline: buildLocalized('Workshops and kids aerial yoga experiences.', 'Laboratori e yoga bimbi in volo.'),
    description: buildLocalized(
      'Spazio Terra hosts children-focused yoga workshops, including aerial formats when publicly scheduled.',
      'Spazio Terra ospita laboratori yoga per bambini, inclusi format in volo quando pubblicati.'
    ),
    address: 'Via Dante 119, Palermo',
    geo: { lat: 38.1268, lng: 13.3498 },
    amenities: ['Workshops', 'Kids yoga', 'Event-led sessions'],
    languages: ['Italian'],
    styleSlugs: ['aerial-kids-yoga', 'kids-yoga'],
    categorySlugs: ['kids-activities', 'yoga'],
    bookingTargetOrder: ['spazio-terra-facebook'],
    freshnessNote: buildLocalized(
      'Checked against a current public source on 2026-03-12.',
      'Controllato su una fonte pubblica corrente il 2026-03-12.'
    ),
    sourceUrl: 'https://www.facebook.com/spazioterrapalermo',
    lastVerifiedAt: '2026-03-12T12:00:00+01:00'
  },
  {
    slug: 'diaria-sala-venezia',
    citySlug: 'palermo',
    neighborhoodSlug: 'citywide',
    name: 'Diaria - Sala Venezia',
    tagline: buildLocalized('Adult and kids weekly classes near La Loggia.', 'Classi settimanali adulti e bambini in zona La Loggia.'),
    description: buildLocalized(
      'Diaria publishes recurring yoga, pilates, and kids activities on its Palermo calendar.',
      'Diaria pubblica sul calendario palermitano attivita ricorrenti di yoga, pilates e corsi per bambini.'
    ),
    address: 'Via Venezia 61, Palermo',
    geo: { lat: 38.1173045, lng: 13.3618569 },
    amenities: ['Weekly timetable', 'Kids activities', 'Beginner-friendly formats'],
    languages: ['Italian'],
    styleSlugs: [
      'hatha',
      'vinyasa',
      'ashtanga',
      'pilates-core',
      'kids-theater',
      'kids-contemporary-dance',
      'kids-dance-foundations',
      'kids-dance-pedagogy',
      'kids-capoeira'
    ],
    categorySlugs: ['yoga', 'pilates', 'kids-activities'],
    bookingTargetOrder: ['diaria-iscrizione', 'diaria-whatsapp', 'diaria-calendario'],
    freshnessNote: buildLocalized(
      'Timetable verified on 2026-03-12 from the official Diaria calendar.',
      'Calendario verificato il 2026-03-12 dalla fonte ufficiale Diaria.'
    ),
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00'
  },
  {
    slug: 'diaria-studio-gagini',
    citySlug: 'palermo',
    neighborhoodSlug: 'citywide',
    name: 'Diaria - Studio Gagini',
    tagline: buildLocalized('Pilates, yoga, and kids classes in central Palermo.', 'Pilates, yoga e corsi bimbi nel centro di Palermo.'),
    description: buildLocalized(
      'Second Diaria location with recurring morning and evening class slots across the week.',
      'Seconda sede Diaria con slot ricorrenti mattina e sera durante la settimana.'
    ),
    address: 'Via Antonio Gagini 31/59, Palermo',
    geo: { lat: 38.1202217, lng: 13.3621221 },
    amenities: ['Weekly timetable', 'Contact via WhatsApp', 'Mixed-level classes'],
    languages: ['Italian'],
    styleSlugs: [
      'hatha',
      'vinyasa',
      'ashtanga',
      'pilates-core',
      'kids-theater',
      'kids-contemporary-dance'
    ],
    categorySlugs: ['yoga', 'pilates', 'kids-activities'],
    bookingTargetOrder: ['diaria-iscrizione', 'diaria-whatsapp', 'diaria-calendario'],
    freshnessNote: buildLocalized(
      'Timetable verified on 2026-03-12 from the official Diaria calendar.',
      'Calendario verificato il 2026-03-12 dalla fonte ufficiale Diaria.'
    ),
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00'
  }
];

const extraRecurringSessions: RecurringSessionTemplate[] = [
  {
    templateId: 'kids-circo-01',
    citySlug: 'palermo',
    venueSlug: 'circo-pificio-palermo',
    instructorSlug: 'circopificio-team',
    categorySlug: 'kids-activities',
    styleSlug: 'circomotricita',
    title: buildLocalized('Kids Circomotricity', 'Circomotricita bambini'),
    weekday: 'Tuesday',
    startTime: '17:00',
    endTime: '18:00',
    level: 'beginner',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'circopificio-website',
    sourceUrl: 'https://www.circopificio.it/circomotricita/',
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'kids-spazio-01',
    citySlug: 'palermo',
    venueSlug: 'spazio-terra-palermo',
    instructorSlug: 'spazio-terra-team',
    categorySlug: 'kids-activities',
    styleSlug: 'aerial-kids-yoga',
    title: buildLocalized('Kids Aerial Yoga Lab', 'Yoga bimbi in volo'),
    weekday: 'Saturday',
    startTime: '10:30',
    endTime: '11:30',
    level: 'beginner',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'spazio-terra-facebook',
    sourceUrl: 'https://www.facebook.com/spazioterrapalermo',
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-mon-microworkout-pilates-0830',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-maja',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Microworkout Pilates', 'Microworkout Pilates'),
    weekday: 'Monday',
    startTime: '08:30',
    endTime: '09:15',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-mon-hatha-flow-0900',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-federica',
    categorySlug: 'yoga',
    styleSlug: 'hatha',
    title: buildLocalized('Hatha Yoga Flow', 'Hatha Yoga Flow'),
    weekday: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-mon-pilates-barre-1330',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-federica',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates Barre', 'Pilates Barre'),
    weekday: 'Monday',
    startTime: '13:30',
    endTime: '14:30',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-mon-pilates-1700',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-federica',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates', 'Pilates'),
    weekday: 'Monday',
    startTime: '17:00',
    endTime: '18:00',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-mon-vinyasa-1815',
    citySlug: 'palermo',
    venueSlug: 'diaria-sala-venezia',
    instructorSlug: 'diaria-ceren',
    categorySlug: 'yoga',
    styleSlug: 'vinyasa',
    title: buildLocalized('Vinyasa Yoga', 'Vinyasa Yoga'),
    weekday: 'Monday',
    startTime: '18:15',
    endTime: '19:15',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-mon-pilates-attrezzi-1830',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-emilia',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates Attrezzi', 'Pilates Attrezzi'),
    weekday: 'Monday',
    startTime: '18:30',
    endTime: '19:30',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-mon-ashtanga-1930',
    citySlug: 'palermo',
    venueSlug: 'diaria-sala-venezia',
    instructorSlug: 'diaria-maria-laura',
    categorySlug: 'yoga',
    styleSlug: 'ashtanga',
    title: buildLocalized('Ashtanga Yoga', 'Ashtanga Yoga'),
    weekday: 'Monday',
    startTime: '19:30',
    endTime: '20:30',
    level: 'intermediate',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-tue-pilates-attrezzi-0900',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-emilia',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates Attrezzi', 'Pilates Attrezzi'),
    weekday: 'Tuesday',
    startTime: '09:00',
    endTime: '10:00',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-tue-microworkout-core-1430',
    citySlug: 'palermo',
    venueSlug: 'diaria-sala-venezia',
    instructorSlug: 'diaria-federica',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Microworkout Core & Stability', 'Microworkout Core e Stability'),
    weekday: 'Tuesday',
    startTime: '14:30',
    endTime: '15:15',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-tue-pilates-cardiodinamico-1800',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-emilia',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates Cardiodynamic', 'Pilates Cardiodinamico'),
    weekday: 'Tuesday',
    startTime: '18:00',
    endTime: '19:00',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-tue-pilates-1915',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-emilia',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates', 'Pilates'),
    weekday: 'Tuesday',
    startTime: '19:15',
    endTime: '20:15',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-wed-hatha-standing-0830',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-federica',
    categorySlug: 'yoga',
    styleSlug: 'hatha',
    title: buildLocalized('Hatha Yoga (Standing Pose)', 'Hatha Yoga (Standing Pose)'),
    weekday: 'Wednesday',
    startTime: '08:30',
    endTime: '09:30',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-wed-pilates-muro-1030',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-federica',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates Muro', 'Pilates Muro'),
    weekday: 'Wednesday',
    startTime: '10:30',
    endTime: '11:30',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-wed-pilates-attrezzi-1330',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-emilia',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates Attrezzi', 'Pilates Attrezzi'),
    weekday: 'Wednesday',
    startTime: '13:30',
    endTime: '14:30',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-wed-pilates-1700',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-maja',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates', 'Pilates'),
    weekday: 'Wednesday',
    startTime: '17:00',
    endTime: '18:00',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-wed-pilates-flow-1830',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-emilia',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates Flow', 'Pilates Flow'),
    weekday: 'Wednesday',
    startTime: '18:30',
    endTime: '19:30',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-wed-ashtanga-1930',
    citySlug: 'palermo',
    venueSlug: 'diaria-sala-venezia',
    instructorSlug: 'diaria-maria-laura',
    categorySlug: 'yoga',
    styleSlug: 'ashtanga',
    title: buildLocalized('Ashtanga Yoga', 'Ashtanga Yoga'),
    weekday: 'Wednesday',
    startTime: '19:30',
    endTime: '20:30',
    level: 'intermediate',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-thu-pilates-flow-0900',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-emilia',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates Flow', 'Pilates Flow'),
    weekday: 'Thursday',
    startTime: '09:00',
    endTime: '10:00',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-thu-microworkout-linfodrenante-1430',
    citySlug: 'palermo',
    venueSlug: 'diaria-sala-venezia',
    instructorSlug: 'diaria-emilia',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Microworkout Lymphatic', 'Microworkout Linfodrenante'),
    weekday: 'Thursday',
    startTime: '14:30',
    endTime: '15:15',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-thu-pilates-1800',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-federica',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates', 'Pilates'),
    weekday: 'Thursday',
    startTime: '18:00',
    endTime: '19:00',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-thu-pilates-attrezzi-1915',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-federica',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates Attrezzi', 'Pilates Attrezzi'),
    weekday: 'Thursday',
    startTime: '19:15',
    endTime: '20:15',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-fri-hatha-0900',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-federica',
    categorySlug: 'yoga',
    styleSlug: 'hatha',
    title: buildLocalized('Hatha Yoga', 'Hatha Yoga'),
    weekday: 'Friday',
    startTime: '09:00',
    endTime: '10:00',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-fri-pilates-cardiodinamico-1330',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-maja',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates Cardiodynamic', 'Pilates Cardiodinamico'),
    weekday: 'Friday',
    startTime: '13:30',
    endTime: '14:30',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-fri-pilates-barre-1700',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-federica',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates Barre', 'Pilates Barre'),
    weekday: 'Friday',
    startTime: '17:00',
    endTime: '18:00',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-fri-vinyasa-1815',
    citySlug: 'palermo',
    venueSlug: 'diaria-sala-venezia',
    instructorSlug: 'diaria-ceren',
    categorySlug: 'yoga',
    styleSlug: 'vinyasa',
    title: buildLocalized('Vinyasa Yoga', 'Vinyasa Yoga'),
    weekday: 'Friday',
    startTime: '18:15',
    endTime: '19:15',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-sat-pilates-yoga-1030',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-federica',
    categorySlug: 'pilates',
    styleSlug: 'pilates-core',
    title: buildLocalized('Pilates / Yoga', 'Pilates / Yoga'),
    weekday: 'Saturday',
    startTime: '10:30',
    endTime: '11:30',
    level: 'open',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-kids-mon-contemporary-1700',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-emilia',
    categorySlug: 'kids-activities',
    styleSlug: 'kids-contemporary-dance',
    title: buildLocalized('Contemporary Dance 7-10', 'Danza contemporanea 7-10'),
    weekday: 'Monday',
    startTime: '17:00',
    endTime: '18:00',
    level: 'beginner',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-kids-mon-capoeira-1645',
    citySlug: 'palermo',
    venueSlug: 'diaria-sala-venezia',
    instructorSlug: 'diaria-ceroda',
    categorySlug: 'kids-activities',
    styleSlug: 'kids-capoeira',
    title: buildLocalized('Capoeira 6-10', 'Capoeira 6-10'),
    weekday: 'Monday',
    startTime: '16:45',
    endTime: '17:45',
    level: 'beginner',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-kids-tue-theater-1615',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-dario',
    categorySlug: 'kids-activities',
    styleSlug: 'kids-theater',
    title: buildLocalized('Theater 10+ Years', 'Teatro 10+ anni'),
    weekday: 'Tuesday',
    startTime: '16:15',
    endTime: '18:00',
    level: 'beginner',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-kids-tue-dance-1630',
    citySlug: 'palermo',
    venueSlug: 'diaria-sala-venezia',
    instructorSlug: 'diaria-carlotta',
    categorySlug: 'kids-activities',
    styleSlug: 'kids-dance-foundations',
    title: buildLocalized('Dance 5-6 Years', 'Danza 5-6 anni'),
    weekday: 'Tuesday',
    startTime: '16:30',
    endTime: '17:30',
    level: 'beginner',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-kids-wed-pedagogy-1600',
    citySlug: 'palermo',
    venueSlug: 'diaria-sala-venezia',
    instructorSlug: 'diaria-emilia',
    categorySlug: 'kids-activities',
    styleSlug: 'kids-dance-pedagogy',
    title: buildLocalized('Dance Pedagogy 3-4', 'Pedagogia della danza 3-4'),
    weekday: 'Wednesday',
    startTime: '16:00',
    endTime: '17:00',
    level: 'beginner',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-kids-wed-contemporary-1700',
    citySlug: 'palermo',
    venueSlug: 'diaria-sala-venezia',
    instructorSlug: 'diaria-emilia',
    categorySlug: 'kids-activities',
    styleSlug: 'kids-contemporary-dance',
    title: buildLocalized('Contemporary Dance 7-10', 'Danza contemporanea 7-10'),
    weekday: 'Wednesday',
    startTime: '17:00',
    endTime: '18:00',
    level: 'beginner',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-kids-thu-theater-1615',
    citySlug: 'palermo',
    venueSlug: 'diaria-studio-gagini',
    instructorSlug: 'diaria-dario',
    categorySlug: 'kids-activities',
    styleSlug: 'kids-theater',
    title: buildLocalized('Theater 7-10 Years', 'Teatro 7-10 anni'),
    weekday: 'Thursday',
    startTime: '16:15',
    endTime: '18:00',
    level: 'beginner',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  },
  {
    templateId: 'diaria-kids-thu-capoeira-1645',
    citySlug: 'palermo',
    venueSlug: 'diaria-sala-venezia',
    instructorSlug: 'diaria-ceroda',
    categorySlug: 'kids-activities',
    styleSlug: 'kids-capoeira',
    title: buildLocalized('Capoeira 6-10', 'Capoeira 6-10'),
    weekday: 'Thursday',
    startTime: '16:45',
    endTime: '17:45',
    level: 'beginner',
    language: 'Italian',
    format: 'in_person',
    bookingTargetSlug: 'diaria-iscrizione',
    sourceUrl: diariaCalendarSource,
    lastVerifiedAt: '2026-03-12T12:00:00+01:00',
    verificationStatus: 'verified'
  }
];

const generatedVenuesWithKidsCategory = generated.venues.map((venue) => {
  const normalizedVenue =
    venue.styleSlugs.includes('kids-yoga') && !venue.categorySlugs.includes('kids-activities')
      ? { ...venue, categorySlugs: [...venue.categorySlugs, 'kids-activities'] }
      : venue;

  return withVenueCoverImage(normalizedVenue);
});

export const styles: Style[] = [...generated.styles, ...extraStyles];
export const instructors: Instructor[] = [...generated.instructors, ...extraInstructors].map(withInstructorMedia);
export const bookingTargets: BookingTarget[] = [...generated.bookingTargets, ...extraBookingTargets];
export const venues: Venue[] = [...generatedVenuesWithKidsCategory, ...extraVenues.map(withVenueCoverImage)];

export const collections: EditorialCollection[] = [
  {
    slug: 'today-nearby',
    citySlug: 'palermo',
    title: buildLocalized('Today nearby', 'Vicino a te oggi'),
    description: buildLocalized('Quick picks for a same-day Palermo practice.', 'Selezione rapida per praticare a Palermo nella stessa giornata.'),
    cta: buildLocalized('Open same-day classes', 'Apri le classi di oggi'),
    kind: 'rule'
  },
  {
    slug: 'new-this-week',
    citySlug: 'palermo',
    title: buildLocalized('New this week', 'Nuovo questa settimana'),
    description: buildLocalized('Freshly checked sessions and timetables from current Palermo sources.', 'Sessioni e orari ricontrollati di fresco da fonti palermitane correnti.'),
    cta: buildLocalized('See fresh additions', 'Vedi le novita'),
    kind: 'rule'
  },
  {
    slug: 'english-speaking-classes',
    citySlug: 'palermo',
    title: buildLocalized('English-speaking classes', 'Classi in inglese'),
    description: buildLocalized('Reserved for sessions that clearly publish English-language delivery.', 'Riservato alle sessioni che pubblicano chiaramente una conduzione in inglese.'),
    cta: buildLocalized('Browse English-friendly classes', 'Esplora le classi in inglese'),
    kind: 'editorial'
  }
];

const weekdayMap: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

const parseClock = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return { hour, minute };
};

const inferSessionMetadata = (template: RecurringSessionTemplate) => {
  const categorySlug = template.styleSlug === 'kids-yoga' ? 'kids-activities' : template.categorySlug;
  const audience =
    template.audience ??
    inferSessionAudience({
      categorySlug,
      styleSlug: template.styleSlug,
      title: template.title
    });
  const attendanceModel = normalizeAttendanceModel(template.attendanceModel ?? (audience === 'kids' ? 'cycle' : 'drop_in'));
  const styleAgeRange = inferKidsAgeRangeFromStyle(template.styleSlug);
  const ageMin = template.ageMin ?? (audience === 'kids' ? styleAgeRange.min : undefined);
  const ageMax = template.ageMax ?? (audience === 'kids' ? styleAgeRange.max : undefined);
  const ageBand = template.ageBand ?? styleAgeRange.ageBand ?? deriveKidsAgeBand(ageMin, ageMax);
  const guardianRequired =
    template.guardianRequired ?? (audience === 'kids' ? (typeof ageMax === 'number' ? ageMax <= 10 : true) : false);

  return {
    categorySlug,
    audience,
    attendanceModel,
    ageMin,
    ageMax,
    ageBand,
    guardianRequired
  };
};

const getFallbackPriceNote = (template: Pick<RecurringSessionTemplate, 'venueSlug' | 'categorySlug'>) => {
  if (template.venueSlug.startsWith('diaria-')) {
    if (template.categorySlug === 'kids-activities') {
      return buildLocalized(
        'Diaria 2025 kids pricing: monthly plans from EUR 35, drop-in EUR 10-15 by class, plus EUR 20 annual membership.',
        'Listino Diaria 2025 area bimbi: mensili da 35 EUR, spot 10-15 EUR secondo corso, piu 20 EUR di quota associativa annua.'
      );
    }

    return buildLocalized(
      'Diaria 2025 Yoga/Pilates pricing: EUR 10 drop-in, 10-class pass EUR 85, monthly plans from EUR 35, plus EUR 20 annual membership.',
      'Listino Diaria 2025 Yoga/Pilates: spot 10 EUR, carnet 10 lezioni 85 EUR, mensili da 35 EUR, piu 20 EUR di quota associativa annua.'
    );
  }

  if (template.venueSlug === 'circo-pificio-palermo') {
    return buildLocalized(
      'Pricing is not publicly listed online; trial lesson booking is available via Circo Pificio contacts.',
      'Prezzo non pubblicato online; prenotazione lezione di prova disponibile via contatti Circo Pificio.'
    );
  }

  if (template.venueSlug === 'spazio-terra-palermo') {
    return buildLocalized(
      'Pricing is not publicly listed online; booking and pricing details are shared via the official social contact channel.',
      'Prezzo non pubblicato online; dettagli su costo e prenotazione condivisi tramite canale social ufficiale.'
    );
  }

  return undefined;
};

const generateSessions = () => {
  const zone = 'Europe/Rome';
  const start = DateTime.now().setZone(zone).startOf('day');
  const sessions: Session[] = [];

  for (const template of [...generated.recurringSessions, ...extraRecurringSessions]) {
    const targetWeekday = weekdayMap[template.weekday];
    if (!targetWeekday) continue;

    const startClock = parseClock(template.startTime);
    const endClock = parseClock(template.endTime);

    for (let offset = 0; offset < 14; offset += 1) {
      const day = start.plus({ days: offset });
      if (day.weekday !== targetWeekday) continue;

      const startAt = day.set({ hour: startClock.hour, minute: startClock.minute, second: 0, millisecond: 0 });
      const endAt = day.set({ hour: endClock.hour, minute: endClock.minute, second: 0, millisecond: 0 });
      const metadata = inferSessionMetadata(template);

      sessions.push({
        id: `${template.templateId}-${day.toFormat('yyyyLLdd')}`,
        citySlug: template.citySlug,
        venueSlug: template.venueSlug,
        instructorSlug: template.instructorSlug,
        categorySlug: metadata.categorySlug,
        styleSlug: template.styleSlug,
        title: template.title,
        startAt: startAt.toISO() ?? '',
        endAt: endAt.toISO() ?? '',
        level: template.level,
        language: template.language,
        format: template.format,
        bookingTargetSlug: template.bookingTargetSlug,
        sourceUrl: template.sourceUrl,
        lastVerifiedAt: template.lastVerifiedAt,
        verificationStatus: template.verificationStatus,
        audience: metadata.audience,
        attendanceModel: metadata.attendanceModel,
        ageMin: metadata.ageMin,
        ageMax: metadata.ageMax,
        ageBand: metadata.ageBand,
        guardianRequired: metadata.guardianRequired,
        priceNote: normalizePriceNote(template.priceNote ?? getFallbackPriceNote(template))
      });
    }
  }

  return sessions.sort((a, b) => a.startAt.localeCompare(b.startAt));
};

export const sessions = generateSessions();

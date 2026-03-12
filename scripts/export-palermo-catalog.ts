import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DateTime } from 'luxon';

type Localized = { en: string; it: string };

type ResearchVenue = {
  id: string;
  slug: string;
  name: string;
  neighborhood: string | null;
  street_address: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  venue_kind: string;
  notes: string | null;
  last_verified_at: string;
  source_url: string;
  lat: number;
  lng: number;
  location_label: string;
  location_confidence: string;
};

type ResearchOffering = {
  venue_id: string;
  venue_slug: string;
  title: string;
  style: string | null;
  category: string;
  format: string;
  audience: string | null;
  pricing_text: string | null;
};

type ResearchInstructor = {
  id: string;
  slug: string;
  full_name: string;
  bio: string | null;
  listing_status: string;
  source_url: string;
};

type ResearchSchedule = {
  schedule_id: string;
  weekday: string;
  start_time: string;
  end_time: string;
  location_text: string | null;
  offering_title: string;
  offering_style: string | null;
  offering_category: string;
  offering_format: string;
  offering_audience: string | null;
  pricing_text: string | null;
  offering_description: string | null;
  venue_id: string;
  venue_slug: string;
  venue_name: string;
  instructor_id: string | null;
  source_url: string;
  last_verified_at: string;
};

type AppNeighborhood = {
  slug: string;
  citySlug: 'palermo';
  name: Localized;
  description: Localized;
  center: { lat: number; lng: number };
};

type AppStyle = {
  slug: string;
  categorySlug: string;
  name: Localized;
  description: Localized;
};

type AppInstructor = {
  slug: string;
  citySlug: 'palermo';
  name: string;
  shortBio: Localized;
  specialties: string[];
  languages: string[];
};

type AppBookingTarget = {
  slug: string;
  type: 'direct' | 'platform' | 'whatsapp' | 'phone' | 'email' | 'website';
  label: string;
  href: string;
};

type AppVenue = {
  slug: string;
  citySlug: 'palermo';
  neighborhoodSlug: string;
  name: string;
  tagline: Localized;
  description: Localized;
  address: string;
  geo: { lat: number; lng: number };
  amenities: string[];
  languages: string[];
  styleSlugs: string[];
  categorySlugs: string[];
  bookingTargetOrder: string[];
  freshnessNote: Localized;
  sourceUrl: string;
  lastVerifiedAt: string;
};

type AppRecurringSession = {
  templateId: string;
  citySlug: 'palermo';
  venueSlug: string;
  instructorSlug: string;
  categorySlug: string;
  styleSlug: string;
  title: Localized;
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
  priceNote?: Localized;
};

type AppCatalog = {
  neighborhoods: AppNeighborhood[];
  styles: AppStyle[];
  instructors: AppInstructor[];
  bookingTargets: AppBookingTarget[];
  venues: AppVenue[];
  recurringSessions: AppRecurringSession[];
};

type AppSessionInstance = {
  id: string;
  citySlug: 'palermo';
  venueSlug: string;
  instructorSlug: string;
  categorySlug: string;
  styleSlug: string;
  title: Localized;
  startAt: string;
  endAt: string;
  level: 'beginner' | 'open' | 'intermediate' | 'advanced';
  language: string;
  format: 'in_person' | 'online' | 'hybrid';
  bookingTargetSlug: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  verificationStatus: 'verified';
  priceNote?: Localized;
};

const ROOT = process.cwd();
const DB_PATH = join(ROOT, 'data/research/palermo_research.sqlite');
const APP_JSON_PATH = join(ROOT, 'data/research/palermo_app_catalog.json');
const POSTGRES_SQL_PATH = join(ROOT, 'data/research/palermo_postgres_seed.sql');

const queryJson = <T>(sql: string): T[] => {
  const output = execFileSync('sqlite3', ['-json', DB_PATH, sql], { encoding: 'utf8' }).trim();
  return output ? (JSON.parse(output) as T[]) : [];
};

const localized = (en: string, it: string): Localized => ({ en, it });

const isoAtMidday = (date: string) => `${date}T12:00:00+01:00`;

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/[\s/-]+/)
    .map((chunk) => (chunk ? chunk[0].toUpperCase() + chunk.slice(1) : chunk))
    .join(' ');

const firstPhone = (value: string | null) => {
  if (!value) return null;
  return value.split('/')[0]?.trim() ?? null;
};

const phoneDigits = (value: string | null) => {
  if (!value) return null;
  const digits = value.replace(/[^\d+]/g, '');
  if (!digits) return null;
  return digits.startsWith('+') ? digits : `+${digits.replace(/^00/, '')}`;
};

const whatsappHref = (value: string | null) => {
  const digits = phoneDigits(value);
  if (!digits) return null;
  return `https://wa.me/${digits.replace(/[^\d]/g, '')}`;
};

const venuePresentation: Record<string, {
  neighborhoodSlug: string;
  tagline: Localized;
  description: Localized;
  amenities: string[];
  languages: string[];
}> = {
  'yoga-your-life': {
    neighborhoodSlug: 'politeama',
    tagline: localized('Dense weekly yoga timetable near Politeama.', 'Orario yoga fitto vicino al Politeama.'),
    description: localized(
      'Barbara Faludi’s studio has the clearest current weekly schedule in the city, spanning hatha, vinyasa, yin, meditation, and children’s classes.',
      'Lo studio di Barbara Faludi ha uno degli orari settimanali piu chiari della citta, con hatha, vinyasa, yin, meditazione e classi per bambini.'
    ),
    amenities: ['Mats available', 'Small groups', 'Studio timetable'],
    languages: ['Italian', 'English']
  },
  'ashtanga-shala-sicilia': {
    neighborhoodSlug: 'liberta',
    tagline: localized('Mysore-led Ashtanga base off Via Liberta.', 'Base Ashtanga con Mysore in zona Via Liberta.'),
    description: localized(
      'A source-backed Palermo shala with current Mysore, yin, pranayama, meditation, and children’s programming.',
      'Una shala palermitana verificata con Mysore, yin, pranayama, meditazione e programma bimbi.'
    ),
    amenities: ['Early classes', 'Traditional practice room', 'Lesson packs'],
    languages: ['Italian', 'English']
  },
  'centro-cultura-rishi': {
    neighborhoodSlug: 'sampolo',
    tagline: localized('Long-running traditional yoga association in Sampolo.', 'Associazione storica di yoga tradizionale in zona Sampolo.'),
    description: localized(
      'Centro di Cultura Rishi publishes a dense 2025-2026 timetable with first-level, soft, hatha, breathwork, and children’s sessions.',
      'Il Centro di Cultura Rishi pubblica un orario 2025-2026 fitto con primo livello, soft, hatha, respiro e classi bimbi.'
    ),
    amenities: ['Academic-year timetable', 'Beginner paths', 'Breathwork classes'],
    languages: ['Italian']
  },
  'centro-sportivo-ivanor': {
    neighborhoodSlug: 'politeama',
    tagline: localized('Sports club with morning yoga and evening yogilates.', 'Centro sportivo con yoga al mattino e yogilates la sera.'),
    description: localized(
      'Ivanor is not a yoga-only studio, but it publishes concrete Palermo times for Hatha Yoga and Yogilates with a named instructor.',
      'Ivanor non e uno studio solo yoga, ma pubblica orari palermitani concreti per Hatha Yoga e Yogilates con insegnante nominata.'
    ),
    amenities: ['Locker rooms', 'Sports club facilities', 'Morning slots'],
    languages: ['Italian']
  },
  'grandmas-pilates': {
    neighborhoodSlug: 'notarbartolo',
    tagline: localized('Boutique yoga-pilates studio with a secret-garden feel.', 'Studio boutique yoga-pilates con atmosfera da secret garden.'),
    description: localized(
      'The official site clearly confirms the studio and its yoga-pilates offer, but this pass did not surface a fully machine-readable Palermo street coordinate.',
      'Il sito ufficiale conferma chiaramente lo studio e l’offerta yoga-pilates, ma in questo passaggio non e emersa una coordinata palermitana completamente leggibile.'
    ),
    amenities: ['Boutique studio', 'Private options', 'Online options'],
    languages: ['Italian', 'English']
  },
  'palermo-pilates': {
    neighborhoodSlug: 'politeama',
    tagline: localized('Classical Pilates studio with private Vinyasa Yoga.', 'Studio di pilates classico con Vinyasa Yoga privato.'),
    description: localized(
      'Palermo Pilates is a strong adjacent venue: the official site confirms the address, team, and a by-appointment Vinyasa Yoga offer.',
      'Palermo Pilates e un forte venue adiacente: il sito ufficiale conferma indirizzo, team e un’offerta Vinyasa Yoga su appuntamento.'
    ),
    amenities: ['Private sessions', 'Teacher training', 'International team'],
    languages: ['Italian', 'English']
  },
  'taiji-studio-palermo': {
    neighborhoodSlug: 'liberta',
    tagline: localized('Movement studio mixing taiji, yoga, and pilates.', 'Studio di movimento che unisce taiji, yoga e pilates.'),
    description: localized(
      'Taiji Studio Palermo is verified as an active wellness space; yoga is present in the offer mix even though the captured source is lighter on weekly timetable detail.',
      'Taiji Studio Palermo e verificato come spazio wellness attivo; lo yoga e presente nell’offerta anche se la fonte catturata e meno dettagliata sul calendario settimanale.'
    ),
    amenities: ['Multi-discipline studio', 'Open day programming', 'Contact booking'],
    languages: ['Italian']
  },
  'yoga-ananda-palermo': {
    neighborhoodSlug: 'pallavicino',
    tagline: localized('Raja Yoga association with deep practice blocks.', 'Associazione di Raja Yoga con percorsi di pratica approfonditi.'),
    description: localized(
      'Yoga Ananda Palermo is a serious lineage-led association. The captured public schedule is course-block based rather than a standing weekly grid.',
      'Yoga Ananda Palermo e un’associazione guidata da una linea di pratica seria. Il calendario pubblico catturato e a cicli di corso, non una griglia settimanale continua.'
    ),
    amenities: ['Course blocks', 'Meditation paths', 'Association setting'],
    languages: ['Italian']
  },
  'yoga-city': {
    neighborhoodSlug: 'sampolo',
    tagline: localized('Citywide outdoor yoga series across Palermo landmarks.', 'Rassegna di yoga outdoor in luoghi simbolo di Palermo.'),
    description: localized(
      'Yoga City is better understood as an event series than a single studio, with sunrise and sunset sessions staged across Palermo.',
      'Yoga City va letto piu come una rassegna che come uno studio singolo, con sessioni all’alba e al tramonto in diversi luoghi della citta.'
    ),
    amenities: ['Outdoor events', 'Landmark locations', 'Seasonal programming'],
    languages: ['Italian']
  },
  'yogastudiolab': {
    neighborhoodSlug: 'citywide',
    tagline: localized('Yoga and mindful movement project working across Palermo.', 'Progetto di yoga e mindful movement che lavora in piu punti di Palermo.'),
    description: localized(
      'Yogastudiolab is source-backed and current, but the official site confirms Palermo activity more clearly than it exposes a fixed street studio address.',
      'Yogastudiolab e verificato e attivo, ma il sito ufficiale conferma meglio la presenza a Palermo di quanto esponga un indirizzo fisso di studio.'
    ),
    amenities: ['WhatsApp contact', 'Hybrid format', 'Movement therapy'],
    languages: ['Italian']
  },
  'you-are-yoga': {
    neighborhoodSlug: 'citywide',
    tagline: localized('Mobile yoga and pilates service across Palermo.', 'Servizio mobile di yoga e pilates in area Palermo.'),
    description: localized(
      'You Are Yoga clearly documents Palermo service and current packages, but the fixed published timetable captured in this pass points to Terrasini rather than Palermo proper.',
      'You Are Yoga documenta chiaramente il servizio su Palermo e i pacchetti correnti, ma l’orario fisso pubblicato e catturato in questo passaggio punta a Terrasini piu che a Palermo.'
    ),
    amenities: ['Small-group packages', 'Prenatal paths', 'Private lessons'],
    languages: ['Italian', 'English']
  },
  'sahaja-yoga-sicilia': {
    neighborhoodSlug: 'politeama',
    tagline: localized('Community-led weekly Sahaja Yoga near Via Garzilli.', 'Incontro settimanale di Sahaja Yoga vicino a Via Garzilli.'),
    description: localized(
      'The official Sahaja Yoga site publishes a current Palermo Tuesday class with exact address, phone, and embedded map coordinates.',
      'Il sito ufficiale Sahaja Yoga pubblica una classe palermitana corrente del martedi con indirizzo, telefono e coordinate mappa.'
    ),
    amenities: ['Community class', 'Weekly fixed slot', 'Direct phone contact'],
    languages: ['Italian']
  }
};

const neighborhoodDefinitions: Record<string, AppNeighborhood> = {
  citywide: {
    slug: 'citywide',
    citySlug: 'palermo',
    name: localized('Citywide', 'Diffuso in citta'),
    description: localized('Operators working across Palermo without a single public fixed studio address.', 'Operatori che lavorano in piu punti di Palermo senza un unico indirizzo pubblico fisso.'),
    center: { lat: 38.1181, lng: 13.3613 }
  },
  liberta: {
    slug: 'liberta',
    citySlug: 'palermo',
    name: localized('Liberta', 'Liberta'),
    description: localized('Polished residential corridors with disciplined studio rhythms.', 'Assi residenziali curati con ritmi di studio disciplinati.'),
    center: { lat: 38.1351, lng: 13.3483 }
  },
  notarbartolo: {
    slug: 'notarbartolo',
    citySlug: 'palermo',
    name: localized('Notarbartolo', 'Notarbartolo'),
    description: localized('Commuter-friendly west-central Palermo with compact wellness spaces.', 'Area comoda per i commuter nella Palermo centro-occidentale con spazi wellness compatti.'),
    center: { lat: 38.131, lng: 13.3435 }
  },
  pallavicino: {
    slug: 'pallavicino',
    citySlug: 'palermo',
    name: localized('Pallavicino', 'Pallavicino'),
    description: localized('Northern Palermo with easier access toward Mondello and the coast.', 'Quadrante nord di Palermo con accesso piu semplice verso Mondello e la costa.'),
    center: { lat: 38.1735, lng: 13.3256 }
  },
  politeama: {
    slug: 'politeama',
    citySlug: 'palermo',
    name: localized('Politeama', 'Politeama'),
    description: localized('Central Palermo with dense after-work and commuter-friendly classes.', 'Palermo centrale con classi dense nel post-lavoro e facili da raggiungere.'),
    center: { lat: 38.1295, lng: 13.3527 }
  },
  sampolo: {
    slug: 'sampolo',
    citySlug: 'palermo',
    name: localized('Sampolo', 'Sampolo'),
    description: localized('Eastern residential Palermo with long-running associations and event bases.', 'Palermo orientale residenziale con associazioni storiche e basi per eventi.'),
    center: { lat: 38.1438, lng: 13.3501 }
  }
};

const styleDefinitions: Record<string, AppStyle> = {
  ashtanga: { slug: 'ashtanga', categorySlug: 'yoga', name: localized('Ashtanga', 'Ashtanga'), description: localized('Structured, repeatable practice with a traditional backbone.', 'Pratica strutturata e ripetibile con una spina dorsale tradizionale.') },
  'fascia-flow': { slug: 'fascia-flow', categorySlug: 'yoga', name: localized('Fascia Flow', 'Fascia Flow'), description: localized('Fluid sequences focused on connective tissue and body rhythm.', 'Sequenze fluide centrate su fascia e ritmo corporeo.') },
  hatha: { slug: 'hatha', categorySlug: 'yoga', name: localized('Hatha', 'Hatha'), description: localized('Balanced fundamentals with a clear pace and stable cueing.', 'Fondamentali bilanciati con ritmo chiaro e istruzioni stabili.') },
  integrated: { slug: 'integrated', categorySlug: 'movement', name: localized('Integrated Yoga-Pilates', 'Yoga-Pilates Integrato'), description: localized('A blended practice combining yoga, pilates, and stretching.', 'Una pratica mista che unisce yoga, pilates e stretching.') },
  'kids-yoga': { slug: 'kids-yoga', categorySlug: 'yoga', name: localized('Kids Yoga', 'Yoga Bimbi'), description: localized('Playful and structured classes for younger practitioners.', 'Classi giocose e strutturate per praticanti piu giovani.') },
  kriya: { slug: 'kriya', categorySlug: 'yoga', name: localized('Kriya Yoga', 'Kriya Yoga'), description: localized('A lineage-based internal practice path rather than a casual drop-in.', 'Un percorso interiore di linea, piu che un semplice drop-in.') },
  'meditation-practice': { slug: 'meditation-practice', categorySlug: 'meditation', name: localized('Meditation Practice', 'Pratica Meditativa'), description: localized('Seated or guided internal practice focused on attention and regulation.', 'Pratica interiore seduta o guidata centrata su attenzione e regolazione.') },
  odaka: { slug: 'odaka', categorySlug: 'yoga', name: localized('Odaka', 'Odaka'), description: localized('Wave-like movement language tied to the Odaka method.', 'Linguaggio di movimento ondulatorio legato al metodo Odaka.') },
  'pilates-core': { slug: 'pilates-core', categorySlug: 'pilates', name: localized('Pilates', 'Pilates'), description: localized('Core-strength and control-driven movement work.', 'Lavoro di movimento centrato su controllo e forza del core.') },
  'postural-movement': { slug: 'postural-movement', categorySlug: 'movement', name: localized('Postural Movement', 'Movimento Posturale'), description: localized('Alignment and posture-focused movement sessions.', 'Sessioni di movimento orientate ad allineamento e postura.') },
  power: { slug: 'power', categorySlug: 'yoga', name: localized('Power Yoga', 'Power Yoga'), description: localized('A more charged physical practice with steady output.', 'Una pratica fisica piu intensa e continua.') },
  pranayama: { slug: 'pranayama', categorySlug: 'breathwork', name: localized('Pranayama', 'Pranayama'), description: localized('Breath-led classes centered on regulation and respiratory technique.', 'Classi guidate dal respiro centrate su regolazione e tecnica respiratoria.') },
  prenatal: { slug: 'prenatal', categorySlug: 'yoga', name: localized('Prenatal', 'Prenatale'), description: localized('Supportive yoga adapted for pregnancy.', 'Yoga di supporto adattato alla gravidanza.') },
  'qi-gong': { slug: 'qi-gong', categorySlug: 'movement', name: localized('Qi Gong', 'Qi Gong'), description: localized('Energy-focused movement and breath practices with a slower tempo.', 'Pratiche di movimento e respiro orientate all’energia con ritmo piu lento.') },
  raja: { slug: 'raja', categorySlug: 'yoga', name: localized('Raja Yoga', 'Raja Yoga'), description: localized('Meditative practice emphasizing inner regulation and attention.', 'Pratica meditativa centrata su regolazione interiore e attenzione.') },
  'sacred-chant': { slug: 'sacred-chant', categorySlug: 'meditation', name: localized('Sacred Chant', 'Canto Sacro'), description: localized('Voice-led contemplative sessions rooted in mantra and resonance.', 'Sessioni contemplative vocali radicate in mantra e risonanza.') },
  sahaja: { slug: 'sahaja', categorySlug: 'yoga', name: localized('Sahaja Yoga', 'Sahaja Yoga'), description: localized('Meditation-led yoga practice in a community format.', 'Pratica yoga a guida meditativa in formato comunitario.') },
  soft: { slug: 'soft', categorySlug: 'yoga', name: localized('Soft Yoga', 'Soft Yoga'), description: localized('Gentler pacing with accessible intensity and longer reset moments.', 'Ritmo piu gentile con intensita accessibile e piu spazio per il reset.') },
  'sufi-dance': { slug: 'sufi-dance', categorySlug: 'movement', name: localized('Sufi Dance', 'Danza Sufi'), description: localized('Rhythmic contemplative movement inspired by Sufi practice.', 'Movimento contemplativo ritmico ispirato alla pratica sufi.') },
  taijiquan: { slug: 'taijiquan', categorySlug: 'movement', name: localized('Taijiquan', 'Taijiquan'), description: localized('Structured internal martial movement with balance and breath control.', 'Movimento marziale interno strutturato con lavoro su equilibrio e respiro.') },
  'taoist-meditation': { slug: 'taoist-meditation', categorySlug: 'meditation', name: localized('Taoist Meditation', 'Meditazione Taoista'), description: localized('Early-morning meditative practice in the Taoist tradition.', 'Pratica meditativa mattutina nella tradizione taoista.') },
  traditional: { slug: 'traditional', categorySlug: 'yoga', name: localized('Traditional Yoga', 'Yoga Tradizionale'), description: localized('Classic foundations and breath-led practice.', 'Fondamentali classici e pratica guidata dal respiro.') },
  vinyasa: { slug: 'vinyasa', categorySlug: 'yoga', name: localized('Vinyasa', 'Vinyasa'), description: localized('Flow-based sequencing with more continuity between shapes.', 'Sequenze in flow con piu continuita tra una forma e l’altra.') },
  yogilates: { slug: 'yogilates', categorySlug: 'movement', name: localized('Yogilates', 'Yogilates'), description: localized('Hybrid class blending yoga flow and pilates conditioning.', 'Classe ibrida che unisce flow yoga e condizionamento pilates.') },
  yin: { slug: 'yin', categorySlug: 'yoga', name: localized('Yin', 'Yin'), description: localized('Longer holds and slower tissue-focused work.', 'Tenute piu lunghe e lavoro lento sui tessuti.') }
};

const styleAliases: Record<string, keyof typeof styleDefinitions> = {
  'ashtanga yoga': 'ashtanga',
  'canto sacro': 'sacred-chant',
  'danza sufi': 'sufi-dance',
  'fascia flow': 'fascia-flow',
  'hata yoga': 'hatha',
  'hatha yoga': 'hatha',
  'integrated yoga-pilates': 'integrated',
  'kids yoga': 'kids-yoga',
  'kriya yoga': 'kriya',
  'med-taoista': 'taoist-meditation',
  meditation: 'meditation-practice',
  'meditazione taoista': 'taoist-meditation',
  mindfulness: 'meditation-practice',
  'odaka / martial flow': 'odaka',
  'odaka / pranayama': 'odaka',
  'odaka flow': 'odaka',
  pilates: 'pilates-core',
  'pilates matwork': 'pilates-core',
  postura: 'postural-movement',
  'postura dinamica': 'postural-movement',
  'power yoga': 'power',
  pranayama: 'pranayama',
  'postnatal yoga': 'prenatal',
  'prenatal yoga': 'prenatal',
  'qi gong': 'qi-gong',
  'raja yoga': 'raja',
  'sahaja yoga': 'sahaja',
  'soft yoga': 'soft',
  taijiquan: 'taijiquan',
  'traditional yoga': 'traditional',
  'vinyasa yoga': 'vinyasa',
  yogilates: 'yogilates',
  'yin yoga': 'yin'
};

const instructorLanguageOverrides: Record<string, string[]> = {
  'barbara-faludi': ['Italian', 'English'],
  'cristina-chiummo': ['Italian', 'English'],
  'ekaterina-kaptur': ['English', 'Italian'],
  'lesley-bell': ['English', 'Italian'],
  'marta-sto': ['Italian', 'English'],
  'silvia-riccobono': ['Italian', 'English']
};

const titleOverrides: Record<string, Localized> = {
  'Primo Livello Yoga': localized('First Level Yoga', 'Primo Livello Yoga'),
  'Tecniche Respiratorie 1': localized('Breathwork Techniques 1', 'Tecniche Respiratorie 1'),
  'Tecniche Respiratorie 2': localized('Breathwork Techniques 2', 'Tecniche Respiratorie 2'),
  'Yoga Bimbi': localized('Kids Yoga', 'Yoga Bimbi'),
  'Yoga per Bimbi': localized('Kids Yoga', 'Yoga per Bimbi'),
  'Hata Yoga': localized('Hatha Yoga', 'Hata Yoga'),
  'Meditazione, Pranayama e Teoria': localized('Meditation, Pranayama, and Theory', 'Meditazione, Pranayama e Teoria')
};

const venueRows = queryJson<ResearchVenue>(`
SELECT
  v.id,
  v.slug,
  v.name,
  v.neighborhood,
  v.street_address,
  v.postal_code,
  v.phone,
  v.email,
  v.website_url,
  v.venue_kind,
  v.notes,
  v.last_verified_at,
  src.url AS source_url,
  vl.lat,
  vl.lng,
  vl.location_label,
  vl.location_confidence
FROM venues v
JOIN sources src ON src.id = v.source_id
JOIN venue_locations vl ON vl.venue_id = v.id
WHERE v.verification_level = 'official' AND v.listing_status = 'current'
ORDER BY v.name;
`);

const offeringRows = queryJson<ResearchOffering>(`
SELECT
  o.venue_id,
  v.slug AS venue_slug,
  o.title,
  o.style,
  o.category,
  o.format,
  o.audience,
  o.pricing_text
FROM offerings o
JOIN venues v ON v.id = o.venue_id
WHERE v.verification_level = 'official' AND v.listing_status = 'current' AND o.listing_status = 'current'
ORDER BY v.slug, o.title;
`);

const instructorRows = queryJson<ResearchInstructor>(`
SELECT DISTINCT
  i.id,
  i.slug,
  i.full_name,
  i.bio,
  i.listing_status,
  src.url AS source_url
FROM instructors i
JOIN venue_instructors vi ON vi.instructor_id = i.id
JOIN venues v ON v.id = vi.venue_id
JOIN sources src ON src.id = i.source_id
WHERE v.verification_level = 'official' AND v.listing_status = 'current' AND i.listing_status != 'lead'
ORDER BY i.full_name;
`);

const scheduleRows = queryJson<ResearchSchedule>(`
SELECT
  s.id AS schedule_id,
  s.weekday,
  s.start_time,
  s.end_time,
  s.location_text,
  o.title AS offering_title,
  o.style AS offering_style,
  o.category AS offering_category,
  o.format AS offering_format,
  o.audience AS offering_audience,
  o.pricing_text,
  o.description AS offering_description,
  v.id AS venue_id,
  v.slug AS venue_slug,
  v.name AS venue_name,
  o.instructor_id,
  src.url AS source_url,
  s.last_verified_at
FROM schedules s
JOIN offerings o ON o.id = s.offering_id
JOIN venues v ON v.id = o.venue_id
JOIN sources src ON src.id = s.source_id
WHERE v.verification_level = 'official'
  AND v.listing_status = 'current'
  AND o.listing_status = 'current'
  AND s.listing_status = 'current'
  AND s.weekday IS NOT NULL
  AND s.start_time IS NOT NULL
  AND s.end_time IS NOT NULL
ORDER BY v.slug, s.weekday, s.start_time;
`).filter((row) => !row.location_text?.toLowerCase().includes('terrasini'));

const categoryFallbackStyle: Record<string, keyof typeof styleDefinitions> = {
  breathwork: 'pranayama',
  meditation: 'meditation-practice',
  mindfulness: 'meditation-practice',
  movement: 'integrated',
  pilates: 'pilates-core',
  yoga: 'hatha'
};

const normalizeStyle = (raw: string | null, fallbackTitle: string, category: string) => {
  const key = (raw ?? fallbackTitle).trim().toLowerCase();
  const direct = styleAliases[key];
  if (direct) return direct;
  if (key.includes('vinyasa')) return 'vinyasa';
  if (key.includes('ashtanga')) return 'ashtanga';
  if (key.includes('yin')) return 'yin';
  if (key.includes('hatha') || key.includes('hata')) return 'hatha';
  if (key.includes('pranayama') || key.includes('respiratorie')) return 'pranayama';
  if (key.includes('taiji') || key.includes('taijiquan')) return 'taijiquan';
  if (key.includes('qi gong')) return 'qi-gong';
  if (key.includes('yogilates')) return 'yogilates';
  if (key.includes('postura')) return 'postural-movement';
  if (key.includes('danza sufi')) return 'sufi-dance';
  if (key.includes('canto')) return 'sacred-chant';
  if (key.includes('meditaz') || key.includes('mindfulness')) return 'meditation-practice';
  if (key.includes('sahaja')) return 'sahaja';
  if (key.includes('bimbi') || key.includes('kids')) return 'kids-yoga';
  return categoryFallbackStyle[category] ?? 'hatha';
};

const categoryForOffering = (raw: string) => {
  if (raw === 'pilates') return 'pilates';
  if (raw === 'breathwork') return 'breathwork';
  if (raw === 'meditation' || raw === 'mindfulness') return 'meditation';
  if (raw === 'movement') return 'movement';
  return 'yoga';
};

const venueOfferings = new Map<string, ResearchOffering[]>();
for (const row of offeringRows) {
  const existing = venueOfferings.get(row.venue_id) ?? [];
  existing.push(row);
  venueOfferings.set(row.venue_id, existing);
}

const teamInstructors = new Map<string, AppInstructor>();
const sessionStyleSlugs = new Set<string>();

for (const row of scheduleRows) {
  sessionStyleSlugs.add(normalizeStyle(row.offering_style, row.offering_title, row.offering_category));
}

for (const venue of venueRows) {
  const needsTeam = scheduleRows.some((row) => row.venue_id === venue.id && !row.instructor_id);
  if (!needsTeam) continue;
  const name = venue.name.includes('Centro di Cultura Rishi')
    ? 'Rishi teaching team'
    : venue.name.includes('Sahaja')
      ? 'Sahaja Yoga Palermo team'
      : `${venue.name} team`;
  teamInstructors.set(venue.id, {
    slug: `${venue.slug}-team`,
    citySlug: 'palermo',
    name,
    shortBio: localized(
      `Public source pages for ${venue.name} do not always name the individual teacher for every class, so this session is attributed to the venue team.`,
      `Le fonti pubbliche di ${venue.name} non nominano sempre l’insegnante individuale per ogni classe, quindi questa sessione e attribuita al team del venue.`
    ),
    specialties: ['hatha'],
    languages: venuePresentation[venue.slug]?.languages ?? ['Italian']
  });
}

const instructorSpecialties = new Map<string, Set<string>>();

for (const offering of offeringRows) {
  const matchingInstructors = instructorRows.filter((row) =>
    scheduleRows.some((schedule) => schedule.venue_id === offering.venue_id && schedule.instructor_id === row.id)
  );

  for (const instructor of matchingInstructors) {
    const set = instructorSpecialties.get(instructor.slug) ?? new Set<string>();
    set.add(normalizeStyle(offering.style, offering.title, offering.category));
    instructorSpecialties.set(instructor.slug, set);
  }
}

const appInstructors: AppInstructor[] = [
  ...instructorRows.map((row) => ({
    slug: row.slug,
    citySlug: 'palermo' as const,
    name: row.full_name,
    shortBio: localized(row.bio ?? `${row.full_name} appears in a current Palermo source page.`, row.bio ?? `${row.full_name} compare in una fonte palermitana corrente.`),
    specialties: Array.from(instructorSpecialties.get(row.slug) ?? new Set(['hatha'])),
    languages: instructorLanguageOverrides[row.slug] ?? ['Italian']
  })),
  ...Array.from(teamInstructors.values())
].sort((a, b) => a.name.localeCompare(b.name));

const bookingTargets: AppBookingTarget[] = [];
const venueBookingTargetOrder = new Map<string, string[]>();

for (const venue of venueRows) {
  const targets: string[] = [];
  const basePhone = firstPhone(venue.phone);
  const whatsapp = whatsappHref(basePhone);
  const phone = phoneDigits(basePhone);

  if (whatsapp) {
    const slug = `${venue.slug}-whatsapp`;
    bookingTargets.push({ slug, type: 'whatsapp', label: 'Book on WhatsApp', href: whatsapp });
    targets.push(slug);
  }

  if (phone) {
    const slug = `${venue.slug}-phone`;
    bookingTargets.push({ slug, type: 'phone', label: 'Call to reserve', href: `tel:${phone}` });
    targets.push(slug);
  }

  if (venue.email) {
    const slug = `${venue.slug}-email`;
    bookingTargets.push({ slug, type: 'email', label: 'Book by email', href: `mailto:${venue.email}` });
    targets.push(slug);
  }

  if (venue.website_url) {
    const slug = `${venue.slug}-website`;
    bookingTargets.push({ slug, type: 'website', label: 'Visit website', href: venue.website_url });
    targets.push(slug);
  }

  if (targets.length === 0) {
    const slug = `${venue.slug}-website`;
    bookingTargets.push({ slug, type: 'website', label: 'Visit source page', href: venue.source_url });
    targets.push(slug);
  }

  venueBookingTargetOrder.set(venue.slug, targets);
}

const usedStyleSlugs = new Set<string>();

const appVenues: AppVenue[] = venueRows.map((row) => {
  const presentation = venuePresentation[row.slug];
  if (!presentation) {
    throw new Error(`Missing venue presentation config for ${row.slug}`);
  }

  const offerings = venueOfferings.get(row.id) ?? [];
  const styleSlugs = Array.from(
    new Set(
      offerings.map((offering) => normalizeStyle(offering.style, offering.title, offering.category))
    )
  ).sort();
  const categorySlugs = Array.from(
    new Set(
      offerings.map((offering) => categoryForOffering(offering.category))
    )
  ).sort();

  for (const slug of styleSlugs) usedStyleSlugs.add(slug);

  const addressBits = [row.street_address, row.postal_code, 'Palermo'].filter(Boolean);
  const fallbackAddress = row.location_label.includes('Palermo') ? row.location_label : `${row.location_label}, Palermo`;

  return {
    slug: row.slug,
    citySlug: 'palermo' as const,
    neighborhoodSlug: presentation.neighborhoodSlug,
    name: row.name,
    tagline: presentation.tagline,
    description: presentation.description,
    address: addressBits.length > 0 ? addressBits.join(', ') : fallbackAddress,
    geo: { lat: row.lat, lng: row.lng },
    amenities: presentation.amenities,
    languages: presentation.languages,
    styleSlugs,
    categorySlugs,
    bookingTargetOrder: venueBookingTargetOrder.get(row.slug) ?? [],
    freshnessNote: localized(
      `Checked against a current public source on ${row.last_verified_at}.`,
      `Controllato su una fonte pubblica corrente il ${row.last_verified_at}.`
    ),
    sourceUrl: row.source_url,
    lastVerifiedAt: isoAtMidday(row.last_verified_at)
  };
}).sort((a, b) => a.name.localeCompare(b.name));

for (const instructor of appInstructors) {
  instructor.specialties = Array.from(new Set(instructor.specialties)).sort();
}

const translateTitle = (title: string): Localized => {
  if (titleOverrides[title]) return titleOverrides[title];
  if (title.includes(' con ')) {
    const [prefix, suffix] = title.split(' con ');
    return localized(`${prefix} with ${suffix}`, title);
  }
  return localized(titleCase(title), title);
};

const deriveLevel = (row: ResearchSchedule): AppRecurringSession['level'] => {
  const title = row.offering_title.toLowerCase();
  const audience = row.offering_audience?.toLowerCase() ?? '';
  if (title.includes('primo livello') || title.includes('soft') || title.includes('bimbi') || audience.includes('beginner') || audience.includes('children')) return 'beginner';
  if (title.includes('mysore')) return 'intermediate';
  return 'open';
};

const deriveFormat = (raw: string): AppRecurringSession['format'] => {
  if (raw === 'hybrid') return 'hybrid';
  return 'in_person';
};

const venueDefaultInstructor = new Map<string, string>();
for (const instructor of appInstructors) {
  const venue = venueRows.find((row) => scheduleRows.some((schedule) => schedule.venue_id === row.id && schedule.instructor_id === instructorRows.find((item) => item.slug === instructor.slug)?.id));
  if (venue && !venueDefaultInstructor.has(venue.id)) {
    venueDefaultInstructor.set(venue.id, instructor.slug);
  }
}

const appRecurringSessions: AppRecurringSession[] = scheduleRows.map((row) => {
  const venue = appVenues.find((item) => item.slug === row.venue_slug);
  if (!venue) {
    throw new Error(`Missing app venue for schedule ${row.schedule_id}`);
  }

  const teamSlug = teamInstructors.get(row.venue_id)?.slug;
  const directInstructorSlug = row.instructor_id
    ? instructorRows.find((item) => item.id === row.instructor_id)?.slug
    : null;

  const instructorSlug = directInstructorSlug ?? teamSlug ?? venueDefaultInstructor.get(row.venue_id);
  if (!instructorSlug) {
    throw new Error(`Missing instructor mapping for schedule ${row.schedule_id}`);
  }

  const styleSlug = normalizeStyle(row.offering_style, row.offering_title, row.offering_category);
  usedStyleSlugs.add(styleSlug);

  const session: AppRecurringSession = {
    templateId: row.schedule_id,
    citySlug: 'palermo',
    venueSlug: row.venue_slug,
    instructorSlug,
    categorySlug: categoryForOffering(row.offering_category),
    styleSlug,
    title: translateTitle(row.offering_title),
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    level: deriveLevel(row),
    language: 'Italian',
    format: deriveFormat(row.offering_format),
    bookingTargetSlug: venue.bookingTargetOrder[0],
    sourceUrl: row.source_url,
    lastVerifiedAt: isoAtMidday(row.last_verified_at),
    verificationStatus: 'verified'
  };

  if (row.pricing_text) {
    session.priceNote = localized(row.pricing_text, row.pricing_text);
  }
  return session;
});

const appStyles = Array.from(usedStyleSlugs)
  .map((slug) => styleDefinitions[slug])
  .filter(Boolean)
  .sort((a, b) => a.name.en.localeCompare(b.name.en));

const appNeighborhoods = Array.from(new Set(appVenues.map((venue) => venue.neighborhoodSlug)))
  .map((slug) => neighborhoodDefinitions[slug])
  .sort((a, b) => a.name.en.localeCompare(b.name.en));

const catalog: AppCatalog = {
  neighborhoods: appNeighborhoods,
  styles: appStyles,
  instructors: appInstructors,
  bookingTargets,
  venues: appVenues,
  recurringSessions: appRecurringSessions
};

const categories = [
  {
    slug: 'yoga',
    citySlug: 'palermo',
    visibility: 'live',
    name: localized('Yoga', 'Yoga'),
    description: localized('The most complete verified category in Palermo right now.', 'La categoria verificata piu completa a Palermo in questo momento.'),
    heroMetric: localized('Strongest verified class density in the city.', 'La densita di classi verificate piu forte in citta.')
  },
  {
    slug: 'pilates',
    citySlug: 'palermo',
    visibility: 'beta',
    name: localized('Pilates', 'Pilates'),
    description: localized('Useful adjacent category, but still thinner than the yoga core.', 'Categoria adiacente utile, ma ancora piu sottile del nucleo yoga.'),
    heroMetric: localized('Published selectively while coverage grows.', 'Pubblicata in modo selettivo mentre la copertura cresce.')
  },
  {
    slug: 'breathwork',
    citySlug: 'palermo',
    visibility: 'beta',
    name: localized('Breathwork', 'Breathwork'),
    description: localized('Breath-led practice is present, but not yet citywide.', 'La pratica guidata dal respiro e presente, ma non ancora diffusa in tutta la citta.'),
    heroMetric: localized('Visible where source-backed sessions exist.', 'Visibile dove esistono sessioni supportate da fonti.')
  },
  {
    slug: 'meditation',
    citySlug: 'palermo',
    visibility: 'hidden',
    name: localized('Meditation', 'Meditazione'),
    description: localized('Meditation appears in the research catalog but is not a primary public discovery lane yet.', 'La meditazione compare nel catalogo di ricerca ma non e ancora una corsia pubblica primaria di discovery.'),
    heroMetric: localized('Hidden until schedule quality improves.', 'Nascosta finche la qualita dei calendari non migliora.')
  },
  {
    slug: 'movement',
    citySlug: 'palermo',
    visibility: 'hidden',
    name: localized('Movement', 'Movimento'),
    description: localized('Adjacent movement formats are tracked, but the public wedge remains yoga-led.', 'I formati di movimento adiacenti sono tracciati, ma il wedge pubblico resta guidato dallo yoga.'),
    heroMetric: localized('Tracked in research, not yet foregrounded.', 'Tracciato in ricerca, non ancora in primo piano.')
  }
];

const collections = [
  {
    slug: 'today-nearby',
    citySlug: 'palermo',
    title: localized('Today nearby', 'Vicino a te oggi'),
    description: localized('Quick picks for a same-day Palermo practice.', 'Selezione rapida per praticare a Palermo nella stessa giornata.'),
    cta: localized('Open same-day classes', 'Apri le classi di oggi'),
    kind: 'rule'
  },
  {
    slug: 'new-this-week',
    citySlug: 'palermo',
    title: localized('New this week', 'Nuovo questa settimana'),
    description: localized('Freshly checked sessions and timetables from current Palermo sources.', 'Sessioni e orari ricontrollati di fresco da fonti palermitane correnti.'),
    cta: localized('See fresh additions', 'Vedi le novita'),
    kind: 'rule'
  },
  {
    slug: 'english-speaking-classes',
    citySlug: 'palermo',
    title: localized('English-speaking classes', 'Classi in inglese'),
    description: localized('Reserved for sessions that clearly publish English-language delivery.', 'Riservato alle sessioni che pubblicano chiaramente una conduzione in inglese.'),
    cta: localized('Browse English-friendly classes', 'Esplora le classi in inglese'),
    kind: 'editorial'
  }
];

const sqlValue = (value: string | number | null) => {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${value.replace(/'/g, "''")}'`;
};

const jsonSql = (value: unknown) => sqlValue(JSON.stringify(value));

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

const generateSessionInstances = (templates: AppRecurringSession[]): AppSessionInstance[] => {
  const start = DateTime.now().setZone('Europe/Rome').startOf('day');
  const sessions: AppSessionInstance[] = [];

  for (const template of templates) {
    const weekday = weekdayMap[template.weekday];
    if (!weekday) continue;

    const startClock = parseClock(template.startTime);
    const endClock = parseClock(template.endTime);

    for (let offset = 0; offset < 14; offset += 1) {
      const day = start.plus({ days: offset });
      if (day.weekday !== weekday) continue;

      const startAt = day.set({ hour: startClock.hour, minute: startClock.minute, second: 0, millisecond: 0 });
      const endAt = day.set({ hour: endClock.hour, minute: endClock.minute, second: 0, millisecond: 0 });

      sessions.push({
        id: `${template.templateId}-${day.toFormat('yyyyLLdd')}`,
        citySlug: template.citySlug,
        venueSlug: template.venueSlug,
        instructorSlug: template.instructorSlug,
        categorySlug: template.categorySlug,
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
        priceNote: template.priceNote
      });
    }
  }

  return sessions.sort((a, b) => a.startAt.localeCompare(b.startAt));
};

const postgresLines: string[] = [];
const postgresSessions = generateSessionInstances(catalog.recurringSessions);
postgresLines.push('-- Generated from data/research/palermo_research.sqlite');
postgresLines.push('BEGIN;');
postgresLines.push(`INSERT INTO cities (slug, country_code, timezone, status, bounds, name, hero) VALUES (${sqlValue('palermo')}, ${sqlValue('IT')}, ${sqlValue('Europe/Rome')}, ${sqlValue('public')}, ${jsonSql([13.2805, 38.085, 13.405, 38.165])}, ${jsonSql(localized('Palermo', 'Palermo'))}, ${jsonSql(localized('The citywide yoga and mind-body calendar for Palermo.', 'Il calendario cittadino di yoga e mind-body per Palermo.'))}) ON CONFLICT (slug) DO NOTHING;`);
postgresLines.push(`INSERT INTO cities (slug, country_code, timezone, status, bounds, name, hero) VALUES (${sqlValue('catania')}, ${sqlValue('IT')}, ${sqlValue('Europe/Rome')}, ${sqlValue('seed')}, ${jsonSql([15.02, 37.45, 15.18, 37.57])}, ${jsonSql(localized('Catania', 'Catania'))}, ${jsonSql(localized('Next city in the kinelo.fit pipeline.', 'La prossima citta nella pipeline di kinelo.fit.'))}) ON CONFLICT (slug) DO NOTHING;`);

for (const neighborhood of catalog.neighborhoods) {
  postgresLines.push(`INSERT INTO neighborhoods (city_slug, slug, name, description, center_lat, center_lng) VALUES (${sqlValue(neighborhood.citySlug)}, ${sqlValue(neighborhood.slug)}, ${jsonSql(neighborhood.name)}, ${jsonSql(neighborhood.description)}, ${sqlValue(neighborhood.center.lat)}, ${sqlValue(neighborhood.center.lng)}) ON CONFLICT (slug) DO NOTHING;`);
}

for (const category of categories) {
  postgresLines.push(`INSERT INTO activity_categories (city_slug, slug, visibility, name, description, hero_metric) VALUES (${sqlValue(category.citySlug)}, ${sqlValue(category.slug)}, ${sqlValue(category.visibility)}, ${jsonSql(category.name)}, ${jsonSql(category.description)}, ${jsonSql(category.heroMetric)}) ON CONFLICT (slug) DO NOTHING;`);
}

for (const style of catalog.styles) {
  postgresLines.push(`INSERT INTO styles (category_slug, slug, name, description) VALUES (${sqlValue(style.categorySlug)}, ${sqlValue(style.slug)}, ${jsonSql(style.name)}, ${jsonSql(style.description)}) ON CONFLICT (slug) DO NOTHING;`);
}

for (const instructor of catalog.instructors) {
  postgresLines.push(`INSERT INTO instructors (city_slug, slug, name, short_bio, specialties, languages) VALUES (${sqlValue(instructor.citySlug)}, ${sqlValue(instructor.slug)}, ${sqlValue(instructor.name)}, ${jsonSql(instructor.shortBio)}, ${jsonSql(instructor.specialties)}, ${jsonSql(instructor.languages)}) ON CONFLICT (slug) DO NOTHING;`);
}

for (const venue of catalog.venues) {
  postgresLines.push(`INSERT INTO venues (city_slug, neighborhood_slug, slug, name, tagline, description, address, lat, lng, amenities, languages, style_slugs, category_slugs, booking_target_order, freshness_note, source_url, last_verified_at) VALUES (${sqlValue(venue.citySlug)}, ${sqlValue(venue.neighborhoodSlug)}, ${sqlValue(venue.slug)}, ${sqlValue(venue.name)}, ${jsonSql(venue.tagline)}, ${jsonSql(venue.description)}, ${sqlValue(venue.address)}, ${sqlValue(venue.geo.lat)}, ${sqlValue(venue.geo.lng)}, ${jsonSql(venue.amenities)}, ${jsonSql(venue.languages)}, ${jsonSql(venue.styleSlugs)}, ${jsonSql(venue.categorySlugs)}, ${jsonSql(venue.bookingTargetOrder)}, ${jsonSql(venue.freshnessNote)}, ${sqlValue(venue.sourceUrl)}, ${sqlValue(venue.lastVerifiedAt)}) ON CONFLICT (slug) DO NOTHING;`);
}

for (const target of catalog.bookingTargets) {
  postgresLines.push(`INSERT INTO booking_targets (slug, type, label, href) VALUES (${sqlValue(target.slug)}, ${sqlValue(target.type)}, ${sqlValue(target.label)}, ${sqlValue(target.href)}) ON CONFLICT (slug) DO NOTHING;`);
}

for (const venue of venueRows) {
  if (!catalog.venues.find((item) => item.slug === venue.slug)) continue;
  postgresLines.push(`INSERT INTO source_records (entity_type, entity_slug, source_url, source_payload, last_verified_at) VALUES (${sqlValue('venue')}, ${sqlValue(venue.slug)}, ${sqlValue(venue.source_url)}, ${jsonSql({ locationLabel: venue.location_label, locationConfidence: venue.location_confidence, notes: venue.notes })}, ${sqlValue(isoAtMidday(venue.last_verified_at))});`);
}

for (const session of catalog.recurringSessions) {
  postgresLines.push(`INSERT INTO source_records (entity_type, entity_slug, source_url, source_payload, last_verified_at) VALUES (${sqlValue('session_template')}, ${sqlValue(session.templateId)}, ${sqlValue(session.sourceUrl)}, ${jsonSql({ weekday: session.weekday, startTime: session.startTime, endTime: session.endTime, level: session.level, styleSlug: session.styleSlug })}, ${sqlValue(session.lastVerifiedAt)});`);
}

for (const session of postgresSessions) {
  postgresLines.push(`INSERT INTO sessions (id, city_slug, venue_slug, instructor_slug, category_slug, style_slug, title, start_at, end_at, level, language, format, booking_target_slug, source_url, last_verified_at, verification_status, price_note) VALUES (${sqlValue(session.id)}, ${sqlValue(session.citySlug)}, ${sqlValue(session.venueSlug)}, ${sqlValue(session.instructorSlug)}, ${sqlValue(session.categorySlug)}, ${sqlValue(session.styleSlug)}, ${jsonSql(session.title)}, ${sqlValue(session.startAt)}, ${sqlValue(session.endAt)}, ${sqlValue(session.level)}, ${sqlValue(session.language)}, ${sqlValue(session.format)}, ${sqlValue(session.bookingTargetSlug)}, ${sqlValue(session.sourceUrl)}, ${sqlValue(session.lastVerifiedAt)}, ${sqlValue(session.verificationStatus)}, ${session.priceNote ? jsonSql(session.priceNote) : 'NULL'}) ON CONFLICT (id) DO NOTHING;`);
}

for (const collection of collections) {
  postgresLines.push(`INSERT INTO editorial_collections (city_slug, slug, title, description, cta, kind) VALUES (${sqlValue(collection.citySlug)}, ${sqlValue(collection.slug)}, ${jsonSql(collection.title)}, ${jsonSql(collection.description)}, ${jsonSql(collection.cta)}, ${sqlValue(collection.kind)}) ON CONFLICT (slug) DO NOTHING;`);
}

postgresLines.push('COMMIT;');

const main = async () => {
  await mkdir(join(ROOT, 'data/research'), { recursive: true });
  await writeFile(APP_JSON_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  await writeFile(POSTGRES_SQL_PATH, `${postgresLines.join('\n')}\n`, 'utf8');

  console.log(`Wrote ${APP_JSON_PATH}`);
  console.log(`Wrote ${POSTGRES_SQL_PATH}`);
  console.log(`Public venues: ${catalog.venues.length}`);
  console.log(`Recurring schedule templates: ${catalog.recurringSessions.length}`);
  console.log(`Generated session instances for Postgres: ${postgresSessions.length}`);
};

void main();

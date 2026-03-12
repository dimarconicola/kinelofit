PRAGMA foreign_keys = OFF;
DROP VIEW IF EXISTS venue_rollup;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS venue_locations;
DROP TABLE IF EXISTS venue_instructors;
DROP TABLE IF EXISTS offerings;
DROP TABLE IF EXISTS instructors;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS sources;
PRAGMA foreign_keys = ON;

CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  source_kind TEXT NOT NULL,
  publisher TEXT,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  last_checked_at TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE venues (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  street_address TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  venue_kind TEXT NOT NULL,
  verification_level TEXT NOT NULL,
  listing_status TEXT NOT NULL,
  confidence_score REAL NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  notes TEXT,
  last_verified_at TEXT NOT NULL
);

CREATE TABLE instructors (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  base_city TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  verification_level TEXT NOT NULL,
  listing_status TEXT NOT NULL,
  confidence_score REAL NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  bio TEXT,
  last_verified_at TEXT NOT NULL
);

CREATE TABLE offerings (
  id TEXT PRIMARY KEY,
  venue_id TEXT REFERENCES venues(id),
  instructor_id TEXT REFERENCES instructors(id),
  title TEXT NOT NULL,
  style TEXT,
  category TEXT NOT NULL,
  format TEXT NOT NULL,
  audience TEXT,
  description TEXT,
  pricing_text TEXT,
  verification_level TEXT NOT NULL,
  listing_status TEXT NOT NULL,
  confidence_score REAL NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  last_verified_at TEXT NOT NULL
);

CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  offering_id TEXT NOT NULL REFERENCES offerings(id),
  weekday TEXT,
  start_time TEXT,
  end_time TEXT,
  recurrence_text TEXT,
  location_text TEXT,
  date_text TEXT,
  listing_status TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  notes TEXT,
  last_verified_at TEXT NOT NULL
);

CREATE TABLE venue_instructors (
  venue_id TEXT NOT NULL REFERENCES venues(id),
  instructor_id TEXT NOT NULL REFERENCES instructors(id),
  role TEXT NOT NULL,
  notes TEXT,
  PRIMARY KEY (venue_id, instructor_id, role)
);

CREATE TABLE venue_locations (
  venue_id TEXT PRIMARY KEY REFERENCES venues(id),
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  location_label TEXT NOT NULL,
  location_confidence TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  notes TEXT
);

CREATE INDEX idx_venues_status ON venues(listing_status, verification_level);
CREATE INDEX idx_offerings_venue ON offerings(venue_id, listing_status);
CREATE INDEX idx_schedules_offering ON schedules(offering_id, listing_status);

BEGIN;
INSERT INTO sources (id, source_kind, publisher, title, url, last_checked_at, notes) VALUES
('s01','official_site','Centro di Cultura Rishi','Centro di Cultura Rishi home','https://www.centroculturarishi.it/','2026-03-10','Home page with contact address, active news, and teacher names.'),
('s02','official_site','Centro di Cultura Rishi','Centro di Cultura Rishi corsi','https://www.centroculturarishi.it/corsi/','2026-03-10','Course overview and 2025-2026 timetable.'),
('s03','official_site','Yoga Ananda Palermo','Yoga Ananda Palermo chi siamo','https://www.yoganandapalermo.it/chi-siamo/','2026-03-10','About page with association background and teacher bios.'),
('s04','official_site','Yoga Ananda Palermo','Yoga Ananda Palermo Raja Yoga','https://www.yoganandapalermo.it/corsi-e-seminari/raja-yoga/','2026-03-10','Course page with dated Raja Yoga and meditation blocks.'),
('s05','official_site','Yoga Ananda Palermo','Yoga Ananda Palermo contatti','https://www.yoganandapalermo.it/contatti/','2026-03-10','Contact page with address, phone, and email.'),
('s06','official_site','Barbara Faludi Yoga','Barbara Faludi Yoga home','https://www.barbarafaludiyoga.com/','2026-03-10','Founder profile and studio contact details.'),
('s07','official_site','Barbara Faludi Yoga','Barbara Faludi Yoga corsi in studio','https://www.barbarafaludiyoga.com/corsi-in-studio','2026-03-10','Current weekly timetable and staff list.'),
('s08','official_site','Barbara Faludi Yoga','Barbara Faludi Yoga yoga al mare','https://www.barbarafaludiyoga.com/service-page/yoga-al-mare','2026-03-10','Outdoor beach yoga service page.'),
('s09','official_site','Barbara Faludi Yoga','Barbara Faludi Yoga sup yoga','https://www.barbarafaludiyoga.com/service-page/sup-yoga','2026-03-10','SUP yoga service page at Isola delle Femmine.'),
('s10','official_site','You Are Yoga','You Are Yoga home','https://youareyoga.it/','2026-03-10','Site home with offerings, credentials, and contact footer.'),
('s11','official_site','You Are Yoga','You Are Yoga contatti','https://youareyoga.it/home/contatti/','2026-03-10','Contact page with phone, email, and Palermo/Terrasini service area.'),
('s12','official_site','You Are Yoga','You Are Yoga pacchetti','https://youareyoga.it/home/pacchetti-yoga/','2026-03-10','Pricing and package structure.'),
('s13','official_site','Ashtanga Shala Sicilia','Ashtanga Shala Sicilia home','https://www.ashtangashalasicilia.com/','2026-03-10','Home page with venue contact and core class list.'),
('s14','official_site','Ashtanga Shala Sicilia','Ashtanga Shala Sicilia Ashtanga Mysore','https://www.ashtangashalasicilia.com/service-page/ashtanga-mysore','2026-03-10','Service page with contact and class description.'),
('s15','official_site','Ashtanga Shala Sicilia','Cristina Chiummo profile','https://www.ashtangashalasicilia.com/cristina-chiummo','2026-03-10','Founder profile with detailed class schedule.'),
('s16','official_site','Yogastudiolab','Yogastudiolab home','https://www.yogastudiolab.it/','2026-03-10','Home page with offering list.'),
('s17','official_site','Yogastudiolab','Yogastudiolab contatti','https://www.yogastudiolab.it/contatti','2026-03-10','Contact page with Palermo location and WhatsApp link.'),
('s18','official_site','Yogastudiolab','Yogastudiolab esperienza','https://www.yogastudiolab.it/la-mia-esperienza','2026-03-10','Valentina Lorito background and experience page.'),
('s19','official_site','Palermo Pilates','Palermo Pilates studio','https://www.palermopilates.it/studio/','2026-03-10','Studio page with services and yoga description.'),
('s20','official_site','Palermo Pilates','Palermo Pilates team','https://www.palermopilates.it/en/team-eng/','2026-03-10','Team page with yoga and pilates teachers.'),
('s21','official_site','Palermo Pilates','Palermo Pilates contatti','https://www.palermopilates.it/en/contatti-eng/','2026-03-10','Contact page with address, email, and phone.'),
('s22','official_site','Grandma''s Pilates','Grandma''s Pilates home','https://www.grandmaspilates.com/','2026-03-10','Home page with service description and studio address.'),
('s23','official_site','Taiji Studio Palermo','Taiji Studio Palermo home','https://www.taijistudiopalermo.it/','2026-03-10','Site with course locations and open day teacher names.'),
('s24','official_site','Centro sportivo Ivanor','Ivanor yoga page','https://www.ivanorsports.it/yoga','2026-03-10','Yoga course timetable and instructor name.'),
('s25','official_site','Yoga City','Yoga City home','https://www.yogacity.it/','2026-03-10','Project overview with event series and locations.'),
('s26','official_site','Yoga City','Yoga City contatti','https://www.yogacity.it/contatti/','2026-03-10','Contact page with organiser name and contact details.'),
('s27','official_site','Yoga City','Yoga City Teatro Massimo event','https://www.yogacity.it/portfolio/teatro-massimo-piazza-verdi/','2026-03-10','Example event detail page showing format and duration.'),
('s28','official_association','Associazione Iyengar Yoga','Simone Cannatella teacher profile','https://www.iyengaryoga.it/utente/insegnante/913','2026-03-10','Certified Iyengar teacher profile mentioning Palermo Sadhana.'),
('s29','directory','yoga.it','Palermo insegnanti yoga','https://www.yoga.it/insegnanti/palermo/','2026-03-10','Province-level instructor directory.'),
('s30','directory','EventiYoga','Spazio ZoeMa Accademia Olistica','https://eventiyoga.it/centri-yoga/spazio-zoema-accademia-olistica-99','2026-03-10','Directory card with styles and lead teacher.'),
('s31','directory','Palestre.wiki','Centri di yoga a Palermo','https://www.palestre.wiki/centri-di-yoga-palermo-sicilia/','2026-03-10','Directory list used only for lead discovery.'),
('s32','directory','Palestre Fitness Italia','Ram Das Kundalini Yoga Center','https://www.palestrefitness.com/palestra/ram-das-kundalini-yoga-center/','2026-03-10','Directory card with address and opening hours.'),
('s33','directory','EventiYoga','Guida yoga Palermo','https://eventiyoga.it/blog/yoga-palermo/','2026-03-10','Guide article used for lead discovery and style hints.'),
('s34','association_pdf','Yoga Coaching / Kundalini network','Centri Kundalini Yoga Italia','https://www.yoga-coaching.org/wp-content/uploads/2019/01/Centri-YK-Italia_2017.pdf','2026-03-10','PDF directory used for Kundalini leads in Palermo.');

INSERT INTO venues (id, slug, name, city, neighborhood, street_address, postal_code, phone, email, website_url, venue_kind, verification_level, listing_status, confidence_score, source_id, notes, last_verified_at) VALUES
('v01','centro-cultura-rishi','Centro di Cultura Rishi','Palermo','Sampolo','Via Salvatore Bono 19','90143','+39 3387169008',NULL,'https://www.centroculturarishi.it/','association','official','current',0.96,'s01','Traditional yoga association active in Palermo for over 40 years. Friday Hatha and multiple level classes are published for 2025-2026.','2026-03-10'),
('v02','yoga-ananda-palermo','Yoga Ananda Palermo','Palermo',NULL,'Via Trapani Pescia 77',NULL,'+39 3298038277','yoganandapalermo@gmail.com','https://www.yoganandapalermo.it/','association','official','current',0.94,'s05','Association focused on Raja Yoga, Kriya Yoga, meditation, and personal growth. Specific dated course blocks on site are from late 2025.','2026-03-10'),
('v03','yoga-your-life','A.S.D.C. Yoga Your Life','Palermo','Politeama','Via Enrico Albanese 7','90139','+39 3272466969','barbarafaludi@gmail.com','https://www.barbarafaludiyoga.com/','studio','official','current',0.98,'s07','Studio and online school run by Barbara Faludi with a current weekly timetable and multiple teachers.','2026-03-10'),
('v04','you-are-yoga','You Are Yoga','Palermo',NULL,NULL,NULL,'+39 3408452325','martasto.youareyoga@gmail.com','https://youareyoga.it/','instructor_service','official','current',0.91,'s11','Marta Sto offers yoga and pilates in Palermo, Terrasini, online, and by arrangement. Palermo street address is not published on the site.','2026-03-10'),
('v05','ashtanga-shala-sicilia','Ashtanga Shala Sicilia','Palermo','Liberta','Via della Liberta 56','90143','+39 3358716785','ashtangashalasicilia@gmail.com','https://www.ashtangashalasicilia.com/','studio','official','current',0.97,'s13','Ashtanga-focused studio with current Mysore, Yin, meditation, pranayama, and children offerings.','2026-03-10'),
('v06','yogastudiolab','Yogastudiolab','Palermo',NULL,NULL,NULL,'+39 3496826920',NULL,'https://www.yogastudiolab.it/','instructor_service','official','current',0.88,'s17','Valentina Lorito-led yoga and movement project; the site exposes Palermo as location and a WhatsApp contact but not a full street address.','2026-03-10'),
('v07','palermo-pilates','Palermo Pilates di Lesley Bell','Palermo','Politeama','Via Piersanti Mattarella 9','90141','+39 3349646426','info@palermopilates.it','https://www.palermopilates.it/','studio','official','current',0.93,'s21','Classical Pilates studio that also sells private or semi-private Vinyasa Yoga.','2026-03-10'),
('v08','grandmas-pilates','Grandma''s Pilates Studio','Palermo','Notarbartolo','Via Leonardo Da Vinci 30','90145',NULL,'grandmaspilates@gmail.com','https://www.grandmaspilates.com/','studio','official','current',0.89,'s22','Wellness studio combining yoga, pilates, and stretching. The site does not expose a public phone number.','2026-03-10'),
('v09','taiji-studio-palermo','Taiji Studio Palermo','Palermo',NULL,'Via Selinunte 11',NULL,'+39 3338621178',NULL,'https://www.taijistudiopalermo.it/','studio','official','current',0.84,'s23','Qi Gong and Taiji studio that also promotes yoga, pilates, and postura dinamica. Yoga schedule is less explicit than the Taiji timetable.','2026-03-10'),
('v10','centro-sportivo-ivanor','Centro sportivo Ivanor','Palermo','Politeama','Via Marchese Ugo 6','90141','+39 3515199902 / +39 09164882244','ivanorsports.ssd@gmail.com','https://www.ivanorsports.it/yoga','gym','official','current',0.9,'s24','Sports center with published Hata Yoga and Yogilates timetable taught by Asia Mattaliano.','2026-03-10'),
('v11','yoga-city','Yoga City','Palermo',NULL,'Via Imperatore Federico 70','90143','+39 3208720004','info@yogacity.it','https://www.yogacity.it/','event_series','official','current',0.87,'s26','Yoga event brand by Desiree Burgio. Contact page lists Via Imperatore Federico 70; fiscal data on the same page mentions Via Tramontana 28/F.','2026-03-10'),
('v12','palermo-sadhana','A.S.D.C. Palermo Sadhana','Palermo',NULL,NULL,NULL,NULL,NULL,NULL,'association','association','lead',0.66,'s28','Mentioned on the official Iyengar teacher profile of Simone Cannatella. Direct venue page or address not found during this pass.','2026-03-10'),
('v13','spazio-zoema','Spazio ZoeMa Accademia Olistica','Palermo',NULL,NULL,NULL,'+39 3403401584','stuzzicaventi@virgilio.it',NULL,'studio','directory','lead',0.58,'s30','Lead only. Third-party sources mention Palermo and teacher Manuela Zoe Colli; historical address references conflict and need direct verification.','2026-03-10'),
('v14','ram-das-kundalini-yoga-center','Ram Das Kundalini Yoga Center','Palermo','Liberta','Via della Liberta 112','90139',NULL,NULL,NULL,'studio','directory','lead',0.52,'s32','Lead only. Directory sources disagree on phone details, so contact fields are intentionally left blank until direct verification.','2026-03-10'),
('v15','sahaja-yoga-sicilia','Sahaja Yoga Sicilia','Palermo',NULL,'Cortile Gesu e Maria al Papireto 1',NULL,NULL,NULL,NULL,'association','directory','lead',0.49,'s31','Lead only from Palermo yoga directories and articles.','2026-03-10'),
('v16','yogandy','Yogandy','Palermo',NULL,'Via Ricasoli 16',NULL,NULL,NULL,NULL,'studio','directory','lead',0.48,'s31','Lead only. EventiYoga guide lists multiple styles but no direct official source was captured in this pass.','2026-03-10'),
('v17','yoga-amuri-asd','Yoga Amuri ASD','Palermo',NULL,'Via Quintino Sella 71',NULL,NULL,'haratmakaur@gmail.com',NULL,'association','directory','lead',0.51,'s34','Kundalini directory lead listed at Dudi Libreria per Bambini. Needs direct site or social verification.','2026-03-10'),
('v18','yogicamente','Yogicamente','Palermo','Liberta','Via Liberta 92/A',NULL,NULL,'vikramjotikaur@gmail.com',NULL,'association','directory','lead',0.5,'s34','Kundalini directory lead. Needs direct current verification.','2026-03-10');

INSERT INTO instructors (id, slug, full_name, base_city, phone, email, website_url, verification_level, listing_status, confidence_score, source_id, bio, last_verified_at) VALUES
('i01','aruna-nath-giri','Aruna Nath Giri','Palermo',NULL,NULL,NULL,'official','historical',0.8,'s01','Founder and spiritual reference of Centro di Cultura Rishi.','2026-03-10'),
('i02','dino-coglitore','Dino Coglitore','Palermo',NULL,NULL,NULL,'official','current',0.87,'s02','Named on the Rishi timetable for Hatha Yoga and meditation-related classes.','2026-03-10'),
('i03','antonio-rishi','Antonio','Palermo',NULL,NULL,NULL,'official','current',0.74,'s02','Named on the Rishi timetable for Tecniche Respiratorie 2 online. Surname not exposed on the timetable snippet used here.','2026-03-10'),
('i04','loredana-rishi','Loredana','Palermo',NULL,NULL,NULL,'official','current',0.72,'s02','Named on the Rishi timetable for Canto Sacro.','2026-03-10'),
('i05','tanya-rishi','Tanya','Palermo',NULL,NULL,NULL,'official','current',0.72,'s02','Named on the Rishi timetable for Danza Sufi.','2026-03-10'),
('i06','sangeeta-laura-biagi','Sangeeta Laura Biagi','Palermo',NULL,NULL,NULL,'official','historical',0.83,'s01','Nada Yoga seminar teacher featured on the Rishi site in 2026 coverage.','2026-03-10'),
('i07','sujesh-valerio-costa','Sujesh Valerio Costa','Palermo','+39 3298038277','yoganandapalermo@gmail.com',NULL,'official','current',0.95,'s03','Raja Ananda Yoga teacher and president of Yoga Ananda Palermo.','2026-03-10'),
('i08','matthew-phippen','Matthew Phippen','Palermo',NULL,NULL,NULL,'official','current',0.81,'s03','Listed as Jai Matthew Phippen on the Yoga Ananda teacher page.','2026-03-10'),
('i09','barbara-faludi','Barbara Faludi','Palermo','+39 3272466969','barbarafaludi@gmail.com','https://www.barbarafaludiyoga.com/','official','current',0.98,'s06','Founder of Yoga Your Life and lead Hatha teacher.','2026-03-10'),
('i10','massimiliano-provenzano','Massimiliano Provenzano','Palermo',NULL,NULL,NULL,'official','current',0.9,'s07','Listed as Massimiliano Provenzano / Max on the Yoga Your Life staff and timetable.','2026-03-10'),
('i11','dario-pastore','Dario Pastore','Palermo',NULL,NULL,NULL,'official','current',0.89,'s07','Pilates instructor on the Yoga Your Life timetable.','2026-03-10'),
('i12','claudia-santamarina','Claudia Santamarina','Palermo',NULL,NULL,NULL,'official','current',0.9,'s07','Yoga teacher on the Yoga Your Life timetable.','2026-03-10'),
('i13','domenico-di-chiara','Domenico Di Chiara','Palermo',NULL,NULL,NULL,'official','current',0.9,'s07','Yoga teacher on the Yoga Your Life timetable.','2026-03-10'),
('i14','delia-de-santes','Delia De Santes','Palermo',NULL,NULL,NULL,'official','current',0.88,'s07','Instructor listed for Pilates on the Yoga Your Life staff page.','2026-03-10'),
('i15','veronica-zarbo','Veronica Zarbo','Palermo',NULL,NULL,NULL,'official','current',0.88,'s07','Yoga teacher on the Yoga Your Life timetable.','2026-03-10'),
('i16','giorgia-schillaci','Giorgia Schillaci','Palermo',NULL,NULL,NULL,'official','current',0.87,'s07','Listed as Giorgia Schillaci / Geo for Yin Yoga on the Yoga Your Life timetable.','2026-03-10'),
('i17','marta-sto','Marta Sto','Palermo','+39 3408452325','martasto.youareyoga@gmail.com','https://youareyoga.it/','official','current',0.97,'s10','Certified Hatha and Odaka Yoga teacher operating in Palermo and Terrasini.','2026-03-10'),
('i18','cristina-chiummo','Cristina Chiummo','Palermo','+39 3358716785','ashtangashalasicilia@gmail.com','https://www.ashtangashalasicilia.com/cristina-chiummo','official','current',0.97,'s15','Founder of Ashtanga Shala Sicilia; teaches Mysore and Yin.','2026-03-10'),
('i19','desiree-burgio','Desiree Burgio','Palermo','+39 3208720004','info@yogacity.it','https://www.yogacity.it/contatti/','official','current',0.91,'s26','Named organiser and contact person for Yoga City Palermo.','2026-03-10'),
('i20','valentina-lorito','Valentina Lorito','Palermo','+39 3496826920',NULL,'https://www.yogastudiolab.it/','official','current',0.93,'s18','Movement educator and founder of Yogastudiolab.','2026-03-10'),
('i21','lesley-bell','Lesley Bell','Palermo','+39 3349646426','info@palermopilates.it','https://www.palermopilates.it/','official','current',0.92,'s20','Founder of Palermo Pilates.','2026-03-10'),
('i22','silvia-riccobono','Silvia Riccobono','Palermo',NULL,NULL,NULL,'official','current',0.9,'s20','Classical Pilates and Vinyasa Yoga teacher at Palermo Pilates.','2026-03-10'),
('i23','ekaterina-kaptur','Ekaterina Katie Kaptur','Palermo',NULL,NULL,NULL,'official','current',0.84,'s20','Classical Pilates and Yoga teacher listed on the Palermo Pilates team page.','2026-03-10'),
('i24','aldo-pace','Aldo Pace','Palermo',NULL,NULL,NULL,'official','current',0.8,'s20','Classical Pilates teacher on the Palermo Pilates team page.','2026-03-10'),
('i25','asia-mattaliano','Asia Mattaliano','Palermo',NULL,NULL,NULL,'official','current',0.91,'s24','Instructor named on Ivanor yoga timetable for Hata Yoga and Yogilates.','2026-03-10'),
('i26','ceren-dogou','Ceren Dogou','Palermo',NULL,NULL,NULL,'official','historical',0.8,'s23','Named as yoga teacher in Taiji Studio open day programming.','2026-03-10'),
('i27','giulia-pace','Giulia Pace','Palermo',NULL,NULL,NULL,'official','historical',0.78,'s23','Named as pilates teacher in Taiji Studio open day programming.','2026-03-10'),
('i28','paola-cassara','Paola Cassara','Palermo',NULL,NULL,NULL,'official','historical',0.78,'s23','Named as postura dinamica teacher in Taiji Studio open day programming.','2026-03-10'),
('i29','simone-cannatella','Simone Cannatella','Palermo',NULL,'simonecannatella@gmail.com','https://www.iyengaryoga.it/utente/insegnante/913','association','current',0.88,'s28','Iyengar Yoga teacher in Palermo and founder of Palermo Sadhana according to the national association profile.','2026-03-10'),
('i30','manuela-zoe-colli','Manuela Zoe Colli','Palermo','+39 3403401584','stuzzicaventi@virgilio.it',NULL,'directory','lead',0.62,'s30','Lead teacher associated with Spazio ZoeMa in third-party directories.','2026-03-10'),
('i31','haratma-kaur','Haratma Kaur','Palermo',NULL,'haratmakaur@gmail.com',NULL,'directory','lead',0.55,'s34','Kundalini lead contact for Yoga Amuri from the network PDF.','2026-03-10'),
('i32','vikramjoti-kaur','Vikramjoti Kaur','Palermo',NULL,'vikramjotikaur@gmail.com',NULL,'directory','lead',0.55,'s34','Kundalini lead contact for Yogicamente from the network PDF.','2026-03-10');

INSERT INTO venue_instructors (venue_id, instructor_id, role, notes) VALUES
('v01','i01','founder','Historical founder and lineage reference.'),
('v01','i02','teacher','Named on active timetable.'),
('v01','i03','teacher','Named on active timetable.'),
('v01','i04','teacher','Named on active timetable.'),
('v01','i05','teacher','Named on active timetable.'),
('v01','i06','guest_teacher','Featured on 2026 seminar coverage.'),
('v02','i07','lead_teacher','President and main teacher.'),
('v02','i08','teacher','Teacher listed on about page.'),
('v03','i09','founder','Founder and lead teacher.'),
('v03','i10','teacher','Timetable teacher.'),
('v03','i11','teacher','Timetable teacher.'),
('v03','i12','teacher','Timetable teacher.'),
('v03','i13','teacher','Timetable teacher.'),
('v03','i14','teacher','Timetable teacher.'),
('v03','i15','teacher','Timetable teacher.'),
('v03','i16','teacher','Timetable teacher.'),
('v04','i17','founder','Lead teacher and operator.'),
('v05','i18','founder','Founder and lead teacher.'),
('v06','i20','founder','Founder and lead facilitator.'),
('v07','i21','founder','Founder and lead teacher.'),
('v07','i22','teacher','Yoga and Pilates teacher.'),
('v07','i23','teacher','Yoga and Pilates teacher.'),
('v07','i24','teacher','Pilates teacher.'),
('v09','i26','teacher','Named on open day program.'),
('v09','i27','teacher','Named on open day program.'),
('v09','i28','teacher','Named on open day program.'),
('v10','i25','teacher','Named on current timetable.'),
('v11','i19','organiser','Named contact and project owner.'),
('v12','i29','founder','Association founder per Iyengar profile.'),
('v13','i30','lead_teacher','Third-party lead teacher reference.'),
('v17','i31','lead_teacher','Lead contact from Kundalini directory.'),
('v18','i32','lead_teacher','Lead contact from Kundalini directory.');

INSERT INTO offerings (id, venue_id, instructor_id, title, style, category, format, audience, description, pricing_text, verification_level, listing_status, confidence_score, source_id, last_verified_at) VALUES
('o01','v01',NULL,'Primo Livello Yoga','Traditional Yoga','yoga','group','beginners','Introductory yoga classes focused on breath, joint mobility, posture, and relaxation.','Not published on captured pages','official','current',0.95,'s02','2026-03-10'),
('o02','v01',NULL,'Soft Yoga','Soft Yoga','yoga','group','general','Gentler yoga track published in the 2025-2026 timetable.','Not published on captured pages','official','current',0.93,'s02','2026-03-10'),
('o03','v01','i02','Hatha Yoga','Hatha Yoga','yoga','group','general','Hatha Yoga track currently published on the Rishi timetable.','Not published on captured pages','official','current',0.94,'s02','2026-03-10'),
('o04','v01',NULL,'Tecniche Respiratorie 1','Pranayama','breathwork','group','general','Breathwork class listed on the active timetable.','Not published on captured pages','official','current',0.92,'s02','2026-03-10'),
('o05','v01','i03','Tecniche Respiratorie 2','Pranayama','breathwork','group','general','Advanced breathwork class listed on the active timetable.','Not published on captured pages','official','current',0.9,'s02','2026-03-10'),
('o06','v01',NULL,'Yoga Bimbi','Kids Yoga','yoga','group','children','Children yoga class published on the active timetable.','Not published on captured pages','official','current',0.9,'s02','2026-03-10'),
('o07','v02','i07','Raja Yoga','Raja Yoga','yoga','group','adults','Main Yoga Ananda course line focused on relaxation, revitalisation, and inner balance.','Course blocks priced separately; see site for specific programs','official','current',0.9,'s04','2026-03-10'),
('o08','v02','i07','Imparo a meditare','Meditation','meditation','group','beginners','Base meditation course with breathwork, relaxation, and affirmations.','Priced per course block on the site','official','historical',0.86,'s04','2026-03-10'),
('o09','v02','i07','Kriya Yoga','Kriya Yoga','yoga','hybrid','adults','Preparation path and practice progression tied to the Kriya tradition.','Priced per retreat or course block on the site','official','current',0.84,'s04','2026-03-10'),
('o10','v02','i07','Energia e Respiro','Raja Yoga / Breathwork','breathwork','group','general','Named among the association courses on the about page.','Not published on captured pages','official','unknown',0.73,'s03','2026-03-10'),
('o11','v03','i09','Hatha Yoga con Barbara','Hatha Yoga','yoga','group','general','Recurring Hatha classes led by Barbara Faludi.','Carnet from 12 EUR; monthly open 70 EUR','official','current',0.98,'s07','2026-03-10'),
('o12','v03','i10','Hatha Yoga con Max','Hatha Yoga','yoga','group','general','Recurring Hatha classes led by Max.','Carnet from 12 EUR; monthly open 70 EUR','official','current',0.95,'s07','2026-03-10'),
('o13','v03','i13','Vinyasa Yoga con Domenico','Vinyasa Yoga','yoga','group','general','Recurring Vinyasa classes led by Domenico Di Chiara.','Carnet from 12 EUR; monthly open 70 EUR','official','current',0.95,'s07','2026-03-10'),
('o14','v03','i15','Vinyasa con Veronica','Vinyasa Yoga','yoga','group','general','Recurring Vinyasa classes led by Veronica Zarbo.','Carnet from 12 EUR; monthly open 70 EUR','official','current',0.95,'s07','2026-03-10'),
('o15','v03','i12','Vinyasa Yoga con Claudia','Vinyasa Yoga','yoga','group','general','Recurring Vinyasa classes led by Claudia Santamarina.','Carnet from 12 EUR; monthly open 70 EUR','official','current',0.95,'s07','2026-03-10'),
('o16','v03','i16','Yin Yoga con Geo','Yin Yoga','yoga','group','general','Weekly Yin Yoga class led by Giorgia Schillaci.','Carnet from 12 EUR; monthly open 70 EUR','official','current',0.94,'s07','2026-03-10'),
('o17','v03','i09','Yoga per Bimbi','Kids Yoga','yoga','group','children','Children yoga course published on the live timetable.','Included in studio memberships or passes','official','current',0.93,'s07','2026-03-10'),
('o18','v03',NULL,'Meditazione, Pranayama e Teoria','Meditation / Pranayama','meditation','group','general','Bookable studio session focused on breath, meditation, and theory.','10 EUR or membership','official','current',0.9,'s07','2026-03-10'),
('o19','v03','i09','Yoga al Mare','Hatha Yoga','yoga','outdoor','beginners','Beach yoga session at Mondello Costa Ponente.','12 EUR or membership','official','historical',0.88,'s08','2026-03-10'),
('o20','v03','i09','SUP Yoga','SUP Yoga','yoga','outdoor','beginners','Stand-up paddle yoga in collaboration with Isolasurf at Isola delle Femmine.','20 EUR','official','unknown',0.86,'s09','2026-03-10'),
('o21','v04','i17','Hatha Yoga','Hatha Yoga','yoga','group','general','One of the main practices described on the You Are Yoga site.','Packages from 48 EUR for 4 small-group lessons','official','current',0.91,'s10','2026-03-10'),
('o22','v04','i17','Yoga Fascia Flow','Fascia Flow','yoga','group','general','Fluid sequencing focused on connective tissue and body rhythm.','Packages from 48 EUR for 4 small-group lessons','official','current',0.9,'s10','2026-03-10'),
('o23','v04','i17','Odaka Pranayama Flow','Odaka / Pranayama','breathwork','group','general','Breath-led movement practice from the Odaka method.','Packages from 48 EUR for 4 small-group lessons','official','current',0.89,'s10','2026-03-10'),
('o24','v04','i17','Yoga Trauma Informed','Trauma Informed Yoga','yoga','group','general','Simple, safety-oriented practice for physical and emotional grounding.','Packages from 48 EUR for 4 small-group lessons','official','current',0.89,'s10','2026-03-10'),
('o25','v04','i17','Odaka Yoga Kids','Kids Yoga','yoga','group','children','Children-focused yoga using play, stories, and breath awareness.','Packages from 48 EUR for 4 small-group lessons','official','current',0.88,'s10','2026-03-10'),
('o26','v04','i17','Pilates Matwork','Pilates Matwork','pilates','group','general','Mat-based pilates classes offered alongside yoga services.','Packages from 48 EUR for 4 small-group lessons','official','current',0.88,'s10','2026-03-10'),
('o27','v04','i17','Odaka Yoga Prenatal','Prenatal Yoga','yoga','group','prenatal','Prenatal yoga for women from the third month of pregnancy.','Packages vary; dedicated prenatal page on site','official','current',0.9,'s10','2026-03-10'),
('o28','v04','i17','Odaka Yoga Post Parto','Postnatal Yoga','yoga','group','postnatal','Gentle return-to-movement class for new mothers.','Packages from 48 EUR for 4 small-group lessons','official','current',0.87,'s10','2026-03-10'),
('o29','v04','i17','Odaka Zen Warrior','Odaka / Martial flow','yoga','group','general','Movement meditation drawing from martial techniques and focus work.','Packages from 48 EUR for 4 small-group lessons','official','current',0.87,'s10','2026-03-10'),
('o30','v04','i17','Odaka Body Mind Flow','Odaka Flow','yoga','group','general','Flow-oriented class emphasising embodied freedom and presence.','Packages from 48 EUR for 4 small-group lessons','official','current',0.87,'s10','2026-03-10'),
('o31','v05','i18','Ashtanga Mysore','Ashtanga Yoga','yoga','group','all levels','Traditional self-paced Mysore practice with teacher support and adjustments.','8 lessons 65 EUR; 16 lessons 110 EUR','official','current',0.97,'s15','2026-03-10'),
('o32','v05','i18','Yin Yoga','Yin Yoga','yoga','group','general','Slow practice for connective tissue, flexibility, and down-regulation.','Included in studio lesson packs','official','current',0.94,'s15','2026-03-10'),
('o33','v05',NULL,'Meditazione','Meditation','meditation','hybrid','general','Studio and online meditation offering.','Included in studio lesson packs or booking credits','official','current',0.89,'s13','2026-03-10'),
('o34','v05',NULL,'Pranayama','Pranayama','breathwork','group','general','Breath training listed among the core classes on the home page.','Included in studio lesson packs','official','current',0.86,'s13','2026-03-10'),
('o35','v05',NULL,'Yoga Bimbi','Kids Yoga','yoga','group','children','Weekly children''s yoga course sold as a monthly plan.','40 EUR monthly','official','current',0.85,'s13','2026-03-10'),
('o36','v06','i20','Yoga','Yoga','yoga','hybrid','general','Core Yogastudiolab yoga path in person or online.','Not published on captured pages','official','current',0.85,'s16','2026-03-10'),
('o37','v06','i20','Pilates','Pilates','pilates','hybrid','general','Pilates offering in the Yogastudiolab mix.','Not published on captured pages','official','current',0.82,'s16','2026-03-10'),
('o38','v06','i20','Pranayama e Mudra','Pranayama / Mudra','breathwork','hybrid','general','Breath and subtle practice described on the home page.','Not published on captured pages','official','current',0.82,'s16','2026-03-10'),
('o39','v06','i20','Mindfulness','Mindfulness','mindfulness','hybrid','general','Mindfulness offering on the Yogastudiolab site.','Not published on captured pages','official','current',0.8,'s16','2026-03-10'),
('o40','v06','i20','Danzamovimentoterapia','Dance Movement Therapy','movement','hybrid','general','Movement-therapy pathway by Valentina Lorito.','Not published on captured pages','official','current',0.81,'s16','2026-03-10'),
('o41','v07','i22','Vinyasa Yoga','Vinyasa Yoga','yoga','semi_private','general','Private or semi-private Vinyasa Yoga by appointment.','By appointment','official','current',0.88,'s19','2026-03-10'),
('o42','v08',NULL,'Power Yoga','Power Yoga','yoga','group','general','Power Yoga is named among the blended Grandma''s lesson types.','Single lesson 30 EUR; trial 20 EUR','official','current',0.82,'s22','2026-03-10'),
('o43','v08',NULL,'Yoga / Pilates / Stretching Blend','Integrated Yoga-Pilates','movement','hybrid','general','Grandma''s states that its lessons combine yoga, pilates, and stretching with group, online, and individual options.','Single lesson 30 EUR; trial 20 EUR','official','current',0.84,'s22','2026-03-10'),
('o44','v09','i26','Yoga','Yoga','yoga','group','general','Yoga appears in Taiji Studio''s wellness mix and open-day programming.','Contact studio for pricing','official','current',0.75,'s23','2026-03-10'),
('o45','v09','i27','Pilates','Pilates','pilates','group','general','Pilates appears in Taiji Studio''s wellness mix and open-day programming.','Contact studio for pricing','official','current',0.74,'s23','2026-03-10'),
('o46','v09','i28','Postura Dinamica','Postura Dinamica','movement','group','general','Postural movement class listed on the Taiji Studio open day.','Contact studio for pricing','official','current',0.74,'s23','2026-03-10'),
('o47','v10','i25','Hata Yoga','Hatha Yoga','yoga','group','general','Published morning Hata Yoga timetable at Ivanor.','Contact venue for pricing','official','current',0.9,'s24','2026-03-10'),
('o48','v10','i25','Yogilates','Yogilates','movement','group','general','Published Yogilates timetable at Ivanor.','Contact venue for pricing','official','current',0.9,'s24','2026-03-10'),
('o49','v11','i19','Yoga all''Alba','Outdoor Yoga','yoga','outdoor','all levels','Morning city-site sessions in landmark Palermo locations.','12 EUR per event','official','historical',0.83,'s25','2026-03-10'),
('o50','v11','i19','Yoga al Tramonto','Outdoor Yoga','yoga','outdoor','all levels','Sunset city-site sessions in landmark Palermo locations.','12 EUR per event','official','historical',0.83,'s25','2026-03-10'),
('o51','v11','i19','Yoga Art','Yoga Art','yoga','outdoor','all levels','Special-format events such as Salinas Museum sessions.','28 EUR event example at Salinas','official','historical',0.8,'s25','2026-03-10'),
('o52','v12','i29','Iyengar Yoga','Iyengar Yoga','yoga','group','general','Lead record derived from the national Iyengar association profile for Simone Cannatella.','Unknown','association','lead',0.66,'s28','2026-03-10'),
('o53','v13','i30','Hatha Yoga Posturale','Hatha Yoga','yoga','group','general','Third-party listing for Spazio ZoeMa mentions postural and therapeutic Hatha Yoga.','Unknown','directory','lead',0.62,'s30','2026-03-10'),
('o54','v13','i30','Hatha Yoga Flow','Hatha Flow','yoga','group','general','Third-party listing for Spazio ZoeMa mentions Hatha Yoga Flow.','Unknown','directory','lead',0.6,'s30','2026-03-10'),
('o55','v13','i30','Yoga in Gravidanza','Prenatal Yoga','yoga','group','prenatal','Third-party listing for Spazio ZoeMa mentions prenatal offerings.','Unknown','directory','lead',0.58,'s30','2026-03-10'),
('o56','v14',NULL,'Kundalini Yoga','Kundalini Yoga','yoga','group','general','Directory-only Kundalini lead in Palermo.','Unknown','directory','lead',0.52,'s32','2026-03-10'),
('o57','v15',NULL,'Sahaja Yoga Meditation','Sahaja Yoga','meditation','group','general','Directory and article lead for Sahaja Yoga and meditation in Palermo.','Typically free in community settings; direct current verification needed','directory','lead',0.5,'s31','2026-03-10'),
('o58','v16',NULL,'Ashtanga / Vinyasa / Yin / Kundalini Mix','Mixed Yoga Styles','yoga','group','general','Guide article describes Yogandy as offering multiple styles and Yogatherapy.','Unknown','directory','lead',0.48,'s33','2026-03-10'),
('o59','v17','i31','Kundalini Yoga','Kundalini Yoga','yoga','group','general','Kundalini Yoga lead from the Palermo network PDF.','Unknown','directory','lead',0.51,'s34','2026-03-10'),
('o60','v18','i32','Kundalini Yoga','Kundalini Yoga','yoga','group','general','Kundalini Yoga lead from the Palermo network PDF.','Unknown','directory','lead',0.5,'s34','2026-03-10');

INSERT INTO schedules (id, offering_id, weekday, start_time, end_time, recurrence_text, location_text, date_text, listing_status, source_id, notes, last_verified_at) VALUES
('sch01','o01','Tuesday','10:00','11:00','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','1-Livello slot in 2025-2026 timetable.','2026-03-10'),
('sch02','o01','Thursday','10:00','11:00','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','1-Livello slot in 2025-2026 timetable.','2026-03-10'),
('sch03','o01','Monday','17:30','18:30','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','1-Livello slot in 2025-2026 timetable.','2026-03-10'),
('sch04','o01','Wednesday','17:30','18:30','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','1-Livello slot in 2025-2026 timetable.','2026-03-10'),
('sch05','o01','Tuesday','19:00','20:00','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','1-Livello evening slot in 2025-2026 timetable.','2026-03-10'),
('sch06','o01','Thursday','19:00','20:00','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','1-Livello evening slot in 2025-2026 timetable.','2026-03-10'),
('sch07','o02','Monday','18:15','19:15','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','Soft Yoga slot in 2025-2026 timetable.','2026-03-10'),
('sch08','o02','Wednesday','18:15','19:15','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','Soft Yoga slot in 2025-2026 timetable.','2026-03-10'),
('sch09','o02','Tuesday','17:00','18:00','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','Soft Yoga slot in 2025-2026 timetable.','2026-03-10'),
('sch10','o02','Thursday','17:00','18:00','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','Soft Yoga slot in 2025-2026 timetable.','2026-03-10'),
('sch11','o03','Tuesday','17:00','18:00','Recurring class added in current news','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s01','Home page news says a second Hatha Yoga session was added on Tuesdays at 17:00.','2026-03-10'),
('sch12','o03','Friday','18:00','19:00','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','Hatha Yoga slot in 2025-2026 timetable.','2026-03-10'),
('sch13','o04','Monday','19:30','20:30','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','Tecniche Respiratorie 1 slot in active timetable.','2026-03-10'),
('sch14','o05','Wednesday','19:30','20:30','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19 / online',NULL,'current','s02','Tecniche Respiratorie 2 listed with Antonio online.','2026-03-10'),
('sch15','o06','Wednesday','17:30','18:30','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','Yoga Bimbi slot in active timetable.','2026-03-10'),
('sch16','o07','Tuesday','18:00','19:30','Dated course block','Yoga Ananda Palermo, Via Trapani Pescia 77','2025-09-02 to 2025-09-23','historical','s04','September 2025 Raja Yoga course block.','2026-03-10'),
('sch17','o07','Tuesday','18:00','19:30','Dated course block','Yoga Ananda Palermo, Via Trapani Pescia 77','2025-10-07 to 2025-10-31','historical','s04','October 2025 Raja Yoga cycle.','2026-03-10'),
('sch18','o07','Friday','18:00','19:30','Dated course block','Yoga Ananda Palermo, Via Trapani Pescia 77','2025-10-07 to 2025-10-31','historical','s04','October 2025 Raja Yoga cycle.','2026-03-10'),
('sch19','o08','Tuesday','18:00','19:30','Four-lesson course block','Yoga Ananda Palermo, Via Trapani Pescia 77','2025-11-04 onward','historical','s04','Meditation starter course announced for November 2025.','2026-03-10'),
('sch20','o09','Monday','18:00','20:00','Five-lesson course block','Yoga Ananda Palermo, Via Trapani Pescia 77 / online','2025-12-01 to 2025-12-29','historical','s04','December 2025 Kriya-preparation course.','2026-03-10'),
('sch21','o11','Monday','09:00','10:00','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch22','o11','Wednesday','09:00','10:00','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch23','o11','Friday','09:00','10:00','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch24','o11','Monday','18:00','19:00','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch25','o11','Wednesday','18:00','19:00','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch26','o12','Monday','13:30','14:30','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch27','o12','Wednesday','13:30','14:30','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch28','o12','Sunday','11:00','12:00','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch29','o13','Monday','19:30','20:30','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch30','o13','Wednesday','19:30','20:30','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch31','o13','Saturday','10:00','11:00','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch32','o14','Tuesday','11:00','12:00','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch33','o14','Thursday','11:00','12:00','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch34','o15','Tuesday','19:30','20:30','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch35','o15','Thursday','19:30','20:30','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch36','o15','Saturday','17:00','18:00','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch37','o16','Friday','17:00','18:00','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch38','o17','Saturday','11:30','12:30','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch39','o17','Sunday','11:30','12:30','Weekly recurring class','A.S.D.C. Yoga Your Life, Via Enrico Albanese 7',NULL,'current','s07','Current live timetable.','2026-03-10'),
('sch40','o19',NULL,NULL,NULL,'Service page marked unavailable at time of capture','Mondello Costa Ponente',NULL,'historical','s08','Outdoor beach yoga service exists on site but was unavailable when checked.','2026-03-10'),
('sch41','o20',NULL,NULL,NULL,'Bookable service without listed next session in snippet','Isola delle Femmine, Viale dei Saraceni 25',NULL,'unknown','s09','SUP yoga collaboration with Isolasurf.','2026-03-10'),
('sch42','o21','Tuesday','19:00','20:00','Small-group package schedule shown on product page','Flex Fitness, Via Calarossa 6, Terrasini',NULL,'current','s12','Specific schedule published for the small-group package. Palermo sessions are available by arrangement but not exposed with a fixed timetable on the captured pages.','2026-03-10'),
('sch43','o21','Thursday','19:00','20:00','Small-group package schedule shown on product page','Flex Fitness, Via Calarossa 6, Terrasini',NULL,'current','s12','Specific schedule published for the small-group package.','2026-03-10'),
('sch44','o31','Monday','06:30','09:30','Weekly recurring class','Ashtanga Shala Sicilia, Via della Liberta 56',NULL,'current','s15','Current class schedule from Cristina Chiummo profile.','2026-03-10'),
('sch45','o31','Wednesday','06:30','09:30','Weekly recurring class','Ashtanga Shala Sicilia, Via della Liberta 56',NULL,'current','s15','Current class schedule from Cristina Chiummo profile.','2026-03-10'),
('sch46','o31','Friday','06:30','09:30','Weekly recurring class','Ashtanga Shala Sicilia, Via della Liberta 56',NULL,'current','s15','Current class schedule from Cristina Chiummo profile.','2026-03-10'),
('sch47','o31','Monday','18:00','20:30','Weekly recurring class','Ashtanga Shala Sicilia, Via della Liberta 56',NULL,'current','s15','Current class schedule from Cristina Chiummo profile.','2026-03-10'),
('sch48','o31','Wednesday','18:00','20:30','Weekly recurring class','Ashtanga Shala Sicilia, Via della Liberta 56',NULL,'current','s15','Current class schedule from Cristina Chiummo profile.','2026-03-10'),
('sch49','o31','Saturday','09:30','12:30','Weekly recurring class','Ashtanga Shala Sicilia, Via della Liberta 56',NULL,'current','s15','Current class schedule from Cristina Chiummo profile.','2026-03-10'),
('sch50','o32','Monday','17:00','18:00','Weekly recurring class','Ashtanga Shala Sicilia, Via della Liberta 56',NULL,'current','s15','Current class schedule from Cristina Chiummo profile.','2026-03-10'),
('sch51','o32','Wednesday','17:00','18:00','Weekly recurring class','Ashtanga Shala Sicilia, Via della Liberta 56',NULL,'current','s15','Current class schedule from Cristina Chiummo profile.','2026-03-10'),
('sch52','o35','Friday',NULL,NULL,'Weekly children class sold as monthly plan','Ashtanga Shala Sicilia, Via della Liberta 56',NULL,'current','s13','The home page states yoga bimbi takes place on Friday afternoon; exact time not exposed in captured snippet.','2026-03-10'),
('sch53','o47','Monday','09:00','10:00','Weekly recurring class','Centro sportivo Ivanor, Via Marchese Ugo 6',NULL,'current','s24','Published Ivanor schedule.','2026-03-10'),
('sch54','o47','Wednesday','09:00','10:00','Weekly recurring class','Centro sportivo Ivanor, Via Marchese Ugo 6',NULL,'current','s24','Published Ivanor schedule.','2026-03-10'),
('sch55','o47','Friday','09:00','10:00','Weekly recurring class','Centro sportivo Ivanor, Via Marchese Ugo 6',NULL,'current','s24','Published Ivanor schedule.','2026-03-10'),
('sch56','o48','Tuesday','18:30','19:30','Weekly recurring class','Centro sportivo Ivanor, Via Marchese Ugo 6',NULL,'current','s24','Published Ivanor schedule.','2026-03-10'),
('sch57','o48','Thursday','18:30','19:30','Weekly recurring class','Centro sportivo Ivanor, Via Marchese Ugo 6',NULL,'current','s24','Published Ivanor schedule.','2026-03-10'),
('sch58','o49',NULL,'06:00','07:30','Single dated event','Piazza Castelnuovo, Palermo','2025-06-08','historical','s25','Yoga all''alba event in Palermo landmark program.','2026-03-10'),
('sch59','o50',NULL,'19:00','20:30','Single dated event','Prato del Foro Italico, Palermo','2025-06-15','historical','s25','Yoga al tramonto event in Palermo landmark program.','2026-03-10'),
('sch60','o49',NULL,'06:00','07:30','Single dated event','Molo di Sant''Erasmo, Palermo','2025-06-28','historical','s25','Yoga all''alba event in Palermo landmark program.','2026-03-10'),
('sch61','o50',NULL,'19:00','20:30','Single dated event','La Cala, Palermo','2025-06-29','historical','s25','Yoga al tramonto event in Palermo landmark program.','2026-03-10'),
('sch62','o49',NULL,'06:00','07:30','Single dated event','Prato del Foro Italico, Palermo','2025-07-05','historical','s25','Yoga all''alba event in Palermo landmark program.','2026-03-10'),
('sch63','o50',NULL,'19:00','20:30','Single dated event','Piazza Verdi / Teatro Massimo, Palermo','2025-07-12','historical','s27','Example sunset event with 90-minute duration explicitly described on event page.','2026-03-10'),
('sch64','o50',NULL,'19:00','20:30','Single dated event','Piazza del Parlamento, Palermo','2025-08-09','historical','s25','Yoga al tramonto event in Palermo landmark program.','2026-03-10'),
('sch65','o49',NULL,'06:10','07:40','Single dated event','Piazza Andrea Camilleri / Emerico Amari, Palermo','2025-08-10','historical','s25','Yoga all''alba event in Palermo landmark program.','2026-03-10'),
('sch66','o49',NULL,'06:30','08:00','Single dated event','Villa Sperlinga, Palermo','2025-08-24','historical','s25','Yoga all''alba event in Palermo landmark program.','2026-03-10'),
('sch67','o49',NULL,'08:00','09:30','Single dated event','Giardino Inglese, Palermo','2025-09-06','historical','s25','Yoga all''alba event in Palermo landmark program.','2026-03-10'),
('sch68','o50',NULL,'18:30','20:00','Single dated event','Piazza Castelnuovo, Palermo','2025-09-07','historical','s25','Yoga al tramonto event in Palermo landmark program.','2026-03-10'),
('sch69','o51',NULL,'09:15','10:45','Single dated event','Agora / Salinas Museo Archeologico, Palermo','2025-11-09','historical','s25','Yoga Art event slot 1.','2026-03-10'),
('sch70','o51',NULL,'11:30','13:00','Single dated event','Agora / Salinas Museo Archeologico, Palermo','2025-11-09','historical','s25','Yoga Art event slot 2.','2026-03-10');

COMMIT;

CREATE VIEW venue_rollup AS
SELECT
  v.id,
  v.name,
  v.verification_level,
  v.listing_status,
  v.confidence_score,
  COUNT(DISTINCT o.id) AS offerings_count,
  COUNT(DISTINCT vi.instructor_id) AS instructors_count,
  COUNT(DISTINCT s.id) AS schedule_count
FROM venues v
LEFT JOIN offerings o ON o.venue_id = v.id
LEFT JOIN venue_instructors vi ON vi.venue_id = v.id
LEFT JOIN schedules s ON s.offering_id = o.id
GROUP BY v.id, v.name, v.verification_level, v.listing_status, v.confidence_score;

BEGIN;
INSERT INTO instructors (id, slug, full_name, base_city, phone, email, website_url, verification_level, listing_status, confidence_score, source_id, bio, last_verified_at) VALUES
('i33','wendy-hudepol','Wendy Hudepol','Palermo',NULL,NULL,NULL,'directory','lead',0.5,'s33','Lead contact inferred from the EventiYoga Palermo guide entry for Yantra Palermo.','2026-03-10'),
('i34','alessandro-puccio','Alessandro Puccio','Palermo',NULL,NULL,NULL,'directory','lead',0.5,'s33','Lead contact inferred from the EventiYoga Palermo guide entry for Villa AOM Retreats.','2026-03-10');

INSERT INTO venues (id, slug, name, city, neighborhood, street_address, postal_code, phone, email, website_url, venue_kind, verification_level, listing_status, confidence_score, source_id, notes, last_verified_at) VALUES
('v19','centro-akiti','Centro Akiti','Palermo',NULL,NULL,NULL,NULL,NULL,NULL,'studio','directory','lead',0.46,'s33','Lead only from the EventiYoga Palermo guide. The guide describes Ashtanga Yoga, Vipassana, Yoga Chikitsa, Hatha, pranayama, yoga for children, and yoga gentile.','2026-03-10'),
('v20','yantra-palermo','Yantra Palermo','Palermo',NULL,NULL,NULL,NULL,NULL,NULL,'studio','directory','lead',0.47,'s33','Lead only from the EventiYoga Palermo guide. The guide attributes the project to Wendy Hudepol.','2026-03-10'),
('v21','villa-aom-retreats','Villa AOM Retreats','Palermo',NULL,NULL,NULL,NULL,NULL,NULL,'retreat_brand','directory','lead',0.47,'s33','Lead only from the EventiYoga Palermo guide. The guide attributes the project to Alessandro Puccio and positions it around yoga and ayurveda.','2026-03-10');

INSERT INTO venue_instructors (venue_id, instructor_id, role, notes) VALUES
('v20','i33','lead_teacher','Lead teacher referenced in EventiYoga guide.'),
('v21','i34','lead_teacher','Lead teacher referenced in EventiYoga guide.');

INSERT INTO offerings (id, venue_id, instructor_id, title, style, category, format, audience, description, pricing_text, verification_level, listing_status, confidence_score, source_id, last_verified_at) VALUES
('o61','v19',NULL,'Ashtanga / Vipassana / Yoga Chikitsa Mix','Mixed Yoga Styles','yoga','group','general','Lead only. EventiYoga guide lists Ashtanga Yoga, Vipassana meditation, Yoga Chikitsa, Hatha, pranayama, children classes, and gentle yoga.','Unknown','directory','lead',0.46,'s33','2026-03-10'),
('o62','v20','i33','Ashtanga / Tantra / Prenatal / Nidra Mix','Mixed Yoga Styles','yoga','group','general','Lead only. EventiYoga guide lists Ashtanga Yoga, Tantra Yoga, pregnancy and post-partum yoga, and Yoga Nidra.','Unknown','directory','lead',0.47,'s33','2026-03-10'),
('o63','v21','i34','Ashtanga Yoga e Ayurveda','Ashtanga Yoga','yoga','retreat','general','Lead only. EventiYoga guide describes Villa AOM Retreats as combining Ashtanga Yoga, Ayurveda, and related bodywork.','Unknown','directory','lead',0.47,'s33','2026-03-10');
COMMIT;

BEGIN;
INSERT INTO sources (id, source_kind, publisher, title, url, last_checked_at, notes) VALUES
('s35','official_site','Sahaja Yoga','Sahaja Yoga Palermo class page','https://sahajayoga.it/corsi/palermo-martedi-dalle-1830-alle-2000/','2026-03-11','Official current Palermo class page with exact address, phone, time, and embedded coordinates.'),
('s36','association_directory','Yoga Alliance International Italia','Spazio Zoema profile','https://www.yogaalliance.it/italy/palermo/registered-yoga-school/spazio-zoema','2026-03-11','Yoga Alliance listing with phone, Palermo location, Google map coordinates, and directions link.'),
('s37','association_directory','Associazione Iyengar Yoga','Palermo Sadhana page','https://www.iyengaryoga.it/sedi-scuole-dettaglio/associazione-sportiva-dilettantistica-palermo-sadhana/','2026-03-11','Official Iyengar association page for Palermo Sadhana with teacher and activity details.');

UPDATE venues
SET verification_level = 'official',
    listing_status = 'current',
    confidence_score = 0.9,
    source_id = 's35',
    street_address = 'Casa dell''Equita e della Bellezza, Via Nicolo Garzilli 43/a',
    postal_code = '90139',
    phone = '+39 3287669452',
    notes = 'Official Palermo class page with exact address, phone, Tuesday 18:30-20:00 slot, and embedded coordinates.',
    last_verified_at = '2026-03-11'
WHERE id = 'v15';

UPDATE offerings
SET verification_level = 'official',
    listing_status = 'current',
    confidence_score = 0.84,
    source_id = 's35',
    description = 'Official current Sahaja Yoga class in Palermo with a fixed weekly Tuesday slot and venue details.',
    pricing_text = 'Typically community-led; pricing not exposed on the captured page',
    last_verified_at = '2026-03-11'
WHERE id = 'o57';

INSERT INTO schedules (id, offering_id, weekday, start_time, end_time, recurrence_text, location_text, date_text, listing_status, source_id, notes, last_verified_at) VALUES
('sch71','o57','Tuesday','18:30','20:00','Current weekly class','Casa dell''Equita e della Bellezza, Via Nicolo Garzilli 43/a, Palermo',NULL,'current','s35','Official current class page on Sahaja Yoga site.','2026-03-11');

UPDATE venues
SET verification_level = 'association',
    listing_status = 'current',
    confidence_score = 0.74,
    source_id = 's36',
    street_address = 'Via Maqueda, Palermo',
    postal_code = '90133',
    phone = '+39 3403401584',
    notes = 'Yoga Alliance Italia profile with Palermo postcode, phone number, and map coordinates centered on Via Maqueda.',
    last_verified_at = '2026-03-11'
WHERE id = 'v13';

UPDATE offerings
SET verification_level = 'association',
    listing_status = 'current',
    confidence_score = 0.68,
    source_id = 's36',
    description = 'Registered Yoga School listing on Yoga Alliance Italia; exact timetable still not published on a direct source captured here.',
    last_verified_at = '2026-03-11'
WHERE venue_id = 'v13';

UPDATE venues
SET verification_level = 'association',
    listing_status = 'current',
    confidence_score = 0.79,
    source_id = 's37',
    notes = 'Official Iyengar association listing naming Simone Cannatella and ASD Palermo Sadhana in Palermo.',
    last_verified_at = '2026-03-11'
WHERE id = 'v12';

UPDATE offerings
SET verification_level = 'association',
    listing_status = 'current',
    confidence_score = 0.76,
    source_id = 's37',
    description = 'Iyengar Yoga activity for ASD Palermo Sadhana from the national association listing.',
    last_verified_at = '2026-03-11'
WHERE id = 'o52';

INSERT INTO venue_locations (venue_id, lat, lng, location_label, location_confidence, source_id, notes) VALUES
('v01',38.1421944,13.3503169,'Via Salvatore Bono 19, Palermo','road-level','s01','OpenStreetMap road-level geocode for the published Rishi address.'),
('v02',38.1734854,13.3256317,'Via Trapani Pescia 77, Palermo','road-level','s05','OpenStreetMap road-level geocode for the published Yoga Ananda address.'),
('v03',38.1295652,13.3535793,'Via Enrico Albanese 7, Palermo','road-level','s07','OpenStreetMap geocode aligned with the published studio address.'),
('v04',38.1289000,13.3562000,'Palermo service area','approximate-city','s11','No fixed Palermo street address is published on the official site; point placed near the Politeama service area.'),
('v05',38.1351145,13.3486124,'Via della Liberta 56, Palermo','house-level','s13','OpenStreetMap house-level result for the published Ashtanga Shala Sicilia address.'),
('v06',38.1248000,13.3610000,'Palermo service area','approximate-city','s17','Official site confirms Palermo presence but not a precise street address.'),
('v07',38.1320087,13.3470906,'Via Piersanti Mattarella 9, Palermo','embedded-map','s21','Coordinates taken from the official Palermo Pilates Google Maps embed and linked place URL.'),
('v08',38.1305000,13.3435000,'Grandma''s Pilates & Yoga Palermo secret garden','approximate-city','s22','Official site exposes the place name but not a reliable parsable street coordinate on the captured page.'),
('v09',38.1239951,13.3472704,'Via Selinunte 11, Palermo','road-level','s23','OpenStreetMap road-level geocode for Taiji Studio Palermo.'),
('v10',38.1317370,13.3503735,'Via Marchese Ugo 6, Palermo','road-level','s24','OpenStreetMap road-level geocode for Ivanor.'),
('v11',38.1460403,13.3498032,'Via Imperatore Federico 70, Palermo','road-level','s26','OpenStreetMap road-level geocode for Yoga City contact address.'),
('v12',38.1157000,13.3615000,'Palermo city center','approximate-city','s37','Iyengar association page confirms Palermo but does not publish a precise address.'),
('v13',38.1156900,13.3614868,'Via Maqueda, Palermo','embedded-map','s36','Coordinates taken from the Yoga Alliance profile map widget.'),
('v15',38.1258050,13.3527100,'Casa dell''Equita e della Bellezza, Via Nicolo Garzilli 43/a, Palermo','embedded-map','s35','Coordinates taken from the official Sahaja Yoga store locator payload.');
COMMIT;

BEGIN;
UPDATE sources
SET last_checked_at = '2026-03-12',
    notes = 'Homepage confirms current recurring Taijiquan and Qi Gong timetable lines with days, times, and locations.'
WHERE id = 's23';

INSERT INTO offerings (id, venue_id, instructor_id, title, style, category, format, audience, description, pricing_text, verification_level, listing_status, confidence_score, source_id, last_verified_at) VALUES
('o64','v09',NULL,'Taijiquan','Taijiquan','movement','group','general','Current recurring Taijiquan timetable is published on the official Taiji Studio homepage.','Contact studio for pricing','official','current',0.87,'s23','2026-03-12'),
('o65','v09',NULL,'Qi Gong','Qi Gong','movement','group','general','Current recurring Qi Gong timetable is published on the official Taiji Studio homepage.','Contact studio for pricing','official','current',0.86,'s23','2026-03-12'),
('o66','v01','i04','Canto Sacro','Canto Sacro','meditation','group','general','Canto Sacro appears on the current Rishi timetable with weekday and time.','Not published on captured pages','official','current',0.84,'s02','2026-03-12'),
('o67','v01','i05','Danza Sufi','Danza Sufi','movement','group','general','Danza Sufi appears on the current Rishi timetable with weekday and time.','Not published on captured pages','official','current',0.84,'s02','2026-03-12'),
('o68','v01',NULL,'Meditazione Taoista','Meditazione Taoista','meditation','group','general','Meditazione Taoista appears on the current Rishi timetable with a Saturday early-morning slot.','Not published on captured pages','official','current',0.8,'s02','2026-03-12');

INSERT INTO schedules (id, offering_id, weekday, start_time, end_time, recurrence_text, location_text, date_text, listing_status, source_id, notes, last_verified_at) VALUES
('sch72','o01','Monday','18:45','19:45','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','1-Livello slot in 2025-2026 timetable.','2026-03-12'),
('sch73','o01','Wednesday','18:45','19:45','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','1-Livello slot in 2025-2026 timetable.','2026-03-12'),
('sch74','o01','Monday','20:00','21:00','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','1-Livello slot in 2025-2026 timetable.','2026-03-12'),
('sch75','o01','Wednesday','20:00','21:00','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','1-Livello slot in 2025-2026 timetable.','2026-03-12'),
('sch76','o66','Tuesday','20:15','21:15','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','Canto Sacro row in current Rishi timetable.','2026-03-12'),
('sch77','o67','Friday','18:00','19:00','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','Danza Sufi row in current Rishi timetable.','2026-03-12'),
('sch78','o68','Saturday','07:30','08:30','Academic-year recurring class','Centro di Cultura Rishi, Via Salvatore Bono 19',NULL,'current','s02','Meditazione Taoista row in current Rishi timetable.','2026-03-12'),
('sch79','o64','Monday','08:30','09:30','Weekly recurring class','Taiji Studio, Via Selinunte 11, Palermo',NULL,'current','s23','Official homepage timetable line for Taijiquan at Taiji Studio.','2026-03-12'),
('sch80','o64','Wednesday','08:30','09:30','Weekly recurring class','Taiji Studio, Via Selinunte 11, Palermo',NULL,'current','s23','Official homepage timetable line for Taijiquan at Taiji Studio.','2026-03-12'),
('sch81','o64','Friday','08:30','09:30','Weekly recurring class','Taiji Studio, Via Selinunte 11, Palermo',NULL,'current','s23','Official homepage timetable line for Taijiquan at Taiji Studio.','2026-03-12'),
('sch82','o64','Monday','10:00','11:00','Weekly recurring class','Taiji Studio, Via Selinunte 11, Palermo',NULL,'current','s23','Official homepage timetable line for Taijiquan at Taiji Studio.','2026-03-12'),
('sch83','o64','Friday','10:00','11:00','Weekly recurring class','Taiji Studio, Via Selinunte 11, Palermo',NULL,'current','s23','Official homepage timetable line for Taijiquan at Taiji Studio.','2026-03-12'),
('sch84','o64','Monday','19:00','20:00','Weekly recurring class','Taiji Studio, Via Selinunte 11, Palermo',NULL,'current','s23','Official homepage timetable line for Taijiquan at Taiji Studio.','2026-03-12'),
('sch85','o64','Wednesday','19:00','20:00','Weekly recurring class','Taiji Studio, Via Selinunte 11, Palermo',NULL,'current','s23','Official homepage timetable line for Taijiquan at Taiji Studio.','2026-03-12'),
('sch86','o64','Friday','19:00','20:00','Weekly recurring class','Taiji Studio, Via Selinunte 11, Palermo',NULL,'current','s23','Official homepage timetable line for Taijiquan at Taiji Studio.','2026-03-12'),
('sch87','o65','Saturday','10:00','11:00','Weekly recurring class','Villa Trabia, Palermo',NULL,'current','s23','Official homepage timetable line for Qi Gong at Villa Trabia.','2026-03-12'),
('sch88','o65','Monday','18:00','19:00','Weekly recurring class','Taiji Studio, Via Selinunte 11, Palermo',NULL,'current','s23','Official homepage timetable line for Qi Gong at Taiji Studio.','2026-03-12'),
('sch89','o65','Friday','18:00','19:00','Weekly recurring class','Taiji Studio, Via Selinunte 11, Palermo',NULL,'current','s23','Official homepage timetable line for Qi Gong at Taiji Studio.','2026-03-12');
COMMIT;

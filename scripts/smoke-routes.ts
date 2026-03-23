const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000';

const checks = [
  { path: '/it', markers: ['kinelo.fit', 'Palermo'] },
  {
    path: '/it/palermo',
    markers: ['Palermo', 'Classi in evidenza', 'Classi settimanali', 'Quartieri coperti'],
    absent: ['Soglia di copertura', 'Copertura CTA', 'Quando Supabase non è configurato']
  },
  {
    path: '/it/palermo/classes',
    markers: ['Filtri', 'Vista mappa', 'Calendario'],
    absent: ['Soglia di copertura', 'Copertura CTA', 'Not published on captured pages']
  },
  { path: '/it/palermo/studios/yoga-city', markers: ['Studio', 'Agenda verificata'] },
  {
    path: '/it/palermo/studios/ashtanga-shala-sicilia',
    markers: ['Carnet 8 lezioni a 65 EUR; carnet 16 lezioni a 110 EUR.'],
    absent: ['8 lessons 65 EUR; 16 lessons 110 EUR']
  },
  {
    path: '/it/palermo/studios/yoga-your-life',
    markers: ['Carnet da 12 EUR; mensile open a 70 EUR.'],
    absent: ['Carnet from 12 EUR; monthly open 70 EUR']
  },
  {
    path: '/it/palermo/categories/pilates',
    markers: ['Una selezione curata di lezioni ricorrenti.'],
    absent: ['Pubblicata in modo selettivo mentre la copertura cresce.']
  },
  { path: '/it/palermo/teachers/valentina-lorito', markers: ['Valentina Lorito'] },
  { path: '/it/suggest-calendar', markers: ['Segnala il tuo calendario', 'Invio rapido'] },
  { path: '/it/account', markers: ['Account'] },
  { path: '/it/favorites', markers: ['Preferiti'] },
  { path: '/it/schedule', markers: ['Agenda salvata'] },
  {
    path: '/it/sign-in',
    markers: ['Accedi', 'Cosa puoi salvare'],
    absent: ['Supabase', 'Modalità', 'Auth reale attiva', 'Qualcosa si è interrotto']
  }
];

const failures: string[] = [];

async function run() {
  for (const check of checks) {
    const url = new URL(check.path, baseUrl).toString();

    try {
      const response = await fetch(url);
      const body = await response.text();

      if (!response.ok) {
        failures.push(`${check.path}: expected 200, got ${response.status}`);
        continue;
      }

      for (const marker of check.markers) {
        if (!body.includes(marker)) {
          failures.push(`${check.path}: missing marker "${marker}"`);
        }
      }

      for (const marker of check.absent ?? []) {
        if (body.includes(marker)) {
          failures.push(`${check.path}: unexpected marker "${marker}"`);
        }
      }
    } catch (error) {
      failures.push(`${check.path}: ${(error as Error).message}`);
    }
  }

  if (failures.length > 0) {
    console.error('Smoke route check failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(`Smoke route check passed for ${checks.length} routes on ${baseUrl}`);
}

void run();

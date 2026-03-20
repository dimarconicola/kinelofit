const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000';

const checks = [
  { path: '/it', markers: ['kinelo.fit', 'Palermo'] },
  { path: '/it/palermo', markers: ['Palermo', 'Classi in evidenza'] },
  { path: '/it/palermo/classes', markers: ['Filtri', 'Vista mappa', 'Calendario'] },
  { path: '/it/palermo/studios/yoga-city', markers: ['Studio', 'Agenda verificata'] },
  { path: '/it/palermo/teachers/valentina-lorito', markers: ['Valentina Lorito'] },
  { path: '/it/suggest-calendar', markers: ['Segnala il tuo calendario', 'Invio rapido'] },
  { path: '/it/favorites', markers: ['Preferiti'] },
  { path: '/it/schedule', markers: ['Agenda salvata'] },
  { path: '/it/sign-in', markers: ['Accedi'] }
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

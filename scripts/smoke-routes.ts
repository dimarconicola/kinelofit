import http from 'node:http';
import https from 'node:https';

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
  {
    path: '/it/palermo/classes?view=map',
    markers: ['Vista mappa'],
    absent: ['NEXT_PUBLIC_MAPBOX_TOKEN', 'Mappa non configurata', 'Map not configured']
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
  { path: '/it/palermo/teachers', markers: ['Le tue guide a Palermo', 'Valentina Lorito'] },
  { path: '/it/suggest-calendar', markers: ['Suggerisci il tuo calendario', 'Invio rapido'] },
  { path: '/it/account', markers: ['Account'] },
  { path: '/it/favorites', markers: ['Preferiti per scegliere con calma', 'Qui tornano le scelte che vuoi seguire con calma'] },
  { path: '/it/schedule', markers: ['La tua settimana, già filtrata'] },
  {
    path: '/it/sign-in',
    markers: ['Accedi', 'Uno spazio personale leggero e utile'],
    absent: ['Supabase', 'Modalità', 'Auth reale attiva', 'Qualcosa si è interrotto']
  }
];

const failures: string[] = [];

const requestHtml = async (target: string) =>
  new Promise<{ status: number; body: string }>((resolve, reject) => {
    const url = new URL(target);
    const client = url.protocol === 'https:' ? https : http;
    const request = client.get(
      url,
      {
        headers: {
          Accept: 'text/html',
          Connection: 'close'
        },
        timeout: 10_000
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8')
          });
        });
      }
    );

    request.setTimeout(10_000, () => {
      request.destroy(new Error(`Timed out fetching ${target}`));
    });
    request.on('error', reject);
  });

async function run() {
  for (const check of checks) {
    const url = new URL(check.path, baseUrl).toString();

    try {
      const response = await requestHtml(url);
      const body = response.body;

      if (response.status < 200 || response.status >= 300) {
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

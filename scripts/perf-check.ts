const baseUrl = process.env.PERF_BASE_URL ?? 'http://127.0.0.1:3000';
const routes = [
  '/',
  '/it/palermo',
  '/it/palermo/classes',
  '/it/palermo/classes?view=map',
  '/it/palermo/studios',
  '/it/palermo/studios/yoga-city',
  '/it/palermo/teachers/valentina-lorito'
];

const run = async () => {
  const results = [] as Array<{
    route: string;
    status: number;
    ttfbMs: number;
    bytes: number;
    cacheControl: string | null;
  }>;

  for (const route of routes) {
    const url = `${baseUrl}${route}`;
    const startedAt = performance.now();
    const response = await fetch(url, {
      headers: {
        accept: 'text/html'
      }
    });
    const ttfbMs = performance.now() - startedAt;
    const body = await response.text();
    results.push({
      route,
      status: response.status,
      ttfbMs: Math.round(ttfbMs * 10) / 10,
      bytes: Buffer.byteLength(body),
      cacheControl: response.headers.get('cache-control')
    });
  }

  console.log(JSON.stringify({ baseUrl, checkedAt: new Date().toISOString(), results }, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

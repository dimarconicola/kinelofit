import { getCatalogSnapshot } from '@/lib/catalog/repository';

(async () => {
  const snapshot = await getCatalogSnapshot();

  console.log(
    JSON.stringify({
      sourceMode: snapshot.sourceMode,
      cities: snapshot.cities.length,
      sessions: snapshot.sessions.length
    })
  );
})();

import { getLatestFreshnessSnapshot, getSourceRegistrySnapshot } from '@/lib/freshness/service';

const citySlug = (process.argv[2] ?? 'palermo').toLowerCase();

async function main() {
  const [registry, latest] = await Promise.all([
    getSourceRegistrySnapshot(citySlug),
    getLatestFreshnessSnapshot(citySlug)
  ]);

  console.log(JSON.stringify({
    citySlug,
    sourceMode: registry.mode,
    totalSources: registry.totalSources,
    dueNow: registry.dueNow,
    overdueByCadence: registry.overdueByCadence,
    latestRun: latest
      ? {
          cadence: latest.cadence,
          createdAt: latest.createdAt,
          totalSources: latest.totalSources,
          changedSources: latest.changedSources,
          unreachableSources: latest.unreachableSources,
          adapterSourcesChecked: latest.adapterSourcesChecked,
          autoReverified: latest.autoReverified
        }
      : null
  }, null, 2));
}

void main();

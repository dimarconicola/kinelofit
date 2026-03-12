import { runDailyFreshnessCheck } from '../lib/freshness/service';

const args = process.argv.slice(2);
const citySlug = args.find((arg) => !arg.startsWith('--')) ?? 'palermo';
const dryRun = args.includes('--dry-run');
const cadenceArg = args.find((arg) => arg.startsWith('--cadence='))?.split('=')[1];
const maxSourcesArg = args.find((arg) => arg.startsWith('--max-sources='))?.split('=')[1];
const cadence = cadenceArg === 'daily' || cadenceArg === 'weekly' || cadenceArg === 'quarterly' ? cadenceArg : undefined;
const maxSources = maxSourcesArg ? Number.parseInt(maxSourcesArg, 10) : undefined;

const run = async () => {
  const report = await runDailyFreshnessCheck({
    citySlug,
    dryRun,
    cadence,
    maxSources: Number.isFinite(maxSources) && (maxSources as number) > 0 ? maxSources : undefined
  });

  console.log(JSON.stringify(report, null, 2));
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

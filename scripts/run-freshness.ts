import { runDailyFreshnessCheck } from '../lib/freshness/service';

const citySlug = process.argv[2] ?? 'palermo';
const dryRun = process.argv.includes('--dry-run');

const run = async () => {
  const report = await runDailyFreshnessCheck({
    citySlug,
    dryRun
  });

  console.log(JSON.stringify(report, null, 2));
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

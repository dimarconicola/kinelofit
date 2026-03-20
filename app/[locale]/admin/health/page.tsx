import { HealthCheckList } from '@/components/admin/HealthCheckList';
import { getRuntimeHealth } from '@/lib/ops/health';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function AdminHealthPage({ params }: { params: Promise<{ locale: string }> }) {
  resolveLocale((await params).locale);
  const health = await getRuntimeHealth('palermo');

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">Runtime health</p>
        <h1>Release baseline</h1>
        <p className="muted">
          Questo pannello deve restare verde prima di aprire nuove città o alzare il livello di automazione.
        </p>
      </section>
      <section className="saved-grid">
        <div className="panel">
          <p className="eyebrow">Checks</p>
          <HealthCheckList checks={health.checks} />
        </div>
        <div className="panel">
          <p className="eyebrow">Stato globale</p>
          <p className="lead">
            {health.hasFailures ? 'Failing checks presenti.' : health.hasWarnings ? 'Baseline utilizzabile, ma con warning aperti.' : 'Baseline operativa pulita.'}
          </p>
        </div>
      </section>
    </div>
  );
}

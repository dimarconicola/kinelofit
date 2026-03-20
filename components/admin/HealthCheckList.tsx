import type { HealthCheck } from '@/lib/ops/health';

const statusLabel: Record<HealthCheck['status'], string> = {
  ok: 'OK',
  warn: 'Warn',
  fail: 'Fail'
};

export function HealthCheckList({ checks }: { checks: HealthCheck[] }) {
  return (
    <div className="stack-list">
      {checks.map((check) => (
        <article className="metric-card" key={check.label}>
          <div className="detail-header">
            <strong>{check.label}</strong>
            <span className={`meta-pill meta-pill-${check.status}`}>{statusLabel[check.status]}</span>
          </div>
          <p className="muted">{check.detail}</p>
        </article>
      ))}
    </div>
  );
}

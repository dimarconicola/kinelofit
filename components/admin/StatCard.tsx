export function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <article className="panel stat-card">
      <p className="eyebrow">{label}</p>
      <h3>{value}</h3>
      {detail ? <p className="muted">{detail}</p> : null}
    </article>
  );
}

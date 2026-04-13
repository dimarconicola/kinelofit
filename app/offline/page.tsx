import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="site-shell site-main offline-page-shell">
      <section className="panel offline-page-card">
        <p className="eyebrow">Offline</p>
        <h1>Sei offline</h1>
        <p className="lead">
          kinelo.fit riesce a riaprire alcune pagine già visitate, ma per agenda personale, accesso e dati freschi serve di nuovo la rete.
        </p>
        <div className="site-actions">
          <Link href="/it" className="button button-primary">Apri home</Link>
          <Link href="/it/palermo" className="button button-ghost">Palermo hub</Link>
          <Link href="/it/palermo/classes" className="button button-ghost">Lezioni</Link>
        </div>
      </section>
    </main>
  );
}

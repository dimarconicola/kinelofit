'use client';

import { useEffect } from 'react';

import { logger } from '@/lib/observability/logger';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(`Next.js Error Page: ${error.message}`, error, {
      digest: error.digest
    });
  }, [error]);

  return (
    <main className="site-shell site-main error-shell">
      <section className="panel error-panel">
        <p className="eyebrow">Errore pagina</p>
        <h1>Qualcosa si è interrotto.</h1>
        <p className="lead">La pagina non è stata renderizzata correttamente. Riprova o torna alla home Palermo.</p>
        {process.env.NODE_ENV === 'development' ? (
          <details className="error-details">
            <summary>Dettagli tecnici</summary>
            <pre>{error.stack ?? error.message}</pre>
          </details>
        ) : null}
        <div className="error-actions">
          <button type="button" className="button button-primary" onClick={() => reset()}>
            Riprova
          </button>
          <button type="button" className="button button-ghost" onClick={() => (window.location.href = '/it/palermo')}>
            Torna a Palermo
          </button>
        </div>
      </section>
    </main>
  );
}

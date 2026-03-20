import { readFile } from 'node:fs/promises';

import { importOptionalHeaders, importRequiredHeaders } from '@/lib/catalog/import-validator';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function AdminImportsPage({ params }: { params: Promise<{ locale: string }> }) {
  resolveLocale((await params).locale);
  const sampleCsv = await readFile('data/imports/palermo_seed.csv', 'utf8');

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">Import spec</p>
        <h1>CSV-first ingestion</h1>
        <p className="lead">The app starts from manual curation. Every imported row carries source and freshness metadata.</p>
      </section>
      <section className="detail-hero">
        <form className="panel form-stack" action="/api/import/validate" method="post">
          <label>
            CSV content
            <textarea name="csv" rows={16} defaultValue={sampleCsv} />
          </label>
          <button className="button button-primary" type="submit">Validate import</button>
        </form>
        <div className="panel">
          <p className="eyebrow">Expected fields</p>
          <p className="lead">Il validator controlla scope, URL, coordinate, ISO datetime, pricing coverage e attendance model.</p>
          <p className="muted">Required: {importRequiredHeaders.join(', ')}</p>
          <p className="muted">Optional but recommended: {importOptionalHeaders.join(', ')}</p>
          <p className="muted">Policy: docs/catalog-policy.md</p>
        </div>
      </section>
    </div>
  );
}

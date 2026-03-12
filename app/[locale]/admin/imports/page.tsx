import { readFile } from 'node:fs/promises';

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
          <p className="lead">city, venue, location, category, style, time range, level, language, format, booking target, source URL, freshness timestamp, verification state.</p>
        </div>
      </section>
    </div>
  );
}

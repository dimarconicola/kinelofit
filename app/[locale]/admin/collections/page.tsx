import Link from 'next/link';

import { getCollections } from '@/lib/catalog/server-data';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function AdminCollectionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const collections = await getCollections('palermo');

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">Editorial layer</p>
        <h1>Collections for utility and curation</h1>
      </section>
      <div className="card-grid">
        {collections.map((collection) => (
          <Link key={collection.slug} href={`/${locale}/palermo/collections/${collection.slug}`} className="collection-card">
            <strong>{collection.title.en}</strong>
            <span className="muted">{collection.kind}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

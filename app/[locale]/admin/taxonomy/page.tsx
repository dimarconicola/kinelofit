import { getCategories, getStyles } from '@/lib/catalog/server-data';
import { resolveLocale } from '@/lib/i18n/routing';

export default async function AdminTaxonomyPage({ params }: { params: Promise<{ locale: string }> }) {
  resolveLocale((await params).locale);
  const [categories, styles] = await Promise.all([getCategories('palermo'), getStyles()]);

  return (
    <div className="stack-list">
      <section className="panel">
        <p className="eyebrow">Taxonomy</p>
        <h1>Public visibility stays controlled city by city</h1>
      </section>
      <section className="saved-grid">
        <div className="panel">
          <p className="eyebrow">Categories</p>
          <div className="stack-list">
            {categories.map((category) => (
              <div key={category.slug} className="metric-card">
                <strong>{category.name.en}</strong>
                <span className="muted">Visibility: {category.visibility}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">Styles</p>
          <div className="stack-list">
            {styles.map((style) => (
              <div key={style.slug} className="metric-card">
                <strong>{style.name.en}</strong>
                <span className="muted">Category: {style.categorySlug}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

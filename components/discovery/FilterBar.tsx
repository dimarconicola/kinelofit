import Link from 'next/link';

import type { DiscoveryFilters, Locale } from '@/lib/catalog/types';

interface FilterBarProps {
  locale: Locale;
  citySlug: string;
  filters: DiscoveryFilters;
  view: 'list' | 'map' | 'calendar';
  categories: Array<{ slug: string; name: string }>;
  neighborhoods: Array<{ slug: string; name: string }>;
  styles: Array<{ slug: string; name: string }>;
  resultCount: number;
  activeFilters: string[];
}

const copy = {
  en: {
    eyebrow: 'Refine the week',
    results: 'visible classes',
    summary: 'Tune day, style, neighborhood, and language to find the right class faster.',
    reset: 'Reset',
    apply: 'Apply filters',
    noFilters: 'No filters applied yet. Start with a day, style, or neighborhood.',
    activeFilters: 'Active filters',
    quickPicks: 'Quick picks',
    today: 'Today',
    weekend: 'Weekend',
    english: 'English-friendly',
    nextWeek: 'Next 7 days',
    date: 'Date',
    time: 'Time',
    category: 'Category',
    style: 'Style',
    neighborhood: 'Neighborhood',
    language: 'Language',
    level: 'Level',
    format: 'Format',
    any: 'Any',
    inPerson: 'In person',
    openNow: 'Open now'
  },
  it: {
    eyebrow: 'Affina la settimana',
    results: 'classi visibili',
    summary: 'Scegli giorno, stile, quartiere e lingua per trovare la classe giusta piu in fretta.',
    reset: 'Azzera',
    apply: 'Applica filtri',
    noFilters: 'Nessun filtro attivo. Parti da giorno, stile o quartiere.',
    activeFilters: 'Filtri attivi',
    quickPicks: 'Scorciatoie',
    today: 'Oggi',
    weekend: 'Weekend',
    english: 'In inglese',
    nextWeek: 'Prossimi 7 giorni',
    date: 'Data',
    time: 'Orario',
    category: 'Categoria',
    style: 'Stile',
    neighborhood: 'Quartiere',
    language: 'Lingua',
    level: 'Livello',
    format: 'Formato',
    any: 'Qualsiasi',
    inPerson: 'In presenza',
    openNow: 'Aperto ora'
  }
} as const;

export function FilterBar({
  locale,
  citySlug,
  filters,
  view,
  categories,
  neighborhoods,
  styles,
  resultCount,
  activeFilters
}: FilterBarProps) {
  const labels = copy[locale];
  const basePath = `/${locale}/${citySlug}/classes`;

  return (
    <form className="panel filter-panel" action={basePath}>
      <input type="hidden" name="view" value={view} />
      <div className="filter-panel-head">
        <div>
          <p className="eyebrow">{labels.eyebrow}</p>
          <h2>
            {resultCount} {labels.results}
          </h2>
          <p className="muted">{labels.summary}</p>
        </div>
      </div>

      <div className="filter-meta-row">
        <div className="stack-list">
          <p className="eyebrow">{labels.activeFilters}</p>
          {activeFilters.length > 0 ? (
            <div className="active-filter-strip">
              {activeFilters.map((filter) => (
                <span key={filter} className="filter-chip">
                  {filter}
                </span>
              ))}
            </div>
          ) : (
            <p className="filter-empty">{labels.noFilters}</p>
          )}
        </div>

        <div className="stack-list">
          <p className="eyebrow">{labels.quickPicks}</p>
          <div className="quick-filter-row">
            <Link href={`${basePath}?view=${view}&date=today`} className="quick-filter-link">
              {labels.today}
            </Link>
            <Link href={`${basePath}?view=${view}&date=weekend`} className="quick-filter-link">
              {labels.weekend}
            </Link>
            <Link href={`${basePath}?view=${view}&date=week`} className="quick-filter-link">
              {labels.nextWeek}
            </Link>
            <Link href={`${basePath}?view=${view}&language=English`} className="quick-filter-link">
              {labels.english}
            </Link>
          </div>
        </div>
      </div>

      <div className="filter-grid filter-grid-expanded">
        <label>
          {labels.date}
          <select name="date" defaultValue={filters.date ?? ''}>
            <option value="">{labels.any}</option>
            <option value="today">{labels.today}</option>
            <option value="tomorrow">{locale === 'it' ? 'Domani' : 'Tomorrow'}</option>
            <option value="weekend">{labels.weekend}</option>
            <option value="week">{labels.nextWeek}</option>
          </select>
        </label>
        <label>
          {labels.time}
          <select name="time_bucket" defaultValue={filters.time_bucket ?? ''}>
            <option value="">{labels.any}</option>
            <option value="early">{locale === 'it' ? 'Presto' : 'Early'}</option>
            <option value="morning">{locale === 'it' ? 'Mattina' : 'Morning'}</option>
            <option value="midday">{locale === 'it' ? 'Meta giornata' : 'Midday'}</option>
            <option value="evening">{locale === 'it' ? 'Sera' : 'Evening'}</option>
          </select>
        </label>
        <label>
          {labels.category}
          <select name="category" defaultValue={filters.category ?? ''}>
            <option value="">{labels.any}</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {labels.style}
          <select name="style" defaultValue={filters.style ?? ''}>
            <option value="">{labels.any}</option>
            {styles.map((style) => (
              <option key={style.slug} value={style.slug}>
                {style.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {labels.neighborhood}
          <select name="neighborhood" defaultValue={filters.neighborhood ?? ''}>
            <option value="">{labels.any}</option>
            {neighborhoods.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {labels.language}
          <select name="language" defaultValue={filters.language ?? ''}>
            <option value="">{labels.any}</option>
            <option value="Italian">Italian</option>
            <option value="English">English</option>
          </select>
        </label>
        <label>
          {labels.level}
          <select name="level" defaultValue={filters.level ?? ''}>
            <option value="">{labels.any}</option>
            <option value="beginner">{locale === 'it' ? 'Principianti' : 'Beginner'}</option>
            <option value="open">{locale === 'it' ? 'Aperti a tutti' : 'Open'}</option>
            <option value="intermediate">{locale === 'it' ? 'Intermedio' : 'Intermediate'}</option>
            <option value="advanced">{locale === 'it' ? 'Avanzato' : 'Advanced'}</option>
          </select>
        </label>
        <label>
          {labels.format}
          <select name="format" defaultValue={filters.format ?? ''}>
            <option value="">{labels.any}</option>
            <option value="in_person">{labels.inPerson}</option>
            <option value="hybrid">Hybrid</option>
            <option value="online">Online</option>
          </select>
        </label>
        <label className="filter-checkbox">
          <input type="checkbox" name="open_now" value="true" defaultChecked={filters.open_now === 'true'} />
          <span>{labels.openNow}</span>
        </label>
      </div>

      <div className="filter-panel-actions filter-panel-actions-bottom">
        <Link href={`${basePath}?view=${view}`} className="button button-ghost">
          {labels.reset}
        </Link>
        <button type="submit" className="button button-primary">
          {labels.apply}
        </button>
      </div>
    </form>
  );
}

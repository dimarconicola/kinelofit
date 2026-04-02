'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { DiscoveryFilters, Locale } from '@/lib/catalog/types';

const FilterBarControls = dynamic(() => import('@/components/discovery/FilterBarControls').then((module) => module.FilterBarControls));

interface FilterBarProps {
  locale: Locale;
  citySlug: string;
  filters: DiscoveryFilters;
  categories: Array<{ slug: string; name: string }>;
  neighborhoods: Array<{ slug: string; name: string }>;
  styles: Array<{ slug: string; name: string }>;
  activeFilters: string[];
  onUpdateFilters?: (filters: DiscoveryFilters) => void;
  onResetFilters?: () => void;
}

const copy = {
  en: {
    title: 'Filters',
    subtitle: 'Refine by date, time, neighborhood, and class profile.',
    show: 'Show filters',
    hide: 'Hide filters',
    apply: 'Apply',
    reset: 'Reset',
    date: 'Day',
    time: 'Time',
    category: 'Category',
    style: 'Style',
    neighborhood: 'Neighborhood',
    language: 'Language',
    level: 'Level',
    format: 'Format',
    availability: 'Availability',
    any: 'Any',
    today: 'Today',
    tomorrow: 'Tomorrow',
    weekend: 'Weekend',
    nextWeek: 'Next 7 days',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
    early: 'Early',
    morning: 'Morning',
    midday: 'Midday',
    evening: 'Evening',
    inPerson: 'In person',
    openNow: 'Open now',
    dropIn: 'Drop-in only'
  },
  it: {
    title: 'Filtri',
    subtitle: 'Affina per data, fascia oraria, quartiere e tipo di classe.',
    show: 'Mostra filtri',
    hide: 'Nascondi filtri',
    apply: 'Applica',
    reset: 'Azzera',
    date: 'Giorno',
    time: 'Orario',
    category: 'Categoria',
    style: 'Stile',
    neighborhood: 'Quartiere',
    language: 'Lingua',
    level: 'Livello',
    format: 'Formato',
    availability: 'Disponibilità',
    any: 'Qualsiasi',
    today: 'Oggi',
    tomorrow: 'Domani',
    weekend: 'Weekend',
    nextWeek: 'Prossimi 7 giorni',
    mon: 'Lunedi',
    tue: 'Martedi',
    wed: 'Mercoledi',
    thu: 'Giovedi',
    fri: 'Venerdi',
    sat: 'Sabato',
    sun: 'Domenica',
    early: 'Presto',
    morning: 'Mattina',
    midday: 'Metà giornata',
    evening: 'Sera',
    inPerson: 'In presenza',
    openNow: 'Aperto ora',
    dropIn: 'Solo drop-in'
  }
} as const;

export function FilterBar({
  locale,
  citySlug,
  filters,
  categories,
  neighborhoods,
  styles,
  activeFilters,
  onUpdateFilters,
  onResetFilters
}: FilterBarProps) {
  const labels = copy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  const [dayFilter, setDayFilter] = useState<string>(filters.weekday ?? filters.date ?? '');
  const [timeBuckets, setTimeBuckets] = useState<Set<string>>(
    new Set(filters.time_buckets?.length ? filters.time_buckets : filters.time_bucket ? [filters.time_bucket] : [])
  );
  const [category, setCategory] = useState<string>(filters.category ?? '');
  const [style, setStyle] = useState<string>(filters.style ?? '');
  const [level, setLevel] = useState<string>(filters.level ?? '');
  const [language, setLanguage] = useState<string>(filters.language ?? '');
  const [neighborhood, setNeighborhood] = useState<string>(filters.neighborhood ?? '');
  const [format, setFormat] = useState<string>(filters.format ?? '');
  const [availability, setAvailability] = useState<Set<string>>(
    new Set(
      [filters.open_now === 'true' ? 'open_now' : null, filters.drop_in === 'true' ? 'drop_in' : null].filter(
        (item): item is string => Boolean(item)
      )
    )
  );

  useEffect(() => {
    setDayFilter(filters.weekday ?? filters.date ?? '');
    setTimeBuckets(new Set(filters.time_buckets?.length ? filters.time_buckets : filters.time_bucket ? [filters.time_bucket] : []));
    setCategory(filters.category ?? '');
    setStyle(filters.style ?? '');
    setLevel(filters.level ?? '');
    setLanguage(filters.language ?? '');
    setNeighborhood(filters.neighborhood ?? '');
    setFormat(filters.format ?? '');
    setAvailability(
      new Set(
        [filters.open_now === 'true' ? 'open_now' : null, filters.drop_in === 'true' ? 'drop_in' : null].filter(
          (item): item is string => Boolean(item)
        )
      )
    );
  }, [filters]);

  const activePreview = useMemo(() => {
    const labelsSet: string[] = [];
    if (dayFilter) labelsSet.push(dayFilter);
    timeBuckets.forEach((item) => labelsSet.push(item));
    if (category) labelsSet.push(category);
    if (style) labelsSet.push(style);
    if (level) labelsSet.push(level);
    if (language) labelsSet.push(language);
    if (neighborhood) labelsSet.push(neighborhood);
    if (format) labelsSet.push(format);
    availability.forEach((item) => labelsSet.push(item));
    return labelsSet;
  }, [availability, category, dayFilter, format, language, level, neighborhood, style, timeBuckets]);

  const applyFilters = () => {
    const nextFilters: DiscoveryFilters = {
      date: dayFilter && !['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(dayFilter) ? (dayFilter as DiscoveryFilters['date']) : undefined,
      weekday: dayFilter && ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(dayFilter) ? (dayFilter as DiscoveryFilters['weekday']) : undefined,
      time_bucket: timeBuckets.size > 0 ? (Array.from(timeBuckets)[0] as DiscoveryFilters['time_bucket']) : undefined,
      time_buckets: timeBuckets.size > 0 ? (Array.from(timeBuckets) as NonNullable<DiscoveryFilters['time_buckets']>) : undefined,
      category: category || undefined,
      style: style || undefined,
      level: (level as DiscoveryFilters['level']) || undefined,
      language: language || undefined,
      neighborhood: neighborhood || undefined,
      format: (format as DiscoveryFilters['format']) || undefined,
      open_now: availability.has('open_now') ? 'true' : undefined,
      drop_in: availability.has('drop_in') ? 'true' : undefined
    };

    if (onUpdateFilters) {
      onUpdateFilters(nextFilters);
      return;
    }

    const source = typeof window === 'undefined' ? searchParams.toString() : window.location.search;
    const next = new URLSearchParams(source);
    const setOrDelete = (key: string, value: string | undefined) => {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    };

    const isWeekday = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(dayFilter);
    setOrDelete('date', dayFilter && !isWeekday ? dayFilter : undefined);
    setOrDelete('weekday', dayFilter && isWeekday ? dayFilter : undefined);
    setOrDelete('time_bucket', timeBuckets.size > 0 ? Array.from(timeBuckets).join(',') : undefined);
    setOrDelete('category', category || undefined);
    setOrDelete('style', style || undefined);
    setOrDelete('level', level || undefined);
    setOrDelete('language', language || undefined);
    setOrDelete('neighborhood', neighborhood || undefined);
    setOrDelete('format', format || undefined);
    setOrDelete('open_now', availability.has('open_now') ? 'true' : undefined);
    setOrDelete('drop_in', availability.has('drop_in') ? 'true' : undefined);
    next.delete('page');

    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const resetFilters = () => {
    if (onResetFilters) {
      onResetFilters();
      return;
    }

    const source = typeof window === 'undefined' ? searchParams.toString() : window.location.search;
    const next = new URLSearchParams(source);
    ['date', 'weekday', 'time_bucket', 'category', 'style', 'level', 'language', 'neighborhood', 'format', 'open_now', 'drop_in', 'page'].forEach((key) =>
      next.delete(key)
    );

    setDayFilter('');
    setTimeBuckets(new Set());
    setCategory('');
    setStyle('');
    setLevel('');
    setLanguage('');
    setNeighborhood('');
    setFormat('');
    setAvailability(new Set());

    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <section className="panel filter-panel filter-panel-compact" data-city={citySlug}>
      <div className="filter-panel-head">
        <div>
          <p className="eyebrow">{labels.title}</p>
          <p className="muted">{labels.subtitle}</p>
        </div>
        <div className="filter-panel-head-actions">
          {activeFilters.length > 0 ? (
            <button type="button" className="button button-ghost" onClick={resetFilters}>
              {labels.reset}
            </button>
          ) : null}
          <button type="button" className="button button-ghost" onClick={() => setExpanded((value) => !value)}>
            {expanded ? labels.hide : labels.show}
          </button>
        </div>
      </div>

      {activeFilters.length > 0 ? (
        <div className="active-filter-strip">
          {activeFilters.map((filter) => (
            <span key={filter} className="filter-chip">
              {filter}
            </span>
          ))}
        </div>
      ) : null}

      {expanded ? (
        <FilterBarControls
          locale={locale}
          labels={labels}
          categories={categories}
          neighborhoods={neighborhoods}
          styles={styles}
          dayFilter={dayFilter}
          setDayFilter={setDayFilter}
          timeBuckets={timeBuckets}
          setTimeBuckets={setTimeBuckets}
          category={category}
          setCategory={setCategory}
          style={style}
          setStyle={setStyle}
          level={level}
          setLevel={setLevel}
          language={language}
          setLanguage={setLanguage}
          neighborhood={neighborhood}
          setNeighborhood={setNeighborhood}
          format={format}
          setFormat={setFormat}
          availability={availability}
          setAvailability={setAvailability}
          applyFilters={applyFilters}
          resetFilters={resetFilters}
        />
      ) : null}

      {activePreview.length === 0 ? null : (
        <p className="filter-preview-muted muted">
          {locale === 'it' ? 'Filtri selezionati pronti da applicare.' : 'Selected filters ready to apply.'}
        </p>
      )}
    </section>
  );
}

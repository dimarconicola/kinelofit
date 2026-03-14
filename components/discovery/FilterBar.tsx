'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Chip, Select, SelectItem, type Selection } from '@heroui/react';

import type { DiscoveryFilters, Locale, TimeBucket } from '@/lib/catalog/types';

interface FilterBarProps {
  locale: Locale;
  citySlug: string;
  filters: DiscoveryFilters;
  categories: Array<{ slug: string; name: string }>;
  neighborhoods: Array<{ slug: string; name: string }>;
  styles: Array<{ slug: string; name: string }>;
  activeFilters: string[];
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

const selectionToList = (selection: Selection): string[] => {
  if (selection === 'all') return [];
  return Array.from(selection).map((item) => String(item));
};

const listToSelection = (value: string | string[] | undefined): Set<string> => {
  if (!value) return new Set();
  if (Array.isArray(value)) return new Set(value);
  return new Set([value]);
};

const timeOptions: TimeBucket[] = ['early', 'morning', 'midday', 'evening'];

export function FilterBar({
  locale,
  citySlug,
  filters,
  categories,
  neighborhoods,
  styles,
  activeFilters
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
        <Button variant="ghost" radius="full" className="button button-ghost" onPress={() => setExpanded((value) => !value)}>
          {expanded ? labels.hide : labels.show}
        </Button>
      </div>

      {activeFilters.length > 0 ? (
        <div className="active-filter-strip">
          {activeFilters.map((filter) => (
            <Chip key={filter} size="sm" radius="full" variant="flat" className="filter-chip">
              {filter}
            </Chip>
          ))}
        </div>
      ) : null}

      {expanded ? (
        <>
          <div className="filter-grid filter-grid-expanded filter-grid-ui">
            <Select
              label={labels.date}
              aria-label={labels.date}
              selectedKeys={listToSelection(dayFilter)}
              onSelectionChange={(selection) => setDayFilter(selectionToList(selection)[0] ?? '')}
              className="filter-select"
            >
              <SelectItem key="today">{labels.today}</SelectItem>
              <SelectItem key="tomorrow">{labels.tomorrow}</SelectItem>
              <SelectItem key="weekend">{labels.weekend}</SelectItem>
              <SelectItem key="week">{labels.nextWeek}</SelectItem>
              <SelectItem key="mon">{labels.mon}</SelectItem>
              <SelectItem key="tue">{labels.tue}</SelectItem>
              <SelectItem key="wed">{labels.wed}</SelectItem>
              <SelectItem key="thu">{labels.thu}</SelectItem>
              <SelectItem key="fri">{labels.fri}</SelectItem>
              <SelectItem key="sat">{labels.sat}</SelectItem>
              <SelectItem key="sun">{labels.sun}</SelectItem>
            </Select>

            <Select
              label={labels.time}
              aria-label={labels.time}
              selectionMode="multiple"
              selectedKeys={timeBuckets}
              onSelectionChange={(selection) => setTimeBuckets(new Set(selectionToList(selection)))}
              className="filter-select"
            >
              {timeOptions.map((option) => (
                <SelectItem key={option}>{labels[option]}</SelectItem>
              ))}
            </Select>

            <Select
              label={labels.category}
              aria-label={labels.category}
              selectedKeys={listToSelection(category)}
              onSelectionChange={(selection) => setCategory(selectionToList(selection)[0] ?? '')}
              className="filter-select"
            >
              {categories.map((item) => (
                <SelectItem key={item.slug}>{item.name}</SelectItem>
              ))}
            </Select>

            <Select
              label={labels.style}
              aria-label={labels.style}
              selectedKeys={listToSelection(style)}
              onSelectionChange={(selection) => setStyle(selectionToList(selection)[0] ?? '')}
              className="filter-select"
            >
              {styles.map((item) => (
                <SelectItem key={item.slug}>{item.name}</SelectItem>
              ))}
            </Select>

            <Select
              label={labels.neighborhood}
              aria-label={labels.neighborhood}
              selectedKeys={listToSelection(neighborhood)}
              onSelectionChange={(selection) => setNeighborhood(selectionToList(selection)[0] ?? '')}
              className="filter-select"
            >
              {neighborhoods.map((item) => (
                <SelectItem key={item.slug}>{item.name}</SelectItem>
              ))}
            </Select>

            <Select
              label={labels.language}
              aria-label={labels.language}
              selectedKeys={listToSelection(language)}
              onSelectionChange={(selection) => setLanguage(selectionToList(selection)[0] ?? '')}
              className="filter-select"
            >
              <SelectItem key="Italian">Italian</SelectItem>
              <SelectItem key="English">English</SelectItem>
            </Select>

            <Select
              label={labels.level}
              aria-label={labels.level}
              selectedKeys={listToSelection(level)}
              onSelectionChange={(selection) => setLevel(selectionToList(selection)[0] ?? '')}
              className="filter-select"
            >
              <SelectItem key="beginner">{locale === 'it' ? 'Principianti' : 'Beginner'}</SelectItem>
              <SelectItem key="open">{locale === 'it' ? 'Aperti a tutti' : 'Open'}</SelectItem>
              <SelectItem key="intermediate">{locale === 'it' ? 'Intermedio' : 'Intermediate'}</SelectItem>
              <SelectItem key="advanced">{locale === 'it' ? 'Avanzato' : 'Advanced'}</SelectItem>
            </Select>

            <Select
              label={labels.format}
              aria-label={labels.format}
              selectedKeys={listToSelection(format)}
              onSelectionChange={(selection) => setFormat(selectionToList(selection)[0] ?? '')}
              className="filter-select"
            >
              <SelectItem key="in_person">{labels.inPerson}</SelectItem>
              <SelectItem key="hybrid">Hybrid</SelectItem>
              <SelectItem key="online">Online</SelectItem>
            </Select>

            <Select
              label={labels.availability}
              aria-label={labels.availability}
              selectionMode="multiple"
              selectedKeys={availability}
              onSelectionChange={(selection) => setAvailability(new Set(selectionToList(selection)))}
              className="filter-select"
            >
              <SelectItem key="open_now">{labels.openNow}</SelectItem>
              <SelectItem key="drop_in">{labels.dropIn}</SelectItem>
            </Select>
          </div>

          <div className="filter-panel-actions filter-panel-actions-bottom">
            <Button variant="ghost" radius="full" className="button button-ghost" onPress={resetFilters}>
              {labels.reset}
            </Button>
            <Button color="primary" radius="full" className="button button-primary" onPress={applyFilters}>
              {labels.apply}
            </Button>
          </div>
        </>
      ) : null}

      {activePreview.length === 0 ? null : (
        <p className="filter-preview-muted muted">
          {locale === 'it' ? 'Filtri selezionati pronti da applicare.' : 'Selected filters ready to apply.'}
        </p>
      )}
    </section>
  );
}

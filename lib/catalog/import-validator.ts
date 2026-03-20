import { isCategoryInScope, isSessionInScope, normalizeAttendanceModel } from '@/lib/catalog/policy';

const REQUIRED_HEADERS = [
  'city_slug',
  'venue_slug',
  'venue_name',
  'neighborhood_slug',
  'address',
  'lat',
  'lng',
  'category_slug',
  'style_slug',
  'title',
  'start_at',
  'end_at',
  'level',
  'language',
  'format',
  'booking_target_type',
  'booking_target_href',
  'source_url',
  'last_verified_at',
  'verification_status'
] as const;

const OPTIONAL_HEADERS = ['attendance_model', 'age_min', 'age_max', 'price_note_it', 'price_note_en'] as const;

export interface ImportIssue {
  row: number;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportValidationResult {
  ok: boolean;
  rows: number;
  headers: string[];
  missingHeaders: string[];
  warnings: ImportIssue[];
  errors: ImportIssue[];
}

const splitCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const isIsoDateTime = (value: string) => {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && value.includes('T');
};

const isFiniteCoordinate = (value: string, bounds: { min: number; max: number }) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= bounds.min && parsed <= bounds.max;
};

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export const validateImportCsv = (csv: string): ImportValidationResult => {
  const trimmed = csv.trim();
  if (!trimmed) {
    return {
      ok: false,
      rows: 0,
      headers: [],
      missingHeaders: [...REQUIRED_HEADERS],
      warnings: [],
      errors: [{ row: 0, message: 'CSV is empty.', severity: 'error' }]
    };
  }

  const [headerLine, ...rowLines] = trimmed.split(/\r?\n/);
  const headers = splitCsvLine(headerLine).map((header) => header.trim());
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];

  if (missingHeaders.length > 0) {
    errors.push({ row: 0, message: `Missing headers: ${missingHeaders.join(', ')}`, severity: 'error' });
  }

  if (rowLines.length === 0) {
    errors.push({ row: 0, message: 'CSV contains no rows.', severity: 'error' });
  }

  const rows = rowLines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const values = splitCsvLine(line);
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    });

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const attendanceModel = normalizeAttendanceModel(row.attendance_model);
    const title = row.title || row.style_slug || row.category_slug;

    if (!row.attendance_model) {
      warnings.push({
        row: rowNumber,
        field: 'attendance_model',
        message: 'Missing attendance_model. Import will default to drop_in.',
        severity: 'warning'
      });
    }

    if (!isCategoryInScope(row.category_slug)) {
      errors.push({
        row: rowNumber,
        field: 'category_slug',
        message: `Category ${row.category_slug} is out of kinelo.fit scope.`,
        severity: 'error'
      });
    }

    if (!isSessionInScope({
      categorySlug: row.category_slug,
      attendanceModel,
      title: { en: title, it: title }
    })) {
      errors.push({
        row: rowNumber,
        field: 'title',
        message: 'Session is out of scope for current catalog policy.',
        severity: 'error'
      });
    }

    if (!isFiniteCoordinate(row.lat, { min: -90, max: 90 })) {
      errors.push({ row: rowNumber, field: 'lat', message: 'Latitude must be a valid coordinate.', severity: 'error' });
    }

    if (!isFiniteCoordinate(row.lng, { min: -180, max: 180 })) {
      errors.push({ row: rowNumber, field: 'lng', message: 'Longitude must be a valid coordinate.', severity: 'error' });
    }

    if (!isHttpUrl(row.booking_target_href)) {
      errors.push({ row: rowNumber, field: 'booking_target_href', message: 'Booking target must be a valid URL.', severity: 'error' });
    }

    if (!isHttpUrl(row.source_url)) {
      errors.push({ row: rowNumber, field: 'source_url', message: 'Source URL must be a valid URL.', severity: 'error' });
    }

    if (!isIsoDateTime(row.start_at)) {
      errors.push({ row: rowNumber, field: 'start_at', message: 'start_at must be a full ISO datetime.', severity: 'error' });
    }

    if (!isIsoDateTime(row.end_at)) {
      errors.push({ row: rowNumber, field: 'end_at', message: 'end_at must be a full ISO datetime.', severity: 'error' });
    }

    if (!isIsoDateTime(row.last_verified_at)) {
      errors.push({ row: rowNumber, field: 'last_verified_at', message: 'last_verified_at must be a full ISO datetime.', severity: 'error' });
    }

    const ageMin = row.age_min ? Number(row.age_min) : undefined;
    const ageMax = row.age_max ? Number(row.age_max) : undefined;
    if (row.category_slug === 'kids-activities') {
      const hasAgeRange = Number.isFinite(ageMin) && Number.isFinite(ageMax);
      if (!hasAgeRange) {
        warnings.push({
          row: rowNumber,
          field: 'age_min',
          message: 'Kids activities should include age_min and age_max for 0-14 targeting.',
          severity: 'warning'
        });
      } else if ((ageMin as number) < 0 || (ageMax as number) > 14 || (ageMin as number) > (ageMax as number)) {
        errors.push({
          row: rowNumber,
          field: 'age_min',
          message: 'Kids activities must stay within the 0-14 age range.',
          severity: 'error'
        });
      }
    }

    if (!row.price_note_it && !row.price_note_en) {
      warnings.push({
        row: rowNumber,
        field: 'price_note_it',
        message: 'Pricing is missing. Palermo ops should capture at least a venue-level note.',
        severity: 'warning'
      });
    }
  });

  return {
    ok: errors.length === 0,
    rows: rows.length,
    headers: [...headers, ...OPTIONAL_HEADERS.filter((header) => headers.includes(header))],
    missingHeaders,
    warnings,
    errors
  };
};

export const importRequiredHeaders = [...REQUIRED_HEADERS];
export const importOptionalHeaders = [...OPTIONAL_HEADERS];

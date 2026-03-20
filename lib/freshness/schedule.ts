import { DateTime } from 'luxon';

import type { SourceCadence } from '@/lib/catalog/types';

export const getCadenceIntervalDays = (cadence: SourceCadence) => {
  if (cadence === 'daily') return 1;
  if (cadence === 'weekly') return 7;
  return 90;
};

export const computeNextCheckAt = (checkedAtIso: string, cadence: SourceCadence) =>
  DateTime.fromISO(checkedAtIso).plus({ days: getCadenceIntervalDays(cadence) }).toUTC().toISO();

export const isSourceDueAt = (nextCheckAtIso: string | undefined, referenceIso: string) => {
  if (!nextCheckAtIso) return true;
  return DateTime.fromISO(nextCheckAtIso) <= DateTime.fromISO(referenceIso);
};

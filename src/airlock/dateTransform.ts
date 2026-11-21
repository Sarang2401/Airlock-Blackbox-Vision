/**
 * Date Transformation with Single Shared Random Non-zero Day Offset.
 * 
 * Guarantees:
 * 1. Day intervals (length of stay, waiting periods, filing deadlines) are mathematically preserved.
 * 2. Absolute dates are shifted into private offsets.
 * 3. DateRefs are retained locally to rehydrate original dates after cloud reasoning.
 */
import { DateRef } from '../contracts/types';

/**
 * Generates a non-zero day offset between 35 and 180 days (positive or negative).
 */
export function generateRandomDayOffset(): number {
  const min = 35;
  const max = 180;
  const range = max - min;
  const absOffset = min + Math.floor(Math.random() * range);
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * absOffset;
}

export function parseToDate(dateStr: string): Date | null {
  // Try ISO
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    let year = parseInt(parts[3], 10);
    if (year < 100) year += 2000;
    d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export function shiftDate(originalIso: string, dayOffset: number): string {
  const d = parseToDate(originalIso);
  if (!d) return originalIso;

  const shifted = new Date(d.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  const yyyy = shifted.getFullYear();
  const mm = String(shifted.getMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function createDateRef(
  counter: number,
  originalDateStr: string,
  dayOffset: number
): DateRef {
  const parsed = parseToDate(originalDateStr);
  const originalIso = parsed
    ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
    : originalDateStr;
  const shiftedIso = shiftDate(originalIso, dayOffset);

  return {
    id: `DREF_${counter}`,
    originalIso,
    shiftedIso,
    dayOffset,
  };
}

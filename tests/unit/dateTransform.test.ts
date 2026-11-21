import { describe, it, expect } from 'vitest';
import { generateRandomDayOffset, shiftDate } from '../../src/airlock/dateTransform';

describe('Date Transformation & Interval Preservation', () => {
  it('generates a non-zero day offset within approved boundary', () => {
    for (let i = 0; i < 20; i++) {
      const offset = generateRandomDayOffset();
      expect(offset).not.toBe(0);
      expect(Math.abs(offset)).toBeGreaterThanOrEqual(35);
      expect(Math.abs(offset)).toBeLessThanOrEqual(180);
    }
  });

  it('preserves exact day intervals across admission and discharge dates', () => {
    const offset = generateRandomDayOffset();
    const admission = '2026-10-04';
    const discharge = '2026-10-08';

    const shiftedAdmission = shiftDate(admission, offset);
    const shiftedDischarge = shiftDate(discharge, offset);

    const originalIntervalMs = new Date(discharge).getTime() - new Date(admission).getTime();
    const shiftedIntervalMs = new Date(shiftedDischarge).getTime() - new Date(shiftedAdmission).getTime();

    expect(shiftedIntervalMs).toBe(originalIntervalMs);
    expect(shiftedIntervalMs / (24 * 60 * 60 * 1000)).toBe(4); // Exactly 4 days
  });
});

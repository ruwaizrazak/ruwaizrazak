import { describe, it, expect } from 'vitest';
import { formatDate } from '../../src/utils/formatDate';

// Dates are constructed in LOCAL time (new Date(y, m, d)) rather than from an
// ISO string — an ISO midnight renders as the previous day in any negative-offset
// timezone, which would make these tests pass in London and fail in New York.
describe('formatDate', () => {
  const march27 = new Date(2026, 2, 27);

  it('defaults to the long month name', () => {
    expect(formatDate(march27)).toBe('March 27, 2026');
  });

  it('abbreviates the month in short style', () => {
    expect(formatDate(march27, 'short')).toBe('Mar 27, 2026');
  });

  it('does not pad single-digit days', () => {
    expect(formatDate(new Date(2026, 0, 5), 'short')).toBe('Jan 5, 2026');
  });

  it('is stable across the year boundary', () => {
    expect(formatDate(new Date(2025, 11, 31))).toBe('December 31, 2025');
  });
});

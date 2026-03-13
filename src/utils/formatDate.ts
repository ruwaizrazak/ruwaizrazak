// Extracted from card components where date formatting was duplicated inline.

/**
 * Format a date for display.
 * @param date - The date to format
 * @param style - 'long' uses full month name, 'short' uses abbreviated month
 */
export function formatDate(date: Date, style: 'long' | 'short' = 'long'): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
  });
}

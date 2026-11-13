/**
 * Extract date-only portion (YYYY-MM-DD) from ISO datetime string.
 */
export function toDateOnly(dateStr: string): string {
  return dateStr.slice(0, 10);
}

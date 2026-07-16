/**
 * Local-calendar-day helpers. Using `Date.toISOString()` for "today" keys UTC day, not the
 * user's actual calendar day — anyone west of UTC can have an evening cook logged against
 * "tomorrow" while it's still today for them. Every daily-tracking feature should use these.
 */

export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** A stable integer per local calendar day, for day-of-year style rotation (e.g. the daily quest). */
export function localDayNumber(date: Date = new Date()): number {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(local.getTime() / 86_400_000);
}

/**
 * Shared query contract for the public brief endpoints.
 *
 * The backend selects a single day's stored data for weather, climate, and the
 * weather observations/research. Callers either pass an explicit `YYYY-MM-DD`
 * date or ask for `latest=true` to fall back to the most recent stored data.
 */

/** `YYYY-MM-DD`, matching the backend's date parameter. */
export interface BriefQuery {
  date?: string;
  latest?: boolean;
}

/**
 * Builds the query string parameters for a brief request. `latest` wins over
 * `date` so a stale date can never be sent alongside the latest request.
 */
export function toBriefQueryParams(query: BriefQuery): Record<string, string> {
  if (query.latest) {
    return { latest: "true" };
  }

  return query.date ? { date: query.date } : {};
}

/**
 * Today as `YYYY-MM-DD` in the browser's local timezone.
 *
 * The brief date is a calendar day, so it is built from local date parts
 * instead of `toISOString()`, which would shift the day in western timezones.
 */
export function getTodayApiDate(reference: Date = new Date()): string {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, "0");
  const day = String(reference.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

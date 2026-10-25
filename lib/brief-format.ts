/**
 * Shared formatting for the AI-generated daily briefs.
 *
 * Brief text comes from a model, so it is treated as untrusted display text.
 * These helpers only normalize presentation; they never produce markup.
 */

/**
 * Model output sometimes arrives wrapped in stray quote characters. Strip a
 * single matching outer pair for display.
 */
export function cleanBriefText(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2) return trimmed;

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  const pairs = ['""', "''", "“”", "‘’"];

  if (pairs.includes(first + last)) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

/**
 * Formats a `YYYY-MM-DD` date as a calendar date. The date is treated as UTC
 * so a date-only value never shifts to the previous day in western timezones.
 */
export function formatBriefDate(value: string | undefined): string | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  );

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Formats a stored timestamp in UTC so it stays consistent with the brief's
 * date-only fields.
 */
export function formatBriefUpdatedAt(
  value: string | undefined
): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

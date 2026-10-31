/**
 * Formatting helpers shared by the asset detail pages.
 *
 * Every helper returns an em dash for missing or invalid values so callers can
 * render a value without repeating null checks. Currency codes come from
 * external providers and are not guaranteed to be valid ISO codes, so currency
 * formatting falls back to a plain number with the code as a prefix.
 */

const MISSING_VALUE = "—";

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  // Provider timestamps are UTC dates; formatting in UTC avoids an off-by-one
  // day for users west of Greenwich.
  timeZone: "UTC",
});

/**
 * Currency formatters are expensive to construct, so they are created once per
 * currency and notation. `null` marks a currency code Intl rejected.
 */
const currencyFormatters = new Map<string, Intl.NumberFormat | null>();

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getCurrencyFormatter(
  currency: string,
  compact: boolean
): Intl.NumberFormat | null {
  const key = `${currency}:${compact ? "compact" : "full"}`;
  const cached = currencyFormatters.get(key);

  if (cached !== undefined) {
    return cached;
  }

  let formatter: Intl.NumberFormat | null = null;

  try {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: 2,
    });
  } catch {
    formatter = null;
  }

  currencyFormatters.set(key, formatter);

  return formatter;
}

/** `1234567` → `1.23M`. Used for volumes and other unitless counts. */
export function formatCompactNumber(
  value: number | null | undefined
): string {
  return isFiniteNumber(value)
    ? compactNumberFormatter.format(value)
    : MISSING_VALUE;
}

/** Alias for formatCompactNumber for backward compatibility. */
export const formatCompact = formatCompactNumber;

/**
 * Formats an amount in its own currency, e.g. `$344.61` or, with
 * `compact: true`, `$5.01T`. Invalid currency codes fall back to
 * `USX 123.45`.
 */
export function formatMoney(
  value: number | null | undefined,
  currency: string | null | undefined,
  options: { compact?: boolean } = {}
): string {
  if (!isFiniteNumber(value)) {
    return MISSING_VALUE;
  }

  const code = currency?.trim() || "USD";
  const compact = options.compact ?? false;
  const formatter = getCurrencyFormatter(code, compact);

  if (formatter) {
    return formatter.format(value);
  }

  const amount = compact
    ? formatCompactNumber(value)
    : value.toLocaleString("en-US", { maximumFractionDigits: 2 });

  return `${code} ${amount}`;
}

/** Formats an absolute change with an explicit sign, e.g. `+$1.20`, `-$2.07`. */
export function formatSignedMoney(
  value: number | null | undefined,
  currency: string | null | undefined
): string {
  if (!isFiniteNumber(value)) {
    return MISSING_VALUE;
  }

  return `${value < 0 ? "-" : "+"}${formatMoney(Math.abs(value), currency)}`;
}

/** `-0.5985` → `-0.60%` (the value is already a percentage). */
export function formatPercent(
  value: number | null | undefined,
  fractionDigits = 2
): string {
  return isFiniteNumber(value)
    ? `${value.toFixed(fractionDigits)}%`
    : MISSING_VALUE;
}

/** `-0.5985` → `-0.60%`, `2.1` → `+2.10%`. */
export function formatSignedPercent(
  value: number | null | undefined,
  fractionDigits = 2
): string {
  if (!isFiniteNumber(value)) {
    return MISSING_VALUE;
  }

  return `${value >= 0 ? "+" : ""}${formatPercent(value, fractionDigits)}`;
}

/** `$344.13 – $349.19`, or an em dash when either bound is missing. */
export function formatRange(
  low: number | null | undefined,
  high: number | null | undefined,
  currency: string | null | undefined
): string {
  if (!isFiniteNumber(low) || !isFiniteNumber(high)) {
    return MISSING_VALUE;
  }

  return `${formatMoney(low, currency)} – ${formatMoney(high, currency)}`;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** `US` → `United States`; unknown codes are returned unchanged. */
export function formatCountry(
  code: string | null | undefined
): string {
  if (!code) {
    return MISSING_VALUE;
  }

  try {
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** Formats an ISO date (or timestamp) as `Oct 30, 2026` in UTC. */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return MISSING_VALUE;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return MISSING_VALUE;
  }

  return dateFormatter.format(date);
}

/** Exposed so components can decide whether to render a timestamp at all. */
export function hasValue<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== "";
}
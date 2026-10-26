import type { WeatherResearchDetails } from "@/types";
import { weatherResearchDetailsSchema } from "@/types/zodSchemas";

/**
 * Presentation helpers for stored Weather observations and the research
 * generated from them.
 *
 * Research is model output, so parsing is defensive: malformed JSON resolves to
 * `null` and the caller falls back to the raw stored text.
 */

export const RESEARCH_STATUS_LABELS: Record<string, string> = {
  supported: "Supported",
  partially_supported: "Partially supported",
  unconfirmed: "Unconfirmed",
};

/** Turns an enum-like token (`partially_supported`) into a label. */
export function formatResearchToken(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getResearchStatusClass(status: string): string {
  switch (status) {
    case "supported":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "partially_supported":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "unconfirmed":
      return "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

export function parseResearchDetails(
  raw: string
): WeatherResearchDetails | null {
  try {
    const parsed = weatherResearchDetailsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/**
 * Source entries are either publication names or full URLs. For URLs, show the
 * host so the evidence label stays compact while the link keeps the full path.
 */
export function formatSourceLabel(value: string): string {
  const trimmed = value.trim();

  if (!isHttpUrl(trimmed)) return trimmed;

  try {
    return new URL(trimmed).hostname.replace(/^www\./i, "");
  } catch {
    return trimmed;
  }
}

/** Newest rows first, breaking ties on the storage timestamp. */
export function sortByMostRecent<T extends { date: string; created_at?: string }>(
  rows: readonly T[]
): T[] {
  return [...rows].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
}

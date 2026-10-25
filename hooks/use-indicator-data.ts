"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchIndicatorData, type FetchIndicatorDataParams } from "@/lib/indicator-api";
import type { IndicatorDataItem } from "@/types";

interface UseIndicatorDataOptions extends FetchIndicatorDataParams {
  enabled?: boolean;
}

export function useIndicatorData(options: UseIndicatorDataOptions) {
  const { indicators, from, to, historyLimit, enabled = true } = options;

  return useQuery({
    queryKey: ["indicators", { indicators, from, to, historyLimit }],
    queryFn: () => fetchIndicatorData({ indicators, from, to, historyLimit }),
    enabled: enabled && indicators.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

export function useIndicatorDataItem(indicators: string[], index: number) {
  const { data, isLoading, error, refetch } = useIndicatorData({
    indicators,
    enabled: indicators.length > 0,
  });

  const item = data?.indicators[index];

  return {
    item,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Extract the current numeric value from an indicator's current data
 */
export function getCurrentValue(item: IndicatorDataItem | undefined): number | null {
  const current = item?.current;
  if (!current) return null;

  const numericKeys = Object.keys(current).filter(
    (key) => key !== "date" && key !== "series_id" && typeof current[key] === "number"
  );

  if (numericKeys.length === 0) return null;

  return (current[numericKeys[0]] as number) ?? null;
}

/**
 * Get the date of the current observation
 */
export function getCurrentDate(item: IndicatorDataItem | undefined): string | null {
  if (!item?.current) return null;

  const value = item.current.observed_at ?? item.current.date;
  return typeof value === "string" ? value : null;
}

function getNumericKeys(row: Record<string, unknown> | null | undefined): string[] {
  if (!row) return [];

  return Object.keys(row).filter((key) => {
    if (key === "date" || key === "series_id") return false;
    const value = row[key];
    return typeof value === "number" && Number.isFinite(value);
  });
}

/**
 * Resolves which historical column matches the series shown on the card.
 * Current rows often name the column `current_value`, while history stores it
 * as `value` (same for `current_bullish` -> `bullish`).
 */
export function getHistoricalSeriesKey(
  item: IndicatorDataItem | undefined
): string | null {
  if (!item?.historical?.length) return null;

  const historicalKeys = getNumericKeys(item.historical[0]);
  if (historicalKeys.length === 0) return null;

  const currentKey = getNumericKeys(item.current)[0];
  if (currentKey) {
    const strippedKey = currentKey.replace(/^current_/, "");
    if (historicalKeys.includes(strippedKey)) return strippedKey;
    if (historicalKeys.includes(currentKey)) return currentKey;
  }

  return historicalKeys[0] ?? null;
}

export interface HistoricalPoint {
  time: string;
  value: number;
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : null;
}

/**
 * Builds an ascending, de-duplicated time series from an indicator's history.
 * The latest `current` observation is appended when it is newer than the
 * history so the chart ends on the same value the card displays.
 */
export function getHistoricalSeries(
  item: IndicatorDataItem | undefined
): HistoricalPoint[] {
  const key = getHistoricalSeriesKey(item);
  if (!item?.historical?.length || !key) return [];

  const byDate = new Map<string, HistoricalPoint>();

  for (const row of item.historical) {
    const date = normalizeDate(row.date);
    const value = row[key];

    if (!date) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) continue;

    byDate.set(date, { time: date, value });
  }

  const currentValue = getCurrentValue(item);
  const observedAt = normalizeDate(item.current?.observed_at);

  if (currentValue !== null && observedAt) {
    byDate.set(observedAt, { time: observedAt, value: currentValue });
  }

  return [...byDate.values()].sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Calculate a simple moving average from historical data
 */
export function calculateSMA(item: IndicatorDataItem | undefined, period: number): number | null {
  if (!item?.historical || item.historical.length < period) return null;

  const sample = item.historical[0];
  const numericKeys = Object.keys(sample).filter(
    (key) => key !== "date" && key !== "series_id" && typeof sample[key] === "number"
  );

  if (numericKeys.length === 0) return null;

  const key = numericKeys[0];
  const values = item.historical
    .map((row) => row[key] as number)
    .filter((v) => typeof v === "number" && !isNaN(v))
    .slice(-period);

  if (values.length < period) return null;

  return values.reduce((sum, v) => sum + v, 0) / period;
}

/**
 * Format a value for display based on the indicator's unit
 */
export function formatValue(value: number | null, unit: string): string {
  if (value === null) return "—";

  const lowerUnit = unit.toLowerCase();

  if (lowerUnit.includes("percent")) {
    return `${value.toFixed(2)}%`;
  }
  if (lowerUnit.includes("percentage point")) {
    return `${value.toFixed(2)}pp`;
  }
  if (lowerUnit.includes("index")) {
    return value.toFixed(lowerUnit.includes("0-100") ? 1 : 2);
  }
  if (lowerUnit.includes("dollar") || lowerUnit.includes("usd")) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }
  if (lowerUnit.includes("thousand")) {
    return new Intl.NumberFormat("en-US").format(value);
  }
  if (lowerUnit.includes("billion")) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 1,
    }).format(value / 1e9).replace(/\.00$/, "") + "B";
  }
  if (lowerUnit.includes("million")) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 1,
    }).format(value / 1e6).replace(/\.00$/, "") + "M";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Native time unit types from the indicator catalogue
 */
export type NativeTimeUnit = "day" | "week" | "month" | "quarter";

function parseTimeUnit(unit: string): NativeTimeUnit | null {
  const lower = unit.trim().toLowerCase();

  // The API/catalogue encodes units as short codes (d/m/q) as well as words.
  if (lower === "d" || lower.startsWith("day")) return "day";
  if (lower === "w" || lower.startsWith("week")) return "week";
  if (lower === "m" || lower.startsWith("month")) return "month";
  if (lower === "q" || lower.startsWith("quarter")) return "quarter";

  return null;
}

/**
 * Normalizes a time unit string from the indicator metadata.
 */
export function normalizeTimeUnit(unit: string): NativeTimeUnit {
  return parseTimeUnit(unit) ?? "day"; // default fallback
}

/**
 * Infers the cadence of a stored historical series from its row spacing.
 * Used for indicators whose `historicalTimeUnit` is `o` (other/observed).
 */
function inferTimeUnitFromHistory(
  item: IndicatorDataItem | undefined
): NativeTimeUnit | null {
  const historical = item?.historical;
  if (!historical || historical.length < 2) return null;

  const timestamps = historical
    .map((row) => (typeof row.date === "string" ? Date.parse(row.date) : NaN))
    .filter((time) => Number.isFinite(time));

  if (timestamps.length < 2) return null;

  const gaps: number[] = [];

  // The latest observations describe the series' current cadence best.
  for (let i = Math.max(1, timestamps.length - 12); i < timestamps.length; i += 1) {
    gaps.push((timestamps[i] - timestamps[i - 1]) / 86_400_000);
  }

  gaps.sort((a, b) => a - b);
  const medianGap = gaps[Math.floor(gaps.length / 2)];

  if (medianGap <= 3) return "day";
  if (medianGap <= 10) return "week";
  if (medianGap <= 45) return "month";
  return "quarter";
}

/**
 * Resolves the unit of the stored historical rows.
 *
 * The API returns `historicalTimeUnit` as a short code:
 * `d` = daily, `m` = monthly, `q` = quarterly, `o` = other/observed.
 * For `o`, the cadence is inferred from the row spacing because those sources
 * are not resampled (e.g. CFTC is weekly, the 2Y treasury series is weekly).
 */
export function resolveHistoricalTimeUnit(
  item: IndicatorDataItem | undefined
): NativeTimeUnit {
  const nativeUnit = normalizeTimeUnit(item?.indicator.nativeTimeUnit ?? "day");
  const historicalUnit = item?.indicator.historicalTimeUnit?.trim().toLowerCase();

  if (!historicalUnit) return nativeUnit;

  if (historicalUnit === "o") {
    return inferTimeUnitFromHistory(item) ?? nativeUnit;
  }

  return parseTimeUnit(historicalUnit) ?? nativeUnit;
}

/**
 * Period configurations for moving averages by historical time unit.
 * Each period specifies how many historical rows to look back.
 */
const MA_PERIODS_BY_UNIT: Record<string, Record<string, number>> = {
  day: {
    "2W": 14,      // 2 weeks = 14 days
    "1M": 30,      // 1 month = 30 days
    "3M": 90,      // 3 months = 90 days
    "6M": 180,     // 6 months = 180 days
    "12M": 360,    // 12 months = 360 days
    "24M": 720,    // 24 months = 720 days
  },
  week: {
    "2W": 2,       // 2 weeks
    "1M": 4,       // ~1 month
    "3M": 13,      // 3 months
    "6M": 26,      // 6 months
    "12M": 52,     // 12 months
    "24M": 104,    // 24 months
  },
  month: {
    "2W": 1,       // ~0.5 months - use 1 month minimum
    "1M": 1,       // 1 month
    "3M": 3,       // 3 months
    "6M": 6,       // 6 months
    "12M": 12,     // 12 months
    "24M": 24,     // 24 months
  },
  quarter: {
    "2W": 1,       // ~0.17 quarters - use 1 quarter minimum
    "1M": 1,       // ~0.33 quarters - use 1 quarter minimum
    "3M": 1,       // 1 quarter
    "6M": 2,       // 2 quarters
    "12M": 4,      // 4 quarters (1 year)
    "24M": 8,      // 8 quarters (2 years)
  },
} as const;

export type MAPeriodKey = "2W" | "1M" | "3M" | "6M" | "12M" | "24M";

const PERIOD_ORDER: MAPeriodKey[] = ["2W", "1M", "3M", "6M", "12M", "24M"];

/**
 * Gets the number of native periods for a given period key and time unit.
 */
export function getPeriodsForUnit(periodKey: MAPeriodKey, timeUnit: string): number {
  const unit = normalizeTimeUnit(timeUnit);
  return MA_PERIODS_BY_UNIT[unit]?.[periodKey] ?? MA_PERIODS_BY_UNIT.day[periodKey];
}

/**
 * Calculates SMA for a specific period based on the indicator's historical frequency.
 */
export function calculateSMAForPeriod(
  item: IndicatorDataItem | undefined,
  periodKey: MAPeriodKey
): number | null {
  if (!item) return null;
  const period = getPeriodsForUnit(periodKey, resolveHistoricalTimeUnit(item));
  return calculateSMA(item, period);
}

/**
 * Calculates all configured moving averages for an indicator based on its native frequency.
 */
export function calculateAllMovingAverages(item: IndicatorDataItem | undefined): Record<MAPeriodKey, number | null> {
  if (!item) {
    return {
      "2W": null,
      "1M": null,
      "3M": null,
      "6M": null,
      "12M": null,
      "24M": null,
    };
  }

  const result: Record<MAPeriodKey, number | null> = {
    "2W": null,
    "1M": null,
    "3M": null,
    "6M": null,
    "12M": null,
    "24M": null,
  };

  for (const period of PERIOD_ORDER) {
    result[period] = calculateSMAForPeriod(item, period);
  }

  return result;
}

function subtractPeriods(
  date: string,
  unit: NativeTimeUnit,
  periods: number
): number | null {
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return null;

  const target = new Date(timestamp);

  switch (unit) {
    case "day":
      target.setUTCDate(target.getUTCDate() - periods);
      break;
    case "week":
      target.setUTCDate(target.getUTCDate() - periods * 7);
      break;
    case "month":
      target.setUTCMonth(target.getUTCMonth() - periods);
      break;
    case "quarter":
      target.setUTCMonth(target.getUTCMonth() - periods * 3);
      break;
  }

  return target.getTime();
}

function getHistoricalValueAtOrBefore(
  item: IndicatorDataItem,
  key: string,
  target: number
): number | null {
  let best: { time: number; value: number } | null = null;

  for (const row of item.historical) {
    if (typeof row.date !== "string") continue;

    const time = Date.parse(row.date);
    const value = row[key];

    if (!Number.isFinite(time) || time > target) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) continue;

    if (!best || time > best.time) {
      best = { time, value };
    }
  }

  return best?.value ?? null;
}

/**
 * Calculates net change (current - value at period ago) for each period.
 */
export function calculateAllNetChanges(
  item: IndicatorDataItem | undefined
): Record<MAPeriodKey, number | null> {
  const result: Record<MAPeriodKey, number | null> = {
    "2W": null,
    "1M": null,
    "3M": null,
    "6M": null,
    "12M": null,
    "24M": null,
  };

  for (const period of PERIOD_ORDER) {
    result[period] = calculateNetChangeForPeriod(item, period);
  }

  return result;
}

/**
 * Calculates net change (current - value at period ago) for a specific period.
 * The comparison row is selected by date so it stays correct when the history
 * already ends before the current observation.
 */
export function calculateNetChangeForPeriod(
  item: IndicatorDataItem | undefined,
  periodKey: MAPeriodKey
): number | null {
  const currentValue = getCurrentValue(item);
  if (currentValue === null || !item?.historical || item.historical.length === 0) return null;

  const sample = item.historical[0];
  const numericKeys = Object.keys(sample).filter(
    (key) => key !== "date" && key !== "series_id" && typeof sample[key] === "number"
  );
  if (numericKeys.length === 0) return null;
  const key = numericKeys[0];

  const unit = resolveHistoricalTimeUnit(item);
  const periods = getPeriodsForUnit(periodKey, unit);
  const currentDate = getCurrentDate(item);

  if (currentDate) {
    const target = subtractPeriods(currentDate, unit, periods);
    if (target === null) return null;

    const previousValue = getHistoricalValueAtOrBefore(item, key, target);
    return previousValue === null ? null : currentValue - previousValue;
  }

  // Fallback when the current observation has no date: compare row offsets.
  const values = item.historical
    .map((row) => row[key] as number)
    .filter((v) => typeof v === "number" && !isNaN(v));

  const index = values.length - 1 - periods;
  if (index < 0) return null;

  return currentValue - values[index];
}

/**
 * Calculates percentage change for a specific period.
 */
export function calculatePercentChangeForPeriod(
  item: IndicatorDataItem | undefined,
  periodKey: MAPeriodKey
): number | null {
  const netChange = calculateNetChangeForPeriod(item, periodKey);
  const currentValue = getCurrentValue(item);
  if (netChange === null || currentValue === null || currentValue === 0) return null;
  return (netChange / Math.abs(currentValue)) * 100;
}

/**
 * Calculates percentage change for each period.
 */
export function calculateAllPercentChanges(item: IndicatorDataItem | undefined): Record<MAPeriodKey, number | null> {
  const netChanges = calculateAllNetChanges(item);
  const currentValue = getCurrentValue(item);

  if (currentValue === null) {
    return {
      "2W": null,
      "1M": null,
      "3M": null,
      "6M": null,
      "12M": null,
      "24M": null,
    };
  }

  const result: Record<MAPeriodKey, number | null> = {
    "2W": null,
    "1M": null,
    "3M": null,
    "6M": null,
    "12M": null,
    "24M": null,
  };

  for (const period of PERIOD_ORDER) {
    const netChange = netChanges[period];
    if (netChange !== null && currentValue !== 0) {
      result[period] = (netChange / Math.abs(currentValue)) * 100;
    }
  }

  return result;
}
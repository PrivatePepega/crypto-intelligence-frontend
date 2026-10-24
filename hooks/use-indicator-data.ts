"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchIndicatorData, type FetchIndicatorDataParams } from "@/lib/indicator-api";
import type { FetchIndicatorDataResponse, IndicatorDataItem } from "@/types";

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
 * Get the date from the current data
 */
export function getCurrentDate(item: IndicatorDataItem | undefined): string | null {
  if (!item?.current) return null;
  return (item.current.date as string) ?? null;
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

/**
 * Normalizes the native_time_unit from the indicator metadata.
 */
export function normalizeTimeUnit(unit: string): NativeTimeUnit {
  const lower = unit.toLowerCase();
  if (lower.includes("day")) return "day";
  if (lower.includes("week")) return "week";
  if (lower.includes("month")) return "month";
  if (lower.includes("quarter")) return "quarter";
  return "day"; // default fallback
}

/**
 * Period configurations for moving averages by native time unit.
 * Each period specifies how many native periods to look back.
 */
const MA_PERIODS_BY_UNIT: Record<string, Record<string, number>> = {
  day: {
    "2W": 10,      // 2 weeks = 10 trading days
    "1M": 21,      // 1 month ≈ 21 trading days
    "3M": 63,      // 3 months ≈ 63 trading days
    "6M": 126,     // 6 months ≈ 126 trading days
    "12M": 252,    // 12 months ≈ 252 trading days
    "24M": 504,    // 24 months ≈ 504 trading days
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
  const timeUnit = normalizeTimeUnit(item.indicator.historicalTimeUnit || item.indicator.nativeTimeUnit);
  const period = getPeriodsForUnit(periodKey, item.indicator.historicalTimeUnit || item.indicator.nativeTimeUnit);
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

/**
 * Calculates net change (current - value at period ago) for each period based on native frequency.
 */
export function calculateAllNetChanges(item: IndicatorDataItem | undefined): Record<MAPeriodKey, number | null> {
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

  if (!item?.historical || item.historical.length === 0) {
    return {
      "2W": null,
      "1M": null,
      "3M": null,
      "6M": null,
      "12M": null,
      "24M": null,
    };
  }

  const timeUnit = normalizeTimeUnit(item.indicator.historicalTimeUnit || item.indicator.nativeTimeUnit);
  const values = item.historical
    .map((row) => {
      const sample = item.historical![0];
      const numericKeys = Object.keys(sample).filter(
        (key) => key !== "date" && key !== "series_id" && typeof sample[key] === "number"
      );
      const key = numericKeys[0];
      return row[key] as number;
    })
    .filter((v) => typeof v === "number" && !isNaN(v));

  if (values.length === 0) {
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
    const periodNum = getPeriodsForUnit(period, item.indicator.historicalTimeUnit || item.indicator.nativeTimeUnit);
    const index = values.length - 1 - periodNum;
    if (index >= 0) {
      const previousValue = values[index];
      if (typeof previousValue === "number" && !isNaN(previousValue)) {
        result[period] = currentValue - previousValue;
      }
    }
  }

  return result;
}

/**
 * Calculates net change (current - value at period ago) for a specific period.
 */
export function calculateNetChangeForPeriod(
  item: IndicatorDataItem | undefined,
  periodKey: MAPeriodKey
): number | null {
  const currentValue = getCurrentValue(item);
  if (currentValue === null || !item?.historical || item.historical.length === 0) return null;

  const timeUnit = normalizeTimeUnit(item.indicator.historicalTimeUnit || item.indicator.nativeTimeUnit);
  const periodNum = getPeriodsForUnit(periodKey, item.indicator.historicalTimeUnit || item.indicator.nativeTimeUnit);

  const sample = item.historical[0];
  const numericKeys = Object.keys(sample).filter(
    (key) => key !== "date" && key !== "series_id" && typeof sample[key] === "number"
  );
  if (numericKeys.length === 0) return null;
  const key = numericKeys[0];

  const values = item.historical
    .map((row) => row[key] as number)
    .filter((v) => typeof v === "number" && !isNaN(v));

  if (values.length === 0) return null;

  const index = values.length - 1 - periodNum;
  if (index < 0) return null;

  const previousValue = values[index];
  if (typeof previousValue !== "number" || isNaN(previousValue)) return null;

  return currentValue - previousValue;
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
"use client";

import { IndicatorCard } from "@/components/indicators/indicator-card";
import { useIndicatorData } from "@/hooks/use-indicator-data";
import type { FetchIndicatorDataResponse } from "@/types";

const macroIndicators = [
  "ten_year_treasury_yield",
  "two_year_treasury_yield",
  "three_m_treasury",
  "ten_two_year_yield_spread",
  "ten_year_breakeven_inflation",
  "vix",
];

const cryptoIndicators = [
  "alternative_crypto_fear_greed",
  "cftc_bitcoin",
];

const macroWeeklyMonthly = [
  "mortgage_rate",
  "average_hourly_earnings",
  "building_permits",
];

const quarterlyIndicators = [
  "real_gdp_growth",
];

export default function Home() {
  const { data: macroData, isLoading: macroLoading, error: macroError } = useIndicatorData({
    indicators: macroIndicators,
    historyLimit: 250,
  });

  const { data: cryptoData, isLoading: cryptoLoading, error: cryptoError } = useIndicatorData({
    indicators: cryptoIndicators,
    historyLimit: 250,
  });

  const { data: weeklyMonthlyData, isLoading: weeklyMonthlyLoading, error: weeklyMonthlyError } = useIndicatorData({
    indicators: macroWeeklyMonthly,
    historyLimit: 250,
  });

  const { data: quarterlyData, isLoading: quarterlyLoading, error: quarterlyError } = useIndicatorData({
    indicators: quarterlyIndicators,
    historyLimit: 100,
  });

  const isLoading = macroLoading || cryptoLoading || weeklyMonthlyLoading || quarterlyLoading;
  const error = macroError || cryptoError || weeklyMonthlyError || quarterlyError;

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-muted-foreground">Loading indicators...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center text-center">
        <p className="text-destructive">Failed to load indicators</p>
        <p className="text-muted-foreground mt-1">{String(error)}</p>
      </div>
    );
  }

  const renderSection = (title: string, description: string, data: FetchIndicatorDataResponse | undefined) => {
    const items = data?.indicators ?? [];
    if (items.length === 0) return null;

    return (
      <section className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item.indicator.id} className="min-h-[200px]">
              <div className="h-full">
                <IndicatorCard item={item} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="flex flex-col flex-1 p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Indicators</h1>
        <p className="mt-2 text-muted-foreground">
          Real-time economic and market indicators from FRED, CFTC, and alternative data sources.
        </p>
      </div>

      {renderSection(
        "Key Rates & Spreads",
        "Core Treasury yields, spreads, and volatility",
        macroData
      )}

      {renderSection(
        "Weekly & Monthly Macro",
        "Mortgage rates, employment, and housing data",
        weeklyMonthlyData
      )}

      {renderSection(
        "Crypto & Alternative",
        "Fear & Greed, CFTC positioning",
        cryptoData
      )}

      {renderSection(
        "Quarterly Macro",
        "GDP and quarterly indicators",
        quarterlyData
      )}
    </div>
  );
}
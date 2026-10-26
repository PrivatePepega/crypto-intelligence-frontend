"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { UseQueryResult } from "@tanstack/react-query";

import { useClimateBrief } from "@/hooks/use-climate-brief";
import { useTodayApiDate } from "@/hooks/use-today-api-date";
import { useWeatherBriefs } from "@/hooks/use-weather-brief";
import { useWeatherObservationsResearch } from "@/hooks/use-weather-observations-research";
import { WEATHER_DOMAIN_IDS, type WeatherDomain } from "@/lib/weather-domains";
import type {
  ClimateBrief,
  DatedBriefResult,
  WeatherBrief,
  WeatherObservationsResearchResponse,
} from "@/types";

interface BriefSelectionContextValue {
  /** Selected day (`YYYY-MM-DD`), or `null` until the browser date resolves. */
  date: string | null;
  latest: boolean;
  setDate: (date: string) => void;
  setLatest: (latest: boolean) => void;
  /** Domain whose weather brief is currently shown. */
  weatherDomain: WeatherDomain;
  setWeatherDomain: (domain: WeatherDomain) => void;
  /**
   * Every domain's brief for the selected date, fetched in one request.
   */
  weatherBriefs: UseQueryResult<DatedBriefResult<WeatherBrief[]>>;
  climate: UseQueryResult<DatedBriefResult<ClimateBrief>>;
  observations: UseQueryResult<
    DatedBriefResult<WeatherObservationsResearchResponse>
  >;
  isLoading: boolean;
  /** True when at least one section had to fall back to the latest data. */
  isFallback: boolean;
}

const BriefSelectionContext =
  createContext<BriefSelectionContextValue | null>(null);

/**
 * Owns the shared briefing date and the three brief queries so the sidebar
 * widget and the dashboard sections always agree.
 */
export function BriefSelectionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onDashboard = pathname === "/";

  const today = useTodayApiDate();
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [latest, setLatest] = useState(false);
  const [weatherDomain, setWeatherDomain] = useState<WeatherDomain>(
    WEATHER_DOMAIN_IDS[0]
  );

  const date = pickedDate ?? today;

  // Briefs only render on the dashboard; other routes should not fetch them.
  const query = {
    date: onDashboard ? (date ?? undefined) : undefined,
    latest: onDashboard && latest,
  };

  const weatherBriefs = useWeatherBriefs(query);
  const climate = useClimateBrief(query);
  const observations = useWeatherObservationsResearch(WEATHER_DOMAIN_IDS, query);

  const isLoading =
    weatherBriefs.isLoading || climate.isLoading || observations.isLoading;

  const isFallback =
    !latest &&
    (Boolean(weatherBriefs.data?.isFallback) ||
      Boolean(climate.data?.isFallback) ||
      Boolean(observations.data?.isFallback));

  return (
    <BriefSelectionContext.Provider
      value={{
        date,
        latest,
        setDate: setPickedDate,
        setLatest,
        weatherDomain,
        setWeatherDomain,
        weatherBriefs,
        climate,
        observations,
        isLoading,
        isFallback,
      }}
    >
      {children}
    </BriefSelectionContext.Provider>
  );
}

export function useBriefSelection(): BriefSelectionContextValue {
  const context = useContext(BriefSelectionContext);

  if (!context) {
    throw new Error(
      "useBriefSelection must be used within a BriefSelectionProvider"
    );
  }

  return context;
}

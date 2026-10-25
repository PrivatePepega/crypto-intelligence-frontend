"use client";

import { useQuery } from "@tanstack/react-query";

import type { BriefQuery } from "@/lib/brief-query";
import { fetchWeatherObservationsResearch } from "@/lib/weather-api";
import type {
  DatedBriefResult,
  WeatherObservationsResearchResponse,
} from "@/types";

export function useWeatherObservationsResearch(
  domains: string[],
  { date, latest }: BriefQuery
) {
  return useQuery({
    queryKey: [
      "weather",
      "observations-research",
      domains,
      latest ? "latest" : (date ?? null),
    ],
    queryFn: async (): Promise<
      DatedBriefResult<WeatherObservationsResearchResponse>
    > => {
      if (latest) {
        return {
          data: await fetchWeatherObservationsResearch(domains, {
            latest: true,
          }),
          isFallback: false,
        };
      }

      const dated = await fetchWeatherObservationsResearch(domains, { date });
      const isEmpty =
        dated.observations.length === 0 && dated.research.length === 0;

      if (!isEmpty) {
        return { data: dated, isFallback: false };
      }

      // The selected day stored no observations. Show the newest set and flag
      // it so the UI can say the date itself had no data.
      const fallback = await fetchWeatherObservationsResearch(domains, {
        latest: true,
      });
      const fallbackIsEmpty =
        fallback.observations.length === 0 && fallback.research.length === 0;

      return { data: fallback, isFallback: !fallbackIsEmpty };
    },
    enabled: domains.length > 0 && Boolean(latest || date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

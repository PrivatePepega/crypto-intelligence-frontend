"use client";

import { useQuery } from "@tanstack/react-query";

import type { BriefQuery } from "@/lib/brief-query";
import { fetchWeatherBriefs } from "@/lib/weather-api";
import type { DatedBriefResult, WeatherBrief } from "@/types";

/**
 * Every domain's brief for one date, in a single response. The page selects
 * the active domain from the returned array, so tab switches stay local.
 */
export function useWeatherBriefs({ date, latest }: BriefQuery) {
  return useQuery({
    queryKey: ["weather", "briefs", latest ? "latest" : (date ?? null)],
    queryFn: async (): Promise<DatedBriefResult<WeatherBrief[]>> => {
      if (latest) {
        const result = await fetchWeatherBriefs({ latest: true });

        return { data: result?.briefs ?? [], isFallback: false };
      }

      const dated = await fetchWeatherBriefs({ date });

      if (dated && dated.briefs.length > 0) {
        // If the backend substituted a different day, surface the same
        // "No data for <date>" notice instead of silently relabelling it.
        const appliedDate = dated.date?.slice(0, 10);

        return {
          data: dated.briefs,
          isFallback: Boolean(date && appliedDate && appliedDate !== date),
        };
      }

      // The selected day has no brief. Show the newest one and flag it so the
      // UI can say the date itself had no data.
      const fallback = await fetchWeatherBriefs({ latest: true });
      const briefs = fallback?.briefs ?? [];

      return { data: briefs, isFallback: briefs.length > 0 };
    },
    enabled: Boolean(latest || date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

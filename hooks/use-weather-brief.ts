"use client";

import { useQuery } from "@tanstack/react-query";

import type { BriefQuery } from "@/lib/brief-query";
import { fetchWeatherBrief } from "@/lib/weather-api";
import type { DatedBriefResult, WeatherBrief } from "@/types";

export function useWeatherBrief({ date, latest }: BriefQuery) {
  return useQuery({
    queryKey: ["weather", "brief", latest ? "latest" : (date ?? null)],
    queryFn: async (): Promise<DatedBriefResult<WeatherBrief>> => {
      if (latest) {
        return {
          data: await fetchWeatherBrief({ latest: true }),
          isFallback: false,
        };
      }

      const dated = await fetchWeatherBrief({ date });

      if (dated) {
        return { data: dated, isFallback: false };
      }

      // The selected day has no brief. Show the newest one and flag it so the
      // UI can say the date itself had no data.
      const fallback = await fetchWeatherBrief({ latest: true });

      return { data: fallback, isFallback: fallback !== null };
    },
    enabled: Boolean(latest || date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
